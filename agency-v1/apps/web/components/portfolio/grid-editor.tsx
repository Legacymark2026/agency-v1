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
import { Smartphone, SquareSquare, LayoutGrid } from "lucide-react";

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

type PlatformFrame = "instagram" | "tiktok";

export function GridEditor({ assets, onOrderChange, onRemove, onEdit }: GridEditorProps) {
    const [frame, setFrame] = useState<PlatformFrame>("instagram");
    // We maintain internal state so dragging feels instant, but we sync it with parent props
    const [items, setItems] = useState<MediaAsset[]>(assets);

    useEffect(() => {
        // Keep internal state synced when parent changes it
        setItems(assets.sort((a, b) => a.order - b.order));
    }, [assets]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires minimum 5px drag to activate, allows clicking buttons inside
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            const newItemsArray = arrayMove(items, oldIndex, newIndex);
            
            // Recompute the order property based on the new array indices
            const reordered = newItemsArray.map((item, index) => ({
                ...item,
                order: index
            }));

            // Optimistic UI update
            setItems(reordered);
            // Notify parent
            onOrderChange(reordered);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 p-6 rounded-2xl bg-[#0a0f1a] border border-slate-800 shadow-xl overflow-hidden relative">
            {/* Header / Controls */}
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

                {/* Frame Selector */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
                    <button
                        type="button"
                        onClick={() => setFrame("instagram")}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            frame === "instagram"
                                ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10"
                                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                        }`}
                    >
                        <SquareSquare className="w-4 h-4" />
                        IG (1:1)
                    </button>
                    <button
                        type="button"
                        onClick={() => setFrame("tiktok")}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            frame === "tiktok"
                                ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10"
                                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                        }`}
                    >
                        <Smartphone className="w-4 h-4" />
                        TikTok (9:16)
                    </button>
                </div>
            </div>

            {/* Visualizer Frame */}
            <div className="w-full mx-auto z-10 flex justify-center">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(i => i.id)}
                        strategy={rectSortingStrategy}
                    >
                        {frame === "instagram" ? (
                            /* INSTAGRAM MOCKUP */
                            <div className="w-full max-w-sm bg-black border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative text-white font-sans ring-4 ring-slate-900">
                                {/* Top Status Bar */}
                                <div className="px-6 py-3 flex justify-between items-center text-xs font-semibold">
                                    <span>20:07</span>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-4 h-3 bg-white rounded-sm" />
                                        <div className="w-4 h-3 bg-white rounded-sm" />
                                    </div>
                                </div>

                                {/* IG Header */}
                                <div className="px-4 py-2 flex items-center justify-between border-b border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 border-t-2 border-l-2 border-white rounded-sm rotate-[-45deg] translate-x-1" />
                                        <span className="font-bold text-lg flex items-center gap-1">
                                            @tu_cuenta <span className="bg-red-500 w-2 h-2 rounded-full inline-block" />
                                        </span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 border-2 border-white rounded-full flex justify-center items-center"><div className="w-2 h-2 bg-white rounded-full" /></div>
                                        <div className="flex gap-1"><div className="w-1 h-1 bg-white rounded-full" /><div className="w-1 h-1 bg-white rounded-full" /><div className="w-1 h-1 bg-white rounded-full" /></div>
                                    </div>
                                </div>

                                {/* IG Profile Info */}
                                <div className="px-4 py-4 flex gap-6 items-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 p-[2px]">
                                        <div className="w-full h-full bg-slate-900 rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                                            <span className="text-2xl">😎</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex justify-between text-center">
                                        <div><div className="font-bold text-lg">{items.length}</div><div className="text-xs text-white/70">Posts</div></div>
                                        <div><div className="font-bold text-lg">10K</div><div className="text-xs text-white/70">Followers</div></div>
                                        <div><div className="font-bold text-lg">100</div><div className="text-xs text-white/70">Following</div></div>
                                    </div>
                                </div>

                                {/* IG Bio */}
                                <div className="px-4 pb-4 text-sm space-y-1">
                                    <div className="font-bold">Tu Agencia / Marca</div>
                                    <div className="text-white/60 text-xs">Agencia de Marketing</div>
                                    <p>🚀 Elevando marcas al siguiente nivel.<br/>🎯 Resultados y Performance.</p>
                                    <a href="#" className="text-blue-400">www.tuagencia.com</a>
                                </div>

                                {/* IG Buttons */}
                                <div className="px-4 flex gap-2 pb-4">
                                    <div className="flex-1 py-1.5 bg-white/10 rounded-lg text-center font-bold text-sm">Siguiendo</div>
                                    <div className="flex-1 py-1.5 bg-white/10 rounded-lg text-center font-bold text-sm">Mensaje</div>
                                    <div className="px-3 py-1.5 bg-white/10 rounded-lg text-center font-bold text-sm">⌄</div>
                                </div>

                                {/* IG Highlights */}
                                <div className="px-4 flex gap-4 pb-4 overflow-x-auto">
                                    {[1,2,3,4].map(h => (
                                        <div key={h} className="flex flex-col items-center gap-1">
                                            <div className="w-14 h-14 rounded-full border border-white/20 p-1">
                                                <div className="w-full h-full bg-slate-800 rounded-full" />
                                            </div>
                                            <span className="text-[10px]">Destacado</span>
                                        </div>
                                    ))}
                                </div>

                                {/* IG Tabs */}
                                <div className="flex border-t border-white/10">
                                    <div className="flex-1 py-3 flex justify-center border-b-[1px] border-white"><LayoutGrid className="w-5 h-5" /></div>
                                    <div className="flex-1 py-3 flex justify-center text-white/50"><Smartphone className="w-5 h-5" /></div>
                                    <div className="flex-1 py-3 flex justify-center text-white/50"><SquareSquare className="w-5 h-5" /></div>
                                </div>

                                {/* IG GRID */}
                                <div className="grid grid-cols-3 gap-[1px] bg-black">
                                    {items.map((asset) => (
                                        <div key={asset.id} className="w-full aspect-square bg-slate-900 border-none rounded-none">
                                            <SortableGridItem
                                                asset={asset}
                                                onEdit={onEdit}
                                                onRemove={onRemove}
                                                isInstagramMock={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* DEFAULT / TIKTOK GRID */
                            <div className="grid grid-cols-3 gap-2 md:gap-4 transition-all duration-500 max-w-md">
                                {items.map((asset) => (
                                    <div 
                                        key={asset.id} 
                                        className="w-full transition-all duration-500 aspect-[9/16]"
                                    >
                                        <SortableGridItem
                                            asset={asset}
                                            onEdit={onEdit}
                                            onRemove={onRemove}
                                            isInstagramMock={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </SortableContext>
                </DndContext>
            </div>
            
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-teal-500/5 blur-[100px] pointer-events-none rounded-full" />
        </div>
    );
}
