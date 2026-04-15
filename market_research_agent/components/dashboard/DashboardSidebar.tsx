import Link from "next/link";
import {
    LayoutDashboard, Users, Settings, FileText, LogOut,
    Shield, BookOpen, Briefcase, BarChart2, Workflow,
    MessageSquare, Target, TrendingUp, Link2, Building2,
    Lock, UserCog, DollarSign, CheckSquare, Zap, Mail, Calendar, Wand2,
    Activity, Wifi, Bot, Trello, CreditCard, Landmark
} from "lucide-react";
import { signOut } from "@/lib/auth";
import Image from "next/image";
import { canAccessRoute, isStandardRole, PERMISSION_ROUTE_MAP } from "@/lib/rbac";
import { UserRole } from "@/types/auth";
import { prisma } from "@/lib/prisma";
import { getRoleAllowedRoutes, canCustomRoleAccess } from "@/lib/role-config";
import { Image as ImageIcon } from "lucide-react";
import { NotificationBell } from "./notification-bell";
interface NavItem { href: string; label: string; icon: React.ReactNode; code?: string; }
interface NavGroup { title: string; code: string; accent?: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
    {
        title: "Portal del Cliente", code: "CLIENT_PORTAL",
        accent: "teal",
        items: [
            { href: "/dashboard/client", label: "Mi Resumen", icon: <LayoutDashboard size={14} />, code: "C_OVW" },
            { href: "/dashboard/client/proposals", label: "Mis Propuestas", icon: <FileText size={14} />, code: "C_QOT" },
            { href: "/dashboard/client/projects", label: "Mis Proyectos", icon: <Briefcase size={14} />, code: "C_PRJ" },
        ],
    },
    {
        title: "Panel General", code: "SYS_CORE",
        items: [
            { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} />, code: "OVW" },
            { href: "/dashboard/kanban", label: "Gestión Operativa", icon: <Trello size={14} />, code: "KBN" },
            { href: "/dashboard/inbox", label: "Inbox Omnicanal", icon: <MessageSquare size={14} />, code: "BCX" },
            { href: "/dashboard/events", label: "Calendario", icon: <Calendar size={14} />, code: "CAL" },
            { href: "/dashboard/analytics", label: "Analítica Web", icon: <BarChart2 size={14} />, code: "ANL" },
        ],
    },
    {
        title: "Marketing Hub", code: "MKT_SYS",
        accent: "teal",
        items: [
            { href: "/dashboard/admin/marketing", label: "CMO Dashboard", icon: <BarChart2 size={14} />, code: "CMO" },
            { href: "/dashboard/admin/marketing/campaigns", label: "Campañas (Live)", icon: <Target size={14} />, code: "LIV" },
            { href: "/dashboard/marketing/calendar", label: "Planificador", icon: <Calendar size={14} />, code: "PUB" },
            { href: "/dashboard/marketing/email-blast", label: "Email Masivo", icon: <Mail size={14} />, code: "EML" },
            { href: "/dashboard/admin/marketing/creative-studio", label: "Creative Studio", icon: <Wand2 size={14} />, code: "CRE" },
            { href: "/dashboard/marketing/pricing", label: "Tarifario", icon: <Building2 size={14} />, code: "PRC" },
            { href: "/dashboard/admin/automation", label: "Automatización", icon: <Workflow size={14} />, code: "BOT" },
            { href: "/dashboard/admin/marketing/spend", label: "Ad Spend (ROI)", icon: <DollarSign size={14} />, code: "ROI" },
            { href: "/dashboard/admin/marketing/links", label: "Link Tracker", icon: <Link2 size={14} />, code: "TRK" },
            { href: "/dashboard/admin/marketing/settings", label: "APIs & Config", icon: <Settings size={14} />, code: "API" },
        ],
    },
    {
        title: "CRM & Ventas", code: "CRM_CORE",
        accent: "amber",
        items: [
            { href: "/dashboard/admin/crm", label: "CRM Overview", icon: <TrendingUp size={14} />, code: "OVW" },
            { href: "/dashboard/admin/crm/leads", label: "Leads", icon: <Users size={14} />, code: "LDS" },
            { href: "/dashboard/admin/crm/pipeline", label: "Pipeline", icon: <Briefcase size={14} />, code: "PIP" },
            { href: "/dashboard/admin/proposals", label: "Cotizaciones (e-Sign)", icon: <FileText size={14} />, code: "QOT" },
            { href: "/dashboard/admin/invoices", label: "Facturación B2B", icon: <CreditCard size={14} />, code: "INV" },
            { href: "/dashboard/admin/crm/tasks", label: "Tareas", icon: <CheckSquare size={14} />, code: "TSK" },
            { href: "/dashboard/admin/crm/reports", label: "Reportes CRM", icon: <BarChart2 size={14} />, code: "RPT" },
            { href: "/dashboard/admin/crm/templates", label: "Templates Email", icon: <Mail size={14} />, code: "TPL" },
            { href: "/dashboard/admin/crm/scoring", label: "Lead Scoring", icon: <Zap size={14} />, code: "SCR" },
            { href: "/dashboard/admin/sales/goals", label: "Metas Ventas", icon: <Target size={14} />, code: "GLS" },
            { href: "/dashboard/admin/crm/commissions", label: "Comisiones", icon: <DollarSign size={14} />, code: "COM" },
            { href: "/dashboard/admin/crm/automation", label: "Reglas CRM", icon: <Workflow size={14} />, code: "AUT" },
            { href: "/dashboard/admin/crm/sequences", label: "Sequences", icon: <Mail size={14} />, code: "SEQ" },
        ],
    },
    {
        title: "Contenido & Web", code: "CNT_MGR",
        items: [
            { href: "/dashboard/posts", label: "Blog", icon: <BookOpen size={14} />, code: "BLG" },
            { href: "/dashboard/posts/comments", label: "Comentarios", icon: <MessageSquare size={14} />, code: "CMT" },
            { href: "/dashboard/posts/categories", label: "Categorías", icon: <FileText size={14} />, code: "CAT" },
            { href: "/dashboard/projects", label: "Portafolio", icon: <Briefcase size={14} />, code: "PRJ" },
            { href: "/dashboard/media", label: "Archivos & Medios", icon: <ImageIcon size={14} />, code: "MED" },
            { href: "/dashboard/admin/architecture", label: "Organización", icon: <Building2 size={14} />, code: "ORG" },
        ],
    },
    {
        title: "Administración", code: "ADM_OPS",
        items: [
            { href: "/dashboard/users", label: "Usuarios", icon: <Users size={14} />, code: "USR" },
            { href: "/dashboard/experts", label: "Equipo", icon: <UserCog size={14} />, code: "TEM" },
            { href: "/dashboard/security", label: "Seguridad", icon: <Shield size={14} />, code: "SEC" },
            { href: "/dashboard/admin/agent-config", label: "Agente Cognitivo", icon: <Bot size={14} />, code: "AIA" },
            { href: "/dashboard/admin/payroll", label: "Nómina y Egresos", icon: <DollarSign size={14} />, code: "PYR" },
            { href: "/dashboard/admin/treasury", label: "Tesorería (Ledger)", icon: <Landmark size={14} />, code: "TRS" },
            { href: "/dashboard/settings", label: "Configuración", icon: <Settings size={14} />, code: "CFG" },
        ],
    },
];

const ACCENT_COLORS: Record<string, { label: string; dot: string }> = {
    teal: { label: "text-teal-400", dot: "bg-teal-400" },
    amber: { label: "text-amber-400", dot: "bg-amber-400" },
    default: { label: "text-slate-600", dot: "bg-slate-600" },
};

const ROLE_BADGES: Record<UserRole, { label: string; color: string }> = {
    [UserRole.SUPER_ADMIN]: { label: "Super Admin", color: "border-red-800/50 text-red-400 bg-slate-900/60" },
    [UserRole.ADMIN]: { label: "Project Manager", color: "border-teal-900/50 text-teal-400 bg-slate-900/60" },
    [UserRole.CONTENT_MANAGER]: { label: "Marketing / SEO", color: "border-teal-900/50 text-teal-400 bg-slate-900/60" },
    [UserRole.CLIENT_ADMIN]: { label: "Ventas", color: "border-amber-900/50 text-amber-400 bg-slate-900/60" },
    [UserRole.CLIENT_USER]: { label: "Creativo", color: "border-teal-900/50 text-teal-400 bg-slate-900/60" },
    [UserRole.EXTERNAL_CLIENT]: { label: "Cliente", color: "border-indigo-900/50 text-indigo-400 bg-slate-900/60" },
    [UserRole.GUEST]: { label: "En Revisión", color: "border-slate-700/50 text-slate-500 bg-slate-900/60" },
};

/** Resuelve el badge para cualquier rol — incluye custom roles (ej. 'gerente') */
function resolveBadge(role: string, customRoleName?: string): { label: string; color: string } {
    // Primero buscar en los roles estándar
    if (ROLE_BADGES[role as UserRole]) return ROLE_BADGES[role as UserRole];
    // Para custom roles: mostrar el nombre del rol (capitalizado) con teal badge
    const label = customRoleName || (role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' '));
    return { label, color: "border-teal-900/50 text-teal-400 bg-slate-900/60" };
}

interface DashboardSidebarProps {
    role: UserRole;
    name: string | null | undefined;
    email: string | null | undefined;
    image?: string | null | undefined;
    userId?: string;
}

export async function DashboardSidebar({ role: _roleProp, name, email, image, userId }: DashboardSidebarProps) {
    let userPermissions: string[] = [];
    let customRoleName: string | undefined;
    // ── allowedRoutes del RoleConfig (fuente de verdad para roles custom) ──
    let roleAllowedRoutes: string[] = [];

    // ── DB-First: siempre leer el rol real desde la DB para evitar sesión stale ──
    let dbRole: string = _roleProp;

    if (userId) {
        const [dbUser, companyUser] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            }),
            prisma.companyUser.findFirst({
                where: { userId },
                select: { permissions: true, companyId: true, company: { select: { defaultCompanySettings: true } } },
            }),
        ]);

        if (dbUser) dbRole = dbUser.role;

        if (companyUser) {
            userPermissions = (companyUser.permissions as string[]) ?? [];
            const settings = (companyUser.company?.defaultCompanySettings as any) || {};
            const customRoles = settings.customRoles || [];
            const matched = customRoles.find((r: any) => r.id === dbRole);
            if (matched) customRoleName = matched.name;
        }

        // ── Para roles custom: cargar allowedRoutes desde RoleConfig (BD) ──
        // Esta es la fuente de verdad: las rutas configuradas en el editor de roles.
        if (!isStandardRole(dbRole)) {
            const routes = await getRoleAllowedRoutes(dbRole);
            roleAllowedRoutes = routes ?? [];
        }
    }

    const role = dbRole as UserRole;
    const badge = resolveBadge(dbRole, customRoleName);

    const isCustomRole = !isStandardRole(dbRole);

    const checkAccess = (href: string): boolean => {
        if (isCustomRole) {
            // ── FUENTE DE VERDAD PARA ROLES CUSTOM ────────────────────────────
            // 1. Primero: verificar contra allowedRoutes del RoleConfig (BD).
            //    Esto es lo que configura el admin en el editor de roles.
            if (roleAllowedRoutes.length > 0) {
                if (href === "/dashboard") return true; // siempre accesible si tiene rutas
                return canCustomRoleAccess(roleAllowedRoutes, href);
            }

            // 2. Fallback: verificar contra permisos IAM granulares (companyUser.permissions)
            //    Útil si se usa el editor de permisos en lugar del editor de rutas.
            if (href === "/dashboard") return userPermissions.length > 0;
            for (const { perm, routes } of PERMISSION_ROUTE_MAP) {
                if (userPermissions.includes(perm) && routes.some(r => href === r || href.startsWith(r + "/"))) {
                    return true;
                }
            }
            return false;
        }

        // Roles estándar — usan canAccessRoute() de rbac.ts
        if (canAccessRoute(href, role as UserRole)) return true;

        // Fallback: permisos IAM explícitos para roles estándar con permisos extra
        for (const { perm, routes } of PERMISSION_ROUTE_MAP) {
            if (userPermissions.includes(perm) && routes.some(r => href === r || href.startsWith(r + "/"))) {
                return true;
            }
        }
        return false;
    };


    return (
        // Sidebar — slate-950+ dark, border-right slate-800 style
        <aside
            className="w-56 flex flex-col h-full shrink-0 relative"
            style={{
                background: 'rgba(2,6,23,0.97)',   /* deeper than slate-950 */
                borderRight: '1px solid rgba(30,41,59,0.6)',
            }}
        >
            {/* Teal glow top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

            {/* Logo — filtro blanco, tamaño 4× */}
            <div className="flex items-center justify-center shrink-0 px-3 py-4"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                <Link href="/" className="flex items-center justify-center w-full group">
                    <div className="relative h-16 w-full transition-opacity group-hover:opacity-80">
                        <Image
                            src="/logo.png"
                            alt="LegacyMark"
                            fill
                            className="object-contain"
                            priority
                            style={{ filter: 'brightness(0) invert(1)' }}
                        />
                    </div>
                </Link>
            </div>


            {/* System HUD indicators */}
            <div className="flex items-center gap-3 px-4 py-2"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-teal-400 uppercase tracking-widest">
                    <Activity size={8} className="text-teal-500" /> SYS: ONLINE
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <NotificationBell />
                    <span className="relative flex h-1.5 w-1.5 ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 space-y-0 scrollbar-hide">
                {NAV_GROUPS.map((group) => {
                    const accessible = group.items.filter(item => checkAccess(item.href));
                    if (accessible.length === 0) return null;
                    const colors = ACCENT_COLORS[group.accent ?? 'default'];

                    return (
                        <div key={group.title} className="mb-0.5">
                            {/* Group label — HUD style */}
                            <div className={`flex items-center gap-1.5 px-4 pt-3 pb-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.15em] ${colors.label}`}>
                                <span className={`w-1 h-1 rounded-full ${colors.dot} opacity-60`} />
                                {group.code}
                                <span className="ml-auto text-slate-700 text-[7px]">{group.title}</span>
                            </div>

                            {/* Items */}
                            {accessible.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group flex items-center gap-2.5 px-4 py-2 text-[11.5px] font-medium transition-all duration-200 relative"
                                    style={{ color: 'rgba(148,163,184,0.9)' }}
                                >
                                    {/* Active/hover indicator line */}
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-4 bg-teal-500/80 group-hover:w-0.5 transition-all duration-200 rounded-r-full" />
                                    <span className="shrink-0 opacity-60 group-hover:opacity-100 group-hover:text-teal-400 transition-all">
                                        {item.icon}
                                    </span>
                                    <span className="group-hover:text-white transition-colors">{item.label}</span>
                                    {item.code && (
                                        <span className="ml-auto font-mono text-[7px] text-slate-700 group-hover:text-teal-700 transition-colors tracking-widest">
                                            [{item.code}]
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="shrink-0 p-3"
                style={{ borderTop: '1px solid rgba(30,41,59,0.6)' }}>
                {/* User */}
                <div className="flex items-center gap-2.5 mb-2">
                    {image ? (
                        <div className="relative h-7 w-7 rounded-sm overflow-hidden shrink-0"
                            style={{ border: '1px solid rgba(13,148,136,0.3)' }}>
                            <Image src={image} alt={name ?? "Avatar"} fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="h-7 w-7 rounded-sm flex items-center justify-center text-[10px] font-black shrink-0 font-mono"
                            style={{ background: 'rgba(13,148,136,0.15)', color: '#14b8a6', border: '1px solid rgba(13,148,136,0.3)' }}>
                            {name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-semibold text-slate-200 truncate">{name}</p>
                        <p className="text-[9px] font-mono text-slate-600 truncate">{email}</p>
                    </div>
                </div>

                {/* Role badge */}
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 font-mono text-[8.5px] font-bold uppercase tracking-widest border rounded-sm ${badge.color}`}>
                    <Lock size={7} /> {badge.label}
                </div>

                {/* Logout */}
                <form action={async () => { "use server"; await signOut(); }}>
                    <button type="submit"
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors group">
                        <LogOut size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        LOGOUT
                    </button>
                </form>
            </div>

            {/* Bottom teal accent */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
        </aside>
    );
}
