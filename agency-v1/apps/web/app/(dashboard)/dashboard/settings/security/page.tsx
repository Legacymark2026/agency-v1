import { PersonalSecurityClient } from "@/components/settings/personal-security-client";
import { getPersonalSecurityOverview, getActiveSessions, getMyLoginHistory } from "@/actions/settings";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function SettingsSecurityPage() {
    const session = await auth();
    const currentToken = (session as any)?.sessionToken || "";

    const [overview, sessions, loginHistory] = await Promise.all([
        getPersonalSecurityOverview(),
        getActiveSessions(),
        getMyLoginHistory(),
    ]);

    const safeOverview = overview || {
        id: (session as any)?.user?.id || "default",
        email: (session as any)?.user?.email || "",
        hasPassword: true,
        mfaEnabled: false,
        hasBackupCodes: false,
        unspentCodesCount: 0,
        emailVerified: true,
        activeSessionsCount: sessions?.length || 1,
        recentFailedAttemptsCount: 0,
        securityScore: 65,
        securityGrade: "B" as const,
        checklist: [
            {
                id: "mfa",
                title: "Doble Factor de Autenticación (2FA)",
                description: "Protege tu cuenta activando autenticación TOTP de dos pasos.",
                status: "warning" as const,
                impact: "+35 pts",
            },
            {
                id: "backup_codes",
                title: "Códigos de Respaldo de Emergencia",
                description: "Genera códigos de respaldo para emergencias o pérdida de dispositivo.",
                status: "warning" as const,
                impact: "+15 pts",
            },
            {
                id: "password",
                title: "Contraseña Criptográfica",
                description: "Protección con hashing bcrypt seguro.",
                status: "passed" as const,
                impact: "+20 pts",
            }
        ],
        createdAt: new Date().toISOString(),
    };

    return (
        <PersonalSecurityClient 
            overview={(overview as any) || safeOverview}
            sessions={sessions || []}
            logs={loginHistory || []}
            currentSessionToken={currentToken}
        />
    );
}

