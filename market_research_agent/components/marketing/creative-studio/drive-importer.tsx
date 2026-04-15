'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Link, FolderOpen, Download, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    thumbnailUrl?: string;
    webViewLink: string;
    size?: string;
}

interface DriveImporterProps {
    onImport?: (urls: string[]) => void;
}

const MOCK_FILES: DriveFile[] = [
    { id: '1', name: 'hero-banner-v3.png', mimeType: 'image/png', size: '2.4 MB', webViewLink: '#' },
    { id: '2', name: 'product-shot-dark.jpg', mimeType: 'image/jpeg', size: '1.8 MB', webViewLink: '#' },
    { id: '3', name: 'brand-video-15s.mp4', mimeType: 'video/mp4', size: '18 MB', webViewLink: '#' },
    { id: '4', name: 'logo-white.png', mimeType: 'image/png', size: '345 KB', webViewLink: '#' },
];

export function DriveImporter({ onImport }: DriveImporterProps) {
    const [mode, setMode] = useState<'url' | 'drive'>('url');
    const [directUrl, setDirectUrl] = useState('');
    const [driveConnected, setDriveConnected] = useState(false);
    const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importedUrls, setImportedUrls] = useState<string[]>([]);

    async function connectDrive() {
        setLoading(true);
        setError(null);
        try {
            // In production: redirect to Google OAuth consent screen
            // window.location.href = '/api/auth/google-drive';
            // For now, simulate connection with mock files
            await new Promise((r) => setTimeout(r, 1200));
            setDriveConnected(true);
            setDriveFiles(MOCK_FILES);
        } catch (e) {
            setError('No se pudo conectar con Google Drive. Verifica la configuración OAuth.');
        } finally {
            setLoading(false);
        }
    }

    function toggleFile(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    async function importSelected() {
        setImporting(true);
        try {
            // In production: call /api/creative/import-drive with selected file IDs
            // For now, simulate URL generation
            await new Promise((r) => setTimeout(r, 800));
            const mockUrls = Array.from(selectedIds).map((id) =>
                `https://drive.google.com/uc?id=${id}&export=download`
            );
            setImportedUrls(mockUrls);
            onImport?.(mockUrls);
            setSelectedIds(new Set());
        } finally {
            setImporting(false);
        }
    }

    async function importByUrl() {
        if (!directUrl.trim()) return;
        setImporting(true);
        try {
            await new Promise((r) => setTimeout(r, 400));
            setImportedUrls((prev) => [...prev, directUrl]);
            onImport?.([directUrl]);
            setDirectUrl('');
        } finally {
            setImporting(false);
        }
    }

    return (
        <div className="space-y-5">
            {/* Mode selector */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                <button type="button" onClick={() => setMode('url')}
                    className={cn('flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                        mode === 'url' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200')}>
                    <Link className="w-3.5 h-3.5" /> URL Directa
                </button>
                <button type="button" onClick={() => setMode('drive')}
                    className={cn('flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                        mode === 'drive' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200')}>
                    <FolderOpen className="w-3.5 h-3.5" /> Google Drive
                </button>
            </div>

            {/* ── URL Mode ── */}
            {mode === 'url' && (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-400">URL del Asset (CDN, S3, etc.)</Label>
                        <div className="flex gap-2">
                            <Input value={directUrl} onChange={(e) => setDirectUrl(e.target.value)}
                                placeholder="https://cdn.ejemplo.com/banner.png"
                                onKeyDown={(e) => e.key === 'Enter' && importByUrl()}
                                className="bg-white/5 border-white/10 text-white h-10 flex-1 text-sm" />
                            <Button id="import-url-btn" onClick={importByUrl} disabled={importing || !directUrl.trim()}
                                className="bg-violet-600 hover:bg-violet-500 text-white h-10 px-4 gap-1.5 shrink-0">
                                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Importar
                            </Button>
                        </div>
                        <p className="text-[10px] text-gray-600">Soporta: PNG, JPG, WebP, MP4, MOV, GIF. HTTPS requerido.</p>
                    </div>

                    {/* Preview of last imported */}
                    {importedUrls.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500">{importedUrls.length} assets importados</p>
                            <div className="grid grid-cols-4 gap-2">
                                {importedUrls.slice(-4).map((url) => (
                                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                        <Image src={url} alt="Imported" fill className="object-cover" unoptimized onError={() => null} />
                                        <button type="button" onClick={() => setImportedUrls((prev) => prev.filter((u) => u !== url))}
                                            className="absolute top-1 right-1 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-2.5 h-2.5 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Drive Mode ── */}
            {mode === 'drive' && (
                <div className="space-y-4">
                    {!driveConnected ? (
                        <div className="text-center py-8 space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-white mx-auto flex items-center justify-center shadow-lg">
                                <FolderOpen className="w-7 h-7 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Conecta Google Drive</p>
                                <p className="text-xs text-gray-500 mt-1">Importa assets directamente desde tus carpetas de Drive</p>
                            </div>
                            <Button id="connect-drive-btn" onClick={connectDrive} disabled={loading}
                                className="bg-white text-gray-900 hover:bg-gray-100 gap-2 h-10 text-sm font-semibold">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin text-gray-600" /> : <FolderOpen className="w-4 h-4 text-yellow-500" />}
                                Conectar con Google Drive
                            </Button>
                            <p className="text-[10px] text-gray-600">Requiere GOOGLE_DRIVE_CLIENT_ID en .env</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-emerald-400 font-medium">Drive conectado</span>
                                </div>
                                <p className="text-xs text-gray-500">{driveFiles.length} archivos</p>
                            </div>

                            {error && <div className="flex items-center gap-2 text-red-400 text-xs"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}

                            <div className="space-y-1.5 max-h-56 overflow-y-auto">
                                {driveFiles.map((file) => {
                                    const isSelected = selectedIds.has(file.id);
                                    const isImg = file.mimeType.startsWith('image/');
                                    return (
                                        <button key={file.id} type="button" onClick={() => toggleFile(file.id)}
                                            className={cn('w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left',
                                                isSelected ? 'border-violet-500 bg-violet-500/10' : 'border-white/8 bg-white/2 hover:bg-white/5')}>
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 bg-white/5">
                                                {isImg ? '🖼️' : '🎬'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-white truncate">{file.name}</p>
                                                <p className="text-[10px] text-gray-500">{file.size}</p>
                                            </div>
                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedIds.size > 0 && (
                                <Button id="import-drive-btn" onClick={importSelected} disabled={importing}
                                    className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2">
                                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Importar {selectedIds.size} archivo{selectedIds.size !== 1 ? 's' : ''}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
