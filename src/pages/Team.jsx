import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  Users,
  Heart,
  QrCode,
  ArrowUpRight,
  ExternalLink,
  Clock,
  Sparkles,
  Share2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjects } from '../services/projects';
import { getAllInvestments } from '../services/investments';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { Loading } from '../components/Loading';

export function Team() {
  const { user, profile } = useAuth();
  const [project, setProject] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeamData() {
      try {
        setLoading(true);
        const projects = await getProjects();
        // If team profile has project_id or match by name, otherwise pick first active project
        let userProject = null;
        if (profile?.project_id) {
          userProject = projects.find((p) => p.id === profile.project_id);
        }
        if (!userProject && projects.length > 0) {
          userProject = projects[0]; // fallback to premier project
        }
        setProject(userProject);

        if (userProject) {
          const allInvs = await getAllInvestments();
          const teamInvs = allInvs.filter((i) => i.project_id === userProject.id);
          setInvestments(teamInvs);
        }
      } catch (err) {
        console.error('Error loading team data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [profile]);

  if (loading) {
    return <Loading message="Cargando panel de equipo..." />;
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white mb-2">No se encontró proyecto asignado</h2>
        <p className="text-xs text-slate-400 mb-6">
          Contacta al administrador de la Expo para vincular tu cuenta con tu stand.
        </p>
        <Link to="/" className="py-2 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold">
          Ver Catálogo
        </Link>
      </div>
    );
  }

  const investmentTotal = Number(project.investment_total || 0);
  const investorsCount = Number(project.investors || 0);
  const customerTokensCount = Number(project.customer_tokens || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Team Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sky-400">
            <Briefcase className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Panel de Equipo Estudiantil</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {project.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {project.team_name} • Stand Oficial de la Expo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/proyecto/${project.id}`}
            className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver Stand Público
          </Link>
          <Link
            to="/dashboard"
            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Mercado en Vivo
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-3xl bg-[#0D192A] border border-blue-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs text-blue-300 font-semibold uppercase tracking-wider mb-2">
            <span>Inversión Recibida</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mb-1">
            ${investmentTotal.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">Capital virtual otorgado por visitantes</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0D192A] border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2">
            <span>Total Inversionistas</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono mb-1">
            {investorsCount}
          </div>
          <p className="text-xs text-slate-400">Visitantes que han confiado en su equipo</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0D192A] border border-rose-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold uppercase tracking-wider mb-2">
            <span>Customer Tokens</span>
            <Heart className="w-5 h-5 fill-rose-500 text-rose-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-rose-400 font-mono mb-1">
            {customerTokensCount}
          </div>
          <p className="text-xs text-slate-400">Validaciones de compra/uso potencial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latest Investments Stream */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-[#0D192A] border border-white/10 p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Últimas Inversiones Recibidas</h3>
                <p className="text-xs text-slate-400">Asistentes que han invertido recientemente en tu stand</p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-white/5">
                {investments.length} inversiones
              </span>
            </div>

            {investments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Aún no has recibido inversiones directas registradas. Invita a los visitantes a escanear tu QR.
              </div>
            ) : (
              <div className="space-y-3">
                {investments.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        💰
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {inv.visitor_name || 'Visitante Expo'}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(inv.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        +${Number(inv.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QR Display for Stand Table */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0D192A] border border-white/10 p-6 shadow-xl text-center">
            <h3 className="text-base font-bold text-white mb-1">
              QR Oficial de tu Stand
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Muestra esta pantalla en una tablet o imprímelo para colocarlo en tu stand.
            </p>

            <QRCodeGenerator
              value={`/proyecto/${project.id}`}
              title={project.name}
              subtitle={`Stand oficial de ${project.team_name}`}
              size={180}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
