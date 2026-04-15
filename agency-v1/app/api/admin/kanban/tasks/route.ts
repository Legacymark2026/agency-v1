import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Crear un nuevo ticket (KanbanTask)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, description, status, priority, projectId, assigneeId, dueDate, estimatedHours } = body;

        // Validar que el proyecto pertenece a la compañía del usuario activo
        const project = await prisma.kanbanProject.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Determinar el 'order' basado en tareas existentes en esa columna (status)
        const lastTask = await prisma.kanbanTask.findFirst({
            where: { projectId, status },
            orderBy: { order: 'desc' }
        });
        const order = lastTask ? lastTask.order + 10000 : 10000;

        const newTask = await prisma.kanbanTask.create({
            data: {
                title,
                description,
                status: status || "TODO",
                priority: priority || "MEDIUM",
                order,
                projectId,
                assigneeId: assigneeId || null,
                creatorId: session.user.id,
                dueDate: dueDate ? new Date(dueDate) : null,
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
            },
            include: {
                assignee: { select: { id: true, name: true, image: true } }
            }
        });

        return NextResponse.json(newTask);
    } catch (error: any) {
        console.error("KANBAN_TASK_POST_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Actualizar un ticket (Mover de columna, cambiar estado/prioridad/orden)
export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, title, description, status, priority, assigneeId, dueDate, estimatedHours, order } = body;

        const updatedTask = await prisma.kanbanTask.update({
            where: { id },
            data: {
                title,
                description,
                status,
                priority,
                assigneeId,
                order,
                dueDate: dueDate ? new Date(dueDate) : null,
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
            },
            include: {
                assignee: { select: { id: true, name: true, image: true } }
            }
        });

        return NextResponse.json(updatedTask);
    } catch (error: any) {
        console.error("KANBAN_TASK_PUT_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Eliminar un ticket logica
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('id');

        if (!taskId) return NextResponse.json({ error: "Task ID required" }, { status: 400 });

        await prisma.kanbanTask.delete({
            where: { id: taskId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("KANBAN_TASK_DELETE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
