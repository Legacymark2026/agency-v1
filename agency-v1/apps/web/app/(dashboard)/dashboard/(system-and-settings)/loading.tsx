import { Loader2 } from 'lucide-react';

export default function LoadingBoundary() {
  return (
    <div className='flex h-full w-full items-center justify-center p-12'>
      <Loader2 className='h-8 w-8 animate-spin text-zinc-400' />
      <span className='ml-3 text-zinc-500 font-medium'>Cargando módulo...</span>
    </div>
  );
}
