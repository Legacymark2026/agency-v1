export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db as prisma } from "@/lib/db";
import { UserRole } from "@/types/auth";
import ApprovalsDashboardClient from "@/components/marketing/approvals/ApprovalsDashboardClient";

export default async function CampaignApprovalsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/login");
    }

    // Only allow admin/developer to view approvals
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLIENT_ADMIN) {
        redirect("/dashboard/unauthorized");
    }

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) {
        throw new Error("Company not found");
    }

    const campaigns = await prisma.campaign.findMany({
        where: {
            companyId: companyUser.companyId,
            approvalStatus: 'PENDING_APPROVAL'
        },
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Campaign Approvals</h2>
                    <p className="text-muted-foreground">
                        Review, approve, or reject draft campaigns before they are pushed to live ad networks.
                    </p>
                </div>
            </div>

            <ApprovalsDashboardClient defaultCampaigns={campaigns} />
        </div>
    );
}
