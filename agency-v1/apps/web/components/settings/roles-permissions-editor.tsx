"use client";

import { ShieldCheck, Lock, Settings, Plus, Check, Trash2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { saveCustomRoles } from "@/actions/admin";

// ── Permisos completos del sistema, agrupados por módulo ───────────────────
// Los IDs deben coincidir con los que usa checkAccess() en DashboardSidebar
const PERMISSIONS = [
    {
        module: "Dashboard Principal",
        code: "CORE",
        actions: [
            { id: "dashboard.view", label: "Ver Dashboard Principal" },
        ]
    },
    {
        module: "Administración IAM",
        code: "IAM",
        actions: [
            { id: "iam.view_users", label: "Ver Directorio de Usuarios" },
            { id: "iam.manage_users", label: "Invitar / Eliminar Usuarios" },
            { id: "iam.manage_roles", label: "Gestionar Roles y Permisos" },
            { id: "iam.view_security", label: "Ver Logs de Seguridad" },
            { id: "manage_settings", label: "Acceso a Configuración del Sistema" },
        ]
    },
    {
        module: "Calendario y Eventos",
        code: "CAL",
        actions: [
            { id: "calendar.view", label: "Ver Calendario y Eventos" },
            { id: "calendar.create", label: "Crear / Editar Eventos" },
            { id: "calendar.delete", label: "Eliminar Eventos" },
        ]
    },
    {
        module: "CRM & Ventas",
        code: "CRM",
        actions: [
            { id: "crm.view_own", label: "Ver Leads Asignados" },
            { id: "crm.view_all", label: "Ver Todos los Leads" },
            { id: "crm.edit", label: "Editar Leads / Negocios" },
            { id: "crm.delete", label: "Eliminar Leads" },
            { id: "crm.export", label: "Exportar a CSV" },
            { id: "crm.pipeline", label: "Gestionar Pipeline" },
            { id: "crm.tasks", label: "Ver / Gestionar Tareas CRM" },
            { id: "crm.reports", label: "Ver Reportes CRM" },
            { id: "crm.templates", label: "Gestionar Plantillas de Email" },
            { id: "crm.scoring", label: "Ver / Configurar Lead Scoring" },
        ]
    },
    {
        module: "Marketing Hub",
        code: "MKT",
        actions: [
            { id: "mkt.view", label: "Ver CMO Dashboard" },
            { id: "mkt.campaigns", label: "Ver / Gestionar Campañas" },
            { id: "mkt.spend", label: "Ver Ad Spend (ROI)" },
            { id: "mkt.links", label: "Gestionar Link Tracker" },
            { id: "mkt.edit", label: "Crear / Editar Campañas" },
            { id: "mkt.send", label: "Enviar Correos Masivos" },
            { id: "mkt.integrations", label: "Gestionar APIs e Integraciones" },
            { id: "mkt.creative", label: "Acceso a Creative Studio" },
        ]
    },
    {
        module: "Automatización",
        code: "BOT",
        actions: [
            { id: "automation.view", label: "Ver Flujos de Automatización" },
            { id: "automation.manage", label: "Crear / Editar Automatizaciones" },
        ]
    },
    {
        module: "Inbox Omnicanal",
        code: "BCX",
        actions: [
            { id: "inbox.view", label: "Ver Bandeja de Entrada" },
            { id: "inbox.send", label: "Responder Mensajes" },
            { id: "inbox.manage", label: "Gestionar Conversaciones" },
        ]
    },
    {
        module: "Contenido (Blog & Web)",
        code: "CNT",
        actions: [
            { id: "content.view", label: "Ver Blog y Categorías" },
            { id: "content.create", label: "Crear / Editar Contenido" },
            { id: "content.publish", label: "Publicar Contenido" },
            { id: "content.delete", label: "Eliminar Contenido" },
        ]
    },
    {
        module: "Proyectos y Portafolio",
        code: "PRJ",
        actions: [
            { id: "projects.view", label: "Ver Proyectos" },
            { id: "projects.create", label: "Crear / Editar Proyectos" },
            { id: "projects.manage", label: "Gestionar Portafolio" },
        ]
    },
    {
        module: "Analítica y Reportes",
        code: "ANL",
        actions: [
            { id: "analytics.view", label: "Ver Analíticas Generales" },
            { id: "analytics.reports", label: "Ver Reportes Avanzados" },
            { id: "analytics.export", label: "Exportar Datos" },
        ]
    },
    {
        module: "Gestión de Archivos",
        code: "AST",
        actions: [
            { id: "assets.upload", label: "Subir y Gestionar Archivos" },
            { id: "assets.delete", label: "Eliminar Archivos" },
            { id: "client.dashboard", label: "Acceso a Portal de Clientes" },
        ]
    },
    {
        module: "Equipo",
        code: "TEM",
        actions: [
            { id: "team.view", label: "Ver Directorio del Equipo" },
            { id: "team.invite", label: "Invitar / Eliminar Miembros" },
            { id: "team.roles", label: "Modificar Roles del Equipo" },
        ]
    },
    {
        module: "Finanzas y Tesorería",
        code: "FIN",
        actions: [
            { id: "treasury.view", label: "Ver Cuentas y Transacciones" },
            { id: "treasury.manage", label: "Gestionar Cuentas y Movimientos" },
            { id: "proposals.view", label: "Ver Propuestas Comerciales" },
            { id: "proposals.manage", label: "Crear y Enviar Propuestas" },
        ]
    },
    {
        module: "RRHH y Operaciones",
        code: "OPS",
        actions: [
            { id: "payroll.view", label: "Ver Nómina y Operaciones" },
            { id: "payroll.manage", label: "Gestionar Nómina y Kanban" },
        ]
    },
    {
        module: "Inteligencia Artificial",
        code: "AGI",
        actions: [
            { id: "agents.manage", label: "Configurar / Gestionar Agentes IA" },
        ]
    },
];

const COLORS = ["teal", "blue", "indigo", "violet", "amber", "red", "emerald", "sky", "rose", "slate"];

interface CustomRole { id: string; name: string; color: string; permissions: string[]; }

export function RolesPermissionsEditor({ customRoles = [], currentUserRole }: { customRoles?: any[]; currentUserRole?: string }) {
    const [roles, setRoles] = useState<CustomRole[]>(customRoles.length > 0 ? customRoles : []);
    const canManage = currentUserRole === "super_admin" || currentUserRole === "admin";
    const [selectedRole, setSelectedRole] = useState<CustomRole | null>(roles[0] || null);
    const [activePermissions, setActivePermissions] = useState<string[]>(selectedRole?.permissions ?? []);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(PERMISSIONS.map(p => p.code)));
    const [isSaving, setIsSaving] = useState(false);

    // New role dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleColor, setNewRoleColor] = useState("teal");

    useEffect(() => { if (customRoles.length > 0) setRoles(customRoles); }, [customRoles]);

    useEffect(() => {
        if (selectedRole) setActivePermissions(selectedRole.permissions ?? []);
    }, [selectedRole]);

    const toggleModule = (code: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            next.has(code) ? next.delete(code) : next.add(code);
            return next;
        });
    };

    const handleToggle = (id: string) => {
        if (!canManage) return;
        setActivePermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const toggleAllInModule = (actions: { id: string }[]) => {
        if (!canManage) return;
        const ids = actions.map(a => a.id);
        const allActive = ids.every(id => activePermissions.includes(id));
        setActivePermissions(prev =>
            allActive ? prev.filter(p => !ids.includes(p)) : [...new Set([...prev, ...ids])]
        );
    };

    const handleSave = async () => {
        if (!selectedRole || !canManage) return;
        setIsSaving(true);
        const updated = roles.map(r => r.id === selectedRole.id ? { ...r, permissions: activePermissions } : r);
        setRoles(updated);
        setSelectedRole({ ...selectedRole, permissions: activePermissions });
        const res = await saveCustomRoles(updated);
        setIsSaving(false);
        res?.success
            ? toast.success(`Permisos de '${selectedRole.name}' guardados.`)
            : toast.error(res?.error || "Error al guardar");
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) { toast.error("El nombre no puede estar vacío"); return; }
        const newRole: CustomRole = {
            id: newRoleName.toLowerCase().replace(/\s+/g, "_"),
            name: newRoleName,
            color: newRoleColor,
            permissions: [],
        };
        const updated = [...roles, newRole];
        setRoles(updated);
        setSelectedRole(newRole);
        setActivePermissions([]);
        setNewRoleName("");
        setIsDialogOpen(false);
        const res = await saveCustomRoles(updated);
        res?.success
            ? toast.success(`Rol '${newRole.name}' creado.`)
            : (toast.error(res?.error || "Error al crear"), setRoles(roles));
    };

    const handleDeleteRole = async (roleId: string) => {
        const updated = roles.filter(r => r.id !== roleId);
        setRoles(updated);
        setSelectedRole(updated[0] ?? null);
        const res = await saveCustomRoles(updated);
        res?.success ? toast.success("Rol eliminado.") : toast.error("Error al eliminar");
    };

    return (
        <div className="relative overflow-hidden mt-6"
            style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '0.15rem' }}>
            {/* Teal top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

            {/* Header */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.7)' }}>
                <div className="flex items-start gap-4">
                    <div className="ds-icon-box w-11 h-11 shrink-0">
                        <ShieldCheck className="w-4.5 h-4.5 text-teal-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[15px] font-black text-slate-100">Control de Acceso Basado en Roles</h3>
                            <span className="ds-badge ds-badge-teal">RBAC_CTRL</span>
                        </div>
                        <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">
                            Define módulos · Acciones · Permisos granulares por rol personalizado
                        </p>
                    </div>
                </div>
                {!canManage && (
                    <div className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-amber-400 uppercase tracking-widest"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.15rem' }}>
                        <AlertTriangle size={10} /> Requiere SuperAdmin
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row min-h-[600px]">
                {/* ── LEFT: Role list ─────────────────────────────────── */}
                <div className="w-full lg:w-64 shrink-0 p-4 space-y-1.5"
                    style={{ borderRight: '1px solid rgba(30,41,59,0.7)', background: 'rgba(10,17,35,0.3)' }}>
                    <p className="font-mono text-xs text-slate-700 uppercase tracking-[0.16em] px-2 pb-2 mb-2"
                        style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                        Roles personalizados
                    </p>

                    {roles.length === 0 && (
                        <p className="font-mono text-xs text-slate-700 text-center py-6">&gt; Sin roles creados_</p>
                    )}

                    {roles.map((role) => {
                        const isActive = selectedRole?.id === role.id;
                        return (
                            <div key={role.id} className="group flex items-center gap-1.5">
                                <button
                                    onClick={() => setSelectedRole(role)}
                                    className={`flex-1 text-left px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center justify-between ${isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                                    style={isActive
                                        ? { background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)' }
                                        : { background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(30,41,59,0.5)' }}
                                >
                                    <span className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full bg-${role.color}-500 shrink-0`} />
                                        {role.name}
                                    </span>
                                    {isActive && <Settings size={10} className="opacity-40" />}
                                </button>
                                {canManage && (
                                    <button
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-700 hover:text-red-400 transition-all rounded-sm"
                                        title="Eliminar rol">
                                        <Trash2 size={10} />
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {/* Create role */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <button
                                disabled={!canManage}
                                className="w-full flex items-center justify-center gap-1.5 mt-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-teal-400 transition-all rounded-sm disabled:opacity-30"
                                style={{ border: '1px dashed rgba(30,41,59,0.8)' }}>
                                <Plus size={10} /> Crear Nuevo Rol
                            </button>
                        </DialogTrigger>
                        <DialogContent>
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
                            <DialogHeader>
                                <DialogTitle className="font-black text-slate-100 tracking-tight">Crear Rol Personalizado</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div>
                                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-2">Nombre del Rol</label>
                                    <input
                                        placeholder="ej. Analista de Datos"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateRole()}
                                        autoFocus
                                        className="w-full px-3 py-2 font-mono text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none rounded-sm"
                                        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}
                                    />
                                </div>
                                <div>
                                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-2">Color del badge</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(c => (
                                            <button key={c} onClick={() => setNewRoleColor(c)}
                                                className={`w-5 h-5 rounded-sm bg-${c}-500 transition-all ${newRoleColor === c ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-50 hover:opacity-100'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <button onClick={() => setIsDialogOpen(false)}
                                    className="px-3 py-2 font-mono text-xs text-slate-500 hover:text-slate-300 uppercase tracking-widest">
                                    Cancelar
                                </button>
                                <button onClick={handleCreateRole}
                                    className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white rounded-sm"
                                    style={{ background: 'rgba(13,148,136,0.25)', border: '1px solid rgba(13,148,136,0.5)' }}>
                                    Crear Rol
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* ── RIGHT: Permissions matrix ────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!selectedRole ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <div className="ds-icon-box w-14 h-14 mx-auto mb-5">
                                <ShieldCheck className="w-6 h-6 text-slate-700" />
                            </div>
                            <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; Selecciona un rol para editar sus permisos_</p>
                        </div>
                    ) : (
                        <>
                            {/* Role header */}
                            <div className="flex items-center justify-between px-6 py-4 shrink-0"
                                style={{ borderBottom: '1px solid rgba(30,41,59,0.7)', background: 'rgba(10,17,35,0.3)' }}>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`w-2 h-2 rounded-full bg-${selectedRole.color}-500`} />
                                        <h4 className="font-black text-[14px] text-slate-100">{selectedRole.name}</h4>
                                    </div>
                                    <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">
                                        {activePermissions.length} / {PERMISSIONS.reduce((s, g) => s + g.actions.length, 0)} permisos habilitados
                                    </p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={!canManage || isSaving}
                                    className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white rounded-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)' }}>
                                    {isSaving ? (
                                        <><span className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" /> Guardando...</>
                                    ) : (
                                        <><Check size={11} /> Guardar Cambios</>
                                    )}
                                </button>
                            </div>

                            {/* Permissions accordion */}
                            <div className="flex-1 overflow-auto p-4 space-y-2">
                                {PERMISSIONS.map((group) => {
                                    const isExpanded = expandedModules.has(group.code);
                                    const groupIds = group.actions.map(a => a.id);
                                    const activeCount = groupIds.filter(id => activePermissions.includes(id)).length;
                                    const allActive = activeCount === groupIds.length;

                                    return (
                                        <div key={group.code} className="rounded-sm overflow-hidden"
                                            style={{ border: '1px solid rgba(30,41,59,0.7)' }}>
                                            {/* Group header */}
                                            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                                                style={{ background: 'rgba(15,23,42,0.4)' }}
                                                onClick={() => toggleModule(group.code)}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleAllInModule(group.actions); }}
                                                    disabled={!canManage}
                                                    className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-all ${allActive && activeCount > 0 ? 'border-teal-500 bg-teal-500/20' : 'border-slate-700'} disabled:opacity-40`}
                                                    title="Activar/desactivar todos">
                                                    {allActive && activeCount > 0 && <Check size={9} className="text-teal-400" />}
                                                </button>
                                                <div className="flex-1 flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-teal-600 uppercase tracking-widest">{group.code}</span>
                                                    <span className="font-bold text-[12px] text-slate-300">{group.module}</span>
                                                </div>
                                                <span className="font-mono text-xs text-slate-600 mr-2">{activeCount}/{group.actions.length}</span>
                                                {isExpanded ? <ChevronDown size={12} className="text-slate-600" /> : <ChevronRight size={12} className="text-slate-600" />}
                                            </div>

                                            {/* Actions grid */}
                                            {isExpanded && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3"
                                                    style={{ background: 'rgba(10,17,35,0.2)' }}>
                                                    {group.actions.map((action) => {
                                                        const isActive = activePermissions.includes(action.id);
                                                        return (
                                                            <button
                                                                key={action.id}
                                                                onClick={() => handleToggle(action.id)}
                                                                disabled={!canManage}
                                                                className={`text-left flex items-start gap-3 p-3 rounded-sm transition-all ${isActive ? '' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
                                                                style={isActive
                                                                    ? { background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)' }
                                                                    : { background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(30,41,59,0.6)' }}>
                                                                <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-all ${isActive ? 'border-teal-500 bg-teal-500/20' : 'border-slate-700'}`}>
                                                                    {isActive && <Check size={9} className="text-teal-400" />}
                                                                </div>
                                                                <div>
                                                                    <span className={`block text-xs font-bold ${isActive ? 'text-slate-100' : 'text-slate-500'}`}>
                                                                        {action.label}
                                                                    </span>
                                                                    <span className="block font-mono text-xs text-slate-700 mt-0.5 uppercase tracking-widest">
                                                                        SCOPE: {action.id}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
