"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, File as FileIcon, FileVideo, FileImage, X, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface MediaUploaderProps {
    onUploadComplete: (url: string, name: string) => void;
    accept?: string;
    maxSizeMB?: number;
    title?: string;
    description?: string;
}

export function MediaUploader({ 
    onUploadComplete, 
    accept = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv",
    maxSizeMB = 50,
    title = "Sube tus archivos",
    description = "Arrastra imágenes, videos o documentos interactivos."
}: MediaUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) handleFiles(files);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length > 0) handleFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
    };

    const handleFiles = async (files: File[]) => {
        // Validation length
        if (files.length > 1) {
            toast.error("Por favor, sube solo un archivo a la vez en este campo.");
            return;
        }

        const file = files[0];
        const fileSizeMB = file.size / 1024 / 1024;
        
        if (fileSizeMB > maxSizeMB) {
            toast.error(`El archivo es muy pesado. El máximo es ${maxSizeMB}MB.`);
            return;
        }

        // Client-side WebP Compressor
        const compressImage = async (imgFile: File): Promise<File> => {
            if (!imgFile.type.startsWith('image/')) return imgFile;
            if (imgFile.type === 'image/svg+xml' || imgFile.type === 'image/gif') return imgFile;

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new window.Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let { width, height } = img;
                        const MAX = 1920;
                        if (width > height) {
                            if (width > MAX) { height *= MAX / width; width = MAX; }
                        } else {
                            if (height > MAX) { width *= MAX / height; height = MAX; }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return resolve(imgFile);

                        ctx.drawImage(img, 0, 0, width, height);

                        // Watermark Layer (Agency Logo)
                        const watermark = new window.Image();
                        watermark.onload = () => {
                            const wmWidth = Math.max(120, width * 0.15); // 15% de ancho o 120px min
                            const wmHeight = (watermark.height / watermark.width) * wmWidth;
                            const padding = Math.max(20, width * 0.03); // 3% padding o 20px min
                            
                            const x = width - wmWidth - padding;
                            const y = height - wmHeight - padding;

                            // Sombra sutil para la marca de agua
                            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                            ctx.shadowBlur = 10;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;
                            
                            ctx.globalAlpha = 0.65; // Transparencia elegante
                            ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
                            
                            // Resetear estilos
                            ctx.globalAlpha = 1.0;
                            ctx.shadowColor = "transparent";

                            canvas.toBlob((blob) => {
                                if (!blob) return resolve(imgFile);
                                const finalFileName = imgFile.name.replace(/\.[^/.]+$/, "") + ".webp";
                                const newFile = new File([blob], finalFileName, {
                                    type: 'image/webp',
                                    lastModified: Date.now(),
                                });
                                resolve(newFile.size < imgFile.size || width > 1000 ? newFile : imgFile);
                            }, 'image/webp', 0.85);
                        };
                        
                        // Fallback de seguridad si no carga el logo
                        watermark.onerror = () => {
                            canvas.toBlob((blob) => {
                                if (!blob) return resolve(imgFile);
                                const finalFileName = imgFile.name.replace(/\.[^/.]+$/, "") + ".webp";
                                const newFile = new File([blob], finalFileName, { type: 'image/webp', lastModified: Date.now() });
                                resolve(newFile.size < imgFile.size ? newFile : imgFile);
                            }, 'image/webp', 0.85);
                        };
                        
                        watermark.src = '/logo.png';
                    };
                    img.onerror = () => resolve(imgFile);
                    if (event.target?.result) img.src = event.target.result as string;
                };
                reader.onerror = () => resolve(imgFile);
                reader.readAsDataURL(imgFile);
            });
        };

        setIsUploading(true);
        setProgress(0);

        // Simulated progress for better UX
        const progressInterval = setInterval(() => {
            setProgress(p => Math.min(p + 15, 90));
        }, 300);

        try {
            // Compress before fetch
            const compressedFile = await compressImage(file);

            const res = await fetch(`/api/upload?name=${encodeURIComponent(compressedFile.name)}&type=${encodeURIComponent(compressedFile.type)}&size=${compressedFile.size}`, {
                method: "POST",
                headers: { "Content-Type": "application/octet-stream" },
                body: compressedFile,
            });

            const data = await res.json();
            clearInterval(progressInterval);
            setProgress(100);

            if (!res.ok) {
                throw new Error(data.error || "Error al subir el archivo");
            }

            toast.success("¡Archivo subido exitosamente!");
            onUploadComplete(data.url, data.name);
            
        } catch (error: any) {
            clearInterval(progressInterval);
            console.error(error);
            toast.error(error.message || "Error de red al procesar el archivo");
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setProgress(0);
            }, 500);
        }
    };

    return (
        <div className="w-full">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept={accept}
                onChange={handleChange}
            />
            
            <div 
                className={`w-full relative rounded-xl border-2 border-dashed transition-all duration-300 ease-out overflow-hidden cursor-pointer
                    ${isDragging 
                        ? 'border-teal-500 bg-teal-900/10 shadow-[0_0_20px_rgba(20,184,166,0.15)]' 
                        : 'border-slate-700/60 bg-slate-900 hover:border-teal-500/50 hover:bg-slate-800'
                    }
                    ${isUploading ? 'pointer-events-none opacity-80' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                    
                    <div className={`p-4 rounded-full bg-slate-800/80 shadow-inner mb-2 transition-transform duration-300 ${isDragging ? 'scale-110 shadow-teal-900/40' : ''}`}>
                        {isUploading ? (
                            <Loader2 size={32} className="text-teal-400 animate-spin" />
                        ) : (
                            <UploadCloud size={32} className={isDragging ? 'text-teal-400' : 'text-slate-400'} />
                        )}
                    </div>
                    
                    {!isUploading ? (
                        <>
                            <h3 className="text-sm font-semibold text-slate-200">
                                {title} <span className="text-teal-400 hover:underline">explorar</span>
                            </h3>
                            <p className="text-xs text-slate-500 max-w-[250px]">
                                {description}
                                <br/>
                                <span className="opacity-70 text-[10px] mt-1 block">Tamaño máx: {maxSizeMB}MB</span>
                            </p>
                        </>
                    ) : (
                        <div className="w-full max-w-xs space-y-2 mt-2">
                            <span className="text-xs font-mono text-teal-400 font-semibold uppercase tracking-widest">
                                Subiendo {progress}%
                            </span>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-teal-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]" 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
