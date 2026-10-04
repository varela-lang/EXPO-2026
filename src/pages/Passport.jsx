import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Globe,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  QrCode,
  KeyRound,
  Gift,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  Compass,
  Zap,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';
import { getPassport, claimPassportStamp, revealPassportToken } from '../services/passport';
import { Loading } from '../components/Loading';

export function Passport() {
  const { user, profile, loginByName } = useAuth();
  const [searchParams] = useSearchParams();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Visitor quick-login on this page if not yet identified
  const [visitorNameInput, setVisitorNameInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Modals & User interaction states
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [codeError, setCodeError] = useState(null);

  // Success stamp revelation modal
  const [unlockedStamp, setUnlockedStamp] = useState(null);

  // Prize revelation state & modal
  const [revealingPrize, setRevealingPrize] = useState(false);
  const [prizeResultModal, setPrizeResultModal] = useState(null);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await getPassport(user.id);
      setPassport(data);
    } catch (err) {
      console.warn('Error loading passport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Handle URL pre-fill if scanned via QR code (e.g. /pasaporte?code=TOK-92XM)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && user?.id) {
      setInputCode(urlCode.toUpperCase().trim());
      setIsCodeModalOpen(true);
    }
  }, [searchParams, user?.id]);

  // Realtime updates when a stamp is claimed
  useRealtime((event) => {
    if (event.type === 'PASSPORT_STAMP_CLAIMED') {
      loadData();
    }
  });

  const handleQuickVisitorLogin = async (e) => {
    e.preventDefault();
    if (!visitorNameInput.trim()) {
      setLoginError('Ingresa tu nombre para comenzar.');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      await loginByName(visitorNameInput.trim());
      await loadData();
    } catch (err) {
      setLoginError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleClaimStamp = async (e) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) {
      setCodeError('Ingresa un código de ciudad válido.');
      return;
    }

    setValidating(true);
    setCodeError(null);

    try {
      const res = await claimPassportStamp(inputCode, user?.id);

      // Celebration effect
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#38BDF8', '#10B981', '#F59E0B'],
        });
      } catch (err) {
        // ignore
      }

      setIsCodeModalOpen(false);
      setInputCode('');
      setUnlockedStamp(res.stamp);
      await loadData();
    } catch (err) {
      console.error('Error claiming stamp:', err);
      setCodeError(err.message || 'Código no válido o error al registrar el sello.');
    } finally {
      setValidating(false);
    }
  };

  const handleRevealPrize = async () => {
    if (!user?.id) return;
    setRevealingPrize(true);

    try {
      const res = await revealPassportToken(user.id);
      setPrizeResultModal(res);

      if (res.has_prize) {
        try {
          confetti({
            particleCount: 140,
            spread: 85,
            origin: { y: 0.5 },
            colors: ['#F59E0B', '#10B981', '#38BDF8', '#EC4899'],
          });
        } catch (err) {
          // ignore
        }
      }
      await loadData();
    } catch (err) {
      console.error('Error revealing prize:', err);
    } finally {
      setRevealingPrize(false);
    }
  };

  if (loading) {
    return <Loading message="Cargando Pasaporte..." />;
  }

  // Not logged in: Show simple, clean on-the-spot name entrance
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl bg-[#0B1524] border border-slate-800 p-7 shadow-xl shadow-black/40">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Pasaporte RaizeUp</h2>
          <p className="text-xs text-slate-400 mb-6">
            Colecciona los 8 sellos de cada ciudad de la Expo RaizeUp y desbloquea tu Token Final.
          </p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleQuickVisitorLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 text-left">
                ¿Cuál es tu nombre?
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="Ej. Sergio"
                value={visitorNameInput}
                onChange={(e) => setVisitorNameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-base placeholder:text-slate-600 focus:outline-none focus:border-blue-500 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading || !visitorNameInput.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Abriendo pasaporte...</span>
                </>
              ) : (
                <>
                  <span>OBTENER MI PASAPORTE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const visitedCount = passport?.visitedCount || 0;
  const totalCount = passport?.totalCount || 8;
  const percentage = passport?.percentage || 0;
  const isCompleted = passport?.isCompleted || false;
  const token = passport?.token;

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* PASSPORT TOP HEADER */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0B1524] border border-slate-800 p-6 sm:p-8 shadow-xl shadow-black/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                <Globe className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    PASAPORTE OFICIAL
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    EXPO RAIZEUP
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {profile?.full_name || 'Visitante'}
                </h1>
                <p className="text-xs text-slate-400">
                  Explora las 8 ciudades y colecciona los sellos de cada stand
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCodeModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                <span>INGRESAR CÓDIGO</span>
              </button>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium text-xs flex items-center gap-2 transition-colors"
              >
                <QrCode className="w-4 h-4 text-blue-400" />
                <span>ESCANEAR QR</span>
              </button>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="pt-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-400" />
                Progreso del Pasaporte
              </span>
              <span className="font-mono font-bold text-white">
                {visitedCount} / {totalCount} ciudades ({percentage}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.max(percentage, 4)}%` }}
              />
            </div>
          </div>
        </div>

        {/* FINAL TOKEN COMPLETION BANNER */}
        {isCompleted && (
          <div className="relative overflow-hidden rounded-2xl bg-[#0B1524] border border-blue-500/40 p-6 sm:p-7 shadow-xl shadow-blue-950/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  <Sparkles className="w-3 h-3" />
                  🎉 ¡PASAPORTE COMPLETADO!
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Has recorrido las 8 ciudades de la Expo RaizeUp.
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Tu viaje ha terminado... pero todavía hay una sorpresa.
                </p>
              </div>

              {/* Final Token & Prize Reveal Box */}
              <div className="w-full md:w-auto p-4 rounded-xl bg-slate-900 border border-slate-700 text-center min-w-[240px]">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>TOKEN FINAL</span>
                </div>
                <span className="text-lg font-bold font-mono text-white block mb-3">
                  {token?.token_code || '#EXPO-8K29'}
                </span>

                {token?.revealed ? (
                  token.has_prize && token.prize ? (
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
                      <span className="font-bold block text-[11px] text-emerald-400 uppercase tracking-wide">
                        🎁 ¡PREMIO GANADO!
                      </span>
                      <strong className="text-white text-sm block mt-0.5">{token.prize.name}</strong>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{token.prize.description}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs">
                      🌎 Token sin premio · ¡Gracias por completar el recorrido!
                    </div>
                  )
                ) : (
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-2">¿Qué ganaste?</span>
                    <button
                      onClick={handleRevealPrize}
                      disabled={revealingPrize}
                      className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      {revealingPrize ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Gift className="w-4 h-4" />
                          <span>DESCUBRIR</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CITY PASSPORT STAMPS GRID */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                Ciudades y Stands
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {visitedCount} / {totalCount} selladas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(passport?.cities || []).map((city) => {
              const isUnlocked = city.unlocked;

              return (
                <div
                  key={city.id}
                  className={`relative overflow-hidden rounded-xl border p-4 transition-colors ${
                    isUnlocked
                      ? 'bg-[#0B1524] border-slate-700 shadow-md'
                      : 'bg-[#08101C] border-slate-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl" role="img" aria-label={city.country}>
                        {city.country_code || '📍'}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {city.city}
                        </h3>
                        <span className="text-xs text-slate-400 font-normal block">
                          {city.country}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          SELLADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-medium uppercase tracking-wider">
                          <Lock className="w-3 h-3" />
                          PENDIENTE
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-medium text-blue-400 block mb-0.5">
                      Equipo: {city.name}
                    </span>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {city.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {isUnlocked ? (
                      <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Sello obtenido
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">
                        Sello pendiente (visita el stand)
                      </span>
                    )}

                    <Link
                      to={`/proyecto/${city.id}`}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <span>Ver Stand</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL 1: ENTER CITY CODE */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0B1524] border border-slate-800 p-5 sm:p-7 shadow-2xl">
            <button
              onClick={() => {
                setIsCodeModalOpen(false);
                setCodeError(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Ingresar Código de Ciudad</h3>
            <p className="text-xs text-slate-400 mb-5">
              Ingresa el código alfanumérico visible en el stand del equipo.
            </p>

            {codeError && (
              <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{codeError}</span>
              </div>
            )}

            <form onSubmit={handleClaimStamp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Código (ej. TOK-92XM, NYC-7K4P)
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="TOK-92XM"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold tracking-wider text-center text-lg placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* Only show test codes if logged in as admin */}
              {profile?.role === 'admin' && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                  <span className="text-[10px] text-amber-300 font-semibold block mb-1">
                    Atajo de prueba (Solo Administrador):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {passport?.cities?.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setInputCode(c.passport_code)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-colors"
                      >
                        {c.city}: {c.passport_code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={validating || !inputCode.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Obtener Sello'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QR SCANNER INFO */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0B1524] border border-slate-800 p-5 sm:p-7 text-center shadow-2xl">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Escanear Código QR</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Apunta la cámara de tu teléfono al código QR expuesto en el stand para registrar automáticamente el sello de esa ciudad.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 mb-5 text-left text-xs text-slate-300">
              <p className="mb-2">¿Prefieres ingresar el código manualmente?</p>
              <button
                onClick={() => {
                  setIsQrModalOpen(false);
                  setIsCodeModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-colors"
              >
                Ingresar Código Manual
              </button>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-medium border border-slate-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: STAMP UNLOCKED SUCCESS */}
      {unlockedStamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0B1524] border border-blue-500/40 p-5 sm:p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-500/10 border border-blue-500/30 flex flex-col items-center justify-center">
              <span className="text-2xl">{unlockedStamp.country_code || '📍'}</span>
            </div>

            <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
              SELLO CONSEGUIDO
            </span>

            <h3 className="text-xl font-bold text-white">
              {unlockedStamp.city}
            </h3>
            <p className="text-xs text-slate-400 mb-1">
              {unlockedStamp.country}
            </p>
            <p className="text-xs text-blue-400 font-medium mb-5">
              Stand: {unlockedStamp.project_name}
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-5">
              ✓ Ciudad desbloqueada en tu pasaporte
            </div>

            <button
              onClick={() => setUnlockedStamp(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: PRIZE REVELATION RESULT */}
      {prizeResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0B1524] border border-slate-700 p-5 sm:p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
              {prizeResultModal.has_prize ? (
                <Gift className="w-8 h-8 text-emerald-400" />
              ) : (
                <Globe className="w-8 h-8 text-blue-400" />
              )}
            </div>

            {prizeResultModal.has_prize ? (
              <>
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  🎉 ¡FELICIDADES!
                </span>
                <h3 className="text-lg font-bold text-white mb-1">
                  Has ganado un premio:
                </h3>
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs my-4">
                  <strong className="text-white text-base block font-bold">
                    {prizeResultModal.prize?.name}
                  </strong>
                  <p className="text-xs text-slate-300 mt-1">
                    {prizeResultModal.prize?.description}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mb-5">
                  Muestra tu Token <strong className="text-white font-mono">{prizeResultModal.token_code}</strong> en el stand de entrega para reclamarlo.
                </p>
              </>
            ) : (
              <>
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
                  🌎 ¡FELICIDADES!
                </span>
                <h3 className="text-lg font-bold text-white mb-2">
                  Completaste tu Pasaporte
                </h3>
                <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                  Gracias por recorrer todos los stands de la Expo de Logros. Tu Token registrado es <strong className="text-white font-mono">{prizeResultModal.token_code}</strong>.
                </p>
              </>
            )}

            <button
              onClick={() => setPrizeResultModal(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
