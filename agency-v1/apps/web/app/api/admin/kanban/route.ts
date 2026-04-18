import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { companies: true }
        });

        if (!user || !user.companies || user.companies.length === 0) {
            return NextResponse.json({ error: "No active company found for this user." }, { status: 400 });
        }

        const activeCompanyId = user.companies[0].companyId;

        const projects = await prisma.kanbanProject.findMany({
            where: { companyId: activeCompanyId },
            include: {
                kanbanTasks: {
                    // Use explicit select to remain compatible with both pre- and post-migration DB
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        priority: true,
                        order: true,
                        projectId: true,
                        assigneeId: true,
                        creatorId: true,
                        dueDate: true,
                        estimatedHours: true,
                        swimlaneId: true,
                        createdAt: true,
                        updatedAt: true,
                        assignee: { select: { id: true, name: true, image: true } },
                    },
                    orderBy: { order: "asc" },
                },
                swimlanes: { orderBy: { order: "asc" } },
                deal: { select: { id: true, title: true, value: true, stage: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(projects);
    } catch (error: any) {
        console.error("KANBAN_GET_ERROR", error?.message || error);
        // Return safe empty response instead of 500 to prevent page crash
        return NextResponse.json([], { status: 200 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, description, companyId, dealId } = body;

        const newProject = await prisma.kanbanProject.create({
            data: {
                name,
                description,
                companyId,
                dealId: dealId || null,
            }
        });

        // Auto-create 3 default swimlanes
        await prisma.kanbanSwimlane.createMany({
            data: [
                { name: "Backlog", projectId: newProject.id, order: 0 },
                { name: "Sprint Activo", projectId: newProject.id, order: 1 },
                { name: "Revisión / Bloqueados", projectId: newProject.id, order: 2 },
            ]
        });

        return NextResponse.json(newProject);
    } catch (error: any) {
        console.error("KANBAN_POST_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
