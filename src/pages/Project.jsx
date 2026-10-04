import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp,
  Heart,
  Users,
  DollarSign,
  Briefcase,
  QrCode,
  Share2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { getProject } from '../services/projects';
import { hasUserGivenToken } from '../services/customers';
import { InvestmentModal } from '../components/InvestmentModal';
import { CustomerTokenButton } from '../components/CustomerTokenButton';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';

export function Project() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const data = await getProject(id);
      if (data) {
        setProject((prev) => {
          if (!prev) return data;
          return {
            ...data,
            investment_total: Math.max(Number(data.investment_total || 0), Number(prev.investment_total || 0)),
            investors: Math.max(Number(data.investors || 0), Number(prev.investors || 0)),
            customer_tokens: Math.max(Number(data.customer_tokens || 0), Number(prev.customer_tokens || 0)),
          };
        });
      }

      if (user?.id && (data?.id || id)) {
        const given = await hasUserGivenToken(user.id, data?.id || id);
        setHasToken(given);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProjectDetails();
  }, [id, user?.id]);

  // Listen to realtime updates for this project stand
  useRealtime((event) => {
    const eventPId = event.payload?.project?.id || event.payload?.project_id;
    const isMatch =
      (eventPId && (eventPId === id || String(eventPId).toLowerCase() === String(id).toLowerCase())) ||
      (event.payload?.project?.name && project?.name && event.payload.project.name.toLowerCase().trim() === project.name.toLowerCase().trim());

    if (isMatch) {
      if (event.type === 'INVESTMENT_CREATED') {
        const amt = Number(event.payload?.amount || 0);
        setProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            investment_total: Number(prev.investment_total || 0) + amt,
            investors: Number(prev.investors || 0) + 1,
          };
        });
      } else if (event.type === 'CUSTOMER_TOKEN_CREATED') {
        setProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            customer_tokens: Number(prev.customer_tokens || 0) + 1,
          };
        });
      }
      setTimeout(() => {
        fetchProjectDetails();
      }, 1000);
    }
  });

  const handleInvestmentSuccess = (result) => {
    // Optimistically update project local stats
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        investment_total: Number(prev.investment_total || 0) + Number(result.amount),
        investors: Number(prev.investors || 0) + 1,
      };
    });
    fetchProjectDetails();
  };

  const handleTokenGiven = (result) => {
    setHasToken(true);
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customer_tokens: Number(prev.customer_tokens || 0) + 1,
      };
    });
  };

  if (loading) {
    return <Loading message="Cargando stand del proyecto..." />;
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          title="Proyecto no encontrado"
          description="El código QR escaneado no corresponde a un stand activo o el proyecto fue desactivado."
          action={
            <Link
              to="/"
              className="py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Volver a la Expo
            </Link>
          }
        />
      </div>
    );
  }

  const investmentTotal = Number(project.investment_total || 0);
  const investorsCount = Number(project.investors || 0);
  const customerTokensCount = Number(project.customer_tokens || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a todos los proyectos
        </Link>

        <button
          onClick={() => setIsQrModalOpen(true)}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold transition-colors"
        >
          <QrCode className="w-3.5 h-3.5 text-blue-400" />
          <span>Ver QR del Stand</span>
        </button>
      </div>

      {/* Main Stand Card */}
      <div className="overflow-hidden rounded-3xl bg-[#0D192A] border border-white/10 shadow-2xl">
        {/* Hero image banner */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-slate-900">
          <img
            src={project.logo_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80'}
            alt={project.name}
            className="h-full w-full object-cover opacity-85"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D192A] via-[#0D192A]/50 to-transparent" />

          {/* Badges on image */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-blue-300 border border-blue-400/20">
              {project.category || 'Innovación'}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Stand Abierto
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              {project.name}
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              Desarrollado por <strong className="text-white">{project.team_name}</strong>
            </p>
          </div>

          {project.city && (
            <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{project.country_code || '📍'}</span>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Ciudad Oficial · Expo RaizeUp
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white">
                    {project.city}, {project.country}
                  </span>
                </div>
              </div>

              {/* Secret code visible ONLY to team members or admins */}
              {(profile?.role === 'admin' || (profile?.role === 'team' && (!profile?.project_id || profile?.project_id === project.id))) ? (
                <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Código Stand (Solo Equipo):
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 font-mono font-bold text-xs border border-amber-500/40">
                    {project.passport_code}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    Pide el sello al equipo en su stand presencial
                  </span>
                  <Link
                    to="/pasaporte"
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Ver Pasaporte
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Acerca del Proyecto
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Metrics Trio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-blue-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-blue-300 font-semibold mb-2">
                <span>Inversión Recibida</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                ${investmentTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
                <span>Inversionistas</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {investorsCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold mb-2">
                <span>Customer Tokens</span>
                <Heart className="w-4 h-4 fill-rose-500 text-rose-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
                {customerTokensCount}
              </div>
            </div>
          </div>

          {/* Action Boxes */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Acciones de Visitante
            </h3>

            {user ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Invertir Capital */}
                <div className="p-5 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex flex-col justify-between">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Inversión de Capital</span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Aportar Fondos Virtuales
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Respaldar el proyecto con montos desde $100 hasta $2,500 de tu saldo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInvestModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    💰 Invertir en {project.name}
                  </button>
                </div>

                {/* 2. Customer Token */}
                <div className="p-5 rounded-2xl bg-rose-600/10 border border-rose-500/30 flex flex-col justify-between">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-rose-400 mb-1">
                      <Heart className="w-5 h-5 fill-rose-500/20" />
                      <span className="text-xs font-bold uppercase tracking-wider">Validación de Mercado</span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Customer Token
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      "Yo compraría o utilizaría este producto si existiera comercialmente".
                    </p>
                  </div>

                  <CustomerTokenButton
                    project={project}
                    hasGivenToken={hasToken}
                    onTokenGiven={handleTokenGiven}
                  />
                </div>
              </div>
            ) : (
              /* Visitor not logged in */
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white mb-1">
                  Ingresa tu nombre para apoyar este proyecto
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Recibirás <strong className="text-emerald-400 font-mono font-medium">$10,000 virtuales</strong> para invertir en {project.name} y entregar tu Customer Token.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  <span>Ingresar mi nombre para participar</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      <InvestmentModal
        project={project}
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        onInvestmentSuccess={handleInvestmentSuccess}
      />

      {/* Stand QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0D192A] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">QR del Stand</h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <QRCodeGenerator
              value={`/proyecto/${project.id}`}
              title={project.name}
              subtitle={`Stand oficial de ${project.team_name}`}
              size={220}
            />
          </div>
        </div>
      )}
    </div>
  );
}
