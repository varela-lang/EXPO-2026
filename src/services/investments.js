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
 * Investments Service
 * Executes atomic RPC functions in Supabase PostgreSQL,
 * with seamless local store fallback and real-time live market broadcasting.
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

export async function makeInvestment(projectId, amount, userId, projectData = null) {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('El monto a invertir debe ser mayor a 0');
  }

  // 1. Determine effective user ID
  const session = await getSupabaseAuthSession();
  const effectiveUserId = userId || session?.user?.id || mockStore.getCurrentUser()?.id;

  if (!effectiveUserId) {
    throw new Error('Debes iniciar sesión o registrarte como visitante para invertir.');
  }

  // Helper to broadcast after successful investment
  const notifyLiveMarket = (result) => {
    broadcastDashboardEvent('INVESTMENT_CREATED', {
      type: 'investment',
      amount: numericAmount,
      project_id: projectId,
      project: {
        id: projectId,
        name: result?.project_name || projectData?.name || 'Proyecto',
        team_name: projectData?.team_name,
        category: projectData?.category,
      },
      new_balance: result?.new_balance,
      timestamp: new Date().toISOString(),
    });
  };

  // 2. If Supabase is not configured, or schema is missing tables, OR user does not have an active Supabase JWT session:
  // Execute via reliable atomic local mockStore so the user is NEVER blocked.
  const schemaStatus = getSupabaseSchemaStatus();
  if (!isSupabaseConfigured || schemaStatus === 'missing_tables' || !session) {
    const res = mockStore.makeInvestment(effectiveUserId, projectId, numericAmount, projectData);
    notifyLiveMarket(res);
    return res;
  }

  try {
    // Attempt RPC call. Try with p_user_id first to support guest/proxy auth,
    // and fallback to standard 2-parameter signature if needed.
    let rpcResponse = await supabase.rpc('make_investment', {
      project_id: projectId,
      amount: numericAmount,
      p_user_id: effectiveUserId,
    });

    // If PostgREST indicates p_user_id is not in function parameter list:
    if (
      rpcResponse.error &&
      (rpcResponse.error.code === 'PGRST202' ||
        rpcResponse.error.message?.includes('parameter') ||
        rpcResponse.error.message?.includes('p_user_id'))
    ) {
      rpcResponse = await supabase.rpc('make_investment', {
        project_id: projectId,
        amount: numericAmount,
      });
    }

    const { data, error } = rpcResponse;

    if (error) {
      console.warn('Supabase make_investment RPC response with error:', error);

      // Handle unauthenticated error or schema missing by fulfilling via mockStore
      if (
        isSchemaMissingError(error) ||
        error.message?.includes('autenticado') ||
        error.message?.includes('not authenticated') ||
        error.message?.includes('function') ||
        error.message?.includes('does not exist') ||
        error.code === '42501' ||
        error.code === 'P0002'
      ) {
        if (isSchemaMissingError(error)) {
          markSupabaseSchemaMissing('make_investment RPC: ' + error.message);
        }
        console.info('Ejecutando inversión con almacén local seguro como respaldo.');
        const fallbackRes = mockStore.makeInvestment(effectiveUserId, projectId, numericAmount);
        notifyLiveMarket(fallbackRes);
        return fallbackRes;
      }

      throw new Error(error.message || 'Error al procesar la inversión en el servidor');
    }

    notifyLiveMarket(data);
    return data;
  } catch (err) {
    console.warn('makeInvestment exception:', err);
    if (
      isSchemaMissingError(err) ||
      err.message?.includes('autenticado') ||
      err.message?.includes('not authenticated') ||
      err.code === '42501' ||
      err.code === 'P0002'
    ) {
      if (isSchemaMissingError(err)) {
        markSupabaseSchemaMissing('makeInvestment catch');
      }
      const fallbackRes = mockStore.makeInvestment(effectiveUserId, projectId, numericAmount);
      notifyLiveMarket(fallbackRes);
      return fallbackRes;
    }
    throw err;
  }
}

export async function getWallet(userId) {
  if (!userId) return null;

  const session = await getSupabaseAuthSession();
  const schemaStatus = getSupabaseSchemaStatus();

  // If Supabase not configured, tables missing, or no active Supabase Auth session
  if (!isSupabaseConfigured || schemaStatus === 'missing_tables' || !session) {
    return mockStore.getWallet(userId);
  }

  try {
    // 1. Fetch user profile (balance)
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) {
      if (isSchemaMissingError(profileErr)) {
        markSupabaseSchemaMissing('getWallet profiles: ' + profileErr.message);
      }
      return mockStore.getWallet(userId);
    }

    if (!profile) {
      return mockStore.getWallet(userId);
    }

    // 2. Fetch user's investments
    const { data: investments, error: invErr } = await supabase
      .from('investments')
      .select('*, projects(name, logo_url, team_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (invErr && isSchemaMissingError(invErr)) {
      markSupabaseSchemaMissing('getWallet investments');
      return mockStore.getWallet(userId);
    }

    // 3. Fetch user's transactions
    const { data: transactions, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (txErr && isSchemaMissingError(txErr)) {
      markSupabaseSchemaMissing('getWallet transactions');
      return mockStore.getWallet(userId);
    }

    // 4. Fetch user's customer tokens count
    const { count: tokensCount, error: tokErr } = await supabase
      .from('customer_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (tokErr && isSchemaMissingError(tokErr)) {
      markSupabaseSchemaMissing('getWallet customer_tokens');
      return mockStore.getWallet(userId);
    }

    const totalInvested = (investments || []).reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const supportedProjectsCount = new Set((investments || []).map((i) => i.project_id)).size;

    return {
      profile,
      balance: Number(profile.balance || 0),
      totalInvested,
      supportedProjectsCount,
      tokensGivenCount: tokensCount || 0,
      transactions: transactions || [],
      investments: investments || [],
    };
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('getWallet catch');
    }
    return mockStore.getWallet(userId);
  }
}

export async function getAllInvestments() {
  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockStore.getAllInvestments();
  }

  try {
    const { data, error } = await supabase
      .from('investments')
      .select('*, profiles(full_name, email), projects(name)')
      .order('created_at', { ascending: false });

    if (error) {
      if (isSchemaMissingError(error)) {
        markSupabaseSchemaMissing('getAllInvestments');
      }
      return mockStore.getAllInvestments();
    }

    return (data || []).map((item) => ({
      ...item,
      visitor_name: item.profiles?.full_name || 'Visitante',
      visitor_email: item.profiles?.email || '',
      project_name: item.projects?.name || 'Proyecto',
    }));
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('getAllInvestments catch');
    }
    return mockStore.getAllInvestments();
  }
}
