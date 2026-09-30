import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, ArrowUpRight, TrendingUp } from 'lucide-react';

export function ProjectCard({ project, rank }) {
  const investmentTotal = Number(project.investment_total || 0);
  const investorsCount = Number(project.investors || 0);
  const customerTokensCount = Number(project.customer_tokens || 0);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#0D192A]/90 border border-white/8 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
      {/* Top Banner / Image */}
      <div className="relative h-36 w-full overflow-hidden bg-slate-900">
        <img
          src={project.logo_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80'}
          alt={project.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-95"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D192A] via-[#0D192A]/40 to-transparent" />

        {/* Category Badge & Rank */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-blue-300 border border-blue-400/20">
            {project.category || 'Proyecto'}
          </span>
          {rank !== undefined && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-md border ${
              rank === 1 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : rank === 2 
                ? 'bg-slate-300/20 text-slate-200 border-slate-300/40' 
                : rank === 3 
                ? 'bg-amber-700/20 text-amber-400 border-amber-700/40' 
                : 'bg-slate-900/60 text-slate-400 border-white/10'
            }`}>
              #{rank}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
            <span className="shrink-0 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>

          <p className="text-xs font-medium text-slate-400 mb-3">
            Por <span className="text-slate-300">{project.team_name}</span>
          </p>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {project.description}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Inversión Recibida
            </span>
            <span className="font-bold text-sm text-white font-mono">
              ${investmentTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/50 border border-white/5">
              <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-white">{investorsCount}</span>
                <span className="text-slate-400 text-[11px] block">Inversionistas</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/50 border border-white/5">
              <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 fill-rose-500/20" />
              <div className="truncate">
                <span className="font-bold text-white">{customerTokensCount}</span>
                <span className="text-slate-400 text-[11px] block">Tokens Cliente</span>
              </div>
            </div>
          </div>

          <Link
            to={`/proyecto/${project.id}`}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 hover:border-blue-500 font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200"
          >
            Visitar Stand & Invertir
          </Link>
        </div>
      </div>
    </div>
  );
}
