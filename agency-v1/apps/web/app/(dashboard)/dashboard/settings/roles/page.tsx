"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Shield, Plus, Search, Trash2, Edit, Copy, 
  Check, X, Loader2, Users, ArrowUpDown, ChevronDown, AlertTriangle
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
  getCompanyUsersWithRoles
} from "@/actions/roles";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  priority: number;
  permissions: Array<{
    id: string;
    permission: {
      id: string;
      name: string;
      module: string;
      description: string | null;
    };
  }>;
  _count: {
    users: number;
  };
}

interface PermissionGroup {
  module: string;
  permissions: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

interface UserWithRole {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  role: {
    id: string;
    name: string;
    priority: number;
  } | null;
}

const MODULE_LABELS: Record<string, string> = {
  crm: "CRM y Ventas",
  marketing: "Marketing",
  content: "Contenido",
  finance: "Finanzas",
  kanban: "Kanban",
  hr: "Recursos Humanos",
  social: "Redes Sociales",
  settings: "Configuración",
  analytics: "Analítica",
  inbox: "Bandeja de Entrada",
  media: "Medios",
  events: "Eventos",
  ai: "Inteligencia Artificial",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserWithRole | null>(null);
  const [activeTab, setActiveTab] = useState<"roles" | "permissions" | "users">("roles");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes, statsRes, usersRes] = await Promise.all([
        getCompanyRoles(),
        getPermissionsGroupedByModule(),
        getRoleStats(),
        getCompanyUsersWithRoles(),
      ]);
      
      if (Array.isArray(rolesRes)) setRoles(rolesRes);
      if (Array.isArray(permsRes)) setPermissions(permsRes as any);
      if (statsRes) setStats(statsRes);
      if (Array.isArray(usersRes)) setUsers(usersRes);
    } catch (error) {
      console.error("Error loading roles:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateRole = async (data: {
    name: string;
    description: string;
    permissionIds: string[];
    isDefault: boolean;
  }) => {
    try {
      await createRole(data);
      toast.success("Rol creado exitosamente");
      setShowCreateModal(false);
      load();
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
      toast.success("Rol actualizado exitosamente");
      setEditingRole(null);
      load();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar rol");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("¿Estás seguro de eliminar este rol?")) return;
    try {
      await deleteRole(roleId);
      toast.success("Rol eliminado");
      load();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar rol");
    }
  };

  const handleAssignRole = async (userId: string, roleId: string | null) => {
    try {
      await assignUserRole(userId, roleId);
      toast.success("Rol asignado exitosamente");
      setAssigningUser(null);
      load();
    } catch (error: any) {
      toast.error(error.message || "Error al asignar rol");
    }
  };

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ds-heading-page flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-400" />
            Roles y Permisos
          </h1>
          <p className="ds-subtext mt-1">
            Gestiona los roles personalizados y permisos de tu empresa
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="ds-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="ds-card">
            <div className="text-2xl font-bold text-white">{stats.totalRoles}</div>
            <div className="text-sm text-slate-400">Roles activos</div>
          </div>
          <div className="ds-card">
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-sm text-slate-400">Total usuarios</div>
          </div>
          <div className="ds-card">
            <div className="text-2xl font-bold text-teal-400">{stats.usersWithRoles}</div>
            <div className="text-sm text-slate-400">Con rol asignado</div>
          </div>
          <div className="ds-card">
            <div className="text-2xl font-bold text-amber-400">{stats.usersWithoutRole}</div>
            <div className="text-sm text-slate-400">Sin rol</div>
          </div>
        </div>
      )}

      <div className="ds-tabs">
        <button
          className={`ds-tab ${activeTab === "roles" ? "ds-tab-active" : ""}`}
          onClick={() => setActiveTab("roles")}
        >
          Roles
        </button>
        <button
          className={`ds-tab ${activeTab === "permissions" ? "ds-tab-active" : ""}`}
          onClick={() => setActiveTab("permissions")}
        >
          Catálogo de Permisos
        </button>
        <button
          className={`ds-tab ${activeTab === "users" ? "ds-tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Usuarios
        </button>
      </div>

      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ds-input pl-10 w-full"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
          ) : (
            <div className="ds-table-container">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Permisos</th>
                    <th>Usuarios</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.id}>
                      <td className="font-medium">
                        <div className="flex items-center gap-2">
                          {role.name}
                          {role.isDefault && (
                            <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-slate-400">{role.description || "-"}</td>
                      <td>
                        <span className="text-sm text-slate-300">
                          {role.permissions.length} permisos
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{role._count.users}</span>
                        </div>
                      </td>
                      <td>
                        {role.isActive ? (
                          <span className="text-emerald-400">Activo</span>
                        ) : (
                          <span className="text-slate-400">Inactivo</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingRole(role)}
                            className="p-1.5 hover:bg-slate-700 rounded"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-1.5 hover:bg-slate-700 rounded"
                            title="Eliminar"
                            disabled={role._count.users > 0}
                          >
                            <Trash2 className={`w-4 h-4 ${role._count.users > 0 ? "text-slate-600" : "text-red-400"}`} />
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

      {activeTab === "permissions" && (
        <div className="space-y-6">
          {permissions.map((group) => (
            <div key={group.module} className="ds-card">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                {MODULE_LABELS[group.module] || group.module}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {group.permissions.map((perm) => (
                  <div 
                    key={perm.id}
                    className="text-sm p-2 bg-slate-800/50 rounded border border-slate-700"
                  >
                    <div className="font-mono text-teal-400 text-xs">{perm.name}</div>
                    <div className="text-slate-400 text-xs">{perm.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "users" && (
        <div className="ds-table-container">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol Asignado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.user.name || "Sin nombre"}</td>
                  <td className="text-slate-400">{user.user.email}</td>
                  <td>
                    {user.role ? (
                      <span className="text-teal-400">{user.role.name}</span>
                    ) : (
                      <span className="text-amber-400">Sin rol</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="ds-btn-outline text-xs"
                      onClick={() => setAssigningUser(user)}
                    >
                      Asignar Rol
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

function AssignRoleModal({
  user,
  roles,
  onClose,
  onSubmit,
}: {
  user: UserWithRole;
  roles: Role[];
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="ds-card max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Asignar Rol</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm text-slate-300 mb-4">
              Selecciona el rol para <span className="font-semibold text-white">{user.user.name || user.user.email}</span>.
            </p>
            <label className="ds-label">Rol</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="ds-input w-full bg-slate-900"
            >
              <option value="">Sin rol</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="ds-btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="ds-btn-primary">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleFormModal({
  role,
  permissions,
  onClose,
  onSubmit,
}: {
  role?: Role;
  permissions: PermissionGroup[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [selectedPerms, setSelectedPerms] = useState<string[]>(
    role?.permissions.map(p => p.permission.id) || []
  );
  const [isDefault, setIsDefault] = useState(role?.isDefault || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePerm = (permId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPerms(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ name, description, permissionIds: selectedPerms, isDefault });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="ds-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {role ? "Editar Rol" : "Crear Nuevo Rol"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="ds-label">Nombre del Rol</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ds-input w-full"
              placeholder="Ej: Admin de Ventas"
              required
            />
          </div>

          <div>
            <label className="ds-label">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ds-input w-full h-20"
              placeholder="Describe las responsabilidades de este rol..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-400"
            />
            <label htmlFor="isDefault" className="text-sm text-slate-300">
              Establecer como rol por defecto para nuevos usuarios
            </label>
          </div>

          <div>
            <label className="ds-label block mb-3">Permisos ({selectedPerms.length} seleccionados)</label>
            <div className="space-y-4 max-h-64 overflow-y-auto p-2 border border-slate-700 rounded-lg">
              {permissions.map((group) => (
                <div key={group.module} className="border border-slate-600 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-teal-400 mb-2">
                    {MODULE_LABELS[group.module] || group.module} ({group.permissions.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.permissions.map((perm) => (
                      <div
                        key={perm.id}
                        onClick={(e) => togglePerm(perm.id, e)}
                        className={`flex items-center gap-2 text-xs cursor-pointer p-2 rounded border transition-all ${
                          selectedPerms.includes(perm.id)
                            ? "bg-teal-500/20 border-teal-500 text-teal-300"
                            : "hover:bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          selectedPerms.includes(perm.id)
                            ? "bg-teal-500 border-teal-500"
                            : "border-slate-500"
                        }`}>
                          {selectedPerms.includes(perm.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate">{perm.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="ds-btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="ds-btn-primary">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : role ? "Guardar Cambios" : "Crear Rol"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}