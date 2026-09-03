"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchMicroserviceRequest } from "@/lib/microservices-client";

export interface GetConversationsOptions {
  status?: string;
  channel?: string;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Returns omni-channel conversations with resilient microservice dispatch
 * and direct database fallback.
 */
export async function getConversationsList(options: GetConversationsOptions = {}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    let companyId = session.user.companyId;
    if (!companyId) {
      const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
      });
      companyId = companyUser?.companyId;
    }

    if (!companyId) return { success: false, error: "Company not found" };

    const queryParams = new URLSearchParams({
      companyId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.channel ? { channel: options.channel } : {}),
      ...(options.assignedTo ? { assignedTo: options.assignedTo } : {}),
      ...(options.search ? { search: options.search } : {}),
      page: String(options.page || 1),
      limit: String(options.limit || 20),
    }).toString();

    const res = await dispatchMicroserviceRequest({
      service: "inbox-service",
      path: `/api/inbox/conversations?${queryParams}`,
      companyId,
      fallback: async () => {
        // Direct Prisma fallback if inbox-service is offline
        const whereClause: any = { companyId };
        if (options.status) whereClause.status = options.status;
        if (options.channel) whereClause.channel = options.channel;
        if (options.assignedTo) whereClause.assignedToId = options.assignedTo;

        const take = options.limit || 20;
        const skip = ((options.page || 1) - 1) * take;

        const [conversations, total] = await Promise.all([
          prisma.conversation.findMany({
            where: whereClause,
            take,
            skip,
            orderBy: { updatedAt: "desc" },
            include: {
              messages: {
                take: 1,
                orderBy: { createdAt: "desc" },
              },
            },
          }),
          prisma.conversation.count({ where: whereClause }),
        ]);

        return {
          conversations,
          pagination: {
            page: options.page || 1,
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        };
      },
    });

    return {
      success: true,
      data: res.data?.conversations || res.data || [],
      pagination: res.data?.pagination,
      isFallback: res.isFallback,
    };
  } catch (error: any) {
    console.error("[getConversationsList] Unexpected error:", error);
    return { success: false, error: error.message || "Failed to fetch conversations" };
  }
}
