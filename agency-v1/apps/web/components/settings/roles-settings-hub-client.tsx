"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Shield, Plus, Search, Trash2, Edit, Copy, 
  Check, X, Loader2, Users, Layers, AlertTriangle, 
  Lock, RefreshCw, Key, ShieldAlert, Sparkles, Filter
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
  getDelegatedUserManagementRole
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

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  const tabs: { id: RbacSubTab; label: string; icon: any; count?: number; badge?: string }[] = [
    { id: "roles", label: "Directorio de Roles", icon: Shield, count: roles.length },
    { id: "matrix", label: "Matriz RBAC Comparativa", icon: Layers, badge: "Visual" },
    { id: "users", label: "Asignación de Usuarios", icon: Users, count: users.length },
    { id: "delegation", label: "Gobernanza & Delegación", icon: Lock, badge: "Zero-Trust" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header Corporativo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--ds-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Control de Accesos (IAM)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              RBAC Granular
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Roles, Permisos & Gobernanza Multi-Tenant
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Define la matriz de seguridad de tu organización, asigna permisos funcionales por módulo y delega la gestión de credenciales con aislamiento estricto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Crear Rol Personalizado
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Roles Configurados</span>
            <span className="text-2xl font-black text-white font-mono">{stats.totalRoles}</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Usuarios</span>
            <span className="text-2xl font-black text-white font-mono">{stats.totalUsers}</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Con Rol Asignado</span>
            <span className="text-2xl font-black text-teal-400 font-mono">{stats.usersWithRoles}</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sin Rol Asignado</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{stats.usersWithoutRole}</span>
          </div>
        </div>
      )}

      {/* Pestañas de Navegación Segmentada */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                isActive
                  ? "bg-slate-900 text-white border border-teal-500/30 shadow-md shadow-teal-500/10 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
              <span className="text-xs">{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  isActive ? "bg-teal-500/20 text-teal-300" : "bg-slate-800 text-slate-400"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Subtab 1: Directorio de Roles ──────────────────────────────────── */}
      {activeTab === "roles" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar roles por nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              onClick={loadData}
              className="px-3 py-2 text-xs rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 self-start sm:self-auto font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Actualizar
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
              <span className="text-xs">Cargando directorio de roles...</span>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">Nombre del Rol</th>
                    <th className="p-4">Descripción Funcional</th>
                    <th className="p-4">Permisos</th>
                    <th className="p-4 text-center">Usuarios</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{role.name}</span>
                          {role.isDefault && (
                            <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono font-bold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs truncate">
                        {role.description || "—"}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 font-mono text-[11px] text-teal-400">
                          {role.permissions?.length || 0} permisos
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                          <Users className="w-3.5 h-3.5 text-slate-500" /> {role._count?.users || 0}
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

      {/* ── Subtab 3: Asignación de Usuarios ───────────────────────────────── */}
      {activeTab === "users" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Directorio de Miembros y Roles Asignados</h3>
              <p className="text-xs text-slate-400">Vincula o reasigna perfiles de acceso a cada usuario del equipo.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{users.length} miembros</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-bold text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-teal-400">
                      {u.user.name ? u.user.name.slice(0, 2).toUpperCase() : "U"}
                    </div>
                    <span>{u.user.name || "Sin nombre"}</span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{u.user.email}</td>
                  <td className="p-4">
                    {u.role ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold text-xs">
                        <Shield className="w-3 h-3" /> {u.role.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs">
                        <AlertTriangle className="w-3 h-3" /> Sin Rol
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setAssigningUser(u)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                    >
                      Reasignar Rol
                    </button>
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

      {/* Modales de Creación y Edición */}
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
    setIsSubmitting(true);
    await onSubmit({ name, description, permissionIds: selectedPerms, isDefault });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            {role ? "Editar Rol Personalizado" : "Crear Nuevo Rol"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 uppercase tracking-wider block">
              Nombre del Rol
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Líder de Operaciones, Auditor Financiero"
              className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-3 focus:border-teal-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 uppercase tracking-wider block">
              Descripción de Funciones
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla las responsabilidades que otorga este rol..."
              className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-3 h-20 focus:border-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-teal-500 rounded"
            />
            <label htmlFor="isDefault" className="text-xs text-slate-300 font-medium cursor-pointer">
              Asignar automáticamente como rol por defecto a nuevos colaboradores
            </label>
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
