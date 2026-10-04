import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet as WalletIcon,
  Coins,
  TrendingUp,
  Heart,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Sparkles,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getWallet } from '../services/investments';
import { getPassport } from '../services/passport';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';

export function Wallet() {
  const { user, profile, refreshProfile } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [passportData, setPassportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallet = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const [wData, pData] = await Promise.all([
        getWallet(user.id),
        getPassport(user.id),
      ]);
      setWalletData(wData);
      setPassportData(pData);
    } catch (err) {
      console.warn('Notice fetching wallet or passport:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await loadWallet();
  };

  if (loading) {
    return <Loading message="Cargando tu cartera virtual..." />;
  }

  const currentBalance = Number(profile?.balance ?? walletData?.balance ?? 10000);
  const totalInvested = Number(walletData?.totalInvested || 0);
  const supportedProjectsCount = walletData?.supportedProjectsCount || 0;
  const tokensGivenCount = walletData?.tokensGivenCount || 0;
  const transactions = walletData?.transactions || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1 text-blue-400">
            <WalletIcon className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Cartera Virtual de Inversor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hola, {profile?.full_name || 'Inversionista'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Visitante oficial de la Expo RaizeUp • Capital de inversión virtual asignado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            Actualizar
          </button>
          <Link
            to="/"
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Explorar Stands
          </Link>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Available Balance */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D192A] to-blue-950/40 p-6 border border-blue-500/30 shadow-xl shadow-blue-950/30">
          <div className="flex items-center justify-between text-xs mb-3 text-blue-300 font-semibold uppercase tracking-wider">
            <span>Capital Disponible</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight mb-1">
            ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400">Fondos virtuales listos para asignar</p>
        </div>

        {/* Invested Capital */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0D192A] p-6 border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs mb-3 text-emerald-300 font-semibold uppercase tracking-wider">
            <span>Capital Invertido</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight mb-1">
            ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400">Total distribuido en proyectos</p>
        </div>

        {/* Supported Projects */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0D192A] p-6 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between text-xs mb-3 text-slate-300 font-semibold uppercase tracking-wider">
            <span>Proyectos Apoyados</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight mb-1">
            {supportedProjectsCount}
          </div>
          <p className="text-[11px] text-slate-400">Equipos que han recibido tu capital</p>
        </div>

        {/* Customer Tokens */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0D192A] p-6 border border-rose-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs mb-3 text-rose-300 font-semibold uppercase tracking-wider">
            <span>Customer Tokens</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 font-mono tracking-tight mb-1">
            {tokensGivenCount}
          </div>
          <p className="text-[11px] text-slate-400">Validaciones de cliente otorgadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-[#0D192A] border border-white/10 p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Historial Financiero</h3>
                <p className="text-xs text-slate-400">Registro auditable de movimientos de tu cartera</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-white/5 text-slate-400 font-mono">
                {transactions.length} registros
              </span>
            </div>

            {transactions.length === 0 ? (
              <EmptyState
                title="Sin movimientos todavía"
                description="Tus transacciones de capital y asignación aparecerán aquí."
              />
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const isPositive = Number(tx.amount) > 0;
                  const isInitial = tx.type === 'initial_balance';
                  const dateFormatted = new Date(tx.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                  });

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isPositive
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-white">
                            {tx.description || (isInitial ? 'Capital inicial asignado' : 'Inversión realizada')}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {dateFormatted}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-slate-500 px-1.5 py-0.2 rounded bg-slate-800">
                              {tx.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-extrabold text-sm sm:text-base ${
                            isPositive ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {isPositive ? '+' : ''}${Math.abs(Number(tx.amount)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Passport Widget, Rules & Quick Scanner */}
        <div className="space-y-6">
          {/* PASAPORTE DE CIUDADES WIDGET */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0D192A] via-[#0D192A] to-amber-950/20 border border-amber-500/30 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-amber-400">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Mi Pasaporte
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300">
                {passportData?.visitedCount || 0} / {passportData?.totalCount || 6}
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Colecciona sellos visitando las ciudades de la Expo y desbloquea tu <strong>Token Final</strong> con premios.
            </p>

            <div className="w-full h-2 rounded-full bg-slate-900 border border-white/5 overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-amber-400"
                style={{ width: `${Math.max(passportData?.percentage || 0, 5)}%` }}
              />
            </div>

            {passportData?.token && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold text-center mb-4">
                🎉 {passportData.token.token_code}
              </div>
            )}

            <Link
              to="/pasaporte"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Globe className="w-4 h-4" />
              Ver Mi Pasaporte
            </Link>
          </div>

          <div className="rounded-3xl bg-[#0D192A] border border-white/10 p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-3 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Reglas de la Expo
              </h3>
            </div>

            <ul className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>
                  <strong>Inversiones Múltiples:</strong> Puedes invertir varias veces en un mismo stand mientras mantengas saldo disponible.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong>Customer Token Único:</strong> Solo puedes entregar 1 Customer Token por proyecto para garantizar validación real.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Escenario en Vivo:</strong> Tus inversiones y tokens se reflejan al segundo en la pantalla principal del auditorio.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-blue-900/30 to-sky-900/20 border border-blue-500/20 p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              ¿Estás recorriendo los stands?
            </h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Busca el código QR ubicado en la mesa de cada equipo para acceder al stand e invertir directamente.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
            >
              Ver Catálogo de Stands
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
