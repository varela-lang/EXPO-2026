import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';

export function Register() {
  const { loginByName } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginByName(name.trim());
      try {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#38BDF8', '#10B981'],
        });
      } catch (e) {
        // ignore
      }
      navigate('/wallet');
    } catch (err) {
      setError(err.message || 'Error al ingresar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-[#0B1524] border border-slate-800 p-6 sm:p-8 shadow-xl shadow-black/40">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bienvenido a RaizeUp
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Únete a la Expo RaizeUp: 8 ciudades y 8 proyectos de innovación
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="register-visitor-name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                ¿Cuál es tu nombre?
              </label>
              <input
                id="register-visitor-name"
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

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>
                Recibirás <strong className="text-emerald-400 font-mono font-medium">$10,000</strong> de capital virtual inmediatamente al continuar.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <span>CONTINUAR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
