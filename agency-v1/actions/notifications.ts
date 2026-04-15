'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLocalNotification(params: {
    companyId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
}) {
    try {
        await prisma.notification.create({
            data: {
                companyId: params.companyId,
                userId: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                link: params.link,
            }
        });
        // We could also add email/push delivery here via NotificationDeliveryLog
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
}

export async function getNotifications() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.companyId) {
            return { success: false, data: [] };
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                companyId: session.user.companyId
            },
            orderBy: { createdAt: "desc" },
            take: 30
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                companyId: session.user.companyId,
                isRead: false
            }
        });

        return { success: true, data: notifications, unreadCount };
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { success: false, data: [], unreadCount: 0 };
    }
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false };

        await prisma.notification.update({
            where: { id: notificationId, userId: session.user.id },
            data: { isRead: true, readAt: new Date() }
        });

        revalidatePath('/', 'layout'); // Flushes the router cache to update the Bell
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.companyId) return { success: false };

        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                companyId: session.user.companyId,
                isRead: false
            },
            data: { isRead: true, readAt: new Date() }
        });

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
