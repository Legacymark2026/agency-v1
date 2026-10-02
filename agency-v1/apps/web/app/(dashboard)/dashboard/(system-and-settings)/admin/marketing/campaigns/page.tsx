import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function AdminCampaignsRedirect() {
    // Canonical redirect to unified Marketing & Campaigns dashboard
    redirect("/dashboard/marketing/campaigns");
}
