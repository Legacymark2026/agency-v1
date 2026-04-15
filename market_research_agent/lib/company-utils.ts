
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type CompanyContext = {
    userId: string;
    companyId: string;
    role: string;
}

/**
 * Ensures the current user is authenticated and belongs to a company.
 * If not, redirects to appropriate onboarding or login pages.
 */
export async function requireCompany(): Promise<CompanyContext> {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/auth/login");
    }

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id }
    });

    if (!companyUser) {
        // For now, redirect to a simple "No Company" page or onboarding.
        // In a real app, this would be /onboarding/create-company
        // We'll redirect to a special error page for now to avoid infinite loops if dashboard checks this.
        // Or we can return null and let the caller handle it if strictMode is false, but keeping it simple.
        redirect("/onboarding");
    }

    return {
        userId: session.user.id,
        companyId: companyUser.companyId,
        role: companyUser.role
    };
}
