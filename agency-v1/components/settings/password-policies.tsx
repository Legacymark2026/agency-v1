"use client";

import { ShieldAlert, KeyRound, CalendarDays, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { updatePasswordPolicy } from "@/app/actions/settings";

export function PasswordPolicies({ initialData }: { initialData?: any }) {
    const [policyActive, setPolicyActive] = useState(initialData?.active || false);
    const [expirationDays, setExpirationDays] = useState(initialData?.expirationDays || "90");
    const [historyCount, setHistoryCount] = useState(initialData?.historyCount || "3");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Actualizando políticas de seguridad...");

        const result = await updatePasswordPolicy({
            active: policyActive,
            expirationDays: parseInt(expirationDays, 10),
            historyCount: parseInt(historyCount, 10)
        });

        if (result.success) {
            toast.success("Políticas de contraseña aplicadas a todo el equipo.", { id: toastId });
        } else {
            toast.error(result.error || "Ocurrió un error al guardar", { id: toastId });
        }
        setIsSaving(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-orange-100 text-orange-600 shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Políticas de Contraseña (Enterprise)</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-lg">
                            Fuerza reglas estrictas de seguridad para las contraseñas de todos los miembros del workspace.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-slate-700">Imponer Políticas:</span>
                    <Switch checked={policyActive} onCheckedChange={setPolicyActive} />
                </div>
            </div>

            {policyActive ? (
                <div className="p-6 space-y-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Expiración */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-slate-500" />
                                Rotación Obligatoria
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Forzar a los usuarios a cambiar su contraseña periódicamente.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-600">Cada</span>
                                <input
                                    type="number"
                                    value={expirationDays}
                                    onChange={(e) => setExpirationDays(e.target.value)}
                                    className="w-16 text-sm rounded-lg border border-slate-300 p-2 text-center font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                                <span className="text-sm font-medium text-slate-600">días</span>
                            </div>
                        </div>

                        {/* Historial */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <RefreshCcw className="w-4 h-4 text-slate-500" />
                                Restricción de Historial
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Evitar que los usuarios reutilicen sus contraseñas antiguas.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-600">Recordar últimas</span>
                                <input
                                    type="number"
                                    value={historyCount}
                                    onChange={(e) => setHistoryCount(e.target.value)}
                                    className="w-16 text-sm rounded-lg border border-slate-300 p-2 text-center font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                                <span className="text-sm font-medium text-slate-600">contraseñas</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md">
                            <KeyRound className="w-4 h-4" />
                            Requiere 1 mayúscula, 1 número y longitud mínima de 8 caracteres por defecto.
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                        >
                            {isSaving ? "Guardando..." : "Guardar Políticas"}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="p-6 bg-slate-50/50 text-center text-slate-500 text-sm">
                    Las políticas empresariales de contraseñas están desactivadas. Los usuarios gestionan sus claves libremente.
                </div>
            )}
        </div>
    );
}
