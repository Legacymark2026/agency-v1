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

            {/* Grid Area */}
            <div className="w-full max-w-3xl mx-auto z-10">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(i => i.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div 
                            className={`grid grid-cols-3 gap-2 md:gap-4 transition-all duration-500 mx-auto
                                ${frame === "instagram" ? "max-w-2xl" : "max-w-md"}`}
                        >
                            {items.map((asset) => (
                                <div 
                                    key={asset.id} 
                                    className={`w-full transition-all duration-500 ${
                                        frame === "instagram" ? "aspect-square" : "aspect-[9/16]"
                                    }`}
                                >
                                    <SortableGridItem
                                        asset={asset}
                                        onEdit={onEdit}
                                        onRemove={onRemove}
                                    />
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
            
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-teal-500/5 blur-[100px] pointer-events-none rounded-full" />
        </div>
    );
}
