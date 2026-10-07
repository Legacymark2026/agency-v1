"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Shield, Plus, Search, Trash2, Edit, Copy, 
  Check, X, Loader2, Users, Layers, AlertTriangle, 
  Lock, RefreshCw, Key, ShieldAlert, Sparkles, Filter,
  UserPlus, KeyRound, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { 
  getCompanyRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
  getPermissionsGroupedByModule,
  getRoleStats,
  assignUserRole,
  getCompanyUsersWithRoles,
  getDelegatedUserManagementRole,
  createCompanyUserWithCredentials,
  setUserPassword
} from "@/actions/roles";
import { RbacMatrixView } from "./rbac-matrix-view";
import { DelegationGovernanceCard } from "./delegation-governance-card";

type RbacSubTab = "roles" | "matrix" | "users" | "delegation";

const MODULE_LABELS: Record<string, string> = {
  crm: "CRM y Ventas",
  marketing: "Marketing Hub",
  content: "Contenido y Blog",
  finance: "Finanzas y Tesorería",
  kanban: "Kanban y Tareas",
  hr: "Recursos Humanos y Nómina",
  social: "Redes Sociales",
  settings: "Configuración y Gobernanza",
  analytics: "Analítica y Métricas",
  inbox: "Bandeja de Entrada",
  media: "Medios y Video",
  events: "Eventos y Calendario",
  ai: "Inteligencia Artificial",
  iam: "Identidad y Accesos",
};

export function RolesSettingsHubClient() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [assigningUser, setAssigningUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<RbacSubTab>("roles");
  const [delegationInfo, setDelegationInfo] = useState<{ isOwner: boolean; delegatedRole: any } | null>(null);
  
  // Modales de usuarios y contraseñas
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes, statsRes, usersRes, delegRes] = await Promise.all([
        getCompanyRoles(),
        getPermissionsGroupedByModule(),
        getRoleStats(),
        getCompanyUsersWithRoles(),
        getDelegatedUserManagementRole(),
      ]);

      if (Array.isArray(rolesRes)) setRoles(rolesRes);
      if (Array.isArray(permsRes)) setPermissions(permsRes as any);
      if (statsRes) setStats(statsRes);
      if (Array.isArray(usersRes)) setUsers(usersRes);
      if (delegRes) setDelegationInfo(delegRes);
    } catch (error) {
      console.error("Error loading RBAC hub:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRole = async (data: {
    name: string;
    description: string;
    permissionIds: string[];
    isDefault: boolean;
  }) => {
    try {
      await createRole(data);
      toast.success("Rol personalizado creado exitosamente.");
      setShowCreateModal(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al crear rol");
    }
  };

  const handleUpdateRole = async (data: {
    name: string;
    description: string;
    permissionIds: string[];
    isDefault: boolean;
  }) => {
    if (!editingRole) return;
    try {
      await updateRole(editingRole.id, data);
      toast.success("Rol actualizado exitosamente.");
      setEditingRole(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar rol");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("¿Estás seguro de eliminar este rol? Esta acción no se puede deshacer.")) return;
    try {
      await deleteRole(roleId);
      toast.success("Rol eliminado del sistema.");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar rol");
    }
  };

  const handleAssignRole = async (userId: string, roleId: string | null) => {
    try {
      await assignUserRole(userId, roleId);
      toast.success("Rol asignado correctamente.");
      setAssigningUser(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al asignar rol");
    }
  };

  const handleCreateUserWithCredentials = async (data: {
    name: string;
    email: string;
    password?: string;
    roleId?: string | null;
  }) => {
    try {
      await createCompanyUserWithCredentials(data);
      toast.success("Usuario creado y aprovisionado con sus credenciales correctamente.");
      setShowCreateUserModal(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario y credenciales");
    }
  };

  const handleSetUserPassword = async (userId: string, pass: string) => {
    try {
      await setUserPassword(userId, pass);
      toast.success("Contraseña actualizada exitosamente.");
      setPasswordResetUser(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar contraseña");
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ── Top Executive Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> GOBERNANZA & ZERO-TRUST IAM
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Roles, Permisos y Credenciales
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestión granular de identidades, perfiles RBAC y control delegado de credenciales multi-inquilino.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
            title="Sincronizar con el motor"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-teal-400" : ""}`} />
          </button>
          
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/30 text-teal-300 font-bold text-xs transition shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-teal-400" />
            Crear Usuario & Contraseña
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-lg shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            Crear Nuevo Rol
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Roles Activos</span>
              <span className="text-xl font-bold text-white font-mono">{stats?.totalRoles ?? roles.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Permisos en Catálogo</span>
              <span className="text-xl font-bold text-white font-mono">
                {permissions.reduce((sum, g) => sum + g.permissions.length, 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Usuarios Asignados</span>
              <span className="text-xl font-bold text-white font-mono">{users.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Delegación de Creación</span>
              <span className="text-xs font-bold text-amber-300 block truncate max-w-[120px]">
                {delegationInfo?.delegatedRole ? delegationInfo.delegatedRole.name : "Solo Owner"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subtabs Navigation Bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-px">
        {[
          { id: "roles", label: "Directorio de Roles", icon: Shield, count: roles.length },
          { id: "matrix", label: "Matriz RBAC Comparativa", icon: Layers },
          { id: "users", label: "Usuarios y Credenciales", icon: Users, count: users.length },
          { id: "delegation", label: "Gobernanza & Delegación", icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RbacSubTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-teal-400 text-teal-400 bg-teal-500/5 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                  isActive ? "bg-teal-500/20 text-teal-300" : "bg-slate-800 text-slate-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Subtab 1: Directorio de Roles ───────────────────────────────────── */}
      {activeTab === "roles" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar roles por nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Mostrando {filteredRoles.length} de {roles.length} roles
            </span>
          </div>

          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 border border-slate-800 rounded-3xl bg-slate-900/40">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <span className="text-xs text-slate-400">Consultando roles en el motor de base de datos...</span>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
              <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">No se encontraron roles</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No hay roles que coincidan con los criterios de búsqueda o aún no has creado roles personalizados.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">Rol & Nivel</th>
                    <th className="p-4">Descripción</th>
                    <th className="p-4 text-center">Permisos</th>
                    <th className="p-4 text-center">Usuarios</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-xs">
                            {role.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{role.name}</span>
                              {role.isDefault && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">Prioridad: {role.priority}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs truncate">
                        {role.description || <span className="italic text-slate-600">Sin descripción</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[11px]">
                          {role.permissions?.length || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-mono font-bold text-[11px]">
                          {role._count?.users || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          role.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {role.isActive ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingRole(role)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            title="Editar rol"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition"
                            title="Eliminar rol"
                            disabled={role._count?.users > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Subtab 2: Matriz RBAC Comparativa ───────────────────────────────── */}
      {activeTab === "matrix" && (
        <div className="animate-in fade-in duration-200">
          <RbacMatrixView roles={roles} permissionGroups={permissions} />
        </div>
      )}

      {/* ── Subtab 3: Asignación de Usuarios & Credenciales ──────────────────── */}
      {activeTab === "users" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Directorio de Miembros, Roles y Credenciales</h3>
              <p className="text-xs text-slate-400">Vincula perfiles de acceso, asigna o resetea contraseñas a los colaboradores de tu empresa.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">{users.length} miembros</span>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
              >
                <UserPlus className="w-3.5 h-3.5" /> Nuevo Usuario
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4 text-right">Acciones de Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-bold text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-teal-400">
                      {u.user.name ? u.user.name.slice(0, 2).toUpperCase() : "U"}
                    </div>
                    <div>
                      <span>{u.user.name || "Sin nombre"}</span>
                      {u.tenantUserId && (
                        <span className="block text-[10px] text-slate-500 font-mono">ID: {u.tenantUserId}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{u.user.email}</td>
                  <td className="p-4">
                    {u.role ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold text-xs">
                        <Shield className="w-3 h-3" /> {u.role.name}
                      </span>
                    ) : u.roleName ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold text-xs">
                        <Shield className="w-3 h-3" /> {u.roleName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs">
                        <AlertTriangle className="w-3 h-3" /> Sin Rol
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPasswordResetUser(u)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
                        title="Asignar o cambiar contraseña de acceso"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Contraseña
                      </button>
                      <button
                        onClick={() => setAssigningUser(u)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                      >
                        Reasignar Rol
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Subtab 4: Gobernanza & Delegación ───────────────────────────────── */}
      {activeTab === "delegation" && (
        <div className="animate-in fade-in duration-200 space-y-6">
          <DelegationGovernanceCard
            roles={roles}
            delegationInfo={delegationInfo}
            onRefresh={loadData}
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-teal-400" />
              Políticas de Aislamiento & Prevención de Escalada de Privilegios
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-teal-400 block">1. Delegación Exclusiva 1-a-1</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  No es posible delegar la creación de contraseñas a múltiples roles simultáneamente, minimizando la superficie de ataque.
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-teal-400 block">2. Inmutabilidad de Propietario</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  El rol de Propietario (Owner) no puede ser revocado ni transferido por usuarios delegados.
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-teal-400 block">3. Sellado Criptográfico Audit Trail</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Cada delegación, revocación o cambio de privilegios genera un registro inalterable en la bitácora forense de auditoría.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Creación y Edición de Roles */}
      {showCreateModal && (
        <RoleFormModal
          permissions={permissions}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRole}
        />
      )}

      {editingRole && (
        <RoleFormModal
          role={editingRole}
          permissions={permissions}
          onClose={() => setEditingRole(null)}
          onSubmit={handleUpdateRole}
        />
      )}

      {assigningUser && (
        <AssignRoleModal
          user={assigningUser}
          roles={roles}
          onClose={() => setAssigningUser(null)}
          onSubmit={handleAssignRole}
        />
      )}

      {/* Modal de Creación de Usuario & Contraseña Directa */}
      {showCreateUserModal && (
        <CreateUserModal
          roles={roles}
          onClose={() => setShowCreateUserModal(false)}
          onSubmit={handleCreateUserWithCredentials}
        />
      )}

      {/* Modal de Asignación / Reseteo de Contraseña */}
      {passwordResetUser && (
        <ResetPasswordModal
          user={passwordResetUser}
          onClose={() => setPasswordResetUser(null)}
          onSubmit={handleSetUserPassword}
        />
      )}
    </div>
  );
}

function RoleFormModal({
  role,
  permissions,
  onClose,
  onSubmit,
}: {
  role?: any;
  permissions: any[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [selectedPerms, setSelectedPerms] = useState<string[]>(
    role?.permissions?.map((p: any) => p.permission.id) || []
  );
  const [isDefault, setIsDefault] = useState(role?.isDefault || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePerm = (permId: string) => {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("El nombre del rol es requerido");
    setIsSubmitting(true);
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      permissionIds: selectedPerms,
      isDefault,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            {role ? `Editar Rol: ${role.name}` : "Crear Rol Personalizado"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 flex-1 overflow-y-auto text-xs pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 uppercase tracking-wider block">
                Nombre del Rol
              </label>
              <input
                type="text"
                placeholder="Ej. Gerente de Operaciones"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-teal-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 uppercase tracking-wider block">
                Descripción
              </label>
              <input
                type="text"
                placeholder="Breve descripción de las funciones"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-slate-300 uppercase tracking-wider block">
              Permisos del Sistema ({selectedPerms.length} asignados)
            </label>
            <div className="space-y-4 max-h-64 overflow-y-auto p-3 border border-slate-800 rounded-2xl bg-slate-950/60">
              {permissions.map((group) => (
                <div key={group.module} className="border border-slate-800 rounded-xl p-3 bg-slate-900/60">
                  <h4 className="text-xs font-bold text-teal-400 mb-2">
                    {MODULE_LABELS[group.module] || group.module} ({group.permissions.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.permissions.map((perm: any) => {
                      const isSelected = selectedPerms.includes(perm.id);
                      return (
                        <div
                          key={perm.id}
                          onClick={() => togglePerm(perm.id)}
                          className={`p-2 rounded-lg border text-[11px] cursor-pointer transition flex items-start gap-2 ${
                            isSelected
                              ? "bg-teal-500/10 border-teal-500/30 text-teal-300 font-medium"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-teal-500 text-slate-950 font-bold" : "border border-slate-700"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="block font-mono text-[10px] text-slate-300 font-bold">{perm.name}</span>
                            <span className="text-[10px] text-slate-400 line-clamp-1">{perm.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : role ? (
                "Guardar Cambios"
              ) : (
                "Crear Rol"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignRoleModal({
  user,
  roles,
  onClose,
  onSubmit,
}: {
  user: any;
  roles: any[];
  onClose: () => void;
  onSubmit: (userId: string, roleId: string | null) => Promise<void>;
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(user.role?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(user.user.id, selectedRoleId || null);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            Asignar Perfil de Acceso
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <p className="text-slate-400">
            Selecciona el nivel de acceso para <strong className="text-white">{user.user.name || user.user.email}</strong>.
          </p>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 uppercase tracking-wider block">
              Rol Asignado
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-3 focus:border-teal-500 outline-none"
            >
              <option value="">-- Sin Rol (Solo lectura o limitado) --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.permissions?.length || 0} permisos)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Asignación"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateUserModal({
  roles,
  onClose,
  onSubmit,
}: {
  roles: any[];
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password?: string; roleId?: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("El correo electrónico es requerido");
    setIsSubmitting(true);
    await onSubmit({
      name: name.trim(),
      email: email.trim(),
      password: password.trim() || undefined,
      roleId: roleId || null,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-teal-400">
            <UserPlus className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Crear Usuario y Asignar Credencial</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-teal-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Correo Electrónico (Login)</label>
            <input
              type="email"
              required
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-teal-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Contraseña de Acceso</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 pr-10 focus:border-teal-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">Puedes dejarlo en blanco si el usuario se activará vía invitación.</p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Rol / Perfil RBAC</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-teal-500 outline-none"
            >
              <option value="">-- Sin Rol Inicial --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear y Provisionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
}: {
  user: any;
  onClose: () => void;
  onSubmit: (userId: string, pass: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      return toast.error("La contraseña debe tener al menos 6 caracteres");
    }
    setIsSubmitting(true);
    await onSubmit(user.user.id, password);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Asignar / Cambiar Contraseña</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Estableciendo nueva credencial para <strong className="text-white">{user.user.name || user.user.email}</strong>.
          </p>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 pr-10 focus:border-amber-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
