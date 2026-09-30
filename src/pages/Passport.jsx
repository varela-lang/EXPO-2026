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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';
import { getPassport, claimPassportStamp, revealPassportToken } from '../services/passport';
import { Loading } from '../components/Loading';

export function Passport() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & User interaction states
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [codeError, setCodeError] = useState(null);

  // Success stamp revelation modal
  const [unlockedStamp, setUnlockedStamp] = useState(null);

  // Prize revelation state
  const [revealingPrize, setRevealingPrize] = useState(false);
  const [prizeResult, setPrizeResult] = useState(null);

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
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#38BDF8', '#10B981', '#F59E0B'],
        });
      } catch (err) {
        console.error(err);
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
      setPrizeResult(res);

      if (res.has_prize) {
        try {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6'],
          });
        } catch (err) {
          console.error(err);
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
    return <Loading message="Abriendo tu Pasaporte Virtual..." />;
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Pasaporte de Ciudades</h2>
        <p className="text-sm text-slate-300 mb-6">
          Inicia sesión o regístrate como visitante para obtener tu Pasaporte Virtual de la Expo, coleccionar sellos de cada ciudad y desbloquear tu Token Final con premios.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/registro"
            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition-all"
          >
            Registrarme y Obtener Pasaporte
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-semibold text-xs"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  const visitedCount = passport?.visitedCount || 0;
  const totalCount = passport?.totalCount || 0;
  const percentage = passport?.percentage || 0;
  const isCompleted = passport?.isCompleted || false;
  const token = passport?.token;

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* PASSPORT TOP EMBEDDED COVER & BADGE */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0D192A] to-[#07111F] border border-blue-500/30 p-6 sm:p-10 shadow-2xl shadow-blue-950/60">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Futuristic Gold Passport Stamp watermark */}
          <div className="absolute -right-6 -bottom-6 w-52 h-52 rounded-full border-4 border-amber-500/10 flex items-center justify-center pointer-events-none rotate-12">
            <Globe className="w-36 h-36 text-amber-500/10" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-blue-600 p-0.5 shadow-xl shadow-blue-600/20 shrink-0">
                <div className="w-full h-full bg-[#07111F] rounded-[14px] flex items-center justify-center">
                  <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    PASAPORTE OFICIAL 2026
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                    ID: {profile?.id?.substring(0, 8)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {profile?.full_name || 'Visitante Expo'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recorrido por los stands y centros de innovación internacional
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCodeModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <KeyRound className="w-4 h-4" />
                Ingresar Código
              </button>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-semibold text-xs flex items-center gap-2 transition-colors"
              >
                <QrCode className="w-4 h-4 text-blue-400" />
                Escanear QR
              </button>
            </div>
          </div>

          {/* PROGRESS STRIP */}
          <div className="pt-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                Progreso del Recorrido Mundial
              </span>
              <span className="text-sm font-black font-mono text-amber-300">
                {visitedCount} / {totalCount} Ciudades ({percentage}%)
              </span>
            </div>

            <div className="w-full h-3.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-amber-400 transition-all duration-700 shadow-md shadow-amber-400/20"
                style={{ width: `${Math.max(percentage, 4)}%` }}
              />
            </div>
          </div>
        </div>

        {/* FINAL TOKEN COMPLETION BANNER */}
        {isCompleted && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-[#0D192A] to-emerald-500/20 border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                  <Gift className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1">
                    <Sparkles className="w-3 h-3" />
                    ¡PASAPORTE COMPLETADO!
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Has recorrido todas las ciudades de Expo Investment
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Tu viaje ha terminado... pero todavía hay una sorpresa especial asignada en tu Token Final único.
                  </p>
                </div>
              </div>

              {/* Final Token & Prize Reveal Box */}
              <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 text-center min-w-[240px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Tu Token Final
                </span>
                <span className="text-lg font-black font-mono text-amber-300 block mb-3">
                  {token?.token_code || 'TOKEN #X7K92P'}
                </span>

                {token?.revealed ? (
                  token.has_prize && token.prize ? (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                      <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-400">
                        🎉 ¡Premio Desbloqueado!
                      </span>
                      <strong className="text-white text-sm block mt-0.5">{token.prize.name}</strong>
                      <span className="text-[11px] text-slate-300 block">{token.prize.description}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-xs font-semibold">
                      🌎 ¡Gracias por participar en la Expo!
                    </div>
                  )
                ) : (
                  <button
                    onClick={handleRevealPrize}
                    disabled={revealingPrize}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {revealingPrize ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        Descubrir Premio
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CITY PASSPORT STAMPS GRID */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Colección de Sellos</span>
                <span className="text-xs font-semibold text-slate-400 normal-case">
                  (Visita cada stand e ingresa su código)
                </span>
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {visitedCount} sellados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(passport?.cities || []).map((city) => {
              const isUnlocked = city.unlocked;

              return (
                <div
                  key={city.id}
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-[#0D192A] to-blue-950/40 border-amber-500/40 shadow-xl shadow-amber-500/5'
                      : 'bg-[#0D192A]/60 border-white/5 opacity-85 hover:opacity-100 hover:border-white/20'
                  }`}
                >
                  {/* Digital Stamp Seal Overlay if unlocked */}
                  {isUnlocked && (
                    <div className="absolute -top-3 -right-3 w-24 h-24 rounded-full border-2 border-dashed border-amber-400/30 flex items-center justify-center pointer-events-none rotate-12">
                      <div className="w-20 h-20 rounded-full border border-amber-400/40 flex flex-col items-center justify-center text-[9px] font-black uppercase text-amber-400 tracking-tighter bg-amber-500/5">
                        <span>EXPO</span>
                        <span>VISITED</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl shrink-0" role="img" aria-label={city.country}>
                        {city.country_code || '📍'}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                          {city.city}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium block">
                          {city.country}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          SELLADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <Lock className="w-3 h-3 text-slate-500" />
                          BLOQUEADO
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 relative z-10">
                    <span className="text-xs font-semibold text-blue-400 block mb-0.5">
                      Stand: {city.name}
                    </span>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {city.description}
                    </p>
                  </div>

                  {/* Stamp Card Bottom Status */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs relative z-10">
                    {isUnlocked ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {city.stamped_at ? new Date(city.stamped_at).toLocaleDateString() : 'Visitada'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Visita el stand para obtener el sello
                      </span>
                    )}

                    <Link
                      to={`/proyecto/${city.id}`}
                      className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Ver Stand
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0D192A] border border-blue-500/30 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => {
                setIsCodeModalOpen(false);
                setCodeError(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Ingresar Código de Ciudad</h3>
            <p className="text-xs text-slate-300 mb-6">
              Cada equipo/stand de la Expo tiene un código de pasaporte visible en su mesa o tarjeta. Ingresa el código para registrar tu sello.
            </p>

            {codeError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{codeError}</span>
              </div>
            )}

            <form onSubmit={handleClaimStamp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Código del Stand (ej. TOK-92XM, NYC-7K4P)
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="TOK-92XM"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-mono font-bold tracking-wider text-center text-lg placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* Quick test pills for instant validation */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-1.5">
                  Códigos rápidos de prueba de la Expo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['NYC-7K4P', 'TOK-92XM', 'PAR-5L8Q', 'RIO-3F7A', 'LON-8H2M', 'ROM-4P9X'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setInputCode(c)}
                      className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-900 text-blue-300 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={validating || !inputCode.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sellar Pasaporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QR SCANNER OPTION */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0D192A] border border-blue-500/30 p-6 sm:p-8 text-center shadow-2xl">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Escanear QR de la Ciudad</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              En cada mesa de stand encontrarás un código QR con su sello internacional. Puedes escanearlo con la cámara de tu smartphone para abrir directamente la validación.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 mb-6">
              <p className="text-xs text-slate-400 mb-2">
                ¿Prefieres ingresar el código alfanumérico manualmente?
              </p>
              <button
                onClick={() => {
                  setIsQrModalOpen(false);
                  setIsCodeModalOpen(true);
                }}
                className="py-2 px-4 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
              >
                Ingresar Código Manual
              </button>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: STAMP UNLOCKED SUCCESS EXPERIENCE */}
      {unlockedStamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-300">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#0D192A] border-2 border-amber-500/50 p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20">
            {/* Holographic decorative ring */}
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 p-1 shadow-xl shadow-amber-500/30">
              <div className="w-full h-full bg-[#07111F] rounded-full flex flex-col items-center justify-center">
                <span className="text-3xl mb-0.5">{unlockedStamp.country_code || '✈️'}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
              SELLO CONSEGUIDO
            </span>

            <h3 className="text-2xl font-black text-white tracking-tight">
              {unlockedStamp.city}
            </h3>
            <p className="text-xs text-slate-300 font-medium mb-1">
              {unlockedStamp.country}
            </p>
            <p className="text-xs text-blue-400 font-semibold mb-6">
              Stand: {unlockedStamp.project_name}
            </p>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 mb-6">
              ✓ Has desbloqueado una nueva ciudad en tu Pasaporte Oficial.
            </div>

            <button
              onClick={() => setUnlockedStamp(null)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
            >
              Continuar Recorrido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
