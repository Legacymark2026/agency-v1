import { ProfileClient } from "@/components/settings/profile-client";
import { getSettings } from "@/actions/settings";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SettingsProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/login");
    }

    const settings = await getSettings();

    // Guard: Provide resilient default data if DB retrieval returned empty
    const rawName = (session.user.name || "").trim();
    const nameParts = rawName ? rawName.split(/\s+/) : [];

    const finalData = settings || {
        id: session.user.id || "",
        email: session.user.email || "",
        emailVerified: false,
        role: (session.user as any).role || "member",
        globalRole: "client_user",
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
        companyName: "Organización Principal",
        connectedProviders: [],
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phone: "",
        image: session.user.image || "",
        coverImage: null,
        jobTitle: "",
        department: "",
        bio: "",
        pronouns: "",
        country: "Colombia",
        city: "Bogotá",
        status: "ONLINE" as const,
        statusMessage: "",
        skills: [],
        linkedin: "",
        github: "",
        twitter: "",
        website: "",
        calendarUrl: "",
        theme: "system" as const,
        language: "es" as const,
        timezone: "America/Bogota",
        currency: "USD",
        dateFormat: "DD/MM/YYYY" as const,
        timeFormat: "12h" as const,
        emailNotifications: true,
        profileCompletedPercentage: 25,
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <ProfileClient initialData={finalData as any} />
        </div>
    );
}

