"use client";

import React, { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableGridItem } from "./sortable-grid-item";
import { Smartphone, SquareSquare, LayoutGrid, Facebook } from "lucide-react";

export type MediaAsset = {
    id: string;
    url: string;
    type: "image" | "video";
    order: number;
};

export interface GridEditorProps {
    assets: MediaAsset[];
    onOrderChange: (newOrder: MediaAsset[]) => void;
    onRemove: (id: string) => void;
    onEdit: (id: string) => void;
}

type PlatformFrame = "instagram" | "tiktok" | "facebook";

/* ────────────────────────────────────────────────────────── */
/*  Sub-mockups                                               */
/* ────────────────────────────────────────────────────────── */

function InstagramMockup({ items, onEdit, onRemove }: { items: MediaAsset[]; onEdit: (id: string) => void; onRemove: (id: string) => void }) {
    return (
        <div className="w-full max-w-[340px] bg-black border border-slate-700 rounded-[2.8rem] overflow-hidden shadow-2xl text-white ring-4 ring-slate-900 select-none">
            {/* Status bar */}
            <div className="px-6 pt-3 pb-1 flex justify-between items-center text-[11px] font-semibold">
                <span>9:41</span>
                <div className="flex gap-1.5 items-center">
                    <div className="w-5 h-2.5 border border-white/80 rounded-[3px] relative">
                        <div className="absolute inset-[2px] right-[4px] bg-white rounded-sm" />
                        <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-[2px] h-[5px] bg-white/60 rounded-r" />
                    </div>
                </div>
            </div>

            {/* IG nav bar */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                    {/* back chevron */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M15 18l-6-6 6-6"/></svg>
                    <span className="font-bold text-[15px]">@tu_agencia <span className="inline-block w-2 h-2 bg-red-500 rounded-full align-middle" /></span>
                </div>
                <div className="flex gap-3 text-white/80">
                    {/* bell */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    {/* dots */}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                </div>
            </div>

            {/* Profile info */}
            <div className="px-4 pt-4 flex gap-5 items-center">
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-fuchsia-600 p-[2.5px] flex-shrink-0">
                    <div className="w-full h-full bg-slate-900 rounded-full border-2 border-black flex items-center justify-center text-2xl">😎</div>
                </div>
                <div className="flex-1 flex justify-between text-center text-sm">
                    <div><div className="font-bold text-base">{items.length}</div><div className="text-[11px] text-white/60">Publicaciones</div></div>
                    <div><div className="font-bold text-base">13.6K</div><div className="text-[11px] text-white/60">Seguidores</div></div>
                    <div><div className="font-bold text-base">261</div><div className="text-[11px] text-white/60">Siguiendo</div></div>
                </div>
            </div>

            {/* Bio */}
            <div className="px-4 pt-3 pb-3 text-[12px] space-y-0.5 leading-snug">
                <div className="font-bold text-sm">Tu Agencia · Marketing</div>
                <div className="text-white/50 text-[11px]">Emprendedor</div>
                <p>🚀 Crecimiento con estrategia y data.<br />🎯 Resultados que se sienten.</p>
                <a className="text-blue-400">www.legacymarksas.com</a>
            </div>

            {/* Buttons */}
            <div className="px-4 flex gap-2 pb-3">
                <div className="flex-1 py-1 bg-white/10 rounded-lg text-center font-bold text-xs">Siguiendo</div>
                <div className="flex-1 py-1 bg-white/10 rounded-lg text-center font-bold text-xs">Mensaje</div>
                <div className="px-3 py-1 bg-white/10 rounded-lg font-bold text-xs">⌄</div>
            </div>

            {/* Highlights */}
            <div className="px-4 flex gap-3 pb-3 overflow-x-hidden">
                {["HOLA", "SEO", "IG", "ADS"].map((label) => (
                    <div key={label} className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-400 p-[2px]">
                            <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-[9px] font-bold">{label}</div>
                        </div>
                        <span className="text-[9px] text-white/60">{label}</span>
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div className="flex border-t border-white/10 border-b border-b-white/10">
                <div className="flex-1 py-2.5 flex justify-center border-b-2 border-white"><LayoutGrid className="w-5 h-5" /></div>
                <div className="flex-1 py-2.5 flex justify-center text-white/40"><Smartphone className="w-5 h-5" /></div>
                <div className="flex-1 py-2.5 flex justify-center text-white/40"><SquareSquare className="w-5 h-5" /></div>
            </div>

            {/* ─── DRAGGABLE GRID ─── */}
            <div className="grid grid-cols-3 gap-[1.5px] bg-slate-800">
                {items.map((asset) => (
                    <div key={asset.id} className="w-full aspect-square">
                        <SortableGridItem asset={asset} onEdit={onEdit} onRemove={onRemove} isInstagramMock />
                    </div>
                ))}
            </div>

            {/* Home bar */}
            <div className="bg-black py-3 flex justify-center">
                <div className="w-28 h-1 bg-white/30 rounded-full" />
            </div>
        </div>
    );
}

function TikTokMockup({ items, onEdit, onRemove }: { items: MediaAsset[]; onEdit: (id: string) => void; onRemove: (id: string) => void }) {
    return (
        <div className="w-full max-w-[320px] bg-black border border-slate-700 rounded-[2.8rem] overflow-hidden shadow-2xl text-white ring-4 ring-slate-900 select-none">
            {/* Status bar */}
            <div className="px-6 pt-3 pb-1 flex justify-between items-center text-[11px] font-semibold">
                <span>9:41</span>
                <div className="w-5 h-2.5 border border-white/80 rounded-[3px] relative">
                    <div className="absolute inset-[2px] right-[4px] bg-white rounded-sm" />
                    <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-[2px] h-[5px] bg-white/60 rounded-r" />
                </div>
            </div>

            {/* TikTok nav */}
            <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M15 18l-6-6 6-6"/></svg>
                </div>
                <span className="font-black text-base tracking-tight">TikTok</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            </div>

            {/* TikTok profile */}
            <div className="flex flex-col items-center pt-2 pb-3 gap-3">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-white overflow-hidden bg-slate-800 flex items-center justify-center text-3xl">😎</div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-red-500 rounded-full border-2 border-black flex items-center justify-center text-base font-bold">+</div>
                </div>
                <div className="text-center mt-2">
                    <div className="font-bold text-sm">@tu_agencia</div>
                    <div className="text-white/50 text-xs">Tu Agencia · Marketing</div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-center text-sm">
                    <div><div className="font-black text-base">100</div><div className="text-white/50 text-[11px]">Siguiendo</div></div>
                    <div><div className="font-black text-base">13.6K</div><div className="text-white/50 text-[11px]">Seguidores</div></div>
                    <div><div className="font-black text-base">{items.length}</div><div className="text-white/50 text-[11px]">Me gusta</div></div>
                </div>

                {/* Bio */}
                <p className="text-center text-[11px] text-white/70 px-4 leading-snug">🚀 Crecimiento con estrategia<br/>🎯 Resultados que se sienten</p>

                {/* Buttons */}
                <div className="flex gap-2 px-4 w-full">
                    <div className="flex-1 py-1.5 bg-red-500 rounded-md text-center font-bold text-xs">Seguir</div>
                    <div className="flex-1 py-1.5 border border-white/30 rounded-md text-center font-bold text-xs">Mensaje</div>
                    <div className="px-3 py-1.5 border border-white/30 rounded-md font-bold text-sm">⌄</div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-t border-white/10">
                <div className="flex-1 py-2.5 flex justify-center border-b-2 border-white text-xs font-bold">Videos</div>
                <div className="flex-1 py-2.5 flex justify-center text-white/40 text-xs font-bold">Me Gusta</div>
            </div>

            {/* ─── TikTok vertical videos grid ─── */}
            <div className="grid grid-cols-3 gap-[1.5px] bg-slate-700">
                {items.map((asset) => (
                    <div key={asset.id} className="w-full aspect-[9/16]">
                        <SortableGridItem asset={asset} onEdit={onEdit} onRemove={onRemove} isInstagramMock />
                    </div>
                ))}
            </div>

            {/* Home bar */}
            <div className="bg-black py-3 flex justify-center">
                <div className="w-28 h-1 bg-white/30 rounded-full" />
            </div>
        </div>
    );
}

function FacebookMockup({ items, onEdit, onRemove }: { items: MediaAsset[]; onEdit: (id: string) => void; onRemove: (id: string) => void }) {
    return (
        <div className="w-full max-w-[360px] bg-[#18191a] border border-slate-700 rounded-xl overflow-hidden shadow-2xl text-white ring-1 ring-slate-800 select-none">
            {/* FB nav header */}
            <div className="bg-[#242526] px-4 py-2 flex items-center justify-between border-b border-white/10">
                <span className="font-black text-2xl tracking-tight text-blue-500">f</span>
                <div className="flex-1 mx-3 bg-[#3a3b3c] rounded-full px-4 py-1.5 text-white/40 text-xs">Buscar en Facebook</div>
                <div className="w-8 h-8 bg-[#3a3b3c] rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                </div>
            </div>

            {/* Cover photo */}
            <div className="relative h-32 bg-gradient-to-br from-blue-800 via-blue-600 to-teal-400 flex items-end">
                <div className="absolute bottom-[-36px] left-4 w-20 h-20 rounded-full border-4 border-[#18191a] bg-slate-800 flex items-center justify-center text-3xl overflow-hidden">😎</div>
                <div className="absolute bottom-2 right-3 flex gap-2">
                    <div className="px-3 py-1 bg-[#3a3b3c] rounded-lg text-xs font-bold">Editar perfil</div>
                </div>
            </div>

            {/* Profile info */}
            <div className="pt-12 px-4 pb-2 space-y-1">
                <div className="font-black text-lg">Tu Agencia · Marketing</div>
                <div className="text-white/50 text-xs">Emprendedor · Girón, Santander</div>
                <div className="flex gap-2 pt-2 flex-wrap">
                    {["Siguiendo", "+ Amigos", "Mensaje", "···"].map((btn, i) => (
                        <div key={btn} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${i === 0 ? "bg-blue-600" : "bg-[#3a3b3c]"}`}>{btn}</div>
                    ))}
                </div>
            </div>

            {/* Friends bar */}
            <div className="px-4 py-2 flex items-center gap-1">
                <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-blue-500 border-2 border-[#18191a] text-[9px] flex items-center justify-center">😊</div>
                    ))}
                </div>
                <span className="text-[11px] text-white/50 ml-2">13.6K seguidores</span>
            </div>

            {/* FB tabs */}
            <div className="flex border-t border-white/10 text-white/60 text-xs font-bold overflow-x-auto">
                {["Publicaciones", "Acerca de", "Amigos", "Fotos", "Videos"].map((tab, i) => (
                    <div key={tab} className={`flex-shrink-0 px-4 py-2.5 ${i === 3 ? "border-b-2 border-blue-500 text-blue-400" : ""}`}>{tab}</div>
                ))}
            </div>

            {/* Section label */}
            <div className="px-4 py-2 flex justify-between items-center border-t border-white/10 bg-[#242526]">
                <span className="font-bold text-sm">Fotos</span>
                <span className="text-blue-400 text-xs">Ver todo</span>
            </div>

            {/* ─── Facebook photo grid (4 columns) ─── */}
            <div className="grid grid-cols-4 gap-[1.5px] bg-slate-700">
                {items.map((asset) => (
                    <div key={asset.id} className="w-full aspect-square">
                        <SortableGridItem asset={asset} onEdit={onEdit} onRemove={onRemove} isInstagramMock />
                    </div>
                ))}
            </div>

            {/* Add post bar */}
            <div className="px-4 py-3 flex items-center gap-3 border-t border-white/10 bg-[#242526]">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-base">😎</div>
                <div className="flex-1 bg-[#3a3b3c] rounded-full px-4 py-1.5 text-white/40 text-xs">¿Qué estás pensando?</div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────── */
/*  Main GridEditor                                           */
/* ────────────────────────────────────────────────────────── */

export function GridEditor({ assets, onOrderChange, onRemove, onEdit }: GridEditorProps) {
    const [frame, setFrame] = useState<PlatformFrame>("instagram");
    const [items, setItems] = useState<MediaAsset[]>(assets);

    useEffect(() => {
        setItems([...assets].sort((a, b) => a.order - b.order));
    }, [assets]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({ ...item, order: index }));
            setItems(reordered);
            onOrderChange(reordered);
        }
    };

    const platforms: { key: PlatformFrame; label: string; icon: React.ReactNode }[] = [
        { key: "instagram", label: "IG (1:1)", icon: <SquareSquare className="w-4 h-4" /> },
        { key: "tiktok",    label: "TikTok (9:16)", icon: <Smartphone className="w-4 h-4" /> },
        { key: "facebook",  label: "Facebook",   icon: <Facebook className="w-4 h-4" /> },
    ];

    return (
        <div className="w-full flex flex-col gap-6 p-6 rounded-2xl bg-[#0a0f1a] border border-slate-800 shadow-xl overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
                <div className="flex items-center gap-3 text-slate-200">
                    <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                        <LayoutGrid className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg font-mono tracking-tight">Grid Visualizer</h3>
                        <p className="text-xs text-slate-500">Arrastra para reordenar tu contenido.</p>
                    </div>
                </div>

                {/* Platform selector */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                    {platforms.map(({ key, label, icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFrame(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                frame === key
                                    ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10"
                                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                            }`}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mockup area */}
            <div className="w-full mx-auto z-10 flex justify-center">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                        {frame === "instagram" && <InstagramMockup items={items} onEdit={onEdit} onRemove={onRemove} />}
                        {frame === "tiktok"    && <TikTokMockup    items={items} onEdit={onEdit} onRemove={onRemove} />}
                        {frame === "facebook"  && <FacebookMockup  items={items} onEdit={onEdit} onRemove={onRemove} />}
                    </SortableContext>
                </DndContext>
            </div>

            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-teal-500/5 blur-[100px] pointer-events-none rounded-full" />
        </div>
    );
}
