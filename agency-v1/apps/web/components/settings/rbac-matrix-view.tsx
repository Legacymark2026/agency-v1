"use client";

import { useState, useMemo } from "react";
import { 
  Shield, Check, X, Search, Filter, Info, 
  Layers, Lock, Sliders, CheckCircle2, ChevronRight
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  permissions: Array<{
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

const MODULE_LABELS: Record<string, { label: string; color: string }> = {
  crm: { label: "CRM & Ventas", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  marketing: { label: "Marketing Hub", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  content: { label: "Contenido & Blog", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  finance: { label: "Finanzas & Tesorería", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  kanban: { label: "Kanban & Tareas", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  hr: { label: "Recursos Humanos & Nómina", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  social: { label: "Redes Sociales", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  settings: { label: "Gobernanza & Ajustes", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  analytics: { label: "Analítica & KPIs", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  inbox: { label: "Inbox Omnicanal", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  media: { label: "Creative Media Studio", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  events: { label: "Agenda & Calendario", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  ai: { label: "Agentes Cognitivos IA", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  iam: { label: "Identidad & Accesos (IAM)", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
};

export function RbacMatrixView({
  roles,
  permissionGroups,
}: {
  roles: Role[];
  permissionGroups: PermissionGroup[];
}) {
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");

  // Flattened permission lookup per role: roleId -> Set of permIds/names
  const rolePermissionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    roles.forEach((r) => {
      const set = new Set<string>();
      r.permissions.forEach((p) => {
        set.add(p.permission.id);
        set.add(p.permission.name);
      });
      map.set(r.id, set);
    });
    return map;
  }, [roles]);

  const allModules = useMemo(() => {
    return Array.from(new Set(permissionGroups.map((g) => g.module)));
  }, [permissionGroups]);

  const filteredGroups = useMemo(() => {
    return permissionGroups
      .filter((g) => selectedModule === "ALL" || g.module === selectedModule)
      .map((g) => {
        const perms = g.permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
        );
        return { ...g, permissions: perms };
      })
      .filter((g) => g.permissions.length > 0);
  }, [permissionGroups, selectedModule, search]);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por código de permiso o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5" /> Módulo:
          </span>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs rounded-xl border border-slate-700 bg-slate-950 text-white px-3 py-2 outline-none focus:border-teal-500"
          >
            <option value="ALL">Todos los Módulos ({allModules.length})</option>
            {allModules.map((m) => (
              <option key={m} value={m}>
                {MODULE_LABELS[m]?.label || m.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Matriz Visual Scrollable */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800">
                <th className="p-4 font-bold text-slate-300 min-w-[280px] sticky left-0 bg-slate-950 z-10 border-r border-slate-800">
                  Capacidad Operativa / Permiso
                </th>
                {roles.map((role) => (
                  <th key={role.id} className="p-4 text-center min-w-[140px] font-bold text-white border-r border-slate-800/60 last:border-r-0">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-xs truncate max-w-[130px]">{role.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {role._count.users} {role._count.users === 1 ? "usuario" : "usuarios"}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGroups.map((group) => {
                const badgeInfo = MODULE_LABELS[group.module] || {
                  label: group.module.toUpperCase(),
                  color: "text-slate-300 bg-slate-800 border-slate-700",
                };

                return (
                  <tr key={group.module} className="contents">
                    {/* Header de Módulo */}
                    <tr className="bg-slate-950/40">
                      <td colSpan={roles.length + 1} className="py-2.5 px-4 font-bold text-xs">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badgeInfo.color}`}>
                          <Layers className="w-3 h-3" /> {badgeInfo.label}
                        </span>
                      </td>
                    </tr>

                    {/* Filas de Permisos */}
                    {group.permissions.map((perm) => (
                      <tr key={perm.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-4 sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                          <span className="font-mono text-[11px] text-teal-400 block font-semibold">{perm.name}</span>
                          <span className="text-slate-400 text-[11px] block mt-0.5">{perm.description || "Sin descripción"}</span>
                        </td>

                        {roles.map((role) => {
                          const hasPerm = rolePermissionMap.get(role.id)?.has(perm.id) || rolePermissionMap.get(role.id)?.has(perm.name);
                          return (
                            <td key={role.id} className="p-4 text-center border-r border-slate-800/60 last:border-r-0">
                              {hasPerm ? (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800/40 text-slate-600">
                                  <X className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
