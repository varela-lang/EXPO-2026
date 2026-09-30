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
 * Customer Tokens Service
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

export async function giveCustomerToken(projectId, userId) {
  // 1. Determine effective user ID
  const session = await getSupabaseAuthSession();
  const effectiveUserId = userId || session?.user?.id || mockStore.getCurrentUser()?.id;

  if (!effectiveUserId) {
    throw new Error('Debes iniciar sesión o registrarte como visitante para entregar un Customer Token.');
  }

  const notifyLiveMarket = (result) => {
    broadcastDashboardEvent('CUSTOMER_TOKEN_CREATED', {
      type: 'customer_token',
      project_id: projectId,
      project: {
        id: projectId,
        name: result?.project_name || 'Proyecto',
      },
      total_tokens: result?.total_tokens,
      timestamp: new Date().toISOString(),
    });
  };

  // 2. If Supabase is not configured, or schema is missing tables, OR user does not have an active Supabase JWT session:
  // Execute via reliable atomic local mockStore.
  const schemaStatus = getSupabaseSchemaStatus();
  if (!isSupabaseConfigured || schemaStatus === 'missing_tables' || !session) {
    const res = mockStore.giveCustomerToken(effectiveUserId, projectId);
    notifyLiveMarket(res);
    return res;
  }

  try {
    // Attempt RPC call with p_user_id first
    let rpcResponse = await supabase.rpc('give_customer_token', {
      project_id: projectId,
      p_user_id: effectiveUserId,
    });

    if (
      rpcResponse.error &&
      (rpcResponse.error.code === 'PGRST202' ||
        rpcResponse.error.message?.includes('parameter') ||
        rpcResponse.error.message?.includes('p_user_id'))
    ) {
      rpcResponse = await supabase.rpc('give_customer_token', {
        project_id: projectId,
      });
    }

    const { data, error } = rpcResponse;

    if (error) {
      console.warn('Supabase give_customer_token RPC response with error:', error);

      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('Ya has')) {
        throw new Error('Ya has entregado tu Customer Token a este proyecto');
      }

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
          markSupabaseSchemaMissing('give_customer_token RPC: ' + error.message);
        }
        console.info('Registrando Customer Token con almacén local seguro como respaldo.');
        const fallbackRes = mockStore.giveCustomerToken(effectiveUserId, projectId);
        notifyLiveMarket(fallbackRes);
        return fallbackRes;
      }

      throw new Error(error.message || 'Error al registrar el Customer Token');
    }

    notifyLiveMarket(data);
    return data;
  } catch (err) {
    console.warn('giveCustomerToken exception:', err);
    if (err.message?.includes('Ya has entregado')) {
      throw err;
    }
    if (
      isSchemaMissingError(err) ||
      err.message?.includes('autenticado') ||
      err.message?.includes('not authenticated') ||
      err.code === '42501' ||
      err.code === 'P0002'
    ) {
      if (isSchemaMissingError(err)) {
        markSupabaseSchemaMissing('giveCustomerToken catch');
      }
      const fallbackRes = mockStore.giveCustomerToken(effectiveUserId, projectId);
      notifyLiveMarket(fallbackRes);
      return fallbackRes;
    }
    throw err;
  }
}

export async function hasUserGivenToken(userId, projectId) {
  if (!projectId) return false;

  const session = await getSupabaseAuthSession();
  const effectiveUserId = userId || session?.user?.id || mockStore.getCurrentUser()?.id;

  if (!effectiveUserId) return false;

  const schemaStatus = getSupabaseSchemaStatus();
  if (!isSupabaseConfigured || schemaStatus === 'missing_tables' || !session) {
    return mockStore.hasGivenCustomerToken(effectiveUserId, projectId);
  }

  try {
    const { data, error } = await supabase
      .from('customer_tokens')
      .select('id')
      .eq('user_id', effectiveUserId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      if (isSchemaMissingError(error)) {
        markSupabaseSchemaMissing('hasUserGivenToken table');
      }
      return mockStore.hasGivenCustomerToken(effectiveUserId, projectId);
    }

    return Boolean(data);
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('hasUserGivenToken catch');
    }
    return mockStore.hasGivenCustomerToken(effectiveUserId, projectId);
  }
}
