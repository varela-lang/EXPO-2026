import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Briefcase,
  Users,
  QrCode,
  DollarSign,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Download,
  Printer,
  Heart,
  TrendingUp,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { getProjects, createProject, updateProject, toggleProjectActive } from '../services/projects';
import { getAllVisitors, getDashboardStats } from '../services/dashboard';
import { getAllInvestments } from '../services/investments';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';

export function Admin() {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'qrs' | 'visitors' | 'investments'
  const [projects, setProjects] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedQrProject, setSelectedQrProject] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_name: '',
    category: 'Tecnología',
    logo_url: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [projList, visList, invList, dashStats] = await Promise.all([
        getProjects(),
        getAllVisitors(),
        getAllInvestments(),
        getDashboardStats(),
      ]);
      setProjects(projList || []);
      setVisitors(visList || []);
      setInvestments(invList || []);
      setStats(dashStats || null);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      team_name: '',
      category: 'Tecnología',
      logo_url: '',
      active: true,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      team_name: project.team_name,
      category: project.category || 'Tecnología',
      logo_url: project.logo_url || '',
      active: project.active !== undefined ? project.active : true,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.team_name) {
      setFormError('Nombre, descripción y equipo son obligatorios.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData);
      } else {
        await createProject(formData);
      }
      setIsCreateModalOpen(false);
      await loadAdminData();
    } catch (err) {
      console.error('Error saving project:', err);
      setFormError(err.message || 'Error al guardar el proyecto.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (project) => {
    try {
      const newStatus = !project.active;
      await toggleProjectActive(project.id, newStatus);
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, active: newStatus } : p))
      );
    } catch (err) {
      console.error('Error toggling active status:', err);
      alert('Error al cambiar el estado del proyecto');
    }
  };

  if (loading) {
    return <Loading message="Cargando panel de administración..." />;
  }

  const totalInvested = stats?.total_invested || 0;
  const totalTokens = stats?.total_customer_tokens || 0;
  const totalVisitorsCount = visitors.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1 text-blue-400">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Centro de Control Oficial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Panel de Administración Expo
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Gestión integral de stands, métricas en tiempo real y códigos QR
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            target="_blank"
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Abrir Pantalla Escenario
          </Link>
          <button
            onClick={handleOpenCreate}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Admin Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-[#0D192A] border border-blue-500/20">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Capital Invertido
          </span>
          <span className="text-2xl font-black font-mono text-white">
            ${Number(totalInvested).toLocaleString()}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D192A] border border-white/10">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Proyectos Registrados
          </span>
          <span className="text-2xl font-black font-mono text-white">
            {projects.length}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D192A] border border-rose-500/20">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Customer Tokens
          </span>
          <span className="text-2xl font-black font-mono text-rose-400">
            {Number(totalTokens).toLocaleString()}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D192A] border border-emerald-500/20">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Visitantes Registrados
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400">
            {totalVisitorsCount}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('projects')}
          className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'projects'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Proyectos ({projects.length})
        </button>

        <button
          onClick={() => setActiveTab('qrs')}
          className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'qrs'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Generador de Códigos QR
        </button>

        <button
          onClick={() => setActiveTab('visitors')}
          className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'visitors'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Visitantes ({visitors.length})
        </button>

        <button
          onClick={() => setActiveTab('investments')}
          className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'investments'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Auditoría de Inversiones ({investments.length})
        </button>
      </div>

      {/* TAB 1: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl bg-[#0D192A] border border-white/10 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-4 px-5">Proyecto</th>
                  <th className="py-4 px-4">Equipo</th>
                  <th className="py-4 px-4">Categoría</th>
                  <th className="py-4 px-4 text-right">Inversión Recibida</th>
                  <th className="py-4 px-4 text-right">Inversionistas</th>
                  <th className="py-4 px-4 text-right">Customer Tokens</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-white flex items-center gap-3">
                      <img
                        src={proj.logo_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&auto=format&fit=crop&q=80'}
                        alt={proj.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <span>{proj.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {proj.team_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-blue-300 border border-blue-400/20 text-[10px]">
                        {proj.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ${Number(proj.investment_total || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-300">
                      {Number(proj.investors || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-400">
                      {Number(proj.customer_tokens || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          proj.active
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}
                      >
                        {proj.active ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedQrProject(proj)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Ver QR Stand"
                        >
                          <QrCode className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(proj)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(proj)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            proj.active
                              ? 'text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={proj.active ? 'Desactivar proyecto' : 'Activar proyecto'}
                        >
                          {proj.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QR GENERATION & ENTRANCE POSTER */}
      {activeTab === 'qrs' && (
        <div className="space-y-8">
          {/* General Entrance QR for Visitors */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#0D192A] to-[#0D192A] border border-blue-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
                <QrCode className="w-3.5 h-3.5" />
                <span>Entrada Principal de la Expo</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">
                Código QR General de Registro
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Coloca este póster en la recepción o puerta del evento. Al escanearlo, los visitantes se registran y reciben de inmediato sus <strong>$10,000 de capital virtual</strong> en su cartera.
              </p>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] font-mono text-blue-300">
                URL de destino: /registro
              </div>
            </div>

            <div className="bg-[#07111F] p-4 rounded-2xl border border-white/10">
              <QRCodeGenerator
                value="/registro"
                title="Registro Visitante ($10,000)"
                subtitle="Escanea con tu cámara para empezar a invertir"
                size={180}
              />
            </div>
          </div>

          {/* Individual Projects QR Stand Posters */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">
              Códigos QR Individuales de Stands
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Imprime el QR correspondiente a cada equipo para que los asistentes lo escaneen en su mesa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div key={proj.id} className="rounded-3xl bg-[#0D192A] border border-white/10 p-5 flex flex-col justify-between">
                  <div className="mb-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                      {proj.team_name}
                    </span>
                    <h4 className="text-base font-bold text-white mb-1">
                      {proj.name}
                    </h4>
                  </div>

                  <QRCodeGenerator
                    value={`/proyecto/${proj.id}`}
                    title={proj.name}
                    subtitle={`Stand de ${proj.team_name}`}
                    size={150}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISITORS */}
      {activeTab === 'visitors' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl bg-[#0D192A] border border-white/10 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-4 px-5">Visitante</th>
                  <th className="py-4 px-4">Correo</th>
                  <th className="py-4 px-4 text-right">Saldo Disponible</th>
                  <th className="py-4 px-4 text-right">Capital Invertido</th>
                  <th className="py-4 px-4 text-right">Stands Apoyados</th>
                  <th className="py-4 px-4 text-right">Tokens Entregados</th>
                  <th className="py-4 px-5 text-right">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visitors.map((vis) => (
                  <tr key={vis.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-5 font-bold text-white">
                      {vis.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {vis.email}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ${Number(vis.balance).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-white font-semibold">
                      ${Number(vis.invested_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {vis.projects_supported || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-400">
                      {vis.tokens_count || 0}
                    </td>
                    <td className="py-3.5 px-5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(vis.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: INVESTMENTS LEDGER */}
      {activeTab === 'investments' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl bg-[#0D192A] border border-white/10 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-4 px-5">Inversor</th>
                  <th className="py-4 px-4">Proyecto Beneficiado</th>
                  <th className="py-4 px-4 text-right">Monto Aportado</th>
                  <th className="py-4 px-5 text-right">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Aún no se registran inversiones en la base de datos.
                    </td>
                  </tr>
                ) : (
                  investments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-5 font-bold text-white">
                        {inv.visitor_name}
                        <span className="block text-[10px] font-normal text-slate-400">{inv.visitor_email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-blue-300 font-semibold">
                        {inv.project_name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                        +${Number(inv.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(inv.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0D192A] border border-blue-500/20 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Configura los datos del stand para la Expo de Logros.
            </p>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. EcoTech"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Equipo Responsable *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Equipo Innovación Verde"
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  placeholder="ej. Sostenibilidad, Robótica, Salud"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  URL de Imagen / Logo
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Descripción del Proyecto *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explica la propuesta de valor y solución del proyecto..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/20"
                />
                <label htmlFor="active" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Stand activo para recibir inversiones y Customer Tokens
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingProject ? 'Guardar Cambios' : 'Crear Stand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE QR STAND POPUP */}
      {selectedQrProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0D192A] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">QR de Stand Oficial</h3>
              <button
                onClick={() => setSelectedQrProject(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <QRCodeGenerator
              value={`/proyecto/${selectedQrProject.id}`}
              title={selectedQrProject.name}
              subtitle={`Stand oficial de ${selectedQrProject.team_name}`}
              size={220}
            />
          </div>
        </div>
      )}
    </div>
  );
}
