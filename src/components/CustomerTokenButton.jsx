import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Check, Loader2, Sparkles, X, LogIn, UserCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { giveCustomerToken } from '../services/customers';
import { useAuth } from '../hooks/useAuth';

export function CustomerTokenButton({ project, hasGivenToken, onTokenGiven }) {
  const { user, switchDemoRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleOpenConfirm = () => {
    if (hasGivenToken) return;
    setError(null);
    setIsSuccess(false);
    setIsModalOpen(true);
  };

  const handleConfirmGiveToken = async () => {
    if (!user?.id) {
      setError('Debes iniciar sesión o identificarte para entregar un Customer Token.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await giveCustomerToken(project.id, user.id, project);

      // Heart confetti explosion
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#F43F5E', '#FB7185', '#FDA4AF', '#38BDF8'],
        });
      } catch (e) {
        console.error(e);
      }

      setIsSuccess(true);
      if (onTokenGiven) {
        onTokenGiven(res);
      }

      setTimeout(() => {
        setIsModalOpen(false);
      }, 1800);
    } catch (err) {
      console.error('Error giving customer token:', err);
      setError(err.message || 'No se pudo entregar el Customer Token.');
    } finally {
      setLoading(false);
    }
  };

  if (hasGivenToken) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold text-xs md:text-sm">
        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
        <span>❤️ Ya diste tu Customer Token</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenConfirm}
        className="group relative w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#0D192A] hover:bg-slate-800/90 border border-rose-500/30 hover:border-rose-500/60 text-white transition-all shadow-md hover:shadow-rose-500/10"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 fill-rose-500/20 group-hover:fill-rose-500 text-rose-400 transition-colors" />
          </div>
          <div>
            <span className="text-xs md:text-sm font-bold block text-white group-hover:text-rose-300 transition-colors">
              Dar Customer Token
            </span>
            <span className="text-[11px] text-slate-400 block">
              "Yo utilizaría este proyecto"
            </span>
          </div>
        </div>

        <span className="text-xs font-semibold text-rose-400 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
          +1 Voto
        </span>
      </button>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#0D192A] border border-rose-500/30 p-6 md:p-7 text-center shadow-2xl shadow-rose-950/40">
            {/* Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {!user ? (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Inicia sesión para validar
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  Para otorgar un Customer Token a <strong className="text-white">{project.name}</strong> debes estar identificado como visitante.
                </p>
                <div className="space-y-2.5">
                  <Link
                    to="/registro"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center justify-center gap-2"
                  >
                    Registrarme como Visitante
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('visitor');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/5 flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Continuar como Visitante Invitado
                  </button>
                </div>
              </div>
            ) : !isSuccess ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-7 h-7 fill-rose-500" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  ¿Utilizarías este producto?
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  Tu <strong className="text-rose-400">Customer Token</strong> indica formalmente que sí utilizarías o comprarías este proyecto en el mercado real.
                </p>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/30 mb-4">
                    {error}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs border border-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmGiveToken}
                    disabled={loading}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      'Dar Customer Token'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-3 animate-bounce">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-white mb-1">
                  ❤️ Customer Token registrado
                </h4>
                <p className="text-xs text-slate-300">
                  ¡Gracias por validar la propuesta de {project.name}!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
