"use client";

import React, { useState } from "react";

export default function RolesDashboardPage() {
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "MANAGER" | "AGENT">("ADMIN");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    "finance:create_invoice": true,
    "finance:refund": true,
    "crm:read_leads": true,
    "crm:delete_leads": false,
    "ai:execute_agent": true,
    "security:audit_logs": true,
  });

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Gestor de Roles & Permisos RBAC Corporativos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Matriz de permisos granulados por microservicio para usuarios, gerentes y administradores de la plataforma.
          </p>
        </div>
        <button
          onClick={() => alert("Matriz de permisos RBAC guardada exitosamente.")}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          💾 Guardar Matriz de Permisos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Role Selector */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-3">
          <h2 className="text-lg font-bold text-slate-200 mb-4">Seleccionar Rol Corporativo</h2>
          {(["ADMIN", "MANAGER", "AGENT"] as const).map((r) => (
            <div
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedRole === r
                  ? "bg-slate-800/90 border-emerald-500/50 text-emerald-300"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-950"
              }`}
            >
              <div className="font-bold text-sm">{r}</div>
              <div className="text-[10px] opacity-75">
                {r === "ADMIN" ? "Acceso total a todos los microservicios y finanzas" : r === "MANAGER" ? "Gestión de equipo y reportes CRM" : "Acceso operativo limitado"}
              </div>
            </div>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Matriz de Permisos para Rol: {selectedRole}</h2>
          <div className="space-y-3">
            {[
              { key: "finance:create_invoice", label: "Emitir Facturación Electrónica DIAN" },
              { key: "finance:refund", label: "Procesar Reembolsos & Anulaciones" },
              { key: "crm:read_leads", label: "Ver Base de Datos de Clientes & Leads" },
              { key: "crm:delete_leads", label: "Eliminar Registros de Clientes" },
              { key: "ai:execute_agent", label: "Ejecutar Agentes Autónomos de IA" },
              { key: "security:audit_logs", label: "Acceder a Logs de Auditoría GDPR/SLA" },
            ].map((p) => (
              <div key={p.key} className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                <span className="text-slate-200 font-semibold">{p.label}</span>
                <button
                  onClick={() => togglePermission(p.key)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold transition-all ${
                    permissions[p.key]
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {permissions[p.key] ? "PERMITIDO" : "DENEGADO"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
