"use server";

import { auth } from "@/lib/auth";
import { executeMicroserviceRequest } from "@/lib/microservices-client";
import { prisma } from "@/lib/prisma";

export async function getCompanyFeedAction(limit: number = 20, before?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyId = session.user.companyId || "default-tenant";
  const userId = session.user.id;
  const userRole = session.user.role || "MEMBER";

  return executeMicroserviceRequest({
    service: "feed",
    path: `/api/feed/posts?limit=${limit}${before ? `&before=${before}` : ""}`,
    method: "GET",
    companyId,
    userId,
    headers: { "x-user-role": userRole },
    fallback: async () => {
      const posts = await (prisma as any).enterprisePost.findMany({
        where: { companyId },
        include: {
          comments: {
            take: 3,
            orderBy: { createdAt: "desc" }
          },
          reactions: true,
          _count: { select: { comments: true, reactions: true } }
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: limit
      });
      return { success: true, data: posts, count: posts.length };
    }
  });
}

export async function createEnterprisePostAction(data: {
  title?: string;
  content: string;
  mediaUrls?: string[];
  audienceScope?: "COMPANY_WIDE" | "DEPARTMENT" | "CONFIDENTIAL_MANAGEMENT";
  departmentId?: string;
  tags?: string[];
  isPinned?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyId = session.user.companyId || "default-tenant";
  const userId = session.user.id;
  const userName = session.user.name || "Colaborador";
  const userAvatar = session.user.image || null;

  return executeMicroserviceRequest({
    service: "feed",
    path: "/api/feed/posts",
    method: "POST",
    companyId,
    userId,
    headers: {
      "x-user-name": userName
    },
    body: {
      ...data,
      authorAvatar: userAvatar
    },
    fallback: async () => {
      const created = await (prisma as any).enterprisePost.create({
        data: {
          companyId,
          authorId: userId,
          authorName: userName,
          authorAvatar: userAvatar,
          title: data.title || null,
          content: data.content,
          mediaUrls: data.mediaUrls || [],
          audienceScope: data.audienceScope || "COMPANY_WIDE",
          departmentId: data.departmentId || null,
          tags: data.tags || [],
          isPinned: data.isPinned || false
        }
      });
      return { success: true, data: created };
    }
  });
}

export async function togglePostReactionAction(postId: string, type: "LIKE" | "LOVE" | "CELEBRATE" | "INSIGHTFUL" | "CURIOUS") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyId = session.user.companyId || "default-tenant";
  const userId = session.user.id;

  return executeMicroserviceRequest({
    service: "feed",
    path: `/api/feed/posts/${postId}/reactions`,
    method: "POST",
    companyId,
    userId,
    body: { type },
    fallback: async () => {
      const existing = await (prisma as any).enterprisePostReaction.findFirst({
        where: { companyId, postId, userId }
      });

      if (existing) {
        if (existing.type === type) {
          await (prisma as any).enterprisePostReaction.delete({ where: { id: existing.id } });
          return { success: true, data: { reacted: false, type } };
        } else {
          await (prisma as any).enterprisePostReaction.update({
            where: { id: existing.id },
            data: { type }
          });
          return { success: true, data: { reacted: true, type } };
        }
      }

      await (prisma as any).enterprisePostReaction.create({
        data: { companyId, postId, userId, type }
      });
      return { success: true, data: { reacted: true, type } };
    }
  });
}

export async function addPostCommentAction(postId: string, content: string, parentId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyId = session.user.companyId || "default-tenant";
  const userId = session.user.id;
  const userName = session.user.name || "Colaborador";
  const userAvatar = session.user.image || null;

  return executeMicroserviceRequest({
    service: "feed",
    path: `/api/feed/posts/${postId}/comments`,
    method: "POST",
    companyId,
    userId,
    headers: {
      "x-user-name": userName
    },
    body: { content, parentId },
    fallback: async () => {
      const created = await (prisma as any).enterprisePostComment.create({
        data: {
          companyId,
          postId,
          authorId: userId,
          authorName: userName,
          authorAvatar: userAvatar,
          parentId: parentId || null,
          content
        }
      });
      return { success: true, data: created };
    }
  });
}
