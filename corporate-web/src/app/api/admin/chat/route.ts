import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  try {
    const conversations = await prisma.chatConversation.findMany({
      where: statusFilter && statusFilter !== "todos" ? { status: statusFilter } : undefined,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const unreadCount = await prisma.chatConversation.count({
      where: { status: "nuevo" },
    });

    return NextResponse.json({ conversations, unreadCount });
  } catch (error) {
    console.error("Error fetching admin chats:", error);
    return NextResponse.json({ error: "Error al obtener conversaciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { conversationId, text } = body;

    if (!conversationId || !text || !text.trim()) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Crear mensaje del administrador
    const msg = await prisma.chatMessage.create({
      data: {
        conversationId,
        sender: "admin",
        text: text.trim(),
      },
    });

    // Actualizar estado de la conversación a 'respondido'
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: "respondido",
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error("Error sending admin reply:", error);
    return NextResponse.json({ error: "Error al enviar respuesta" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { conversationId, status } = body;

    if (!conversationId || !status) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const updated = await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { status },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error) {
    console.error("Error updating chat status:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
