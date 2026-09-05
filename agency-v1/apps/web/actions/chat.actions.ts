"use server";

import { auth } from "@/lib/auth";
import { executeMicroserviceRequest } from "@/lib/microservices-client";
import { prisma } from "@/lib/prisma";

export async function getChatChannelsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyId = session.user.companyId || "default-tenant";
  const userId = session.user.id;

  return executeMicroserviceRequest({
    service: "chat",
    path: "/api/chat/channels",
    method: "GET",
    companyId,
    userId,
    fallback: async () => {
      const channels = await (prisma as any).chatChannel.findMany({
        where: {
          companyId,
          isArchived: false,
          OR: [
            { type: "PUBLIC" },
            { members: { some: { userId } } }
          ]
        },
        include: {
          members: true,
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: "desc" }
      });
      return { success: true, data: channels };
    }
  });
}

export async function createChatChannelAction(data: { name: string; description?: string; type: "PUBLIC" | "PRIVATE" | "DIRECT_MESSAGE"; memberIds?: string[] }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyId = session.user.companyId || "default-tenant";
  const userId = session.user.id;

  return executeMicroserviceRequest({
    service: "chat",
    path: "/api/chat/channels",
    method: "POST",
    companyId,
    userId,
    body: data,
    fallback: async () => {
      const members = data.memberIds || [];
      if (!members.includes(userId)) members.push(userId);

      const created = await (prisma as any).chatChannel.create({
        data: {
          companyId,
          name: data.name,
          description: data.description || null,
          type: data.type || "PUBLIC",
          createdById: userId,
          members: {
            create: members.map((mId) => ({
              companyId,
              userId: mId,
              role: mId === userId ? "OWNER" : "MEMBER"
            }))
          }
        }
      });
      return { success: true, data: created };
    }
  });
}

export async function getChannelMessagesAction(channelId: string, limit: number = 50) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyId = session.user.companyId || "default-tenant";
  const userId = session.user.id;

  return executeMicroserviceRequest({
    service: "chat",
    path: `/api/chat/channels/${channelId}/messages?limit=${limit}`,
    method: "GET",
    companyId,
    userId,
    fallback: async () => {
      const messages = await (prisma as any).chatMessage.findMany({
        where: { channelId, companyId },
        orderBy: { createdAt: "asc" },
        take: limit
      });
      return { success: true, data: messages, count: messages.length };
    }
  });
}

export async function sendChatMessageAction(channelId: string, content: string, type: string = "TEXT", metadata?: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyId = session.user.companyId || "default-tenant";
  const userId = session.user.id;
  const userName = session.user.name || "Usuario";

  return executeMicroserviceRequest({
    service: "chat",
    path: `/api/chat/channels/${channelId}/messages`,
    method: "POST",
    companyId,
    userId,
    headers: {
      "x-user-name": userName
    },
    body: { content, type, metadata },
    fallback: async () => {
      const created = await (prisma as any).chatMessage.create({
        data: {
          companyId,
          channelId,
          senderId: userId,
          senderName: userName,
          content,
          type,
          metadata: metadata || {}
        }
      });
      return { success: true, data: created };
    }
  });
}
