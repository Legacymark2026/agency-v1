"use client";

import { useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

// Columnas base predefinidas
const COLUMNS = [
    { id: "TODO", title: "Para Hacer" },
    { id: "IN_PROGRESS", title: "En Proceso" },
    { id: "REVIEW", title: "Revisión / QA" },
    { id: "DONE", title: "Completado" },
];

export default function KanbanBoard({ project, fetchProjects }: { project: any; fetchProjects: () => void }) {
    const [activeId, setActiveId] = useState<string | null>(null);

    // Agrupamos las tareas (KanbanTask) en columnas
    const [tasks, setTasks] = useState(project.kanbanTasks || []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the columns
        const activeContainer = tasks.find((t: any) => t.id === activeId)?.status;
        const overContainer = COLUMNS.find(c => c.id === overId)?.id || tasks.find((t: any) => t.id === overId)?.status;

        if (!activeContainer || !overContainer) return;

        // Actualizar UI optimista
        if (activeContainer !== overContainer) {
             setTasks((prev: any[]) => prev.map(t => t.id === activeId ? { ...t, status: overContainer } : t));
             
             // Aquí se haría el fetch PUT a la API /api/admin/kanban/tasks
             try {
                 await fetch("/api/admin/kanban/tasks", {
                     method: "PUT",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ id: activeId, status: overContainer })
                 });
             } catch (e) {
                 console.error("Failed to update status", e);
             }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 h-full w-full overflow-x-auto pb-4 no-scrollbar">
                {COLUMNS.map((col) => (
                    <KanbanColumn 
                        key={col.id} 
                        column={col} 
                        tasks={tasks.filter((t: any) => t.status === col.id)} 
                    />
                ))}
            </div>

            <DragOverlay>
                {activeId ? (
                    <KanbanCard task={tasks.find((t: any) => t.id === activeId)} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
