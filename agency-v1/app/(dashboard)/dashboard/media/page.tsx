"use client";

import React, { useState, useEffect } from "react";
import { Copy, Navigation, Plus, Files, Search, Video, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaUploader } from "@/components/ui/media-uploader";
import Image from "next/image";

// Simulated fetch (since we don't have a DB table for these yet in the scope of this update, 
// we will just manage a local state for the demonstration of the uploaded ones in this session)
interface UploadedMedia {
    url: string;
    name: string;
    type: 'image' | 'video' | 'document' | 'other';
    date: string;
}

export default function MediaManagerPage() {
    const [uploads, setUploads] = useState<UploadedMedia[]>([]);
    const [showUploader, setShowUploader] = useState(false);

    const onSubidaCompletada = (url: string, name: string) => {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        let type: UploadedMedia['type'] = 'other';
        
        if (['jpg','jpeg','png','webp','gif'].includes(ext)) type = 'image';
        else if (['mp4','webm','mov'].includes(ext)) type = 'video';
        else if (['pdf','doc','docx','xls','xlsx','csv'].includes(ext)) type = 'document';

        const newMedia: UploadedMedia = {
            url,
            name,
            type,
            date: new Date().toLocaleDateString()
        };

        setUploads(prev => [newMedia, ...prev]);
        setShowUploader(false);
    };

    const copyToClipboard = (url: string) => {
        // En producción las URLs de public son relativas al dominio
        const fullUrl = `${window.location.origin}${url}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success("Enlace copiado al portapapeles");
    };

    return (
        <div className="ds-page">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="ds-heading-1 flex items-center gap-3">
                        <Files className="text-teal-400" size={28} />
                        Gestor de Medios
                    </h1>
                    <p className="ds-body-text mt-1 text-slate-400">
                        Sube y administra imágenes, videos y documentos alojados directamente en tu servidor local de forma segura.
                    </p>
                </div>
                <Button 
                    className="ds-btn-primary gap-2"
                    onClick={() => setShowUploader(!showUploader)}
                >
                    <Plus size={16} /> Subir Archivo
                </Button>
            </div>

            {showUploader && (
                <div className="mb-8 p-6 ds-card rounded-2xl animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-white tracking-tight">Nuevo Archivo (VPS Local)</h2>
                        <Button variant="ghost" size="sm" onClick={() => setShowUploader(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cerrar</Button>
                    </div>
                    <MediaUploader 
                        onUploadComplete={onSubidaCompletada} 
                        title="Subir Archivo Profesional"
                        description="Soporta la carga rápida de Videos pesados, PDFs y Assets gráficos (Max 50MB)"
                        maxSizeMB={50}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {uploads.length === 0 && !showUploader && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 ds-card rounded-2xl border-dashed">
                        <Files size={48} className="text-slate-700 mb-4" />
                        <h3 className="text-slate-300 font-medium mb-1">Aún no hay archivos subidos en esta sesión</h3>
                        <p className="text-sm text-slate-500 max-w-sm text-center">Pulsa "Subir Archivo" para agregar e indexar documentos, videos o fotos en tu servidor.</p>
                    </div>
                )}

                {uploads.map((media, idx) => (
                    <div key={idx} className="ds-card rounded-xl overflow-hidden group hover:border-teal-500/50 transition-colors">
                        <div className="aspect-video bg-slate-900 flex items-center justify-center relative border-b border-slate-800">
                            {media.type === 'image' ? (
                                <Image src={media.url} alt={media.name} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : media.type === 'video' ? (
                                <Video size={48} className="text-slate-700 group-hover:text-teal-500/50 transition-colors" />
                            ) : media.type === 'document' ? (
                                <FileText size={48} className="text-slate-700 group-hover:text-teal-500/50 transition-colors" />
                            ) : (
                                <Files size={48} className="text-slate-700" />
                            )}

                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 gap-2">
                                <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white" onClick={() => window.open(media.url, '_blank')}>
                                    <Navigation size={14} className="mr-2"/> Abrir
                                </Button>
                            </div>
                        </div>

                        <div className="p-4">
                            <p className="text-sm font-medium text-slate-200 truncate" title={media.name}>{media.name}</p>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-xs font-mono text-slate-500 uppercase px-2 py-0.5 bg-slate-800 rounded">{media.type}</span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/30 gap-1.5 px-2"
                                    onClick={() => copyToClipboard(media.url)}
                                >
                                    <Copy size={12} /> Copiar Enlace
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
