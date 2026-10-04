import {
  supabase,
  isSupabaseConfigured,
  isSchemaMissingError,
  getSupabaseSchemaStatus,
  markSupabaseSchemaMissing,
} from '../lib/supabase';
import { mockStore, subscribeToMockChanges } from '../lib/mockStore';

/**
 * Dashboard & Realtime Market Service
 * Provides unified cross-client, cross-tab, and database synchronization.
 */

const RECENT_ACTIVITIES_KEY = 'expo_recent_activities_cache_v1';

// Local in-memory event listeners
const realtimeListeners = new Set();
let activeSubscriberCount = 0;
let globalSupabaseChannel = null;

// Browser BroadcastChannel for instant cross-tab synchronization
const broadcastChannel =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('expo_live_market_bus')
    : null;

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const type = event.data?.type || event.data?.event;
    const payload = event.data?.payload;
    if (type && payload) {
      notifyLocalListeners(type, payload);
    }
  };
}

// Window CustomEvent & Storage Event fallbacks
if (typeof window !== 'undefined') {
  window.addEventListener('expo_realtime_event', (e) => {
    if (e.detail?.type && e.detail?.payload) {
      notifyLocalListeners(e.detail.type, e.detail.payload);
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'expo_live_event_trigger' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.type && parsed?.payload) {
          notifyLocalListeners(parsed.type, parsed.payload);
        }
      } catch {
        // ignore parse error
      }
    }
  });
}

function notifyLocalListeners(type, payload) {
  realtimeListeners.forEach((callback) => {
    try {
      callback({ type, payload });
    } catch (err) {
      console.error('Error in realtime listener:', err);
    }
  });
}

function recordRecentActivityCache(event) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(RECENT_ACTIVITIES_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [event, ...existing.filter((e) => e.id !== event.id)].slice(0, 30);
    localStorage.setItem(RECENT_ACTIVITIES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Central event broadcaster called whenever an investment or token is created.
 */
export function broadcastDashboardEvent(type, payload) {
  // Format activity item for feed caching
  const activityItem = {
    id: payload?.id || (crypto.randomUUID ? crypto.randomUUID() : 'act-' + Date.now()),
    type:
      type === 'INVESTMENT_CREATED'
        ? 'investment'
        : type === 'CUSTOMER_TOKEN_CREATED'
        ? 'customer_token'
        : 'passport_stamp',
    title:
      type === 'INVESTMENT_CREATED'
        ? 'NUEVA INVERSIÓN'
        : type === 'CUSTOMER_TOKEN_CREATED'
        ? 'NUEVO CUSTOMER TOKEN'
        : 'SELLO OBTENIDO',
    amount: payload?.amount || null,
    projectName: payload?.project?.name || 'Proyecto',
    projectId: payload?.project?.id || payload?.project_id,
    timestamp: payload?.timestamp || new Date().toISOString(),
  };

  recordRecentActivityCache(activityItem);

  // 1. Notify listeners in the current tab
  notifyLocalListeners(type, payload);

  // 2. Window CustomEvent
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('expo_realtime_event', { detail: { type, payload } })
      );
    } catch {
      // ignore
    }
  }

  // 3. Broadcast to other tabs/windows in the browser
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, payload });
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }

  // 4. LocalStorage trigger
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        'expo_live_event_trigger',
        JSON.stringify({ type, payload, _ts: Date.now() })
      );
    } catch {
      // ignore
    }
  }

  // 5. Broadcast across network via Supabase Realtime broadcast
  if (isSupabaseConfigured && supabase && globalSupabaseChannel) {
    try {
      globalSupabaseChannel.send({
        type: 'broadcast',
        event: type,
        payload,
      });
    } catch (e) {
      console.warn('Supabase Realtime broadcast warning:', e);
    }
  }
}

/**
 * Fetch recent activity feed (investments + customer tokens)
 */
export async function getRecentActivity(limit = 20) {
  const mockActivity = mockStore.getRecentActivity(limit);

  let cachedEvents = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(RECENT_ACTIVITIES_KEY);
      if (raw) cachedEvents = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    const combined = [...cachedEvents, ...mockActivity];
    const seen = new Set();
    const result = [];
    for (const item of combined) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  try {
    const [invRes, tokRes] = await Promise.all([
      supabase
        .from('investments')
        .select('id, amount, created_at, project_id, projects(id, name, team_name)')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('customer_tokens')
        .select('id, created_at, project_id, projects(id, name, team_name)')
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    if (invRes.error && isSchemaMissingError(invRes.error)) {
      markSupabaseSchemaMissing('getRecentActivity: ' + invRes.error.message);
      return mockActivity;
    }

    const investments = (invRes.data || []).map((i) => ({
      id: i.id,
      type: 'investment',
      title: 'NUEVA INVERSIÓN',
      amount: i.amount,
      projectName: i.projects?.name || 'Proyecto',
      projectId: i.project_id,
      timestamp: i.created_at,
    }));

    const tokens = (tokRes.data || []).map((t) => ({
      id: t.id,
      type: 'customer_token',
      title: 'NUEVO CUSTOMER TOKEN',
      amount: null,
      projectName: t.projects?.name || 'Proyecto',
      projectId: t.project_id,
      timestamp: t.created_at,
    }));

    const all = [...investments, ...tokens, ...cachedEvents, ...mockActivity];
    const seenIds = new Set();
    const deduped = [];

    for (const item of all) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        deduped.push(item);
      }
    }

    deduped.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return deduped.slice(0, limit);
  } catch (err) {
    console.warn('Error fetching recent activity from Supabase, using mockStore:', err);
    return mockActivity;
  }
}

/**
 * Fetch unified dashboard statistics & project rankings
 */
export async function getDashboardStats() {
  const mockStats = mockStore.getDashboardStats();

  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockStats;
  }

  try {
    let stats = {
      total_invested: 0,
      total_investors: 0,
      total_customer_tokens: 0,
      total_visitors: 0,
    };

    const { data: expoData, error: expoErr } = await supabase
      .from('expo_stats')
      .select('*')
      .maybeSingle();

    if (!expoErr && expoData) {
      stats = expoData;
    } else {
      if (expoErr && isSchemaMissingError(expoErr)) {
        markSupabaseSchemaMissing('expo_stats view');
      }

      const { data: invs, error: invErr } = await supabase
        .from('investments')
        .select('amount, user_id');
      if (invErr && isSchemaMissingError(invErr)) {
        markSupabaseSchemaMissing('investments table in stats');
        return mockStats;
      }

      const { count: tokCount } = await supabase
        .from('customer_tokens')
        .select('*', { count: 'exact', head: true });
      const { count: visCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'visitor');

      const totalInvested = (invs || []).reduce((acc, i) => acc + Number(i.amount || 0), 0);
      const uniqueInvestors = new Set((invs || []).map((i) => i.user_id)).size;

      stats = {
        total_invested: totalInvested,
        total_investors: uniqueInvestors,
        total_customer_tokens: tokCount || 0,
        total_visitors: visCount || 0,
      };
    }

    // 2. Fetch project ranking
    const { data: rankingData, error: rankErr } = await supabase
      .from('project_stats')
      .select('*')
      .order('investment_total', { ascending: false });

    let ranking = [];
    if (rankErr || !rankingData) {
      if (rankErr && isSchemaMissingError(rankErr)) {
        markSupabaseSchemaMissing('project_stats in dashboard');
      }

      const { data: fallbackProjects, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('active', true);

      if (projErr && isSchemaMissingError(projErr)) {
        markSupabaseSchemaMissing('projects in dashboard');
        return mockStats;
      }

      ranking = fallbackProjects || [];
    } else {
      ranking = rankingData.map((p) => ({
        id: p.project_id || p.id,
        ...p,
      }));
    }

    // Merge ranking with local mockStore figures to ensure instant live updates reflect everywhere
    if (mockStats) {
      if (ranking.length === 0) {
        ranking = mockStats.ranking;
      } else {
        ranking = ranking.map((proj) => {
          const mockP = mockStats.ranking?.find(
            (m) =>
              m.id === proj.id ||
              String(m.id).toLowerCase() === String(proj.id).toLowerCase() ||
              m.name?.toLowerCase().trim() === proj.name?.toLowerCase().trim()
          );
          const dbInvested = Number(proj.investment_total || 0);
          const mockInvested = Number(mockP?.investment_total || 0);
          const dbInvestors = Number(proj.investors || 0);
          const mockInvestors = Number(mockP?.investors || 0);
          const dbTokens = Number(proj.customer_tokens || 0);
          const mockTokens = Number(mockP?.customer_tokens || 0);

          return {
            ...proj,
            investment_total: Math.max(dbInvested, mockInvested),
            investors: Math.max(dbInvestors, mockInvestors),
            customer_tokens: Math.max(dbTokens, mockTokens),
          };
        });
      }

      // Re-sort ranking strictly by investment_total DESC, then customer_tokens DESC, then investors DESC
      ranking.sort((a, b) => {
        const diffInvested = Number(b.investment_total || 0) - Number(a.investment_total || 0);
        if (diffInvested !== 0) return diffInvested;
        const diffTokens = Number(b.customer_tokens || 0) - Number(a.customer_tokens || 0);
        if (diffTokens !== 0) return diffTokens;
        return Number(b.investors || 0) - Number(a.investors || 0);
      });

      const combinedTotal = ranking.reduce((acc, p) => acc + Number(p.investment_total || 0), 0);
      const combinedInvestors = ranking.reduce((acc, p) => acc + Number(p.investors || 0), 0);
      const combinedTokens = ranking.reduce((acc, p) => acc + Number(p.customer_tokens || 0), 0);

      return {
        total_invested: Math.max(combinedTotal, Number(stats.total_invested || 0)),
        total_investors: Math.max(combinedInvestors, Number(stats.total_investors || 0)),
        total_customer_tokens: Math.max(combinedTokens, Number(stats.total_customer_tokens || 0)),
        total_visitors: Math.max(Number(stats.total_visitors || 0), mockStats.total_visitors || 0),
        ranking,
      };
    }

    ranking.sort((a, b) => {
      const diffInvested = Number(b.investment_total || 0) - Number(a.investment_total || 0);
      if (diffInvested !== 0) return diffInvested;
      const diffTokens = Number(b.customer_tokens || 0) - Number(a.customer_tokens || 0);
      if (diffTokens !== 0) return diffTokens;
      return Number(b.investors || 0) - Number(a.investors || 0);
    });

    return {
      total_invested: Number(stats.total_invested || 0),
      total_investors: Number(stats.total_investors || 0),
      total_customer_tokens: Number(stats.total_customer_tokens || 0),
      total_visitors: Number(stats.total_visitors || 0),
      ranking,
    };
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('getDashboardStats catch');
    }
    console.warn('Error fetching dashboard stats from Supabase, using mock fallback:', err);
    return mockStats;
  }
}

/**
 * Singleton Supabase channel initialization
 */
function ensureGlobalSupabaseChannel() {
  if (!isSupabaseConfigured || !supabase || globalSupabaseChannel) return;

  try {
    globalSupabaseChannel = supabase
      .channel('expo-dashboard-live')
      .on('broadcast', { event: 'INVESTMENT_CREATED' }, ({ payload }) => {
        notifyLocalListeners('INVESTMENT_CREATED', payload);
      })
      .on('broadcast', { event: 'CUSTOMER_TOKEN_CREATED' }, ({ payload }) => {
        notifyLocalListeners('CUSTOMER_TOKEN_CREATED', payload);
      })
      .on('broadcast', { event: 'PASSPORT_STAMP_CLAIMED' }, ({ payload }) => {
        notifyLocalListeners('PASSPORT_STAMP_CLAIMED', payload);
      })
      .on('broadcast', { event: 'PROJECT_UPDATE' }, ({ payload }) => {
        notifyLocalListeners('PROJECT_UPDATE', payload);
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investments' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            let projectName = 'Proyecto';
            try {
              const { data: p } = await supabase
                .from('projects')
                .select('name')
                .eq('id', payload.new.project_id)
                .maybeSingle();
              if (p) projectName = p.name;
            } catch (e) {
              // ignore
            }

            notifyLocalListeners('INVESTMENT_CREATED', {
              type: 'investment',
              amount: payload.new.amount,
              project_id: payload.new.project_id,
              project: { id: payload.new.project_id, name: projectName },
              timestamp: payload.new.created_at,
            });
          } else {
            notifyLocalListeners('METRICS_UPDATED', { table: 'investments' });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_tokens' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            let projectName = 'Proyecto';
            try {
              const { data: p } = await supabase
                .from('projects')
                .select('name')
                .eq('id', payload.new.project_id)
                .maybeSingle();
              if (p) projectName = p.name;
            } catch (e) {
              // ignore
            }

            notifyLocalListeners('CUSTOMER_TOKEN_CREATED', {
              type: 'customer_token',
              project_id: payload.new.project_id,
              project: { id: payload.new.project_id, name: projectName },
              timestamp: payload.new.created_at,
            });
          } else {
            notifyLocalListeners('METRICS_UPDATED', { table: 'customer_tokens' });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'passport_stamps' },
        (payload) => {
          notifyLocalListeners('PASSPORT_STAMP_CLAIMED', payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          notifyLocalListeners('PROJECT_UPDATE', payload.new);
        }
      )
      .subscribe((status, err) => {
        if (err || status === 'CHANNEL_ERROR') {
          console.warn('[Realtime notice] Canal Supabase estado:', status);
        }
      });
  } catch (err) {
    console.warn('Error setting up Supabase Realtime channel:', err);
  }
}

/**
 * Subscribe to realtime updates for live market, projects, and rankings.
 * Uses a single shared Supabase channel to eliminate duplicates and memory leaks.
 */
export function subscribeToDashboardRealtime(onEvent) {
  realtimeListeners.add(onEvent);
  activeSubscriberCount++;

  ensureGlobalSupabaseChannel();

  const unsubscribeMock = subscribeToMockChanges((event, payload) => {
    onEvent({
      type: event,
      payload,
    });
  });

  return () => {
    realtimeListeners.delete(onEvent);
    activeSubscriberCount = Math.max(0, activeSubscriberCount - 1);
    if (unsubscribeMock) unsubscribeMock();

    if (activeSubscriberCount === 0 && globalSupabaseChannel && supabase) {
      try {
        supabase.removeChannel(globalSupabaseChannel);
      } catch (e) {
        // ignore
      }
      globalSupabaseChannel = null;
    }
  };
}

export async function getAllVisitors() {
  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockStore.getAllVisitors();
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, investments(amount, project_id), customer_tokens(project_id)')
      .order('created_at', { ascending: false });

    if (error) {
      if (isSchemaMissingError(error)) {
        markSupabaseSchemaMissing('getAllVisitors profiles');
      }
      return mockStore.getAllVisitors();
    }

    return (data || []).map((p) => {
      const investedAmount = (p.investments || []).reduce(
        (sum, i) => sum + Number(i.amount || 0),
        0
      );
      const tokensCount = (p.customer_tokens || []).length;
      const supportedProjects = new Set((p.investments || []).map((i) => i.project_id)).size;

      return {
        ...p,
        invested_amount: investedAmount,
        tokens_count: tokensCount,
        projects_supported: supportedProjects,
      };
    });
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('getAllVisitors catch');
    }
    return mockStore.getAllVisitors();
  }
}
