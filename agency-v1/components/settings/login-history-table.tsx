"use client";

import { AlertTriangle, Clock, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LoginLog {
    id: string;
    date: Date;
    action: string;
    ip: string;
    userAgent: string;
    status: string;
}

export function LoginHistoryTable({ logs }: { logs: LoginLog[] }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Historial de Accesos</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Revisa los últimos intentos de inicio de sesión en tu cuenta para detectar actividad inusual.
                    </p>
                </div>
                <Button variant="outline" className="shrink-0 bg-white" size="sm">
                    Descargar CSV
                </Button>
            </div>

            <div className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No hay registros de actividad recientes.
                    </div>
                ) : logs.map((log) => (
                    <div key={log.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-full shrink-0 ${log.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {log.status === 'success' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-slate-900">{log.userAgent}</span>
                                    {log.status === 'failed' && (
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                                            Fallido
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> {new Date(log.date).toLocaleString()}
                                    </span>
                                    <span className="hidden sm:inline text-slate-300">•</span>
                                    <span className="font-mono text-xs">{log.ip}</span>
                                </div>
                                {log.status === 'failed' && (
                                    <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-md inline-flex items-center gap-2 border border-red-100">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Intento de acceso fallido o bloqueado.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                <Button variant="ghost" className="text-slate-500 text-sm hover:text-slate-900">
                    Cargar más registros
                </Button>
            </div>
        </div>
    );
}
