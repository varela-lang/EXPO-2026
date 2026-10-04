import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ArrowRight, Loader2, AlertCircle, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { loginByName, login, isSupabaseConfigured, switchDemoRole } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Discrete secondary toggle for event organizers / teams
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleVisitorSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre para continuar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginByName(name.trim());
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Error al ingresar visitante:', err);
      setError(err.message || 'No se pudo iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setError('Ingresa correo y contraseña de organizador.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { profile } = await login({ email: adminEmail, password: adminPassword });
      if (profile?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile?.role === 'team') {
        navigate('/team', { replace: true });
      } else {
        navigate('/wallet', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-[#0B1524] border border-slate-800 p-6 sm:p-8 shadow-xl shadow-black/40">
          {!showAdminLogin ? (
            /* Visitor Flow: 100% Single Name Input */
            <div>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Bienvenido a RaizeUp
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Ingresa tu nombre para comenzar a explorar las 8 ciudades, apoyar proyectos y sellar tu pasaporte.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVisitorSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="visitor-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
                  >
                    ¿Cuál es tu nombre?
                  </label>
                  <div className="relative">
                    <input
                      id="visitor-name"
                      type="text"
                      autoFocus
                      required
                      placeholder="Ej. Sergio"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-base placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>
                    Recibirás automáticamente <strong className="text-emerald-400 font-mono font-medium">$10,000</strong> de capital virtual para apoyar proyectos.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingresando a RaizeUp...</span>
                    </>
                  ) : (
                    <>
                      <span>COMENZAR</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowAdminLogin(true);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Acceso para Organizadores y Stands</span>
                </button>
              </div>
            </div>
          ) : (
            /* Organizer / Team Login */
            <div>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 mb-3">
                  <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Acceso Administrativo
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Panel reservado para el comité organizador y equipos
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@expo.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/30 text-xs text-blue-300 space-y-1">
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-blue-400" /> Credenciales de Administrador:
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    Usuario: <span className="font-mono text-blue-300 select-all font-semibold">admin@expo.com</span>
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    Contraseña: <span className="font-mono text-blue-300 select-all font-semibold">admin123</span> (o presionar <em>Admin Demo</em> abajo)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar como Organizador'}
                </button>
              </form>

              {/* Demo quick switch for organizers when in preview */}
              {!isSupabaseConfigured && (
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-2 text-center">
                    Cuentas de prueba rápida:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole('admin');
                        navigate('/admin');
                      }}
                      className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-200 transition-colors"
                    >
                      Admin Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole('team');
                        navigate('/team');
                      }}
                      className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-200 transition-colors"
                    >
                      Equipo Demo
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowAdminLogin(false);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  ← Volver al acceso para visitantes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
