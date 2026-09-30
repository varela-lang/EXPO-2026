import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, DollarSign, AlertCircle, CheckCircle2, ArrowRight, Loader2, Sparkles, UserCheck, LogIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { makeInvestment } from '../services/investments';
import { useAuth } from '../hooks/useAuth';

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500];

export function InvestmentModal({ project, isOpen, onClose, onInvestmentSuccess }) {
  const { user, profile, refreshProfile, switchDemoRole } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  if (!isOpen || !project) return null;

  const currentBalance = Number(profile?.balance || 0);
  const activeAmount = isCustom ? Number(customAmount || 0) : selectedAmount;
  const balanceAfter = currentBalance - activeAmount;
  const isBalanceSufficient = activeAmount > 0 && activeAmount <= currentBalance;

  const handleSelectPreset = (amount) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setError(null);
  };

  const handleCustomChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    setIsCustom(true);
    setError(null);
  };

  const handleProceedToConfirm = () => {
    if (!user) {
      setError('Debes iniciar sesión o registrarte como visitante para invertir.');
      return;
    }
    if (!activeAmount || activeAmount <= 0) {
      setError('Por favor selecciona o ingresa un monto válido a invertir.');
      return;
    }
    if (activeAmount > currentBalance) {
      setError(`Saldo insuficiente. Tu capital disponible es de $${currentBalance.toLocaleString()}.`);
      return;
    }
    setError(null);
    setStep('confirm');
  };

  const handleConfirmInvestment = async () => {
    if (!user?.id) {
      setError('Debes iniciar sesión para realizar la inversión.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await makeInvestment(project.id, activeAmount, user.id, project);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#60A5FA', '#10B981', '#F59E0B'],
        });
      } catch (e) {
        console.error(e);
      }

      setResultData(res);
      await refreshProfile();
      if (onInvestmentSuccess) {
        onInvestmentSuccess(res);
      }
      setStep('success');
    } catch (err) {
      console.error('Error confirming investment:', err);
      setError(err.message || 'Error al procesar la inversión.');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setError(null);
    setResultData(null);
    setIsCustom(false);
    setSelectedAmount(500);
    setCustomAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0D192A] border border-blue-500/20 shadow-2xl shadow-blue-950/50">
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-400" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* IF USER IS NOT LOGGED IN: SHOW GUEST / AUTH PROMPT */}
        {!user ? (
          <div className="p-6 md:p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7" />
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Inicia sesión para invertir
            </h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Para asignar capital virtual a <strong className="text-white">{project.name}</strong> y recibir tus <strong>$10,000 virtuales</strong>, debes identificarte como visitante.
            </p>

            <div className="space-y-3">
              <Link
                to="/registro"
                onClick={handleClose}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                Registrarme y Obtener $10,000
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                Ya tengo una cuenta
              </Link>

              <button
                type="button"
                onClick={() => {
                  switchDemoRole('visitor');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Continuar rápido como Visitante Invitado ($10,000)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: SELECT AMOUNT */}
            {step === 'select' && (
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Inversión de Capital</span>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                  Invertir en {project.name}
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                  Selecciona el capital virtual que deseas asignar a este proyecto de {project.team_name}.
                </p>

                {/* Current Balance Card */}
                <div className="p-3.5 mb-6 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Tu Capital Disponible</span>
                    <span className="text-base font-extrabold text-white font-mono">
                      ${currentBalance.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    {profile?.full_name || 'Inversionista'}
                  </span>
                </div>

                {/* Preset amounts */}
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Montos Rápidos
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {PRESET_AMOUNTS.map((amt) => {
                    const isSelected = !isCustom && selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPreset(amt)}
                        className={`py-3 px-3 rounded-xl font-bold text-sm font-mono transition-all border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 scale-[1.02]'
                            : 'bg-slate-900/80 text-slate-200 border-white/10 hover:border-blue-400/40 hover:bg-slate-800'
                        }`}
                      >
                        ${amt.toLocaleString()}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    O ingresa un monto personalizado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="text"
                      placeholder="ej. 750"
                      value={customAmount}
                      onChange={handleCustomChange}
                      className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-colors ${
                        isCustom
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-white/10 focus:border-blue-400'
                      }`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceedToConfirm}
                  disabled={!isBalanceSufficient}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isBalanceSufficient
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  Continuar (${activeAmount.toLocaleString()})
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: CONFIRMATION MODAL */}
            {step === 'confirm' && (
              <div className="p-6 md:p-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6" />
                </div>

                <h2 className="text-xl font-extrabold text-white mb-1">
                  Confirmar Inversión
                </h2>
                <p className="text-sm text-slate-300 mb-6">
                  ¿Deseas invertir <span className="text-blue-400 font-bold">${activeAmount.toLocaleString()}</span> en <span className="text-white font-bold">{project.name}</span>?
                </p>

                {/* Financial breakdown box */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 mb-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Proyecto de destino</span>
                    <span className="font-semibold text-white">{project.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Monto de la inversión</span>
                    <span className="font-bold text-blue-400 font-mono text-sm">
                      ${activeAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Saldo antes</span>
                    <span className="font-mono text-slate-300">
                      ${currentBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Saldo después</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${balanceAfter.toLocaleString()}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    disabled={loading}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/5 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmInvestment}
                    disabled={loading}
                    className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Confirmar Inversión'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {step === 'success' && (
              <div className="p-6 md:p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Transacción Completada</span>
                </div>

                <h2 className="text-2xl font-extrabold text-white mb-2">
                  🎉 ¡Inversión realizada!
                </h2>

                <p className="text-sm text-slate-300 mb-6">
                  Has invertido exitosamente <span className="font-bold text-emerald-400 font-mono">${activeAmount.toLocaleString()}</span> en <span className="font-bold text-white">{project.name}</span>.
                </p>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 mb-6 text-left">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Nuevo Saldo Disponible:</span>
                    <span className="font-mono font-bold text-white">
                      ${(resultData?.new_balance !== undefined ? resultData.new_balance : balanceAfter).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Equipo Beneficiado:</span>
                    <span className="text-slate-300 font-medium">{project.team_name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
                >
                  Entendido y Cerrar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
