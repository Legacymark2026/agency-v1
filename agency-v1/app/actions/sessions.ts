'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActiveSessions() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const sessions = await prisma.session.findMany({
            where: { userId: session.user.id },
            orderBy: { expires: 'desc' }
        });

        // We also need to get the current session token to mark "This Device"
        // Wait, NextAuth v5 session might not strictly expose the DB token directly.
        // For security, just returning the sessions is enough. We can try to guess "This Device" on frontend via UA/IP if needed, or omit it.

        return { success: true, sessions };
    } catch (error: any) {
        console.error("Failed to fetch sessions:", error);
        return { success: false, error: "Error al obtener las sesiones activas" };
    }
}

export async function revokeSession(sessionId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "No autorizado" };

        // Ensure the session belongs to the user
        const targetSession = await prisma.session.findUnique({
            where: { id: sessionId }
        });

        if (!targetSession || targetSession.userId !== session.user.id) {
            return { success: false, error: "Sesión no encontrada o acceso denegado." };
        }

        await prisma.session.delete({
            where: { id: sessionId }
        });

        revalidatePath("/dashboard/settings/profile");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to revoke session:", error);
        return { success: false, error: "Error al cerrar la sesión remota" };
    }
}
