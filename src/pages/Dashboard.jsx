import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Heart,
  Users,
  Maximize2,
  Minimize2,
  Sparkles,
  Award,
  Zap,
  Radio,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { getDashboardStats } from '../services/dashboard';
import { useRealtime } from '../hooks/useRealtime';
import { RealtimeNotification } from '../components/RealtimeNotification';
import { Loading } from '../components/Loading';

export function Dashboard() {
  const [stats, setStats] = useState({
    total_invested: 0,
    total_investors: 0,
    total_customer_tokens: 0,
    total_visitors: 0,
    ranking: [],
  });
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedProjectId, setHighlightedProjectId] = useState(null);
  const containerRef = useRef(null);

  const sortRanking = (items) => {
    return [...items].sort((a, b) => {
      const diffInvested = Number(b.investment_total || 0) - Number(a.investment_total || 0);
      if (diffInvested !== 0) return diffInvested;
      const diffTokens = Number(b.customer_tokens || 0) - Number(a.customer_tokens || 0);
      if (diffTokens !== 0) return diffTokens;
      return Number(b.investors || 0) - Number(a.investors || 0);
    });
  };

  // Fetch initial stats
  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      if (data) {
        setStats((prev) => {
          // Preserve live higher values if local optimistic update is ahead
          const mergedRanking = (data.ranking || []).map((freshProj) => {
            const currentProj = prev.ranking?.find(
              (p) =>
                p.id === freshProj.id ||
                String(p.id).toLowerCase() === String(freshProj.id).toLowerCase() ||
                p.name?.toLowerCase().trim() === freshProj.name?.toLowerCase().trim()
            );
            return {
              ...freshProj,
              investment_total: Math.max(
                Number(freshProj.investment_total || 0),
                Number(currentProj?.investment_total || 0)
              ),
              investors: Math.max(
                Number(freshProj.investors || 0),
                Number(currentProj?.investors || 0)
              ),
              customer_tokens: Math.max(
                Number(freshProj.customer_tokens || 0),
                Number(currentProj?.customer_tokens || 0)
              ),
            };
          });

          const sortedMerged = sortRanking(mergedRanking);

          return {
            ...data,
            total_invested: Math.max(Number(data.total_invested || 0), Number(prev.total_invested || 0)),
            total_investors: Math.max(Number(data.total_investors || 0), Number(prev.total_investors || 0)),
            total_customer_tokens: Math.max(
              Number(data.total_customer_tokens || 0),
              Number(prev.total_customer_tokens || 0)
            ),
            ranking: sortedMerged,
          };
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Heartbeat sync every 3.5 seconds to guarantee the big screen projector stays 100% updated
    const interval = setInterval(() => {
      fetchStats();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Listen to Realtime events across Supabase, WebSockets, and cross-tab bus
  const { lastNotification, clearNotification, recentEvents } = useRealtime((event) => {
    const { type, payload } = event;

    if (type === 'INVESTMENT_CREATED') {
      const pId = payload.project?.id || payload.project_id;
      const pName = payload.project?.name;
      const amt = Number(payload.amount);

      // Flash highlight on the affected project row
      if (pId) {
        setHighlightedProjectId(pId);
        setTimeout(() => setHighlightedProjectId(null), 3500);
      }

      // Instantly update stats locally with zero latency
      setStats((prev) => {
        const newTotalInvested = (prev.total_invested || 0) + amt;
        const updatedRanking = prev.ranking.map((proj) => {
          const isMatch =
            (pId && (proj.id === pId || String(proj.id).toLowerCase() === String(pId).toLowerCase())) ||
            (pName && proj.name && proj.name.toLowerCase().trim() === pName.toLowerCase().trim());

          if (isMatch) {
            return {
              ...proj,
              investment_total: (Number(proj.investment_total) || 0) + amt,
              investors: (Number(proj.investors) || 0) + 1,
            };
          }
          return proj;
        });

        // Re-sort ranking by total investment and tokens
        const sorted = sortRanking(updatedRanking);

        return {
          ...prev,
          total_invested: newTotalInvested,
          total_investors: (prev.total_investors || 0) + 1,
          ranking: sorted,
        };
      });

      // Background reconcile with database/server after delay
      setTimeout(() => {
        fetchStats();
      }, 1200);
    } else if (type === 'CUSTOMER_TOKEN_CREATED') {
      const pId = payload.project?.id || payload.project_id;
      const pName = payload.project?.name;

      if (pId) {
        setHighlightedProjectId(pId);
        setTimeout(() => setHighlightedProjectId(null), 3500);
      }

      setStats((prev) => {
        const updatedRanking = prev.ranking.map((proj) => {
          const isMatch =
            (pId && (proj.id === pId || String(proj.id).toLowerCase() === String(pId).toLowerCase())) ||
            (pName && proj.name && proj.name.toLowerCase().trim() === pName.toLowerCase().trim());

          if (isMatch) {
            return {
              ...proj,
              customer_tokens: (Number(proj.customer_tokens) || 0) + 1,
            };
          }
          return proj;
        });

        const sorted = sortRanking(updatedRanking);

        return {
          ...prev,
          total_customer_tokens: (prev.total_customer_tokens || 0) + 1,
          ranking: sorted,
        };
      });

      setTimeout(() => {
        fetchStats();
      }, 1200);
    } else if (type === 'METRICS_UPDATED' || type === 'PROJECT_UPDATE' || type === 'PASSPORT_STAMP_CLAIMED') {
      fetchStats();
    }
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.error(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((e) => console.error(e));
        setIsFullscreen(false);
      }
    }
  };

  if (loading) {
    return <Loading message="Cargando Tablero en Vivo para la Gran Pantalla..." />;
  }

  // Max investment in top project to normalize progress bar
  const maxInvestment = Math.max(
    ...stats.ranking.map((p) => Number(p.investment_total || 0)),
    1000
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#07111F] text-[#F8FAFC] p-4 sm:p-8 lg:p-10 font-sans selection:bg-blue-500/40 relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Realtime Toast Pop-up Animation */}
      <RealtimeNotification
        notification={lastNotification}
        onClose={clearNotification}
      />

      {/* Stage Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-xl shadow-blue-600/30">
            <div className="w-full h-full bg-[#07111F] rounded-[14px] flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                RAIZEUP
              </h1>
              {/* LIVE BADGE */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-widest live-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>● EN VIVO</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
              TABLERO OFICIAL EN TIEMPO REAL • EXPO RAIZEUP • 8 CIUDADES
            </p>
          </div>
        </div>

        {/* Stage controls */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
          >
            Ver Catálogo
          </Link>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all shadow-md"
            title="Modo Pantalla Completa para Proyector / TV"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </header>

      {/* BIG SCREEN KPI METRICS STRIP */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 relative z-10">
        {/* TOTAL INVESTED */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0D192A]/90 p-6 sm:p-8 border border-blue-500/30 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-blue-600/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
            <span>CAPITAL INVERTIDO</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white mb-1">
            ${Number(stats.total_invested || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 font-medium">Asignado por el público visitante</p>
        </div>

        {/* TOTAL INVESTORS */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0D192A]/90 p-5 sm:p-8 border border-emerald-500/30 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-emerald-600/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
            <span>INVERSIONISTAS</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-emerald-400 mb-1">
            {Number(stats.total_investors || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 font-medium">Asistentes que han respaldado proyectos</p>
        </div>

        {/* TOTAL CUSTOMER TOKENS */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0D192A]/90 p-5 sm:p-8 border border-rose-500/30 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-rose-600/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">
            <span>CUSTOMER TOKENS</span>
            <Heart className="w-5 h-5 fill-rose-500 text-rose-400" />
          </div>
          <div className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-rose-400 mb-1">
            {Number(stats.total_customer_tokens || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 font-medium">Validaciones comerciales otorgadas</p>
        </div>
      </section>

      {/* MAIN RANKING LEADERBOARD */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Project Ranking Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                Ranking de Proyectos (8 Ciudades)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Ordenado por capital acumulado
            </span>
          </div>

          <div className="space-y-3">
            {stats.ranking.map((project, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;
              const isHighlighted = highlightedProjectId === project.id;
              const totalAmount = Number(project.investment_total || 0);
              const percent = Math.min(100, Math.round((totalAmount / maxInvestment) * 100));

              return (
                <div
                  key={project.id}
                  className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-500 border ${
                    isHighlighted
                      ? 'bg-blue-600/30 border-blue-400 ring-4 ring-blue-500/40 scale-[1.02] shadow-2xl'
                      : isFirst
                      ? 'bg-gradient-to-r from-amber-500/10 via-[#0D192A] to-[#0D192A] border-amber-500/40 shadow-xl'
                      : 'bg-[#0D192A]/90 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    {/* Rank + Name + Team */}
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 border ${
                          isFirst
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/20 text-lg'
                            : isSecond
                            ? 'bg-slate-300/20 text-slate-200 border-slate-300/40'
                            : isThird
                            ? 'bg-amber-800/20 text-amber-400 border-amber-800/40'
                            : 'bg-slate-900 text-slate-400 border-white/5'
                        }`}
                      >
                        #{rank}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                            {isFirst ? '🚀 ' : ''}{project.name}
                          </h3>
                          {project.city && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <span>{project.country_code || '📍'}</span>
                              <span>{project.city}</span>
                            </span>
                          )}
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-white/5">
                            {project.category || 'Proyecto'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {project.team_name}
                        </p>
                      </div>
                    </div>

                    {/* Stats metrics */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* Investors count */}
                      <div className="text-right">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          Inversionistas
                        </span>
                        <div className="flex items-center gap-1 justify-end font-bold text-slate-200 text-sm">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>{Number(project.investors || 0)}</span>
                        </div>
                      </div>

                      {/* Customer Tokens count */}
                      <div className="text-right">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          Customer Tokens
                        </span>
                        <div className="flex items-center gap-1 justify-end font-bold text-rose-400 text-sm">
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-400" />
                          <span>{Number(project.customer_tokens || 0)}</span>
                        </div>
                      </div>

                      {/* Investment Total */}
                      <div className="text-right min-w-[110px]">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          Total Invertido
                        </span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-white">
                          ${totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isFirst
                          ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                          : 'bg-gradient-to-r from-blue-600 to-sky-400'
                      }`}
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity Feed (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                Actividad Reciente
              </h2>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="rounded-3xl bg-[#0D192A]/90 border border-white/10 p-5 shadow-xl max-h-[640px] overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Esperando primeras inversiones y Customer Tokens en tiempo real...
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-2xl border transition-all animate-in fade-in slide-in-from-right-3 duration-300 ${
                      evt.type === 'investment'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                        : 'bg-rose-500/10 border-rose-500/30 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                          evt.type === 'investment' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {evt.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Ahora'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {evt.projectName}
                      </span>
                      <span
                        className={`font-mono font-black text-sm ${
                          evt.type === 'investment' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {evt.type === 'investment' ? `+$${Number(evt.amount).toLocaleString()}` : '+1 Token'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stand QR Scan Prompt for Audience */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-900/30 to-[#0D192A] border border-blue-500/20 text-center">
            <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">
              ¿Eres asistente en el evento?
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              Escanea el QR en tu mesa o visita cada stand para votar y asignar capital en vivo.
            </p>
            <Link
              to="/registro"
              className="inline-block py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
            >
              Registrarse como Inversor
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
