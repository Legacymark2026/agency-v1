"use client";

import { AlertCircle, Clock, Save, BellRing, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { updateSlaAlerts } from "@/app/actions/crm-settings";

export function SLAAlertSettings({ initialData }: { initialData?: any }) {
    const [slaActive, setSlaActive] = useState(initialData?.active ?? true);
    const [responseTime, setResponseTime] = useState(initialData?.responseTime?.toString() || "24"); // horas
    const [escalationTime, setEscalationTime] = useState(initialData?.escalationTime?.toString() || "48"); // horas
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Actualizando políticas de SLA...");

        const result = await updateSlaAlerts({
            active: slaActive,
            responseTime: parseInt(responseTime, 10),
            escalationTime: parseInt(escalationTime, 10)
        });

        if (result.success) {
            toast.success("SLA configurado correctamente.", { id: toastId });
        } else {
            toast.error(result.error || "Error al actualizar", { id: toastId });
        }
        setIsSaving(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        Políticas SLA (Acuerdos de Nivel de Servicio)
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Configura alertas automáticas para garantizar que los leads sean contactados a tiempo.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">Estado:</span>
                    <Switch checked={slaActive} onCheckedChange={setSlaActive} />
                </div>
            </div>

            {slaActive && (
                <div className="p-6 space-y-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">

                        {/* Tiempo de Primera Respuesta */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                Tiempo Máximo de 1ª Respuesta
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Genera una alerta al asignado si un lead nuevo no es contactado en este periodo.
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={responseTime}
                                    onChange={(e) => setResponseTime(e.target.value)}
                                    className="w-20 text-sm rounded-lg border border-slate-300 p-2 text-center font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                                />
                                <span className="text-sm font-medium text-slate-600">Horas</span>
                            </div>
                        </div>

                        {/* Tiempo de Escalación */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <BellRing className="w-4 h-4 text-slate-500" />
                                Escalación a Gerencia
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Si el lead sigue sin respuesta, notificar al administrador del workspace.
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={escalationTime}
                                    onChange={(e) => setEscalationTime(e.target.value)}
                                    className="w-20 text-sm rounded-lg border border-slate-300 p-2 text-center font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                                />
                                <span className="text-sm font-medium text-slate-600">Horas</span>
                            </div>
                        </div>

                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-900">
                            <Settings2 className="w-4 h-4 mr-2" />
                            Ajustes Avanzados
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Guardando..." : "Guardar SLA"}
                        </Button>
                    </div>
                </div>
            )}
            {!slaActive && (
                <div className="p-6 bg-slate-50 text-center text-slate-500 text-sm">
                    El sistema de SLA está actualmente desactivado. Los leads no generarán alertas por inactividad.
                </div>
            )}
        </div>
    );
}
