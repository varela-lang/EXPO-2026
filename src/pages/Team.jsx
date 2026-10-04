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
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjects } from '../services/projects';
import { getAllInvestments } from '../services/investments';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { Loading } from '../components/Loading';

export function Team() {
  const { user, profile } = useAuth();
  const [allProjects, setAllProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeQrTab, setActiveQrTab] = useState('stamp'); // 'stamp' | 'stand'

  useEffect(() => {
    async function loadTeamData() {
      try {
        setLoading(true);
        const projects = await getProjects();
        setAllProjects(projects || []);

        let userProject = null;
        if (profile?.project_id) {
          userProject = (projects || []).find((p) => p.id === profile.project_id);
        }
        if (!userProject && projects && projects.length > 0) {
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

  const handleSelectProject = async (pId) => {
    const selected = allProjects.find((p) => p.id === pId);
    if (!selected) return;
    setProject(selected);
    try {
      const allInvs = await getAllInvestments();
      const teamInvs = allInvs.filter((i) => i.project_id === selected.id);
      setInvestments(teamInvs);
    } catch (err) {
      console.error('Error updating project investments:', err);
    }
  };

  const handleCopyCode = () => {
    if (!project?.passport_code) return;
    navigator.clipboard.writeText(project.passport_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

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
        <Link to="/" className="py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold">
          Ver Catálogo
        </Link>
      </div>
    );
  }

  const investmentTotal = Number(project.investment_total || 0);
  const investorsCount = Number(project.investors || 0);
  const customerTokensCount = Number(project.customer_tokens || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Team Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sky-400">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Panel Exclusivo de Miembros de Equipo
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>

            {project.city && (
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                <span>{project.country_code || '📍'}</span>
                <span>Ciudad: {project.city}</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {project.team_name} • Stand oficial en Expo RaizeUp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Switcher for Expo organizers or shared team devices */}
          {allProjects.length > 1 && (
            <div className="relative">
              <select
                value={project.id}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                title="Cambiar de equipo / stand"
              >
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.city ? `${p.city} - ${p.name}` : p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <Link
            to={`/proyecto/${project.id}`}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver Stand Público
          </Link>

          <Link
            to="/dashboard"
            className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tablero en Vivo
          </Link>
        </div>
      </div>

      {/* EXCLUSIVE STAND STAMP CODE HIGHLIGHT (CRITICAL FOR TEAM ONLY) */}
      <section className="mb-8 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-950/30 via-[#0D192A] to-[#0B1524] border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-bl-full pointer-events-none blur-2xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>CÓDIGO DE SELLADO PRIVADO • SOLO EQUIPO</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Código Oficial para Sellar: {project.city}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Los visitantes <strong>no pueden ver este código en la plataforma pública</strong>. Entrégalo verbalmente o muéstrales el código QR en tu mesa únicamente después de que hayan visitado tu stand y escuchado la explicación de tu proyecto.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="px-5 py-3.5 rounded-2xl bg-slate-950 border-2 border-amber-500/50 shadow-inner text-center min-w-[200px]">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">
                Código de Stand
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300 tracking-wider">
                {project.passport_code || 'SIN-ASIGNAR'}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className={`w-full sm:w-auto py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                copiedCode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡COPIADO!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPIAR CÓDIGO</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0D192A] border border-blue-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs text-blue-300 font-semibold uppercase tracking-wider mb-2">
            <span>Inversión Recibida</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono mb-1">
            ${investmentTotal.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">Capital virtual otorgado por visitantes</p>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-[#0D192A] border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2">
            <span>Total Inversionistas</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-emerald-400 font-mono mb-1">
            {investorsCount}
          </div>
          <p className="text-xs text-slate-400">Visitantes que han confiado en su equipo</p>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-[#0D192A] border border-rose-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold uppercase tracking-wider mb-2">
            <span>Customer Tokens</span>
            <Heart className="w-5 h-5 fill-rose-500 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-rose-400 font-mono mb-1">
            {customerTokensCount}
          </div>
          <p className="text-xs text-slate-400">Validaciones de compra/uso potencial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latest Investments Stream */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-[#0D192A] border border-white/10 p-5 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Últimas Inversiones Recibidas</h3>
                <p className="text-xs text-slate-400">Asistentes que han invertido recientemente en tu stand</p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-white/5">
                {investments.length} inversiones
              </span>
            </div>

            {investments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Aún no has recibido inversiones directas registradas. Invita a los visitantes a escanear tu QR para conocer tu solución.
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

        {/* Dual QR Display for the Stand (Tablet / Table display) */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0D192A] border border-white/10 p-5 sm:p-6 shadow-xl text-center">
            {/* Tab switch between Stamp QR and Stand QR */}
            <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setActiveQrTab('stamp')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
                  activeQrTab === 'stamp'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                QR Sello ({project.city})
              </button>
              <button
                type="button"
                onClick={() => setActiveQrTab('stand')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
                  activeQrTab === 'stand'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                QR Stand / Invertir
              </button>
            </div>

            {activeQrTab === 'stamp' ? (
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Muestra este QR a los visitantes
                </span>
                <h4 className="text-sm font-bold text-white mb-1">
                  Escaneo Directo de Sello
                </h4>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  Al escanearlo con la cámara del teléfono, el visitante registra automáticamente el sello de {project.city}.
                </p>

                <div className="bg-[#07111F] p-4 rounded-2xl border border-amber-500/30 inline-block shadow-inner">
                  <QRCodeGenerator
                    value={`/pasaporte?code=${project.passport_code}`}
                    title={`Sello: ${project.city}`}
                    subtitle={`Código: ${project.passport_code}`}
                    size={170}
                  />
                </div>
              </div>
            ) : (
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                  Perfil de Stand
                </span>
                <h4 className="text-sm font-bold text-white mb-1">
                  QR Para Recibir Inversión
                </h4>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  Abre la ficha del proyecto para que los asistentes inviertan capital o entreguen Customer Tokens.
                </p>

                <div className="bg-[#07111F] p-4 rounded-2xl border border-white/10 inline-block shadow-inner">
                  <QRCodeGenerator
                    value={`/proyecto/${project.id}`}
                    title={project.name}
                    subtitle={`Stand de ${project.team_name}`}
                    size={170}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
