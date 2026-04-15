import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — Cargar historial de conversaciones del usuario
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const conversations = await prisma.agentConversation.findMany({
        where: { userId: session.user.id },
        include: {
            messages: {
                orderBy: { createdAt: "asc" },
            },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
    });

    return NextResponse.json({ conversations });
}

// POST — Guardar una nueva conversación completa
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const companyId = (session.user as any)?.companyId || session.user.id;
    const { title, messages } = await req.json();

    const conversation = await prisma.agentConversation.create({
        data: {
            title: title || messages?.[0]?.content?.slice(0, 50) || "Nueva conversación",
            userId: session.user.id,
            companyId,
            messages: {
                create: messages.map((m: { role: string; content: string }) => ({
                    role: m.role,
                    content: m.content,
                })),
            },
        },
        include: { messages: true },
    });

    return NextResponse.json({ conversation });
}
