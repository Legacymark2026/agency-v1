import { ProfileClient } from "@/components/settings/profile-client";
import { getSettings } from "@/actions/settings";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SettingsProfilePage() {
    const settings = await getSettings();

    if (!settings) {
        redirect("/auth/login");
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <ProfileClient initialData={settings as any} />
        </div>
    );
}
