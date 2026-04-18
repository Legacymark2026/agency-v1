"use client";

import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { requestDataExport, deleteAccount } from "@/app/actions/settings";

export function DangerZone() {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading("Preparando exportación de datos...");

        const result = await requestDataExport();

        if (result.success) {
            toast.success("Archivo listo para descarga", {
                id: toastId,
                description: result.message || "Se ha enviado un enlace de descarga segura a tu correo electrónico."
            });
        } else {
            toast.error(result.error || "Ocurrió un error al exportar", { id: toastId });
        }
        setIsExporting(false);
    };

    const handleDelete = async () => {
        if (confirmText !== "ELIMINAR") {
            toast.error("Por favor, escribe ELIMINAR para confirmar.");
            return;
        }

        const toastId = toast.loading("Procesando solicitud de eliminación...");

        const result = await deleteAccount();

        // Simulate rejection or success based on admin status
        if (result.success) {
            toast.success("Cuenta eliminada exitosamente", { id: toastId });
        } else {
            toast.error("Operación bloqueada", {
                id: toastId,
                description: result.error || "La eliminación de cuentas activas requiere autorización de un Administrador."
            });
            setIsDeleting(false);
            setConfirmText("");
        }
    };

    return (
        <div className="rounded-2xl border border-red-200 bg-red-50/30 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-red-100/50 flex items-center gap-3 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Zona de Peligro</h3>
            </div>

            <div className="p-6 divide-y divide-red-100">
                {/* Exportar Datos */}
                <div className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-slate-900">Exportar mis datos (Takeout)</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-lg">
                            Descarga un archivo .ZIP con toda tu información personal, leads configurados, historiales de actividad y preferencias en formato JSON y CSV.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="shrink-0 bg-white"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? "Generando..." : "Solicitar Archivo"}
                    </Button>
                </div>

                {/* Eliminar Cuenta */}
                <div className="py-4 pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">Eliminar Cuenta (Derecho al Olvido)</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-lg mb-4">
                            Esta acción es irreversible y eliminará permanentemente tu cuenta y todos los datos asociados de nuestros servidores, en cumplimiento con GDPR/CCPA.
                        </p>

                        {isDeleting ? (
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-red-200 shadow-sm inline-block w-full max-w-md">
                                <label className="text-sm font-medium text-slate-700">
                                    Para confirmar, escribe <span className="font-bold text-red-600 select-none">ELIMINAR</span> abajo:
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="ELIMINAR"
                                        className="border-red-200 focus-visible:ring-red-500"
                                    />
                                    <Button
                                        variant="outline"
                                        className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                                        onClick={handleDelete}
                                        disabled={confirmText !== "ELIMINAR"}
                                    >
                                        Confirmar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setIsDeleting(false); setConfirmText(""); }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleting(true)}
                                className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white shadow-sm shadow-red-600/20"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar mi cuenta
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
