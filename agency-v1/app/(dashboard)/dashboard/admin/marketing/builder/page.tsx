export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CampaignWizardClient from "@/components/marketing/builder/CampaignWizardClient";

export default async function CampaignBuilderPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/login");
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Campaign Builder</h2>
                    <p className="text-muted-foreground">
                        Centralize and launch campaigns across TikTok, Meta, Google, and LinkedIn.
                    </p>
                </div>
            </div>

            <CampaignWizardClient />
        </div>
    );
}
