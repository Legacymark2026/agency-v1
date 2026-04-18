'use client';

import { useState, useEffect } from "react";
import { getActiveSessions, revokeSession } from "@/app/actions/sessions";
import { Laptop, Smartphone, Monitor, Trash2, Loader2, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface SessionData {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    expires: Date;
}

export function ActiveSessions() {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            const data = await getActiveSessions();
            if (data?.success && data.sessions) {
                setSessions(data.sessions as any[]);
            }
            setLoading(false);
        };
        fetchSessions();
    }, []);

    const parseUserAgent = (ua: string | null) => {
        if (!ua) return { device: "Dispositivo Desconocido", icon: <Monitor className="w-5 h-5 text-gray-500" /> };
        const isMobile = /Mobile|Android|iP(hone|od|ad)/i.test(ua);
        const deviceName = isMobile ? "Dispositivo Móvil" : "Computadora";
        const icon = isMobile ? <Smartphone className="w-5 h-5 text-gray-500" /> : <Laptop className="w-5 h-5 text-gray-500" />;

        // Extract browser info roughly
        const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : ua.includes("Edge") ? "Edge" : "Navegador";
        const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac OS") ? "macOS" : ua.includes("Linux") ? "Linux" : "Sistema OS";

        return { device: `${browser} en ${os}`, icon };
    };

    const handleRevoke = async (id: string) => {
        setRevokingId(id);
        const toastId = toast.loading("Cerrando sesión en dispositivo...");
        const res = await revokeSession(id);

        if (res.success) {
            toast.success("Sesión cerrada", { id: toastId, description: "Se ha revocado el acceso al dispositivo exitosamente." });
            setSessions(prev => prev.filter(s => s.id !== id));
        } else {
            toast.error("Error", { id: toastId, description: res.error || "No se pudo cerrar la sesión." });
        }
        setRevokingId(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <p className="text-sm font-medium">Buscando dispositivos conectados...</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-60" />
                <h4 className="text-gray-900 font-medium text-sm">Sin sesiones activas</h4>
                <p className="text-xs text-gray-500 mt-1">No tienes otros dispositivos conectados a tu cuenta.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                Estos son los dispositivos que actualmente tienen acceso activo a tu cuenta. Puedes revocar el acceso a cualquiera de ellos si no los reconoces.
            </p>

            <div className="grid gap-4">
                {sessions.map((session, index) => {
                    const { device, icon } = parseUserAgent(session.userAgent);
                    return (
                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 shrink-0 mt-1 sm:mt-0">
                                    {icon}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                        {device}
                                        {index === 0 && <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Actual</span>}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500 font-medium">
                                        <div className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-2 py-1 rounded-md">
                                            <span className="font-medium">IP:</span> {session.ipAddress || 'Oculta'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            Expira {formatDistanceToNow(new Date(session.expires), { addSuffix: true, locale: es })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0 w-full sm:w-auto"
                                onClick={() => handleRevoke(session.id)}
                                disabled={revokingId === session.id}
                            >
                                {revokingId === session.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-2 opacity-70" />
                                )}
                                Revocar Acceso
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
