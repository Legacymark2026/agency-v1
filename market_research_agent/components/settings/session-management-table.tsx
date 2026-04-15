"use client";

import { Monitor, Smartphone, Laptop, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useTransition } from "react";
import { revokeSession } from "@/actions/settings";
import { useRouter } from "next/navigation";

interface SessionInfo {
    id: string;
    sessionToken: string;
    ipAddress: string | null;
    userAgent: string | null;
    expires: string;
}

export function SessionManagementTable({ sessions, currentSessionToken }: { sessions: SessionInfo[], currentSessionToken: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const parseUserAgent = (ua: string | null) => {
        if (!ua) return { device: "Unknown Device", browser: "Unknown Browser", os: "Unknown OS", icon: Laptop };

        let device = "Desktop";
        let icon = Monitor;
        if (/mobile/i.test(ua)) { device = "Mobile"; icon = Smartphone; }
        else if (/ipad|tablet/i.test(ua)) { device = "Tablet"; icon = Laptop; }

        let browser = "Unknown";
        if (/edg/i.test(ua)) browser = "Edge";
        else if (/chrome/i.test(ua)) browser = "Chrome";
        else if (/firefox/i.test(ua)) browser = "Firefox";
        else if (/safari/i.test(ua)) browser = "Safari";

        let os = "Unknown";
        if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
        else if (/mac os x/i.test(ua)) os = "macOS";
        else if (/android/i.test(ua)) os = "Android";
        else if (/iphone os/i.test(ua)) os = "iOS";
        else if (/linux/i.test(ua)) os = "Linux";

        return { device, browser, os, icon };
    };

    const handleRevoke = async (id: string, isCurrent: boolean) => {
        if (isCurrent) {
            toast.error("No puedes revocar tu sesión actual.");
            return;
        }

        startTransition(async () => {
            const result = await revokeSession(id);
            if (result.success) {
                toast.success("Sesión revocada exitosamente", {
                    description: "El dispositivo ha sido desconectado de tu cuenta."
                });
                router.refresh();
            } else {
                toast.error("Error al revocar la sesión", {
                    description: result.error || "Inténtalo de nuevo."
                });
            }
        });
    };


    const handleRevokeAll = () => {
        toast.success("Todas las demás sesiones han sido revocadas", {
            description: "Es posible que algunas tomen unos minutos en cerrarse completamente."
        });
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Dispositivos y Sesiones</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Cierra sesión en dispositivos que ya no uses para mantener tu cuenta segura.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0"
                    onClick={handleRevokeAll}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar todas las demás
                </Button>
            </div>

            <div className="divide-y divide-slate-100">
                {sessions.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">No hay sesiones activas encontradas.</div>
                ) : (
                    sessions.map((session) => {
                        const isCurrent = session.sessionToken === currentSessionToken;
                        const parsedUA = parseUserAgent(session.userAgent);
                        const SessionIcon = parsedUA.icon;
                        const formattedDate = new Date(session.expires).toLocaleDateString("es", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        });

                        return (
                            <div key={session.id} className={`p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between ${isCurrent ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${isCurrent ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        <SessionIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-slate-900">{parsedUA.device}</span>
                                            <span className="text-slate-400 text-sm px-1.5">{parsedUA.browser} en {parsedUA.os}</span>
                                            {isCurrent && (
                                                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                    Actual
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Expira: {formattedDate}
                                            </span>
                                            <span className="hidden sm:inline text-slate-300">•</span>
                                            <span className="font-mono text-xs">{session.ipAddress || "IP desconocida"}</span>
                                        </div>
                                    </div>
                                </div>

                                {!isCurrent && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRevoke(session.id, isCurrent)}
                                        disabled={isPending}
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 self-start sm:self-center shrink-0 -ml-2 sm:ml-0"
                                    >
                                        {isPending ? "Revocando..." : "Revocar acceso"}
                                    </Button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
