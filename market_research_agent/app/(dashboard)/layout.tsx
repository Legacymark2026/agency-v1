import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { UserRole } from "@/types/auth";
import { prisma } from "@/lib/prisma";
import { MobileSidebarWrapper } from "@/components/dashboard/MobileSidebarWrapper";
import { CognitiveAgentChat } from "@/components/ai/cognitive-agent-chat";
import { GlobalTimer } from "@/components/operations/global-timer";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    let role = (session.user.role as UserRole) || UserRole.GUEST;
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });
    if (dbUser?.role) role = dbUser.role as UserRole;
    if (role === UserRole.GUEST) redirect("/dashboard/unauthorized");

    return (
        <div className="h-screen flex flex-col md:flex-row font-sans overflow-hidden"
            style={{ background: 'var(--ds-bg)', color: 'var(--ds-text-primary)' }}>

            {/* Grid overlay — same quantum grid as home */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen z-0" />

            {/* Radial teal glow top — same as home global spotlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.06)_0%,transparent_70%)] pointer-events-none z-0" />

            <MobileSidebarWrapper
                sidebar={
                    <DashboardSidebar
                        role={role}
                        name={session.user.name}
                        email={session.user.email}
                        image={session.user.image}
                        userId={session.user.id}
                    />
                }
            />

            <main className="flex-1 overflow-auto relative z-10 w-full h-full"
                style={{ background: 'transparent' }}>
                <div className="max-w-[1440px] mx-auto">
                    {children}
                </div>
            </main>

            {/* Agente de IA Flotante Nivel C-Level */}
            <CognitiveAgentChat />

            {/* Global Operations Timer */}
            <GlobalTimer />
        </div>
    );
}
