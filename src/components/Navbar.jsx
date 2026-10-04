import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Wallet,
  LayoutDashboard,
  Shield,
  Briefcase,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Coins,
  Database,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SupabaseModal } from './SupabaseModal';

export function Navbar() {
  const { user, profile, logout, isSupabaseConfigured, switchDemoRole, schemaStatus } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Don't show regular navbar on full-screen /dashboard if opened as stadium presentation,
  // but keep a sleek discreet bar or toggle if needed.
  const isDashboardView = location.pathname === '/dashboard';

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#07111F]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-[#07111F] rounded-[10px] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base md:text-lg tracking-tight text-white group-hover:text-blue-300 transition-colors">
                      RaizeUp
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hidden sm:inline-block">
                      Expo 2026
                    </span>
                  </div>
                </div>
              </Link>

              {/* Navigation desktop */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive('/') ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Proyectos
                </Link>

                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/dashboard') ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Mercado en Vivo
                </Link>

                <Link
                  to="/pasaporte"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/pasaporte') ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Pasaporte
                </Link>

                {user && (
                  <Link
                    to="/wallet"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isActive('/wallet') ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Mi Cartera
                  </Link>
                )}

                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      location.pathname.startsWith('/admin') ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Admin
                  </Link>
                )}

                {(profile?.role === 'team' || profile?.role === 'admin') && (
                  <Link
                    to="/team"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isActive('/team') ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                    Equipo
                  </Link>
                )}
              </div>
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Demo role fast-switcher (available in demo mode or when schema is pending) */}
              {(!isSupabaseConfigured || schemaStatus === 'missing_tables') && (
                <div className="relative">
                  <button
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="text-[11px] font-semibold text-slate-300 bg-slate-900 border border-white/10 px-2.5 py-1 rounded-xl flex items-center gap-1 hover:border-blue-400/40"
                  >
                    <span>Rol: <strong className="text-blue-400 uppercase">{profile?.role || 'Visitante'}</strong></span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#0D192A] border border-white/10 p-1.5 shadow-xl z-50">
                      <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                        Cambiar rol (Demo)
                      </div>
                      <button
                        onClick={() => { switchDemoRole('visitor'); setRoleDropdownOpen(false); }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-blue-600/20 rounded-lg"
                      >
                        👤 Visitante ($10k)
                      </button>
                      <button
                        onClick={() => { switchDemoRole('team'); setRoleDropdownOpen(false); }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-blue-600/20 rounded-lg"
                      >
                        🚀 Equipo Estudiante
                      </button>
                      <button
                        onClick={() => { switchDemoRole('admin'); setRoleDropdownOpen(false); }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-blue-600/20 rounded-lg"
                      >
                        🛡️ Administrador Expo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User Balance or Auth links */}
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/wallet"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-white transition-all group"
                  >
                    <Coins className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="text-right">
                      <span className="text-[10px] block text-slate-400 leading-none">Capital Disponible</span>
                      <span className="text-xs font-extrabold text-blue-300 font-mono">
                        ${Number(profile?.balance || 0).toLocaleString()}
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                  >
                    <span>Ingresar mi nombre</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              {user && (
                <Link
                  to="/wallet"
                  className="px-2.5 py-1 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold"
                >
                  ${Number(profile?.balance || 0).toLocaleString()}
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0D192A] p-4 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              Proyectos de la Expo
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Mercado en Vivo (Pantalla Escenario)
            </Link>
            <Link
              to="/pasaporte"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-amber-300 hover:bg-white/5"
            >
              <Globe className="w-4 h-4 text-amber-400" />
              Pasaporte de Ciudades
            </Link>

            {user ? (
              <>
                <Link
                  to="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold bg-blue-600/10 border border-blue-500/20 text-blue-300"
                >
                  <span>Mi Cartera</span>
                  <span className="font-mono font-bold">${Number(profile?.balance || 0).toLocaleString()}</span>
                </Link>

                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                  >
                    Panel Administrativo
                  </Link>
                )}

                {(profile?.role === 'team' || profile?.role === 'admin') && (
                  <Link
                    to="/team"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                  >
                    Panel de Equipo
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
                <div className="pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full block py-3 text-center rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/20"
                  >
                    Ingresar con mi nombre ($10,000)
                  </Link>
                </div>
            )}
          </div>
        )}
      </nav>

      {/* Supabase connection modal */}
      <SupabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </>
  );
}
