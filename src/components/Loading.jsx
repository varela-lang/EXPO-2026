import React from 'react';
import { Loader2 } from 'lucide-react';

export function Loading({ message = 'Cargando información...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <div className="relative flex items-center justify-center w-14 h-14 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
        <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-400" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}
