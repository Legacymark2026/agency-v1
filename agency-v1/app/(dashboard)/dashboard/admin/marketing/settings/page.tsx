export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MarketingSettingsClient from "@/components/marketing/MarketingSettingsClient";
import { getFacebookAdsConfig } from "@/actions/marketing/facebook-ads";
import { getGoogleAdsConfig } from "@/actions/marketing/google-ads";
import { Link } from "lucide-react";

export default function MarketingSettingsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Marketing API Settings</h2>
                    <p className="text-muted-foreground">
                        Connect your external advertising platforms to pull live campaign data.
                    </p>
                </div>
            </div>

            <MarketingSettingsClient />
        </div>
    );
}
