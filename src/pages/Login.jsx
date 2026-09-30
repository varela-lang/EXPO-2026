import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle, Loader2, Sparkles, User, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { login, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { profile } = await login({ email, password });
      
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Role-based redirect
      if (profile?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile?.role === 'team') {
        navigate('/team', { replace: true });
      } else {
        navigate('/wallet', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        {/* Glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative rounded-3xl bg-[#0D192A] border border-white/10 p-7 sm:p-9 shadow-2xl shadow-blue-950/40">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Accede a tu cuenta de visitante, equipo o administración
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Entrar a la Plataforma'
              )}
            </button>
          </form>

          {/* Quick accounts for Demo Mode testing */}
          {!isSupabaseConfigured && (
            <div className="mt-6 pt-5 border-t border-white/5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Acceso Rápido de Prueba (Demo)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin@expo.com', 'admin123')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-left text-xs text-slate-300 transition-colors flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span className="truncate">Admin Expo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('equipo@ecotech.com', 'team123')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-left text-xs text-slate-300 transition-colors flex items-center gap-2"
                >
                  <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                  <span className="truncate">Equipo EcoTech</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            ¿Eres visitante y aún no tienes cuenta?{' '}
            <Link to="/registro" className="text-blue-400 hover:underline font-semibold">
              Regístrate y recibe $10,000
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
