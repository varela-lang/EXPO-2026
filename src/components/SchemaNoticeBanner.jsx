import React, { useState } from 'react';
import { AlertTriangle, Code, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SupabaseModal } from './SupabaseModal';

export function SchemaNoticeBanner() {
  const { schemaStatus, isSupabaseConfigured } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show banner if Supabase credentials are configured but tables are not yet created in the DB
  if (!isSupabaseConfigured || schemaStatus !== 'missing_tables' || dismissed) {
    return null;
  }

  return (
    <>
      <div className="relative bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-slate-900 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs shadow-md z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Base de datos enlazada:</strong> Las tablas aún no están creadas en tu Supabase (PGRST205). La app está funcionando en modo de respaldo interactivo.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="py-1 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Copiar SQL y Activar Backend</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded text-amber-400 hover:text-white"
              title="Ocultar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <SupabaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
