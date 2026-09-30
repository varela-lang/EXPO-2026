import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Sparkles,
  Users,
  Heart,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
} from 'lucide-react';
import { getProjects } from '../services/projects';
import { getDashboardStats } from '../services/dashboard';
import { ProjectCard } from '../components/ProjectCard';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';

export function Home() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total_invested: 0,
    total_investors: 0,
    total_customer_tokens: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadData = async () => {
    try {
      const [projData, statsData] = await Promise.all([
        getProjects(),
        getDashboardStats(),
      ]);
      if (Array.isArray(projData) && projData.length > 0) {
        setProjects((prev) => {
          // Merge preserving any optimistic higher live numbers
          const merged = projData.map((fresh) => {
            const current = prev.find(
              (p) =>
                p.id === fresh.id ||
                String(p.id).toLowerCase() === String(fresh.id).toLowerCase() ||
                p.name?.toLowerCase().trim() === fresh.name?.toLowerCase().trim()
            );
            return {
              ...fresh,
              investment_total: Math.max(
                Number(fresh.investment_total || 0),
                Number(current?.investment_total || 0)
              ),
              investors: Math.max(
                Number(fresh.investors || 0),
                Number(current?.investors || 0)
              ),
              customer_tokens: Math.max(
                Number(fresh.customer_tokens || 0),
                Number(current?.customer_tokens || 0)
              ),
            };
          });
          merged.sort((a, b) => Number(b.investment_total || 0) - Number(a.investment_total || 0));
          return merged;
        });
      }
      if (statsData) {
        setStats((prev) => ({
          ...statsData,
          total_invested: Math.max(Number(statsData.total_invested || 0), Number(prev.total_invested || 0)),
          total_investors: Math.max(Number(statsData.total_investors || 0), Number(prev.total_investors || 0)),
          total_customer_tokens: Math.max(
            Number(statsData.total_customer_tokens || 0),
            Number(prev.total_customer_tokens || 0)
          ),
        }));
      }
    } catch (err) {
      console.warn('Notice loading home data, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Listen to realtime events to keep Home counters and cards updated immediately
  useRealtime((event) => {
    if (event?.type === 'INVESTMENT_CREATED') {
      const pId = event.payload?.project?.id || event.payload?.project_id;
      const pName = event.payload?.project?.name;
      const amt = Number(event.payload?.amount || 0);

      setProjects((prev) => {
        const updated = prev.map((p) => {
          const isMatch =
            (pId && (p.id === pId || String(p.id).toLowerCase() === String(pId).toLowerCase())) ||
            (pName && p.name && p.name.toLowerCase().trim() === pName.toLowerCase().trim());

          if (isMatch) {
            return {
              ...p,
              investment_total: (Number(p.investment_total) || 0) + amt,
              investors: (Number(p.investors) || 0) + 1,
            };
          }
          return p;
        });
        return [...updated].sort((a, b) => (Number(b.investment_total) || 0) - (Number(a.investment_total) || 0));
      });

      setStats((prev) => ({
        ...prev,
        total_invested: (Number(prev.total_invested) || 0) + amt,
        total_investors: (Number(prev.total_investors) || 0) + 1,
      }));

      // Reconcile with server gently after optimistic UI displays
      setTimeout(() => {
        loadData();
      }, 1200);
    } else if (event?.type === 'CUSTOMER_TOKEN_CREATED') {
      const pId = event.payload?.project?.id || event.payload?.project_id;
      const pName = event.payload?.project?.name;

      setProjects((prev) =>
        prev.map((p) => {
          const isMatch =
            (pId && (p.id === pId || String(p.id).toLowerCase() === String(pId).toLowerCase())) ||
            (pName && p.name && p.name.toLowerCase().trim() === pName.toLowerCase().trim());

          if (isMatch) {
            return {
              ...p,
              customer_tokens: (Number(p.customer_tokens) || 0) + 1,
            };
          }
          return p;
        })
      );

      setStats((prev) => ({
        ...prev,
        total_customer_tokens: (Number(prev.total_customer_tokens) || 0) + 1,
      }));

      setTimeout(() => {
        loadData();
      }, 1200);
    }
  });

  const categories = ['ALL', ...new Set(projects.map((p) => p.category).filter(Boolean))];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.team_name.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || project.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-white/5 bg-gradient-to-b from-[#0D192A]/60 via-[#07111F] to-[#07111F]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mercado de Capital Simulado para la Expo de Logros</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
              Invierte en el talento estudiantil con <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">capital virtual</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Cada visitante recibe <strong className="text-white font-semibold">$10,000 virtuales</strong> para respaldar los mejores proyectos universitarios y entregar <strong className="text-rose-400 font-semibold">Customer Tokens</strong> a las soluciones que usarías en tu vida diaria.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {!user ? (
                <>
                  <Link
                    to="/registro"
                    className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Zap className="w-4 h-4" />
                    Registrarme y Recibir $10,000
                  </Link>
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-white/10 flex items-center justify-center gap-2 transition-all"
                  >
                    Ver Tablero en Vivo
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/wallet"
                    className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    Ir a Mi Cartera de Inversiones
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-white/10 flex items-center justify-center gap-2 transition-all"
                  >
                    Ver Tablero de Pantalla Gigante
                  </Link>
                </>
              )}
            </div>

            {/* Quick How it Works Pillars */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-[#0D192A]/80 border border-white/5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Escanea y Regístrate</h4>
                  <p className="text-[11px] text-slate-400">Recibe al instante tus $10,000 sin costo para actuar como inversor.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D192A]/80 border border-white/5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Invierte Capital</h4>
                  <p className="text-[11px] text-slate-400">Elige proyectos prometedores y asígnales desde $100 hasta $2,500.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D192A]/80 border border-white/5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Otorga Customer Tokens</h4>
                  <p className="text-[11px] text-slate-400">Valida la demanda de mercado confirmando que usarías su solución.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Market Counter Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#0D192A] border border-blue-500/20 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Total Invertido en la Expo
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                ${Number(stats.total_invested || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D192A] border border-emerald-500/20 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Inversionistas Activos
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                {Number(stats.total_investors || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D192A] border border-rose-500/20 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Customer Tokens Entregados
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono">
                {Number(stats.total_customer_tokens || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500/30 text-rose-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Proyectos de la Expo
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Conoce los stands, revisa sus propuestas de valor e invierte capital virtual.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o equipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {categories.length > 2 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {cat === 'ALL' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <Loading message="Cargando proyectos de la Expo..." />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No se encontraron proyectos"
            description="Intenta buscar con otros términos o cambia el filtro de categoría."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <ProjectCard key={project.id} project={project} rank={idx + 1} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
