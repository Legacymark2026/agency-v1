import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireTenant(shouldRedirect = true) {
    const session = await auth();
    
    if (!session?.user?.id) {
        if (shouldRedirect) redirect("/login");
        throw new Error("UNAUTHORIZED: No active session.");
    }
    
    // Cross-DB Query: Fetch user first (Auth DB), then fetch companyUser separately (Core DB)
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id }
    });
    
    if (!companyUser) {
        if (shouldRedirect) redirect("/login");
        throw new Error("UNAUTHORIZED: User does not belong to any tenant.");
    }
    
    return {
        userId: session.user.id,
        email: session.user.email,
        companyId: companyUser.companyId,
        session
    };
}
