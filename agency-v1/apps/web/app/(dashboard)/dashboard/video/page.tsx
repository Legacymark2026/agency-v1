import { VideoEditorStudio } from '@/components/video-editor/video-editor-studio';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Studio Pro | LegacyMark',
  description: 'Estudio de edición de video profesional con IA, clips virales 9:16 y timeline interactivo',
};

export default function VideoStudioProPage() {
  return (
    <div className="w-full h-full">
      <VideoEditorStudio />
    </div>
  );
}

