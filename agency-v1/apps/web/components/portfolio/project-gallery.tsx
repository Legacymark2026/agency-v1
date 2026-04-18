'use client';

import { useState, useEffect } from 'react';
import { MediaRenderer } from './media-renderer';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface MediaAsset {
    url: string;
    type?: string;
    name?: string;
    alt?: string;
    caption?: string;
}

export function ProjectGallery({ gallery }: { gallery: any[] }) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowLeft') setLightboxIndex(prev => prev !== null ? (prev === 0 ? assets.length - 1 : prev - 1) : null);
            if (e.key === 'ArrowRight') setLightboxIndex(prev => prev !== null ? (prev === assets.length - 1 ? 0 : prev + 1) : null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    if (!gallery || gallery.length === 0) return null;

    const assets: MediaAsset[] = gallery.map(item => {
        const asset = typeof item === 'string' ? { url: item, type: 'image' } : { ...item };
        if (asset.url && asset.url.startsWith('/uploads/')) {
            asset.url = asset.url.replace('/uploads/', '/api/serve/');
        }
        return asset;
    });

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLightboxIndex(prev => prev !== null ? (prev === 0 ? assets.length - 1 : prev - 1) : null);
    };
    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLightboxIndex(prev => prev !== null ? (prev === assets.length - 1 ? 0 : prev + 1) : null);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 pb-16">
            <h2 className="text-3xl font-bold text-white mb-8 border-b border-slate-800 pb-4">Galería del Proyecto</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset, i) => {
                   const isImage = !asset.type || asset.type === 'image';
                   return (
                    <div 
                        key={i} 
                        className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl group ${isImage ? 'cursor-zoom-in' : ''}`}
                        onClick={() => {
                            if (isImage) openLightbox(i);
                        }}
                    >
                        {isImage ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={asset.url} 
                                    alt={asset.alt || asset.caption || 'Gallery Image'} 
                                    className="w-full aspect-[4/3] object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="bg-teal-500/90 backdrop-blur p-3 rounded-full text-slate-950 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg shadow-teal-500/20">
                                        <ZoomIn className="w-6 h-6" />
                                    </div>
                                </div>
                                {asset.caption && (
                                    <div className="p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent absolute bottom-0 left-0 right-0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-sm font-medium text-slate-200">{asset.caption}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <MediaRenderer asset={asset} className="w-full aspect-[4/3]" />
                        )}
                    </div>
                )})}
            </div>

            {/* Lightbox Overlay */}
            {lightboxIndex !== null && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    <button 
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-900/50 rounded-full transition-colors z-50"
                        onClick={closeLightbox}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {assets.length > 1 && (
                        <>
                            <button 
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 text-slate-400 hover:text-teal-400 bg-slate-900/50 hover:bg-slate-800 rounded-full transition-colors z-50 shadow-lg"
                                onClick={prevImage}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            <button 
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 text-slate-400 hover:text-teal-400 bg-slate-900/50 hover:bg-slate-800 rounded-full transition-colors z-50 shadow-lg"
                                onClick={nextImage}
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    <div 
                        className="relative w-full h-full max-w-6xl max-h-[90vh] p-4 md:p-12 flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={assets[lightboxIndex].url}
                            alt={assets[lightboxIndex].alt || 'Fullscreen image'}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded"
                        />
                        
                        {(assets[lightboxIndex].caption || assets[lightboxIndex].name) && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 border border-slate-800 backdrop-blur px-8 py-4 rounded-2xl text-slate-200 text-sm text-center max-w-[90%] md:max-w-[60%] shadow-2xl">
                                {assets[lightboxIndex].name && <span className="font-bold text-teal-400 block mb-1">{assets[lightboxIndex].name}</span>}
                                {assets[lightboxIndex].caption}
                            </div>
                        )}
                        
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/50 backdrop-blur px-4 py-1.5 rounded-full text-xs text-teal-400 font-mono tracking-widest font-bold border border-teal-900/30">
                            {lightboxIndex + 1} / {assets.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
