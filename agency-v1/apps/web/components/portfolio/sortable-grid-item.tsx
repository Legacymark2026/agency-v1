"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Pencil, GripVertical } from "lucide-react";
import Image from "next/image";
import { MediaAsset } from "./grid-editor"; // We will define this in grid-editor.tsx

interface SortableGridItemProps {
    asset: MediaAsset;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
}

export function SortableGridItem({ asset, onEdit, onRemove }: SortableGridItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: asset.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative w-full h-full group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 transition-all ${
                isDragging ? "shadow-2xl shadow-teal-500/20 ring-2 ring-teal-500 scale-105 opacity-90 z-50" : "hover:border-slate-700"
            }`}
        >
            {/* Media Content */}
            <div className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center">
                {asset.url ? (
                    asset.type === "video" ? (
                        <video 
                            src={asset.url} 
                            className="w-full h-full object-cover pointer-events-none"
                            muted 
                            loop 
                            playsInline
                            autoPlay
                        />
                    ) : (
                        <Image 
                            src={asset.url} 
                            alt={`Media asset ${asset.id}`} 
                            fill 
                            className="object-cover pointer-events-none"
                            unoptimized
                        />
                    )
                ) : (
                    <span className="text-slate-600 text-sm font-mono tracking-wider">Vacío</span>
                )}
            </div>

            {/* Hover Overlay Interactions */}
            <div className={`absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 ${isDragging ? "hidden" : ""}`}>
                {/* Top: Drag Handle */}
                <div 
                    {...attributes} 
                    {...listeners}
                    className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 rounded-lg transition-colors"
                    title="Arrastrar para reordenar"
                >
                    <GripVertical className="w-5 h-5 text-slate-300" />
                </div>

                {/* Bottom: Actions */}
                <div className="flex justify-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(asset.id);
                        }}
                        className="p-2 bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow-lg border border-white/5 outline-none"
                        title="Cambiar imagen"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(asset.id);
                        }}
                        className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow-lg border border-white/5 outline-none"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Position Indicator */}
            <div className={`absolute top-2 left-2 w-6 h-6 rounded-md bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-xs font-mono font-bold ${isDragging ? "text-teal-400" : "text-white"}`}>
                {asset.order + 1}
            </div>
        </div>
    );
}
