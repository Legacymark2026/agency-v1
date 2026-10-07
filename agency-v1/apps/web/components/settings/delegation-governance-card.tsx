"use client";

import { useState } from "react";
import { 
  Shield, AlertTriangle, Check, UserCheck, 
  Lock, RefreshCw, Loader2, Sparkles, Info
} from "lucide-react";
import { toast } from "sonner";
import { delegateUserManagementRole } from "@/actions/roles";

interface Role {
  id: string;
  name: string;
  isDefault: boolean;
  permissions: Array<any>;
  _count: {
    users: number;
  };
}

export function DelegationGovernanceCard({
  roles,
  delegationInfo,
  onRefresh,
}: {
  roles: Role[];
  delegationInfo: { isOwner: boolean; delegatedRole: any } | null;
  onRefresh: () => Promise<void>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    delegationInfo?.delegatedRole?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelegateRole = async (targetRoleId: string | null) => {
    setIsSubmitting(true);
    try {
      await delegateUserManagementRole(targetRoleId);
      toast.success(
        targetRoleId
          ? "Facultad de gestión de usuarios delegada exitosamente al rol personalizado"
          : "Delegación de gestión de usuarios revocada exitosamente"
      );
      setIsModalOpen(false);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la delegación");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-md p-6 relative overflow-hidden shadow-lg shadow-amber-950/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Gobernanza de Seguridad: Delegación de Creación de Usuarios
                </h3>
                {delegationInfo?.isOwner && (
                  <span className="text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                    Propietario del Tenant
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200/80 max-w-3xl leading-relaxed">
                Por política de aislamiento multi-inquilino de grado bancario, la facultad de provisionar credenciales y contraseñas está reservada exclusivamente al <strong>Propietario de la Empresa</strong>. Puedes delegar esta responsabilidad a <strong>un único rol personalizado</strong> a la vez.
              </p>
              
              <div className="pt-2 flex items-center gap-2 text-xs flex-wrap">
                <span className="text-slate-400 font-medium">Estado de la Delegación:</span>
                {delegationInfo?.delegatedRole ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs">
                    <Check className="w-3.5 h-3.5" /> Rol Delegado: {delegationInfo.delegatedRole.name} ({delegationInfo.delegatedRole._count.users} usuarios autorizados)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs">
                    <Lock className="w-3 h-3 text-amber-400" /> Sin delegar (Exclusivo del Propietario)
                  </span>
                )}
              </div>
            </div>
          </div>

          {delegationInfo?.isOwner && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {delegationInfo?.delegatedRole ? "Cambiar / Revocar Rol" : "Delegar Facultad a un Rol"}
            </button>
          )}
        </div>
      </div>

      {/* Modal de Delegación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Shield className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Delegar Creación de Usuarios y Contraseñas
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                Principio de Mínimo Privilegio (Zero-Trust)
              </span>
              <p className="text-amber-200/80 leading-relaxed">
                El rol asignado obtendrá el permiso <code>users.manage</code>. Cualquier rol previamente delegado perderá automáticamente esta facultad.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Seleccionar Rol Personalizado de la Empresa
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-white p-3 focus:border-amber-500 outline-none"
              >
                <option value="">
                  -- Ninguno (Revocar delegación: solo el Propietario) --
                </option>
                {roles
                  .filter((r) => r.name.toLowerCase() !== "owner")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.permissions.length} permisos, {r._count.users} miembros)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDelegateRole(selectedRoleId || null)}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  "Guardar y Aplicar Delegación"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
