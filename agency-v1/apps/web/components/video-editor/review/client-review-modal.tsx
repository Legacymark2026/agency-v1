'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Share2, Copy, Check, MessageSquare, Clock,
  Shield, CheckCircle, ExternalLink, Send
} from 'lucide-react';
import { toast } from 'sonner';

interface ClientReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
}

export function ClientReviewModal({
  open,
  onOpenChange,
  projectId = 'demo-video-1',
  projectName = 'Video Promocional LegacyMark',
}: ClientReviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; author: string; timestamp: number; text: string }>>([
    { id: 'c1', author: 'Cliente (Gerencia)', timestamp: 4.5, text: 'Aumentar tamaño del logo corporativo en esta toma.' },
    { id: 'c2', author: 'Marketing Lead', timestamp: 18.0, text: 'El subtítulo debe tener color amarillo neón.' },
  ]);
  const [newComment, setNewComment] = useState('');
  const [newTimestamp, setNewTimestamp] = useState('00:05');

  const shareLink = typeof window !== 'undefined'
    ? `${window.location.origin}/review/video/${projectId}`
    : `https://legacymarksas.com/review/video/${projectId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Enlace de revisión copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const parts = newTimestamp.split(':');
    const sec = parseInt(parts[0] || '0') * 60 + parseFloat(parts[1] || '0');

    setComments(prev => [
      ...prev,
      {
        id: `comm_${Date.now()}`,
        author: 'Editor (Tú)',
        timestamp: sec,
        text: newComment.trim(),
      },
    ]);
    setNewComment('');
    toast.success('Comentario de revisión añadido con marca de tiempo');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-950 border border-slate-800 text-white p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Portal de Revisión y Aprobación de Clientes (Frame.io Mode)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Comparte este video con tu cliente para que deje notas y correcciones ancladas al segundo exacto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Share Link Input */}
        <div className="space-y-2 mt-3">
          <label className="text-xs font-mono text-slate-400 block">Enlace seguro de revisión:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono select-all outline-hidden"
            />
            <Button
              onClick={handleCopyLink}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-3 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </div>

        {/* Comments Feed */}
        <div className="space-y-3 mt-4 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Marcas de Tiempo & Comentarios ({comments.length})
            </span>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
              Sincronizado con Timeline
            </Badge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {comments.map(c => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{c.author}</span>
                    <Badge className="bg-slate-800 text-teal-400 font-mono text-[9px] px-1.5 py-0">
                      {Math.floor(c.timestamp / 60)}:{(c.timestamp % 60).toFixed(1).padStart(4, '0')}s
                    </Badge>
                  </div>
                  <p className="text-slate-300 mt-1">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add feedback note */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="00:15"
              value={newTimestamp}
              onChange={e => setNewTimestamp(e.target.value)}
              className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-teal-400 outline-hidden"
            />
            <input
              type="text"
              placeholder="Escribe una nota para el cliente o editor..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-hidden focus:border-indigo-500"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
