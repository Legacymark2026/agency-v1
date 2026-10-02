'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className='flex h-full w-full flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800'>
      <div className='bg-red-100 dark:bg-red-900/20 p-3 rounded-full mb-4'>
        <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
      </div>
      <h2 className='text-2xl font-semibold mb-2'>Algo salió mal en esta sección</h2>
      <p className='text-zinc-500 mb-6 max-w-md'>
        Ocurrió un error inesperado al cargar este módulo. No te preocupes, el resto del sistema sigue funcionando.
      </p>
      <div className='flex gap-4'>
        <Button onClick={() => window.location.reload()} variant='outline'>Recargar página</Button>
        <Button onClick={() => reset()}>Intentar de nuevo</Button>
      </div>
    </div>
  );
}
