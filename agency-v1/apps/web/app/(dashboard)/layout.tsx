import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { UserRole } from "@/types/auth";
import { prisma } from "@/lib/prisma";
import { MobileSidebarWrapper } from "@/components/dashboard/MobileSidebarWrapper";
import { CognitiveAgentChat } from "@/components/ai/cognitive-agent-chat";
import { GlobalTimer } from "@/components/operations/global-timer";
import { SidebarController } from "@/components/dashboard/sidebar-controller";
import { isStandardRole, canAccessRoute, PERMISSION_ROUTE_MAP } from "@/lib/rbac";
import { canCustomRoleAccess } from "@/lib/role-config";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const dynamic = 'force-dynamic';

function resolveBadge(role: string, customRoleName?: string) {
    const standardRoles = ['super_admin', 'admin', 'content_manager', 'client_admin', 'client_user', 'external_client', 'guest'];
    if (standardRoles.includes(role)) {
        if (role === 'super_admin') return { label: "SUPER_ADMIN", color: "border-red-500/30 text-red-400 bg-red-500/10" };
        if (role === 'admin') return { label: "ADMIN", color: "border-orange-500/30 text-orange-400 bg-orange-500/10" };
        return { label: role.replace(/_/g, ' ').toUpperCase(), color: "border-slate-700 text-slate-400 bg-slate-800/50" };
    }
    const label = customRoleName || (role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' '));
    return { label, color: "border-teal-900/50 text-teal-400 bg-slate-900/60" };
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    let role = (session.user.role as UserRole) || UserRole.GUEST;

    // ─ Paralelizar las 2 queries independientes de DB ──────────────────────
    const [dbUser, companyUser] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        }),
        prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { permissions: true, companyId: true, company: { select: { defaultCompanySettings: true, onboardingCompleted: true } } },
        }),
    ]);

    if (dbUser?.role) role = dbUser.role as UserRole;
    if (role === UserRole.GUEST) redirect("/dashboard/unauthorized");

    // Get company user data for permissions
    let userPermissions: string[] = [];
    let customRoleName: string | undefined;
    let roleAllowedRoutes: string[] = [];

    let showOnboarding = false;

    if (companyUser) {
        userPermissions = (companyUser.permissions as string[]) ?? [];
        const settings = (companyUser.company?.defaultCompanySettings as any) || {};
        const customRoles = settings.customRoles || [];
        const matched = customRoles.find((r: any) => r.id === role);
        if (matched) customRoleName = matched.name;
        
        // Determinar si debemos mostrar el wizard
        if (companyUser.company && companyUser.company.onboardingCompleted === false) {
            showOnboarding = true;
        }
    }

    if (!isStandardRole(role)) {
        const routes = await import("@/lib/role-config").then(m => m.getRoleAllowedRoutes(role));
        roleAllowedRoutes = routes ?? [];
    }

    const isCustomRole = !isStandardRole(role);

    // Pre-compute accessible routes (can't pass function to client component)
    const allRoutes = [
        "/dashboard/client", "/dashboard/client/proposals", "/dashboard/client/projects",
        "/dashboard", "/dashboard/kanban", "/dashboard/inbox", "/dashboard/events", "/dashboard/analytics",
        "/dashboard/admin/marketing", "/dashboard/admin/marketing/campaigns", "/dashboard/marketing/calendar",
        "/dashboard/marketing/email-blast", "/dashboard/admin/marketing/creative-studio", "/dashboard/marketing/pricing",
        "/dashboard/admin/automation", "/dashboard/admin/marketing/spend", "/dashboard/admin/marketing/links",
        "/dashboard/admin/marketing/settings", "/dashboard/admin/crm", "/dashboard/admin/crm/leads",
        "/dashboard/admin/crm/pipeline", "/dashboard/admin/proposals", "/dashboard/admin/invoices",
        "/dashboard/admin/crm/tasks", "/dashboard/admin/crm/reports", "/dashboard/admin/crm/templates",
        "/dashboard/admin/crm/scoring", "/dashboard/admin/sales/goals", "/dashboard/admin/crm/commissions",
        "/dashboard/admin/crm/automation", "/dashboard/admin/crm/sequences", "/dashboard/posts",
        "/dashboard/posts/comments", "/dashboard/posts/categories", "/dashboard/projects", "/dashboard/media",
        "/dashboard/users", "/dashboard/admin/team", "/dashboard/security", "/dashboard/admin/payroll",
        "/dashboard/admin/treasury", "/dashboard/settings", "/dashboard/settings/agents",
        "/dashboard/admin/ai-insights", "/dashboard/experts"
    ];

    const accessibleRoutesSet = new Set<string>();
    
    for (const href of allRoutes) {
        let hasAccess = false;
        
        if (isCustomRole) {
            if (roleAllowedRoutes.length > 0) {
                if (href === "/dashboard") {
                    hasAccess = true;
                } else {
                    hasAccess = canCustomRoleAccess(roleAllowedRoutes, href);
                }
            } else if (href === "/dashboard") {
                hasAccess = userPermissions.length > 0;
            } else {
                for (const { perm, routes } of PERMISSION_ROUTE_MAP) {
                    if (userPermissions.includes(perm) && routes.some(r => href === r || href.startsWith(r + "/"))) {
                        hasAccess = true;
                        break;
                    }
                }
            }
        } else {
            if (canAccessRoute(href, role as UserRole)) {
                hasAccess = true;
            } else {
                for (const { perm, routes } of PERMISSION_ROUTE_MAP) {
                    if (userPermissions.includes(perm) && routes.some(r => href === r || href.startsWith(r + "/"))) {
                        hasAccess = true;
                        break;
                    }
                }
            }
        }
        
        if (hasAccess) {
            accessibleRoutesSet.add(href);
        }
    }

    const badge = resolveBadge(role as string, customRoleName);

    return (
        <SidebarController>
            <div className="h-screen flex flex-col md:flex-row font-sans overflow-hidden"
                style={{ background: 'var(--ds-bg)', color: 'var(--ds-text-primary)' }}>

                {/* Grid overlay — same quantum grid as home */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen z-0" />

                {/* Radial teal glow top — same as home global spotlight */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.06)_0%,transparent_70%)] pointer-events-none z-0" />

                <MobileSidebarWrapper
                    sidebar={
                        <DashboardSidebar
                            role={role as string}
                            name={session.user.name}
                            email={session.user.email}
                            image={session.user.image}
                            accessibleRoutes={Array.from(accessibleRoutesSet)}
                            badge={badge}
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

                {/* Onboarding Fricción Cero */}
                <OnboardingWizard initialShow={showOnboarding} />
            </div>
        </SidebarController>
    );
}
