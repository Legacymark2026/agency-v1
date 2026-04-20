'use client';

import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { CharacterCounter } from './character-counter';
import Image from 'next/image';
import { ImageIcon, AlertCircle, Loader2, Type } from 'lucide-react';

interface ImageUploadPreviewProps {
    imageUrl: string;
    imageAlt: string;
    onImageUrlChange: (url: string) => void;
    onImageAltChange: (alt: string) => void;
}

/**
 * Premium HUD Image Upload Preview.
 */
export function ImageUploadPreview({
    imageUrl,
    imageAlt,
    onImageUrlChange,
    onImageAltChange
}: ImageUploadPreviewProps) {
    const [isValidImage, setIsValidImage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!imageUrl || imageUrl === '') {
            const timer = setTimeout(() => setIsValidImage(false), 0);
            return () => clearTimeout(timer);
        }

        setIsLoading(true);
        const img = new window.Image();
        img.onload = () => {
            setIsValidImage(true);
            setIsLoading(false);
        };
        img.onerror = () => {
            setIsValidImage(false);
            setIsLoading(false);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    URL Imagen de Portada
                </label>
                <Input
                    value={imageUrl}
                    onChange={(e) => onImageUrlChange(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full bg-slate-950 border-slate-700 h-11 focus:border-teal-500/50 transition-all text-sm"
                />
            </div>

            {/* Image Preview Container */}
            <div className={`relative min-h-[160px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 ${
                imageUrl 
                    ? (isValidImage ? 'border-slate-800 bg-slate-900/20' : 'border-red-900/30 bg-red-900/5') 
                    : 'border-slate-800 bg-slate-900/10'
            }`}>
                {!imageUrl ? (
                    <div className="text-center space-y-2 py-8">
                        <ImageIcon className="w-10 h-10 text-slate-700 mx-auto opacity-40" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sin imagen seleccionada</p>
                    </div>
                ) : isLoading ? (
                    <div className="text-center space-y-3">
                        <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
                        <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-[0.2em]">Cargando Previsualización...</p>
                    </div>
                ) : isValidImage ? (
                    <div className="w-full space-y-6">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                            <Image
                                src={imageUrl}
                                alt={imageAlt || 'Cover image preview'}
                                className="object-cover hover:scale-105 transition-transform duration-700"
                                fill
                                unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-mono font-bold text-white uppercase tracking-widest">
                                Preview Activo
                            </div>
                        </div>

                        <div className="space-y-3 bg-[#0d1117] p-4 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Type className="w-3 h-3" />
                                    Texto Alternativo (SEO)
                                </label>
                                <CharacterCounter
                                    current={imageAlt?.length || 0}
                                    max={125}
                                />
                            </div>
                            <input
                                value={imageAlt}
                                onChange={(e) => onImageAltChange(e.target.value)}
                                placeholder="Describe la imagen para accesibilidad..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg h-10 px-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 transition-all font-medium"
                            />
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider leading-relaxed">
                                Crucial para motores de búsqueda y lectores de pantalla.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-3 py-8">
                        <AlertCircle className="w-10 h-10 text-red-500/50 mx-auto" />
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">URL de imagen no válida</p>
                        <p className="text-[9px] text-red-500/40 font-bold uppercase tracking-widest">Verifica el enlace e intenta de nuevo</p>
                    </div>
                )}
            </div>
        </div>
    );
}
