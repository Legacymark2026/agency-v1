'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, MoveUp, MoveDown, Download } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Layer {
    id: string;
    type: 'text' | 'logo' | 'cta' | 'legal';
    content: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    bgColor: string;
    opacity: number;
    width: number;
}

const DEFAULT_LAYERS: Layer[] = [];

const LAYER_TEMPLATES = [
    { type: 'logo' as const, label: '🏷️ Logo / Marca', content: 'TU MARCA', fontSize: 24, color: '#FFFFFF', bgColor: 'transparent', x: 20, y: 20, opacity: 1, width: 200 },
    { type: 'cta' as const, label: '🎯 Call to Action', content: '¡Pruébalo Gratis!', fontSize: 18, color: '#FFFFFF', bgColor: '#7C3AED', x: 50, y: 80, opacity: 1, width: 260 },
    { type: 'text' as const, label: '📝 Texto', content: 'Tu mensaje aquí', fontSize: 16, color: '#FFFFFF', bgColor: 'transparent', x: 20, y: 60, opacity: 1, width: 300 },
    { type: 'legal' as const, label: '⚖️ Texto Legal', content: '*Aplican términos y condiciones', fontSize: 10, color: '#CCCCCC', bgColor: 'transparent', x: 10, y: 90, opacity: 0.8, width: 350 },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

interface LayerEditorProps {
    baseImageUrl?: string;
    onExport?: (dataUrl: string) => void;
}

export function LayerEditor({ baseImageUrl, onExport }: LayerEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

    const selectedLayer = layers.find((l) => l.id === selectedId);

    // ── Render canvas ───────────────────────────────────────────────────────
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background / base image
        if (baseImageUrl) {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                drawLayers(ctx, canvas.width, canvas.height);
            };
            img.src = baseImageUrl;
        } else {
            ctx.fillStyle = '#1e1e2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#2d2d3f';
            ctx.fillText('Carga una imagen base o genera con IA', 20, canvas.height / 2);
            drawLayers(ctx, canvas.width, canvas.height);
        }
    }, [baseImageUrl, layers, selectedId]);

    function drawLayers(ctx: CanvasRenderingContext2D, w: number, h: number) {
        layers.forEach((layer) => {
            const x = (layer.x / 100) * w;
            const y = (layer.y / 100) * h;
            ctx.globalAlpha = layer.opacity;
            ctx.font = `${layer.fontSize}px Inter, sans-serif`;

            if (layer.bgColor && layer.bgColor !== 'transparent') {
                const metrics = ctx.measureText(layer.content);
                const textWidth = Math.max(metrics.width + 20, layer.width);
                ctx.fillStyle = layer.bgColor;
                ctx.beginPath();
                ctx.roundRect(x - 10, y - layer.fontSize, textWidth, layer.fontSize + 16, 8);
                ctx.fill();
            }

            ctx.fillStyle = layer.color;
            ctx.fillText(layer.content, x, y);
            ctx.globalAlpha = 1;

            // Selection outline
            if (layer.id === selectedId) {
                const metrics = ctx.measureText(layer.content);
                ctx.strokeStyle = '#7C3AED';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(x - 12, y - layer.fontSize - 2, metrics.width + 24, layer.fontSize + 20);
                ctx.setLineDash([]);
            }
        });
    }

    useEffect(() => { renderCanvas(); }, [renderCanvas]);

    // ── Layer management ────────────────────────────────────────────────────
    function addLayer(template: typeof LAYER_TEMPLATES[number]) {
        const newLayer: Layer = { ...template, id: `layer-${Date.now()}` };
        setLayers((prev) => [...prev, newLayer]);
        setSelectedId(newLayer.id);
    }

    function updateLayer(id: string, updates: Partial<Layer>) {
        setLayers((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
    }

    function deleteLayer(id: string) {
        setLayers((prev) => prev.filter((l) => l.id !== id));
        setSelectedId(null);
    }

    function moveLayer(id: string, dir: 'up' | 'down') {
        setLayers((prev) => {
            const idx = prev.findIndex((l) => l.id === id);
            if (dir === 'up' && idx > 0) {
                const arr = [...prev];
                [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                return arr;
            }
            if (dir === 'down' && idx < prev.length - 1) {
                const arr = [...prev];
                [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                return arr;
            }
            return prev;
        });
    }

    // ── Export ──────────────────────────────────────────────────────────────
    function exportCanvas() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        onExport?.(dataUrl);

        // Auto-download
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `creative-overlay-${Date.now()}.png`;
        a.click();
    }

    // ── Canvas mouse events (drag) ───────────────────────────────────────────
    function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;

        // Find topmost layer under cursor
        for (let i = layers.length - 1; i >= 0; i--) {
            const l = layers[i];
            if (Math.abs(mx - l.x) < 15 && Math.abs(my - l.y) < 5) {
                setSelectedId(l.id);
                setDragging({ id: l.id, offsetX: mx - l.x, offsetY: my - l.y });
                return;
            }
        }
        setSelectedId(null);
    }

    function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
        if (!dragging) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        updateLayer(dragging.id, {
            x: Math.max(0, Math.min(95, mx - dragging.offsetX)),
            y: Math.max(2, Math.min(98, my - dragging.offsetY)),
        });
    }

    function handleCanvasMouseUp() { setDragging(null); }

    return (
        <div className="grid grid-cols-[1fr_280px] gap-4">
            {/* Canvas */}
            <div className="space-y-3">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={800}
                    className="w-full rounded-xl border border-white/10 cursor-crosshair"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                />
                <Button id="layer-editor-export" onClick={exportCanvas} className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2">
                    <Download className="w-4 h-4" /> Exportar PNG con Capas
                </Button>
            </div>

            {/* Panel */}
            <div className="space-y-4">
                {/* Add layer templates */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Añadir Capa</Label>
                    <div className="space-y-1">
                        {LAYER_TEMPLATES.map((t) => (
                            <button key={t.type} type="button" onClick={() => addLayer(t)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all flex items-center gap-2">
                                <Plus className="w-3 h-3 opacity-60" /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Layer list */}
                {layers.length > 0 && (
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Capas ({layers.length})</Label>
                        <div className="space-y-1">
                            {[...layers].reverse().map((layer) => (
                                <div key={layer.id} onClick={() => setSelectedId(layer.id)}
                                    className={cn('px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-all',
                                        selectedId === layer.id ? 'bg-violet-500/20 border border-violet-500/40 text-white' : 'bg-white/3 border border-white/8 text-gray-400 hover:bg-white/5')}>
                                    <span className="truncate">{layer.content}</span>
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }} className="hover:text-white"><MoveUp className="w-3 h-3" /></button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }} className="hover:text-white"><MoveDown className="w-3 h-3" /></button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected layer controls */}
                {selectedLayer && (
                    <div className="space-y-3 p-3 bg-white/3 rounded-xl border border-white/8">
                        <Label className="text-xs font-semibold text-gray-400">Editar Capa</Label>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Contenido</Label>
                            <Input value={selectedLayer.content} onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })}
                                className="bg-white/5 border-white/10 text-white h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Tamaño de fuente ({selectedLayer.fontSize}px)</Label>
                            <Slider value={[selectedLayer.fontSize]} min={8} max={80} step={1} onValueChange={([v]) => updateLayer(selectedLayer.id, { fontSize: v })} className="py-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Color texto</Label>
                                <input type="color" value={selectedLayer.color} onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                                    className="w-full h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Color fondo</Label>
                                <input type="color" value={selectedLayer.bgColor === 'transparent' ? '#000000' : selectedLayer.bgColor}
                                    onChange={(e) => updateLayer(selectedLayer.id, { bgColor: e.target.value })}
                                    className="w-full h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Opacidad ({Math.round(selectedLayer.opacity * 100)}%)</Label>
                            <Slider value={[selectedLayer.opacity * 100]} min={10} max={100} step={5}
                                onValueChange={([v]) => updateLayer(selectedLayer.id, { opacity: v / 100 })} className="py-2" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper for cn
function cn(...args: (string | boolean | undefined | null)[]): string {
    return args.filter(Boolean).join(' ');
}
