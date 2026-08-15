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
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NotificationListener } from "@/components/dashboard/notification-listener";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    try {
        const locale = await getLocale();
        const t = await getTranslations({ locale, namespace: "dashboard.metadata" });

        return {
            title: t("title"),
            description: t("description"),
        };
    } catch (e) {
        console.warn("[next-intl] getLocale/getTranslations failed in DashboardLayout generateMetadata (likely bypassed in middleware):", e);
        return {
            title: "Panel de Control | LegacyMark",
            description: "Gestiona tus operaciones y campañas en tiempo real.",
        };
    }
}

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
    if (!session?.user || !session.user.id) redirect("/auth/login");

    let role = (session.user.role as UserRole) || UserRole.GUEST;

    // ─ Paralelizar las 2 queries independientes de DB ──────────────────────
    const [dbUser, companyUser] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        }),
        prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { 
                permissions: true, 
                companyId: true, 
                company: { 
                    select: { 
                        logoUrl: true, 
                        whiteLabeling: true, 
                        defaultCompanySettings: true, 
                        onboardingCompleted: true 
                    } 
                } 
            },
        }),
    ]);

    if (!dbUser) {
        redirect("/auth/login?deleted=1");
    }

    if (dbUser.role) role = dbUser.role as UserRole;
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
        "/dashboard", "/dashboard/pos", "/dashboard/invoicing", "/dashboard/catalog", "/dashboard/promotions", "/dashboard/kanban", "/dashboard/inbox", "/dashboard/events", "/dashboard/analytics",
        "/dashboard/seo",
        "/dashboard/admin/marketing", "/dashboard/admin/marketing/campaigns", "/dashboard/marketing/calendar",
        "/dashboard/marketing/email-blast", "/dashboard/admin/marketing/creative-studio", "/dashboard/marketing/pricing",
        "/dashboard/admin/automation", "/dashboard/admin/marketing/spend", "/dashboard/admin/marketing/links",
        "/dashboard/admin/marketing/settings", "/dashboard/admin/crm", "/dashboard/admin/crm/leads",
        "/dashboard/admin/crm/pipeline", "/dashboard/admin/proposals", "/dashboard/admin/invoices",
        "/dashboard/admin/crm/tasks", "/dashboard/admin/crm/reports", "/dashboard/admin/crm/templates",
        "/dashboard/admin/crm/scoring", "/dashboard/admin/sales/goals", "/dashboard/admin/crm/commissions",
        "/dashboard/admin/crm/automation", "/dashboard/admin/crm/sequences", "/dashboard/admin/crm/assignment", "/dashboard/posts",
        "/dashboard/posts/comments", "/dashboard/posts/categories", "/dashboard/projects", "/dashboard/media",
        "/dashboard/users", "/dashboard/roles", "/dashboard/admin/team", "/dashboard/security", "/dashboard/admin/payroll",
        "/dashboard/admin/payroll/employees", "/dashboard/admin/payroll/employees/new", "/dashboard/admin/payroll/expenses",
        "/dashboard/admin/treasury", "/dashboard/settings", "/dashboard/settings/agents", "/dashboard/settings/inbox/macros",
        "/dashboard/settings/audit-logs", "/dashboard/settings/privacy",
        "/dashboard/admin/ai-insights", "/dashboard/experts", "/dashboard/tools/video-editor",
        "/dashboard/video", "/dashboard/voice", "/dashboard/admin/hr",
        "/dashboard/affiliate", "/dashboard/affiliate/referrals",
        "/dashboard/affiliate/payouts", "/dashboard/affiliate/plans"
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
    
    // Retrieve White-Labeling configs
    const brandColor = (companyUser?.company?.whiteLabeling as any)?.primaryColor || null;
    const companyLogo = companyUser?.company?.logoUrl || null;

    return (
        <SidebarController>
            {brandColor && (
                <style dangerouslySetInnerHTML={{ __html: `
                    :root {
                        --ds-teal: ${brandColor} !important;
                        --ds-teal-md: ${brandColor}e0 !important;
                        --ds-teal-bright: ${brandColor}ff !important;
                        --ds-border-glow: ${brandColor}4D !important; /* 30% opacity */
                        --ds-teal-dim: ${brandColor}26 !important; /* 15% opacity */
                    }
                ` }} />
            )}
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
                            companyLogoUrl={companyLogo}
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

                {/* Listener global de notificaciones */}
                <NotificationListener />

                {/* Global Operations Timer */}
                <GlobalTimer />

                {/* Onboarding Fricción Cero */}
                <OnboardingWizard initialShow={showOnboarding} />
            </div>
        </SidebarController>
    );
}
