import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Enterprise Utility: Require Tenant Context
 * Validates session and resolves the user's active company (tenant).
 * Automatically redirects to login if unauthorized (when used in Server Components).
 * 
 * @param shouldRedirect If true, redirects to /login on failure. If false, throws an Error (for Server Actions).
 */
export async function requireTenant(shouldRedirect = true) {
    const session = await auth();
    
    if (!session?.user?.email) {
        if (shouldRedirect) redirect("/login");
        throw new Error("UNAUTHORIZED: No active session.");
    }
    
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { companyUsers: true }
    });
    
    if (!user || user.companyUsers.length === 0) {
        if (shouldRedirect) redirect("/login");
        throw new Error("UNAUTHORIZED: User does not belong to any tenant.");
    }
    
    return {
        userId: user.id,
        email: user.email,
        companyId: user.companyUsers[0].companyId,
        session
    };
}
