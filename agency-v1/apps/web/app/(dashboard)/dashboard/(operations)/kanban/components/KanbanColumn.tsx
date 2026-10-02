"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { MoreHorizontal, Plus } from "lucide-react";

export function KanbanColumn({ column, tasks }: { column: any; tasks: any[] }) {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div className="flex flex-col flex-shrink-0 w-80 bg-slate-900/50 rounded-xl border border-slate-800/60 overflow-hidden h-full">
            {/* Header Columna */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-200">{column.title}</h3>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        {tasks.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors">
                        <Plus className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Contenedor Droppable */}
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto no-scrollbar flex flex-col gap-3 min-h-[150px]">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <KanbanCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
