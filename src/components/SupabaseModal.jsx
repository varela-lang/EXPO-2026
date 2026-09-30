import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle,
  AlertTriangle,
  Key,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Code,
  Sparkles,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  supabaseUrl,
  saveSupabaseConfig,
  clearSupabaseConfig,
  checkSupabaseHealth,
  getSupabaseSchemaStatus,
} from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import { BUNDLED_SQL } from '../lib/bundledSql';

export function SupabaseModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(supabaseUrl || '');
  const [anonKey, setAnonKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthMessage, setHealthMessage] = useState(null);

  if (!isOpen) return null;

  const schemaStatus = getSupabaseSchemaStatus();

  const handleSave = (e) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Por favor ingresa tanto la URL de Supabase como la Anon Key.');
      return;
    }
    saveSupabaseConfig(url, anonKey);
  };

  const handleDisconnect = () => {
    if (confirm('¿Deseas desconectar y volver al modo demostración local?')) {
      clearSupabaseConfig();
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(BUNDLED_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      // Fallback textarea copy
      const el = document.createElement('textarea');
      el.value = BUNDLED_SQL;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleTestHealth = async () => {
    setTestingHealth(true);
    setHealthMessage(null);
    try {
      const res = await checkSupabaseHealth();
      if (res.status === 'ready') {
        setHealthMessage({
          type: 'success',
          text: '¡Excelente! Las tablas y funciones de Supabase se detectaron correctamente.',
        });
      } else if (res.status === 'missing_tables') {
        setHealthMessage({
          type: 'warning',
          text: 'Las tablas aún no se encuentran en la base de datos (Error PGRST205). Copia el SQL abajo y ejecútalo en el SQL Editor de Supabase.',
        });
      } else {
        setHealthMessage({
          type: 'info',
          text: 'Modo demostración activo.',
        });
      }
    } catch (e) {
      setHealthMessage({
        type: 'error',
        text: 'Error al verificar conexión: ' + (e.message || String(e)),
      });
    } finally {
      setTestingHealth(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0D192A] border border-blue-500/20 p-6 md:p-8 shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Conexión con Supabase</h3>
            <span className="text-xs text-slate-400">Estado del backend y base de datos</span>
          </div>
        </div>

        {/* Current status pill */}
        <div
          className={`p-4 rounded-2xl mb-6 border ${
            schemaStatus === 'ready'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : schemaStatus === 'missing_tables'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : isSupabaseConfigured
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {schemaStatus === 'ready' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-bold mb-0.5">
                  {schemaStatus === 'ready'
                    ? 'Conectado y Tablas Listas (Producción)'
                    : schemaStatus === 'missing_tables'
                    ? 'Conectado a Supabase pero Tablas No Creadas (Error PGRST205)'
                    : isSupabaseConfigured
                    ? 'Supabase Conectado'
                    : 'Modo Demostración Local Activo'}
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {schemaStatus === 'ready'
                    ? 'Todas las inversiones, RPCs y tablas de Supabase están sincronizadas y activas.'
                    : schemaStatus === 'missing_tables'
                    ? 'La URL y API Key están configuradas, pero las tablas (profiles, projects, etc.) aún no se han creado en Supabase. La app está funcionando con datos interactivos de demostración.'
                    : 'Puedes probar la app con datos interactivos o enlazar tu propio proyecto de Supabase.'}
                </p>
              </div>
            </div>

            {isSupabaseConfigured && (
              <button
                onClick={handleDisconnect}
                className="text-[11px] font-semibold text-rose-400 hover:underline shrink-0"
              >
                Desconectar
              </button>
            )}
          </div>

          {isSupabaseConfigured && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                {supabaseUrl ? new URL(supabaseUrl).host : 'Supabase'}
              </span>
              <button
                type="button"
                onClick={handleTestHealth}
                disabled={testingHealth}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${testingHealth ? 'animate-spin' : ''}`} />
                <span>Verificar Tablas Ahora</span>
              </button>
            </div>
          )}
        </div>

        {healthMessage && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-medium border ${
              healthMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : healthMessage.type === 'warning'
                ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                : 'bg-blue-950/60 border-blue-500/30 text-blue-300'
            }`}
          >
            {healthMessage.text}
          </div>
        )}

        {/* 1-Click SQL Copy Box */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                SQL Unificado (Schema + RPC + Seed)
              </span>
            </div>
            <button
              onClick={handleCopySql}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                copiedSql
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
              }`}
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡SQL Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL Completo</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            Para crear todas las tablas, vistas, RLS, trigger de $10,000, funciones RPC y los stands de ejemplo:
          </p>

          <ol className="text-[11px] text-slate-400 space-y-1.5 list-decimal list-inside bg-slate-950/60 p-3 rounded-xl border border-white/5 font-sans">
            <li>Haz clic en <strong>Copiar SQL Completo</strong> arriba.</li>
            <li>
              Abre tu panel en{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline inline-flex items-center gap-0.5"
              >
                supabase.com <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>Ve a la pestaña <strong>SQL Editor</strong> en la barra lateral.</li>
            <li>Pega el contenido y presiona <strong>Run</strong> (Ejecutar).</li>
            <li>¡Listo! Presiona <em>Verificar Tablas Ahora</em> y el backend estará 100% activo.</li>
          </ol>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Credenciales de Proyecto
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Project URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Anon Public Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Key className="w-3.5 h-3.5 text-blue-400" />
            Guardar Credenciales
          </button>
        </form>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Expo Investment • Motor Financiero
          </span>
          <button
            type="button"
            onClick={() => mockStore.resetDemoData()}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Restablecer Datos Locales
          </button>
        </div>
      </div>
    </div>
  );
}
