'use server';
'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error Boundary Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">
        Ocurrió un inconveniente al cargar esta sección
      </h2>

      <p className="text-sm text-slate-400 max-w-md mb-6">
        {error?.message && !error.message.includes('Server Components')
          ? error.message
          : 'Hubo un error al procesar la solicitud en el servidor. Inténtalo de nuevo.'}
      </p>

      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #0d9488, #0891b2)',
          boxShadow: '0 4px 15px rgba(13, 148, 136, 0.3)',
        }}
      >
        <RotateCcw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  );
}
