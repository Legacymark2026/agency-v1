'use client';

import { useState, useRef } from 'react';
import { Plus, X, GripVertical, ImageIcon, Upload, Loader2, FileText, Video, Link as LinkIcon } from 'lucide-react';

export interface GalleryImage {
    url: string;
    type?: 'image' | 'video' | 'document' | 'external';
    name?: string;
    alt?: string;
    caption?: string;
    mimeType?: string;
    size?: number;
}

interface GalleryManagerProps {
    images: GalleryImage[];
    onChange: (images: GalleryImage[]) => void;
    maxImages?: number;
}

export function GalleryManager({
    images,
    onChange,
    maxImages = 20
}: GalleryManagerProps) {
    const [newUrl, setNewUrl] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (images.length + files.length > maxImages) {
            alert(`You can only upload up to ${maxImages} media assets.`);
            return;
        }

        setUploading(true);
        const newAssets: GalleryImage[] = [];
        const errors: string[] = [];

        // Compresor de imágenes en el cliente (bypasses Nginx size limits and speeds up dramatically)
        const compressImage = async (file: File): Promise<File> => {
            if (!file.type.startsWith('image/')) return file;
            if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

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
                        if (!ctx) return resolve(file);

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
                                if (!blob) return resolve(file);
                                const finalFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                                const newFile = new File([blob], finalFileName, {
                                    type: 'image/webp',
                                    lastModified: Date.now(),
                                });
                                resolve(newFile.size < file.size || width > 1000 ? newFile : file);
                            }, 'image/webp', 0.85);
                        };
                        
                        // Fallback de seguridad si no carga el logo
                        watermark.onerror = () => {
                            canvas.toBlob((blob) => {
                                if (!blob) return resolve(file);
                                const finalFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                                const newFile = new File([blob], finalFileName, { type: 'image/webp', lastModified: Date.now() });
                                resolve(newFile.size < file.size ? newFile : file);
                            }, 'image/webp', 0.85);
                        };
                        
                        watermark.src = '/logo.png';
                    };
                    img.onerror = () => resolve(file);
                    if (event.target?.result) img.src = event.target.result as string;
                };
                reader.onerror = () => resolve(file);
                reader.readAsDataURL(file);
            });
        };

        for (const rawFile of files) {
            try {
                // Compress images to WebP ~300KB to bypass network bottlenecks
                const file = await compressImage(rawFile);
                
                const response = await fetch(`/api/upload?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}&size=${file.size}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: file,
                });

                if (!response.ok) {
                    const errStr = await response.text();
                    throw new Error(errStr);
                }

                const data = await response.json();

                if (data.success) {
                    newAssets.push({
                        url: data.url,
                        type: data.type,
                        name: data.name,
                        mimeType: data.mimeType,
                        size: data.size,
                        alt: '',
                        caption: ''
                    });
                } else {
                    throw new Error(data.error);
                }
            } catch (error: any) {
                console.error("Error subiendo", rawFile.name, error);
                errors.push(`${rawFile.name}: ${error.message || 'Fallo de red'}`);
            }
        }

        if (newAssets.length > 0) {
            onChange([...images, ...newAssets]);
        }
        
        if (errors.length > 0) {
            alert("Algunos archivos no se pudieron subir:\n" + errors.join('\n'));
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addExternalUrl = () => {
        if (!newUrl.trim() || images.length >= maxImages) return;

        try {
            new URL(newUrl); // Validate URL
            let type: 'external' | 'image' | 'video' = 'external';
            if (newUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) type = 'image';
            if (newUrl.match(/\.(mp4|webm|ogg)$/i)) type = 'video';
            if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be') || newUrl.includes('vimeo.com')) type = 'video';

            onChange([...images, { url: newUrl.trim(), type, name: 'External Link', alt: '', caption: '' }]);
            setNewUrl('');
        } catch {
            alert('Invalid URL format');
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onChange(newImages);
    };

    const updateImage = (index: number, updates: Partial<GalleryImage>) => {
        const newImages = [...images];
        newImages[index] = { ...newImages[index], ...updates };
        onChange(newImages);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newImages = [...images];
        const [removed] = newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, removed);
        onChange(newImages);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const renderPreview = (image: GalleryImage) => {
        if (image.type === 'video') {
            return (
                <div className="w-full h-full flex items-center justify-center bg-teal-900/20 text-teal-500 rounded-lg">
                    <Video className="h-8 w-8 text-teal-500 opacity-80" />
                </div>
            );
        }
        if (image.type === 'document') {
            return (
                <div className="w-full h-full flex items-center justify-center bg-blue-900/20 text-blue-500 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
            );
        }
        if (image.type === 'external' && !image.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
             return (
                <div className="w-full h-full flex items-center justify-center bg-purple-900/20 text-purple-500 rounded-lg">
                    <LinkIcon className="h-8 w-8 text-purple-500 opacity-80" />
                </div>
            );
        }

        // Image fallback
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={image.url.replace('/uploads/', '/api/serve/')}
                alt={image.alt || `Media asset`}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-slate-200">
                        Project Media Assets
                    </label>
                    <p className="text-xs text-slate-400 mt-1">Upload images, videos (mp4), and documents (pdf).</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold tracking-widest uppercase text-teal-500">
                        {images.length}/{maxImages} Assets
                    </span>
                </div>
            </div>

            {/* Upload Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-6 cursor-pointer hover:border-teal-500 hover:bg-teal-900/10 transition-all group"
                >
                    <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf"
                    />
                    {uploading ? (
                        <Loader2 className="h-8 w-8 text-teal-400 animate-spin mb-3" />
                    ) : (
                        <Upload className="h-8 w-8 text-slate-500 group-hover:text-teal-400 transition-colors mb-3" />
                    )}
                    <span className="text-sm font-medium text-slate-300 group-hover:text-teal-300">
                        {uploading ? 'Processing files...' : 'Click to Upload Files'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">Images, MP4, PDF</span>
                </div>

                {/* Add external new image URL */}
                <div className="flex flex-col items-center justify-center border border-slate-800 bg-slate-900/50 rounded-xl p-6">
                    <div className="w-full space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or Add External Link</label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="https://youtube.com/..."
                                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-teal-500 text-sm text-slate-200"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addExternalUrl();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={addExternalUrl}
                                disabled={!newUrl.trim() || images.length >= maxImages}
                                className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 flex items-center justify-center transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset List */}
            {images.length > 0 ? (
                <div className="space-y-3 mt-6">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex flex-col sm:flex-row items-start gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-800 transition-all ${draggedIndex === index ? 'opacity-50 scale-[0.98]' : 'hover:border-slate-600'}`}
                        >
                            {/* Drag handle & Preview */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="cursor-grab text-slate-500 hover:text-teal-400 active:cursor-grabbing p-1">
                                    <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="relative w-24 h-24 bg-slate-950 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-800 shadow-sm overflow-hidden">
                                    {renderPreview(image)}
                                    {image.type && (
                                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] font-mono font-bold uppercase tracking-widest text-white">
                                            {image.type}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image details */}
                            <div className="flex-1 space-y-3 w-full">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="text"
                                            value={image.name || ''}
                                            onChange={(e) => updateImage(index, { name: e.target.value })}
                                            placeholder="Asset Name (e.g. Hero Video)"
                                            className="w-full px-3 py-1.5 text-sm bg-slate-950 border border-slate-700 rounded-md focus:outline-none focus:border-teal-500 text-teal-100 placeholder:text-slate-600 font-medium"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={image.url}
                                            className="w-full px-3 py-1.5 text-xs bg-slate-900/50 border border-slate-800 rounded-md text-slate-500 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors flex-shrink-0"
                                        title="Remove asset"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={image.alt || ''}
                                        onChange={(e) => updateImage(index, { alt: e.target.value })}
                                        placeholder="Alt text (for SEO & Accessbility)"
                                        className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md focus:outline-none focus:border-teal-500 text-slate-300 placeholder:text-slate-600"
                                    />
                                    <input
                                        type="text"
                                        value={image.caption || ''}
                                        onChange={(e) => updateImage(index, { caption: e.target.value })}
                                        placeholder="Display Caption (optional)"
                                        className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md focus:outline-none focus:border-teal-500 text-slate-300 placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border border-slate-800 border-dashed rounded-xl bg-slate-900/20">
                    <ImageIcon className="h-12 w-12 text-slate-700 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium text-slate-400">No media assets in this project</p>
                    <p className="text-xs text-slate-600 mt-1">Upload files or link external media to build your gallery</p>
                </div>
            )}
        </div>
    );
}

