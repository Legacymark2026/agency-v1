import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireTenant(shouldRedirect = true) {
    const session = await auth();
    
    if (!session?.user?.email) {
        if (shouldRedirect) redirect("/login");
        throw new Error("UNAUTHORIZED: No active session.");
    }
    
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { companies: true }
    });
    
    if (!user || user.companies.length === 0) {
        if (shouldRedirect) redirect("/login");
        throw new Error("UNAUTHORIZED: User does not belong to any tenant.");
    }
    
    return {
        userId: user.id,
        email: user.email,
        companyId: user.companies[0].companyId,
        session
    };
}
