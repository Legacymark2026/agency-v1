"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function KanbanCard({ task, isOverlay }: { task: any; isOverlay?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task?.id });

    if (!task) return null;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const priorityColors: Record<string, string> = {
        LOW: "bg-slate-800 text-slate-300",
        MEDIUM: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        URGENT: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative bg-slate-950 border border-slate-800 p-3.5 rounded-xl shadow-sm hover:border-teal-500/50 transition-colors flex flex-col gap-3 cursor-grab active:cursor-grabbing",
                isOverlay && "rotate-2 scale-105 shadow-xl border-teal-500 z-50",
                isDragging && "border-dashed"
            )}
            {...attributes}
            {...listeners}
        >
            {/* Grip icon */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-slate-600" />
            </div>

            {/* Labels / Priority */}
            <div className="flex items-center justify-between pl-3">
                <span className={cn("text-xs uppercase font-bold px-2 py-0.5 rounded-md border", priorityColors[task.priority || "MEDIUM"])}>
                    {task.priority || "MED"}
                </span>
                
                {task.estimatedHours && (
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimatedHours}h</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-slate-200 leading-snug pl-3">
                {task.title}
            </h4>
            
            {/* Footer / Assignee */}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/50 pl-3">
                <span className="text-xs text-slate-500">#{task.id.slice(0, 4)}</span>
                
                <div className="flex items-center gap-1.5">
                    {task.assignee ? (
                        <div className="h-6 w-6 rounded-full bg-slate-800 overflow-hidden border border-slate-700" title={task.assignee.name}>
                            {task.assignee.image ? (
                                <img src={task.assignee.image} alt="assignee" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs text-white">
                                    {task.assignee.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-6 w-6 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700 border-dashed text-slate-500" title="Sin asignar">
                            <User className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
