'use client';

import { useState, useRef } from 'react';
import { Plus, X, GripVertical, ImageIcon, Upload, Loader2, FileText, Video, Link as LinkIcon, Pencil, AlertTriangle } from 'lucide-react';
import { SlideOver, ConfirmDialog } from '@/components/ui/slide-over';
import { GridEditor, MediaAsset } from '@/components/portfolio/grid-editor';

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
    maxImages = 20,
}: GalleryManagerProps) {
    const [newUrl, setNewUrl] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit SlideOver state
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<GalleryImage>>({});

    // Confirm delete state
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const openEdit = (index: number) => {
        setEditIndex(index);
        setEditForm({ ...images[index] });
    };

    const closeEdit = () => {
        setEditIndex(null);
        setEditForm({});
    };

    const saveEdit = () => {
        if (editIndex === null) return;
        const updated = [...images];
        updated[editIndex] = { ...updated[editIndex], ...editForm };
        onChange(updated);
        closeEdit();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (images.length + files.length > maxImages) {
            alert(`Solo puedes subir hasta ${maxImages} archivos.`);
            return;
        }

        setUploading(true);
        const newAssets: GalleryImage[] = [];
        const errors: string[] = [];

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

                        const watermark = new window.Image();
                        watermark.onload = () => {
                            const wmWidth = Math.max(120, width * 0.15);
                            const wmHeight = (watermark.height / watermark.width) * wmWidth;
                            const padding = Math.max(20, width * 0.03);
                            const x = width - wmWidth - padding;
                            const y = height - wmHeight - padding;
                            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                            ctx.shadowBlur = 10;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;
                            ctx.globalAlpha = 0.65;
                            ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
                            ctx.globalAlpha = 1.0;
                            ctx.shadowColor = "transparent";
                            canvas.toBlob((blob) => {
                                if (!blob) return resolve(file);
                                const finalFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                                const newFile = new File([blob], finalFileName, { type: 'image/webp', lastModified: Date.now() });
                                resolve(newFile.size < file.size || width > 1000 ? newFile : file);
                            }, 'image/webp', 0.85);
                        };
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
                const file = await compressImage(rawFile);
                const response = await fetch(`/api/upload?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}&size=${file.size}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: file,
                });

                if (!response.ok) throw new Error(await response.text());

                const data = await response.json();
                if (data.success) {
                    newAssets.push({ url: data.url, type: data.type, name: data.name, mimeType: data.mimeType, size: data.size, alt: '', caption: '' });
                } else {
                    throw new Error(data.error);
                }
            } catch (error: any) {
                errors.push(`${rawFile.name}: ${error.message || 'Error de red'}`);
            }
        }

        if (newAssets.length > 0) onChange([...images, ...newAssets]);
        if (errors.length > 0) alert("Algunos archivos no se pudieron subir:\n" + errors.join('\n'));

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addExternalUrl = () => {
        if (!newUrl.trim() || images.length >= maxImages) return;
        try {
            new URL(newUrl);
            let type: 'external' | 'image' | 'video' = 'external';
            if (newUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) type = 'image';
            if (newUrl.match(/\.(mp4|webm|ogg)$/i)) type = 'video';
            if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be') || newUrl.includes('vimeo.com')) type = 'video';
            onChange([...images, { url: newUrl.trim(), type, name: 'Enlace Externo', alt: '', caption: '' }]);
            setNewUrl('');
        } catch {
            alert('URL no válida');
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onChange(newImages);
    };

    const handleDragStart = (index: number) => setDraggedIndex(index);

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const newImages = [...images];
        const [removed] = newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, removed);
        onChange(newImages);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => setDraggedIndex(null);

    const renderPreview = (image: GalleryImage) => {
        if (image.type === 'video') {
            return <div className="w-full h-full flex items-center justify-center bg-teal-900/20 rounded-lg"><Video className="h-7 w-7 text-teal-500 opacity-80" /></div>;
        }
        if (image.type === 'document') {
            return <div className="w-full h-full flex items-center justify-center bg-blue-900/20 rounded-lg"><FileText className="h-7 w-7 text-blue-500 opacity-80" /></div>;
        }
        if (image.type === 'external' && !image.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
            return <div className="w-full h-full flex items-center justify-center bg-purple-900/20 rounded-lg"><LinkIcon className="h-7 w-7 text-purple-500 opacity-80" /></div>;
        }
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={image.alt || "Media"} className="w-full h-full object-cover rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        );
    };

    const editingImage = editIndex !== null ? images[editIndex] : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-bold text-slate-200">Biblioteca de Media</label>
                    <p className="text-xs text-slate-500 mt-0.5">Imágenes, videos y documentos del proyecto</p>
                </div>
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-teal-500 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                    {images.length}/{maxImages}
                </span>
            </div>

            {/* Upload Zone + URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-2xl p-8 cursor-pointer hover:border-teal-500 hover:bg-teal-900/10 transition-all group"
                >
                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload}
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf" />
                    {uploading
                        ? <Loader2 className="h-8 w-8 text-teal-400 animate-spin mb-3" />
                        : <Upload className="h-8 w-8 text-slate-500 group-hover:text-teal-400 transition-colors mb-3" />}
                    <span className="text-sm font-bold text-slate-300 group-hover:text-teal-300">
                        {uploading ? 'Procesando...' : 'Subir archivos'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">JPG, PNG, WebP, MP4, PDF</span>
                </div>

                <div className="flex flex-col justify-center border border-slate-800 bg-slate-900/30 rounded-2xl p-6 space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Añadir URL externa</label>
                    <div className="flex gap-2">
                        <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://youtube.com/..."
                            className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 placeholder:text-slate-600"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExternalUrl(); } }} />
                        <button type="button" onClick={addExternalUrl}
                            disabled={!newUrl.trim() || images.length >= maxImages}
                            className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 disabled:opacity-40 transition-colors">
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Visualizer */}
            {images.length > 0 && (
                <GridEditor
                    assets={images.map((img, i) => ({
                        id: img.url + '-' + i,
                        url: img.url,
                        type: (img.type === 'video' || img.url.includes('youtube') || img.url.includes('vimeo')) ? 'video' : 'image',
                        order: i,
                    }))}
                    onOrderChange={(newOrder) => {
                        const remapped: GalleryImage[] = newOrder.map(asset =>
                            images.find(img => img.url === asset.url) || images[0]
                        );
                        onChange(Array.from(new Map(remapped.map(img => [img.url, img])).values()));
                    }}
                    onRemove={(id) => {
                        const index = images.findIndex((img, i) => (img.url + '-' + i) === id);
                        if (index > -1) setDeleteIndex(index);
                    }}
                    onEdit={(id) => {
                        const index = images.findIndex((img, i) => (img.url + '-' + i) === id);
                        if (index > -1) openEdit(index);
                    }}
                />
            )}

            {/* Asset List */}
            {images.length > 0 && (
                <div className="space-y-2 border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Archivos ({images.length})</h4>
                    </div>
                    {images.map((image, index) => (
                        <div key={index} draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border transition-all ${draggedIndex === index ? 'opacity-50 scale-[0.98] border-teal-500/50' : 'border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="cursor-grab text-slate-600 hover:text-teal-400 active:cursor-grabbing flex-shrink-0">
                                <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="relative w-12 h-12 bg-slate-950 rounded-lg flex-shrink-0 border border-slate-800 overflow-hidden">
                                {renderPreview(image)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{image.name || 'Sin nombre'}</p>
                                <p className="text-[10px] text-slate-500 truncate">{image.url}</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                                <button type="button" onClick={() => openEdit(index)}
                                    className="p-2 text-slate-500 hover:text-teal-400 hover:bg-slate-900 rounded-lg transition-colors" title="Editar">
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={() => setDeleteIndex(index)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors" title="Eliminar">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {images.length === 0 && (
                <div className="text-center py-14 border border-slate-800 border-dashed rounded-2xl bg-slate-900/20">
                    <ImageIcon className="h-10 w-10 text-slate-700 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium text-slate-400">Sin archivos aún</p>
                    <p className="text-xs text-slate-600 mt-1">Sube imágenes o añade enlaces externos</p>
                </div>
            )}

            {/* ─── Edit SlideOver ─── */}
            <SlideOver
                open={editIndex !== null}
                onClose={closeEdit}
                title="Editar archivo"
                subtitle={editingImage?.name || editingImage?.url?.split('/').pop() || ''}
                width="md"
            >
                {editingImage && (
                    <div className="space-y-5">
                        {/* Preview */}
                        <div className="w-full aspect-video bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
                            {renderPreview(editingImage)}
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre del archivo</label>
                                <input type="text" value={editForm.name || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Hero Banner"
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 placeholder:text-slate-600" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Texto Alt (SEO)</label>
                                <input type="text" value={editForm.alt || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, alt: e.target.value }))}
                                    placeholder="Descripción para motores de búsqueda"
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 placeholder:text-slate-600" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Caption visible</label>
                                <textarea value={editForm.caption || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                                    placeholder="Texto que aparece bajo la imagen en el portafolio"
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 placeholder:text-slate-600 resize-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">URL del archivo</label>
                                <input type="text" value={editForm.url || ''} readOnly
                                    className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-500 cursor-default" />
                            </div>

                            {/* File info */}
                            {editingImage.size && (
                                <div className="flex gap-3">
                                    <span className="px-3 py-1.5 bg-slate-800 rounded-lg text-[11px] text-slate-400 font-mono uppercase">{editingImage.type || 'file'}</span>
                                    <span className="px-3 py-1.5 bg-slate-800 rounded-lg text-[11px] text-slate-400 font-mono">{(editingImage.size / 1024).toFixed(0)} KB</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={closeEdit}
                                className="flex-1 py-3 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors">
                                Cancelar
                            </button>
                            <button type="button" onClick={saveEdit}
                                className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-sm font-bold transition-colors">
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                )}
            </SlideOver>

            {/* ─── Delete Confirm ─── */}
            <ConfirmDialog
                open={deleteIndex !== null}
                onCancel={() => setDeleteIndex(null)}
                onConfirm={() => {
                    if (deleteIndex !== null) removeImage(deleteIndex);
                    setDeleteIndex(null);
                }}
                title="Eliminar archivo"
                message={`¿Eliminar "${images[deleteIndex ?? 0]?.name || 'este archivo'}" de la galería? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                danger
            />
        </div>
    );
}
