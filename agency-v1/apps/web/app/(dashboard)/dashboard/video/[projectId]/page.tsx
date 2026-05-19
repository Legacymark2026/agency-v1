'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoEditorStudio } from '@/components/video-editor/video-editor-studio';
import { createVideoProject, getVideoProject } from '@/actions/video-editor';
import { Loader2, Film, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ projectId: string }>;
}

export default function VideoEditorPage({ params }: Props) {
  const { projectId } = use(params);
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    getVideoProject(projectId)
      .then(p => setExists(!!p))
      .catch(() => {
        toast.error('Proyecto no encontrado');
        setExists(false);
      })
      .finally(() => setIsValidating(false));
  }, [projectId]);

  if (isValidating) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-teal-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
            <Film className="absolute inset-4 w-8 h-8 text-teal-400" />
          </div>
          <p className="text-slate-400 text-sm">Cargando editor...</p>
        </div>
      </div>
    );
  }

  if (!exists) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Proyecto no encontrado</h2>
          <p className="text-slate-400 text-sm mb-6">
            El proyecto que buscas no existe o no tienes acceso.
          </p>
          <Button
            onClick={() => router.push('/dashboard/video')}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a proyectos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <VideoEditorStudio
      projectId={projectId}
      onSave={() => {}}
    />
  );
}
