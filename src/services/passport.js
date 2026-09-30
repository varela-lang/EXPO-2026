import {
  supabase,
  isSupabaseConfigured,
  isSchemaMissingError,
  getSupabaseSchemaStatus,
  markSupabaseSchemaMissing,
} from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import { broadcastDashboardEvent } from './dashboard';

/**
 * Passport Service
 * Manages City Stamps, Virtual Passport Progress, Final Tokens, and Prize Revelations.
 */

async function getSupabaseAuthSession() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.user) return null;
    return data.session;
  } catch {
    return null;
  }
}

export async function getPassport(userId) {
  if (!userId) return null;

  const session = await getSupabaseAuthSession();
  const schemaStatus = getSupabaseSchemaStatus();

  // If Supabase not configured or schema missing or no session, use reliable local mockStore
  if (!isSupabaseConfigured || schemaStatus === 'missing_tables' || !session) {
    return mockStore.getPassport(userId);
  }

  try {
    // 1. Fetch user profile
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .maybeSingle();

    if (profErr && isSchemaMissingError(profErr)) {
      markSupabaseSchemaMissing('getPassport profiles: ' + profErr.message);
      return mockStore.getPassport(userId);
    }

    // 2. Fetch all active projects (cities)
    const { data: projects, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('active', true)
      .order('created_at');

    if (projErr && isSchemaMissingError(projErr)) {
      markSupabaseSchemaMissing('getPassport projects: ' + projErr.message);
      return mockStore.getPassport(userId);
    }

    // 3. Fetch stamps of this user
    const { data: stamps, error: stampErr } = await supabase
      .from('passport_stamps')
      .select('*')
      .eq('user_id', userId);

    if (stampErr && isSchemaMissingError(stampErr)) {
      markSupabaseSchemaMissing('getPassport stamps: ' + stampErr.message);
      return mockStore.getPassport(userId);
    }

    // 4. Fetch passport token if unlocked
    const { data: userToken, error: tokErr } = await supabase
      .from('passport_tokens')
      .select('*, prizes(id, name, description, value)')
      .eq('user_id', userId)
      .maybeSingle();

    const stampedProjectIds = new Set((stamps || []).map((s) => s.project_id));
    const stampMap = new Map((stamps || []).map((s) => [s.project_id, s.created_at]));

    const mockPassport = mockStore.getPassport(userId);

    const cities = (projects && projects.length > 0 ? projects : mockPassport?.cities || []).map((p) => {
      const isStamped = stampedProjectIds.has(p.id) || mockPassport?.cities?.find((mc) => mc.id === p.id)?.unlocked;
      const stampedAt = stampMap.get(p.id) || mockPassport?.cities?.find((mc) => mc.id === p.id)?.stamped_at;
      return {
        id: p.id,
        name: p.name,
        city: p.city || 'Ciudad',
        country: p.country || 'Mundo',
        country_code: p.country_code || '🌐',
        passport_code: p.passport_code || 'EXP-1234',
        description: p.description,
        team_name: p.team_name,
        logo_url: p.logo_url,
        unlocked: Boolean(isStamped),
        stamped_at: stampedAt || null,
      };
    });

    const visitedCount = cities.filter((c) => c.unlocked).length;
    const totalCount = cities.length;
    const percentage = Math.round((visitedCount / Math.max(totalCount, 1)) * 100);
    const isCompleted = totalCount > 0 && visitedCount >= totalCount;

    let tokenDetails = null;
    if (userToken || mockPassport?.token) {
      const srcToken = userToken || mockPassport.token;
      tokenDetails = {
        token_code: srcToken.token_code,
        completed_at: srcToken.completed_at,
        revealed: Boolean(srcToken.revealed),
        has_prize: Boolean(srcToken.prizes || srcToken.has_prize),
        prize: srcToken.prizes || srcToken.prize || null,
      };
    }

    return {
      user: profile || mockPassport?.user || { id: userId, full_name: 'Visitante' },
      cities,
      visitedCount,
      totalCount,
      percentage,
      isCompleted,
      token: tokenDetails,
    };
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('getPassport catch: ' + err.message);
    }
    console.warn('Error fetching passport from Supabase, using mockStore fallback:', err);
    return mockStore.getPassport(userId);
  }
}

export async function claimPassportStamp(code, userId) {
  if (!code || !code.trim()) {
    throw new Error('Debes ingresar un código de ciudad válido.');
  }

  const cleanCode = code.toUpperCase().trim();
  const session = await getSupabaseAuthSession();
  const effectiveUserId = userId || session?.user?.id || mockStore.getCurrentUser()?.id;

  if (!effectiveUserId) {
    throw new Error('Debes iniciar sesión o registrarte como visitante para sellar tu pasaporte.');
  }

  const schemaStatus = getSupabaseSchemaStatus();

  // If Supabase not ready or no session, execute via mockStore
  if (!isSupabaseConfigured || schemaStatus === 'missing_tables' || !session) {
    const res = mockStore.claimPassportStamp(effectiveUserId, cleanCode);
    broadcastDashboardEvent('PASSPORT_STAMP_CLAIMED', {
      type: 'passport_stamp',
      code: cleanCode,
      stamp: res.stamp,
      completed: res.completed,
      token_code: res.token_code,
      project: {
        id: res.stamp.project_id,
        name: `${res.stamp.country_code} ${res.stamp.city}`,
      },
      timestamp: new Date().toISOString(),
    });
    return res;
  }

  try {
    const { data, error } = await supabase.rpc('claim_passport_stamp', {
      p_code: cleanCode,
      p_user_id: effectiveUserId,
    });

    if (error) {
      if (error.message?.includes('Ya tienes el sello')) {
        throw new Error('Ya tienes el sello de esta ciudad.');
      }
      if (error.message?.includes('no existe') || error.code === 'P0002') {
        throw new Error('El código ingresado no existe o no corresponde a una ciudad válida.');
      }
      if (isSchemaMissingError(error)) {
        markSupabaseSchemaMissing('claim_passport_stamp RPC: ' + error.message);
        const fallbackRes = mockStore.claimPassportStamp(effectiveUserId, cleanCode);
        return fallbackRes;
      }
      throw new Error(error.message || 'Error al validar el código de ciudad.');
    }

    broadcastDashboardEvent('PASSPORT_STAMP_CLAIMED', {
      type: 'passport_stamp',
      code: cleanCode,
      stamp: data.stamp,
      completed: data.completed,
      token_code: data.token_code,
      project: {
        id: data.stamp?.project_id,
        name: `${data.stamp?.country_code || '📍'} ${data.stamp?.city || 'Ciudad'}`,
      },
      timestamp: new Date().toISOString(),
    });

    return data;
  } catch (err) {
    if (err.message?.includes('Ya tienes el sello') || err.message?.includes('no existe')) {
      throw err;
    }
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('claimPassportStamp catch: ' + err.message);
      return mockStore.claimPassportStamp(effectiveUserId, cleanCode);
    }
    throw err;
  }
}

export async function revealPassportToken(userId) {
  const session = await getSupabaseAuthSession();
  const effectiveUserId = userId || session?.user?.id || mockStore.getCurrentUser()?.id;

  if (!effectiveUserId) {
    throw new Error('Usuario no autenticado.');
  }

  const schemaStatus = getSupabaseSchemaStatus();

  if (!isSupabaseConfigured || schemaStatus === 'missing_tables' || !session) {
    return mockStore.revealPassportToken(effectiveUserId);
  }

  try {
    const { data, error } = await supabase.rpc('reveal_passport_token', {
      p_user_id: effectiveUserId,
    });

    if (error) {
      if (isSchemaMissingError(error)) {
        markSupabaseSchemaMissing('reveal_passport_token RPC: ' + error.message);
        return mockStore.revealPassportToken(effectiveUserId);
      }
      throw new Error(error.message || 'Error al revelar el premio.');
    }

    return data;
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('revealPassportToken catch');
      return mockStore.revealPassportToken(effectiveUserId);
    }
    throw err;
  }
}

export async function getPassportAdminStats() {
  const mockAdminStats = mockStore.getPassportAdminStats();

  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockAdminStats;
  }

  try {
    const [stampsRes, tokensRes, prizesRes, visRes, projRes] = await Promise.all([
      supabase.from('passport_stamps').select('*, projects(id, city, country, country_code)'),
      supabase.from('passport_tokens').select('*, prizes(*)'),
      supabase.from('prizes').select('*').order('created_at'),
      supabase.from('profiles').select('*').eq('role', 'visitor'),
      supabase.from('projects').select('*').eq('active', true),
    ]);

    if (stampsRes.error || tokensRes.error || visRes.error) {
      return mockAdminStats;
    }

    const visitors = visRes.data || [];
    const stamps = stampsRes.data || [];
    const tokens = tokensRes.data || [];
    const prizes = prizesRes.data || [];
    const projects = projRes.data || [];

    const cityStats = projects.map((p) => {
      const count = stamps.filter((s) => s.project_id === p.id).length;
      return {
        id: p.id,
        city: p.city || p.name,
        country: p.country,
        country_code: p.country_code,
        stamps_count: count,
        percentage: visitors.length > 0 ? Math.round((count / visitors.length) * 100) : 0,
      };
    }).sort((a, b) => b.stamps_count - a.stamps_count);

    const visitorRows = visitors.map((v) => {
      const vStamps = stamps.filter((s) => s.user_id === v.id);
      const vToken = tokens.find((t) => t.user_id === v.id);
      return {
        id: v.id,
        name: v.full_name || 'Visitante',
        email: v.email,
        progress: `${vStamps.length} / ${projects.length}`,
        percentage: Math.round((vStamps.length / Math.max(projects.length, 1)) * 100),
        token_code: vToken ? vToken.token_code : null,
        prize_name: vToken?.prizes?.name || (vToken ? 'Sin premio' : 'Pendiente'),
        has_prize: Boolean(vToken?.prize_id),
        status: vToken ? (vToken.revealed ? 'Completado & Revelado' : 'Completado (Token Listo)') : 'En progreso',
      };
    });

    return {
      totalVisitors: Math.max(visitors.length, mockAdminStats.totalVisitors),
      completedPassports: Math.max(tokens.length, mockAdminStats.completedPassports),
      totalStamps: Math.max(stamps.length, mockAdminStats.totalStamps),
      tokensUnlocked: Math.max(tokens.length, mockAdminStats.tokensUnlocked),
      tokensWithPrize: tokens.filter((t) => t.prize_id).length || mockAdminStats.tokensWithPrize,
      prizesDelivered: tokens.filter((t) => t.revealed && t.prize_id).length || mockAdminStats.prizesDelivered,
      cityStats: cityStats.length > 0 ? cityStats : mockAdminStats.cityStats,
      visitorRows: visitorRows.length > 0 ? visitorRows : mockAdminStats.visitorRows,
      prizes: prizes.length > 0 ? prizes : mockAdminStats.prizes,
    };
  } catch (err) {
    console.warn('Error fetching passport admin stats:', err);
    return mockAdminStats;
  }
}

export async function createPrize(prizeData) {
  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockStore.createPrize(prizeData);
  }

  try {
    const { data, error } = await supabase
      .from('prizes')
      .insert([prizeData])
      .select()
      .single();

    if (error) {
      return mockStore.createPrize(prizeData);
    }
    return data;
  } catch {
    return mockStore.createPrize(prizeData);
  }
}
