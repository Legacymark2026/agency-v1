import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`chat_post_${clientIp}`, {
      maxRequests: 10,
      windowSeconds: 5 * 60, // 10 mensajes por cada 5 minutos
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Límite de mensajes alcanzado. Por favor espere unos minutos antes de volver a escribir." },
        { 
          status: 429,
          headers: { "Retry-After": String(rateCheck.resetSeconds) }
        }
      );
    }

    const body = await req.json();
    const { conversationId, visitorName, visitorContact, text } = body;

    if (!text || !String(text).trim()) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    // Límites estrictos de longitud contra ataques de denegación de servicio en base de datos
    const safeText = String(text).trim().slice(0, 2000);
    const safeName = visitorName ? String(visitorName).trim().slice(0, 100) : "Visitante Directivo";
    const safeContact = visitorContact ? String(visitorContact).trim().slice(0, 100) : null;

    let convId = conversationId && typeof conversationId === "string" ? conversationId.slice(0, 50) : null;

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
          visitorName: safeName,
          visitorContact: safeContact,
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
          ...(safeName ? { visitorName: safeName } : {}),
          ...(safeContact ? { visitorContact: safeContact } : {}),
        },
      });
    }

    // Crear mensaje del visitante
    const msg = await prisma.chatMessage.create({
      data: {
        conversationId: convId,
        sender: "visitor",
        text: safeText,
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
