import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, visitorName, visitorContact, text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    let convId = conversationId;

    // Si ya existe la conversación, verificarla
    if (convId) {
      const existing = await prisma.chatConversation.findUnique({
        where: { id: convId },
      });
      if (!existing) {
        convId = null;
      }
    }

    // Si no existe, crear nueva conversación
    if (!convId) {
      const newConv = await prisma.chatConversation.create({
        data: {
          visitorName: visitorName?.trim() || "Visitante Directivo",
          visitorContact: visitorContact?.trim() || null,
          status: "nuevo",
        },
      });
      convId = newConv.id;
    } else {
      // Actualizar datos de contacto si se suministran y marcar como nuevo mensaje
      await prisma.chatConversation.update({
        where: { id: convId },
        data: {
          lastMessageAt: new Date(),
          status: "nuevo",
          ...(visitorName ? { visitorName: visitorName.trim() } : {}),
          ...(visitorContact ? { visitorContact: visitorContact.trim() } : {}),
        },
      });
    }

    // Crear mensaje del visitante
    const msg = await prisma.chatMessage.create({
      data: {
        conversationId: convId,
        sender: "visitor",
        text: text.trim(),
      },
    });

    // Registrar evento en la analítica de NEOGESTIÓN
    await prisma.analyticsEvent.create({
      data: {
        path: "/chat",
        eventType: "chat_message",
        deviceType: "desktop",
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      conversationId: convId,
      message: msg,
    });
  } catch (error) {
    console.error("Error in chat POST API:", error);
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      status: conversation.status,
      messages: conversation.messages,
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Error al consultar mensajes" }, { status: 500 });
  }
}
