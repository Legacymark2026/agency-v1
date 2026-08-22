"use client";
/**
 * app/(dashboard)/dashboard/roles/page.tsx
 * ─────────────────────────────────────────────────────────────
 * Gestión de roles custom para SUPER_ADMIN.
 * Permite crear, editar y asignar permisos de ruta a cada rol.
 */

import { useState, useEffect, useTransition } from "react";
import { Shield, Plus, Trash2, Save, ChevronDown, ChevronUp, Users } from "lucide-react";
import { upsertRoleConfig, deleteRoleConfig, getRoleConfigs, getUsersWithRoles, updateUserRole } from "@/actions/role-config";
import { ALL_DASHBOARD_ROUTES } from "@/lib/rbac-routes";
import { toast } from "sonner";


interface RoleConfig {
    id: string;
    roleName: string;
    allowedRoutes: string[];
    description: string | null;
    isActive: boolean;
}

interface UserRow {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    deactivatedAt: Date | null;
}

// ── Dark HUD tokens ──────────────────────────────────────────
const D = {
    bg: "rgba(8,12,20,0.98)",
    card: "rgba(11,15,25,0.95)",
    border: "rgba(30,41,59,0.8)",
    teal: "#2dd4bf",
    tealDim: "rgba(45,212,191,0.12)",
};

export default function RolesPage() {
    const [roles, setRoles] = useState<RoleConfig[]>([]);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [expandedRole, setExpandedRole] = useState<string | null>(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDesc, setNewRoleDesc] = useState("");
    const [isPending, startTransition] = useTransition();

    // Cargar datos iniciales
    useEffect(() => {
        async function load() {
            const [cfg, usr] = await Promise.all([getRoleConfigs(), getUsersWithRoles()]);
            setRoles((cfg as RoleConfig[]).map(r => ({ ...r, allowedRoutes: r.allowedRoutes as string[] })));
            setUsers(usr);
        }
        load();
    }, []);

    function toggleRoute(roleName: string, route: string, checked: boolean) {
        setRoles(prev => prev.map(r => {
            if (r.roleName !== roleName) return r;
            const routes = checked
                ? [...new Set([...r.allowedRoutes, route])]
                : r.allowedRoutes.filter(rt => rt !== route);
            return { ...r, allowedRoutes: routes };
        }));
    }

    function handleSaveRole(role: RoleConfig) {
        startTransition(async () => {
            try {
                await upsertRoleConfig({
                    roleName: role.roleName,
                    allowedRoutes: role.allowedRoutes,
                    description: role.description ?? undefined,
                    isActive: role.isActive,
                });
                toast.success(`Rol "${role.roleName}" guardado correctamente`);
            } catch (e: any) {
                toast.error(e.message ?? "Error al guardar");
            }
        });
    }

    function handleCreateRole() {
        const name = newRoleName.trim().toLowerCase();
        if (!name) { toast.error("El nombre del rol es requerido"); return; }
        if (roles.find(r => r.roleName === name)) { toast.error("Ya existe ese rol"); return; }

        const newRole: RoleConfig = {
            id: Math.random().toString(36),
            roleName: name,
            allowedRoutes: ["/dashboard"],
            description: newRoleDesc || null,
            isActive: true,
        };
        setRoles(prev => [...prev, newRole]);
        setExpandedRole(name);
        setNewRoleName("");
        setNewRoleDesc("");

        // Guardar inmediatamente
        startTransition(async () => {
            try {
                await upsertRoleConfig({
                    roleName: name,
                    allowedRoutes: ["/dashboard"],
                    description: newRoleDesc || undefined,
                    isActive: true,
                });
                toast.success(`Rol "${name}" creado`);
            } catch (e: any) {
                toast.error(e.message ?? "Error al crear");
            }
        });
    }

    function handleDeleteRole(roleName: string) {
        if (!confirm(`¿Eliminar el rol "${roleName}"? Los usuarios con ese rol quedarán sin acceso.`)) return;
        startTransition(async () => {
            try {
                await deleteRoleConfig(roleName);
                setRoles(prev => prev.filter(r => r.roleName !== roleName));
                toast.success(`Rol "${roleName}" eliminado`);
            } catch (e: any) {
                toast.error(e.message ?? "Error al eliminar");
            }
        });
    }

    function handleChangeUserRole(userId: string, newRole: string) {
        startTransition(async () => {
            try {
                await updateUserRole(userId, newRole);
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                toast.success("Rol de usuario actualizado");
            } catch (e: any) {
                toast.error(e.message ?? "Error al actualizar");
            }
        });
    }

    const allRoleNames = [
        "super_admin", "admin", "content_manager", "client_admin", "client_user",
        ...roles.map(r => r.roleName),
    ];

    return (
        <div style={{ minHeight: "100vh", background: D.bg, padding: "2rem", color: "#e2e8f0" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: D.tealDim, border: `1px solid ${D.teal}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={20} color={D.teal} />
                </div>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Gestión de Roles Custom</h1>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>Define qué rutas puede acceder cada rol personalizado</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

                {/* ── Panel izquierdo: Roles ── */}
                <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: 600, color: D.teal, marginBottom: "1rem" }}>Roles configurados</h2>

                    {/* Crear nuevo rol */}
                    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
                        <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>Nuevo rol custom</p>
                        <input
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                            placeholder="nombre_del_rol"
                            style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: `1px solid ${D.border}`, borderRadius: 8, padding: "0.5rem 0.75rem", color: "#e2e8f0", marginBottom: "0.5rem", fontSize: "0.875rem" }}
                        />
                        <input
                            value={newRoleDesc}
                            onChange={e => setNewRoleDesc(e.target.value)}
                            placeholder="Descripción (opcional)"
                            style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: `1px solid ${D.border}`, borderRadius: 8, padding: "0.5rem 0.75rem", color: "#e2e8f0", marginBottom: "0.75rem", fontSize: "0.875rem" }}
                        />
                        <button
                            onClick={handleCreateRole}
                            disabled={isPending}
                            style={{ width: "100%", background: `linear-gradient(135deg, #0d7a72, #0d9488)`, color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}
                        >
                            <Plus size={16} /> Crear Rol
                        </button>
                    </div>

                    {/* Lista de roles */}
                    {roles.length === 0 && (
                        <p style={{ color: "#475569", textAlign: "center", padding: "2rem" }}>No hay roles configurados</p>
                    )}
                    {roles.map(role => (
                        <div key={role.roleName} style={{ background: D.card, border: `1px solid ${expandedRole === role.roleName ? D.teal : D.border}`, borderRadius: 12, marginBottom: "0.75rem", overflow: "hidden" }}>
                            {/* Role header */}
                            <div
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", cursor: "pointer" }}
                                onClick={() => setExpandedRole(expandedRole === role.roleName ? null : role.roleName)}
                            >
                                <div>
                                    <span style={{ fontWeight: 600, color: D.teal, fontSize: "0.875rem" }}>{role.roleName}</span>
                                    {role.description && <p style={{ color: "#475569", margin: 0, fontSize: "0.75rem" }}>{role.description}</p>}
                                    <span style={{ fontSize: "0.7rem", color: "#475569" }}>{role.allowedRoutes.length} rutas permitidas</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <button onClick={e => { e.stopPropagation(); handleDeleteRole(role.roleName); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 6, padding: "0.25rem 0.5rem", cursor: "pointer" }}>
                                        <Trash2 size={14} />
                                    </button>
                                    {expandedRole === role.roleName ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                                </div>
                            </div>

                            {/* Route checkboxes */}
                            {expandedRole === role.roleName && (
                                <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${D.border}` }}>
                                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.75rem 0 0.5rem" }}>Rutas con acceso:</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.25rem" }}>
                                        {ALL_DASHBOARD_ROUTES.map(({ route, label }) => {
                                            const checked = role.allowedRoutes.includes(route);
                                            return (
                                                <label key={route} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.25rem 0.5rem", borderRadius: 6, background: checked ? D.tealDim : "transparent" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={e => toggleRoute(role.roleName, route, e.target.checked)}
                                                        style={{ accentColor: D.teal }}
                                                    />
                                                    <span style={{ fontSize: "0.75rem", color: checked ? D.teal : "#94a3b8" }}>{label}</span>
                                                    <span style={{ fontSize: "0.65rem", color: "#475569", marginLeft: "auto" }}>{route}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => handleSaveRole(role)}
                                        disabled={isPending}
                                        style={{ marginTop: "0.75rem", width: "100%", background: `linear-gradient(135deg, #0d7a72, #0d9488)`, color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}
                                    >
                                        <Save size={14} /> Guardar Permisos
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Panel derecho: Usuarios ── */}
                <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: 600, color: D.teal, marginBottom: "1rem" }}>
                        <Users size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                        Asignar rol a usuarios
                    </h2>
                    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden" }}>
                        {users.map((user, i) => (
                            <div key={user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: i < users.length - 1 ? `1px solid ${D.border}` : "none" }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#e2e8f0", fontWeight: 500 }}>{user.name ?? user.email}</p>
                                    <p style={{ margin: 0, fontSize: "0.7rem", color: "#475569" }}>{user.email}</p>
                                </div>
                                <select
                                    value={user.role}
                                    onChange={e => handleChangeUserRole(user.id, e.target.value)}
                                    style={{ background: "rgba(15,23,42,0.9)", border: `1px solid ${D.border}`, color: "#e2e8f0", borderRadius: 6, padding: "0.3rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                                >
                                    {allRoleNames.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "0.75rem", textAlign: "center" }}>
                        ⚠️ El usuario debe cerrar sesión y volver a entrar para que los cambios de rol tomen efecto.
                    </p>
                </div>
            </div>
        </div>
    );
}
