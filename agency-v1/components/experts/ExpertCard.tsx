"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Eye, EyeOff, Copy } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Expert } from "@/types/experts";

interface ExpertCardProps {
    expert: Expert;
    onEdit: (expert: Expert) => void;
    onDelete: (id: string) => void;
    onToggleVisibility: (id: string, currentStatus: boolean) => void;
    onDuplicate: (expert: Expert) => void;
}

export function ExpertCard({ expert, onEdit, onDelete, onToggleVisibility, onDuplicate }: ExpertCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: expert.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.95 : 1,
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div
                ref={setNodeRef}
                style={style}
                className={cn(
                    "group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 mb-3 bg-slate-900/40 rounded-xl border border-slate-800/80 transition-all duration-300",
                    isDragging
                        ? "shadow-2xl ring-2 ring-teal-500/30 border-teal-500/50 scale-[1.02] cursor-grabbing backdrop-blur-md z-50 bg-slate-900/80"
                        : "shadow-sm hover:shadow-lg hover:border-teal-500/50 hover:-translate-y-0.5",
                    !expert.isVisible && "bg-slate-950/50 border-slate-800/40"
                )}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-teal-400 p-2 rounded-xl hover:bg-teal-500/10 transition-colors hidden sm:block"
                >
                    <GripVertical size={20} />
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                    {/* Active Pulse & Avatar Container */}
                    <div className="relative shrink-0">
                        {/* Status Pulse Dot */}
                        <div className="absolute -top-1 -right-1 z-10">
                            <span className="relative flex h-3 w-3">
                                {expert.isVisible && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                )}
                                <span className={cn(
                                    "relative inline-flex rounded-full h-3 w-3 border-2 border-white",
                                    expert.isVisible ? "bg-teal-500" : "bg-gray-400"
                                )}></span>
                            </span>
                        </div>

                        {/* Avatar */}
                        <div className={cn(
                            "relative h-14 w-14 rounded-full overflow-hidden border-2 shrink-0 transition-colors shadow-sm",
                            expert.isVisible ? "border-teal-500/20" : "border-slate-800 grayscale opacity-70"
                        )}>
                            {expert.imageUrl ? (
                                <Image
                                    src={expert.imageUrl}
                                    alt={expert.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="56px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400 font-bold text-lg border border-slate-800 rounded-full">
                                    {expert.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className={cn("flex-1 min-w-0 flex flex-col justify-center", !expert.isVisible && "opacity-60")}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-slate-100 truncate text-base group-hover:text-teal-400 transition-colors">{expert.name}</h3>

                            {/* Tech/Military Badge Style */}
                            {expert.badgeId && (
                                <Badge variant="outline" className="font-mono text-[10px] tracking-widest uppercase bg-slate-900 text-white border-transparent px-1.5 py-0">
                                    {expert.badgeId}
                                </Badge>
                            )}

                            {!expert.isVisible && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-800/50 text-slate-400 border-slate-700">
                                    Oculto
                                </Badge>
                            )}
                        </div>

                        <p className="text-sm font-medium text-slate-400 truncate">{expert.role}</p>

                        {/* Skills Mini-Pills */}
                        {expert.skills && expert.skills.length > 0 && (
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                {expert.skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap font-mono tracking-tight">
                                        {skill}
                                    </span>
                                ))}
                                {expert.skills.length > 3 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-sm text-slate-500 font-medium font-mono">
                                        +{expert.skills.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto w-full sm:w-auto justify-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-800">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleVisibility(expert.id, expert.isVisible)}
                                className={cn(
                                    "h-9 w-9 xl:h-10 xl:w-10 rounded-full transition-all border border-transparent hover:border-slate-700",
                                    expert.isVisible
                                        ? "text-teal-500 hover:bg-teal-500/10 hover:text-teal-400"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                )}
                            >
                                {expert.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{expert.isVisible ? "Ocultar perfil" : "Hacer público"}</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDuplicate(expert)}
                                className="h-9 w-9 xl:h-10 xl:w-10 text-slate-500 hover:text-purple-400 border border-transparent hover:border-slate-700 hover:bg-purple-500/10 rounded-full transition-colors"
                            >
                                <Copy size={16} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicar perfil</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(expert)}
                                className="h-9 w-9 xl:h-10 xl:w-10 text-slate-500 hover:text-blue-400 border border-transparent hover:border-slate-700 hover:bg-blue-500/10 rounded-full transition-colors"
                            >
                                <Pencil size={16} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar información</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(expert.id)}
                                className="h-9 w-9 xl:h-10 xl:w-10 text-slate-500 hover:text-red-400 border border-transparent hover:border-slate-700 hover:bg-red-500/10 rounded-full transition-colors"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar permanentemente</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    );
}
