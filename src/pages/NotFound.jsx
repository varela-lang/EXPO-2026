import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 text-2xl font-black font-mono">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
        Página no encontrada
      </h1>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        La ruta solicitada no existe o el stand fue reubicado durante la Expo.
      </p>
      <Link
        to="/"
        className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la Expo
      </Link>
    </div>
  );
}
