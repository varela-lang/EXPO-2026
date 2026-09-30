import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or localStorage override
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('expo_supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('expo_supabase_anon_key') : null;

export const supabaseUrl = storedUrl || envUrl || '';
export const supabaseAnonKey = storedKey || envAnonKey || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Utility to check if a Supabase/PostgREST error is due to missing tables
 * (e.g. code PGRST205: "Could not find the table '...' in the schema cache")
 */
export function isSchemaMissingError(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();

  return (
    code === 'PGRST205' || // Could not find the table in the schema cache
    code === '42P01' ||    // relation does not exist
    code === 'PGRST204' || // column not found
    code === 'PGRST200' ||
    code === 'PGRST202' || // function not found
    code === 'P0002' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('could not find the function') ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    details.includes('schema cache')
  );
}

// Reactive schema state manager
// Status can be: 'not_configured' | 'ready' | 'missing_tables' | 'checking'
let schemaStatus = !isSupabaseConfigured ? 'not_configured' : 'checking';
const schemaListeners = new Set();

export function getSupabaseSchemaStatus() {
  return schemaStatus;
}

export function markSupabaseSchemaMissing(context = '') {
  if (schemaStatus !== 'missing_tables') {
    schemaStatus = 'missing_tables';
    console.warn(
      `[Supabase Notice] Tablas o funciones no detectadas (${context || 'PGRST205'}). ` +
      `Se activa respaldo interactivo con datos de demostración hasta que se ejecute schema.sql en Supabase.`
    );
    notifySchemaListeners();
  }
}

export function markSupabaseSchemaReady() {
  if (schemaStatus !== 'ready') {
    schemaStatus = 'ready';
    console.info('[Supabase] Tablas y esquema verificados con éxito.');
    notifySchemaListeners();
  }
}

export function subscribeToSchemaStatus(callback) {
  schemaListeners.add(callback);
  callback(schemaStatus);
  return () => schemaListeners.delete(callback);
}

function notifySchemaListeners() {
  schemaListeners.forEach(listener => {
    try {
      listener(schemaStatus);
    } catch (e) {
      console.error('Error in schema status listener:', e);
    }
  });
}

/**
 * Health check probe to verify if tables exist in the schema cache
 */
export async function checkSupabaseHealth() {
  if (!isSupabaseConfigured || !supabase) {
    schemaStatus = 'not_configured';
    notifySchemaListeners();
    return { ok: false, status: 'not_configured' };
  }

  try {
    // Check if projects table exists
    const { error: projErr } = await supabase.from('projects').select('id').limit(1);
    if (projErr && isSchemaMissingError(projErr)) {
      markSupabaseSchemaMissing(`projects table check: ${projErr.message}`);
      return { ok: false, status: 'missing_tables', error: projErr };
    }

    // Check if profiles table exists
    const { error: profErr } = await supabase.from('profiles').select('id').limit(1);
    if (profErr && isSchemaMissingError(profErr)) {
      markSupabaseSchemaMissing(`profiles table check: ${profErr.message}`);
      return { ok: false, status: 'missing_tables', error: profErr };
    }

    markSupabaseSchemaReady();
    return { ok: true, status: 'ready' };
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing(`probe exception: ${err.message}`);
      return { ok: false, status: 'missing_tables', error: err };
    }
    console.warn('[Supabase probe warning]', err);
    return { ok: false, status: schemaStatus, error: err };
  }
}

// Automatically initiate health check on client load
if (typeof window !== 'undefined' && isSupabaseConfigured) {
  checkSupabaseHealth();
}

/**
 * Configure or update Supabase credentials in browser storage
 */
export function saveSupabaseConfig(url, anonKey) {
  if (url && anonKey) {
    localStorage.setItem('expo_supabase_url', url.trim());
    localStorage.setItem('expo_supabase_anon_key', anonKey.trim());
    window.location.reload();
  }
}

export function clearSupabaseConfig() {
  localStorage.removeItem('expo_supabase_url');
  localStorage.removeItem('expo_supabase_anon_key');
  window.location.reload();
}
