"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Play,
    RotateCw,
    ChevronLeft,
    Bug,
    Terminal,
    AlertTriangle,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ExecutionDetailClient({ initialExecution }: { initialExecution: any }) {
    const [execution, setExecution] = useState(initialExecution);
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    // MOCK: In a real app we would poll the DB if status === 'PENDING'
    // useEffect(() => { ...poll DB... }, [])

    const logs = Array.isArray(execution.logs) ? execution.logs : [];

    // Feature 60: Retry button
    const handleRetry = async () => {
        setIsRetrying(true);
        toast.info("Re-enviando flujo desde el punto de fallo...");
        // Mock retry API call
        setTimeout(() => {
            setIsRetrying(false);
            setExecution({
                ...execution,
                status: 'SUCCESS',
                logs: [
                    ...logs,
                    { stepId: "retry_action", type: "SYSTEM", status: "SUCCESS", durationMs: 150, payload: { msg: "Retried successfully" } }
                ]
            });
            toast.success("Flujo completado con éxito tras el reintento.");
        }, 2000);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle2 className="text-emerald-500 h-5 w-5" />;
            case 'FAILED': return <XCircle className="text-red-500 h-5 w-5" />;
            default: return <RotateCw className="text-blue-500 h-5 w-5 animate-spin" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <Badge className="bg-emerald-100 text-emerald-800 border-none">Completado</Badge>;
            case 'FAILED': return <Badge className="bg-red-100 text-red-800 border-none">Fallido</Badge>;
            default: return <Badge className="bg-blue-100 text-blue-800 border-none">En Progreso</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-slate-50/50 min-h-[calc(100vh-64px)]">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/automation">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                            <ChevronLeft size={16} />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {execution.workflow?.name || 'Workflow Execution'}
                            </h1>
                            {getStatusBadge(execution.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-mono">
                            <span className="flex items-center gap-1"><Terminal size={12} /> ID: {execution.id}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> Inicio: {format(new Date(execution.startedAt), 'dd/MM/yyyy HH:mm:ss')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2 mr-4 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Bug size={16} className={isDebugMode ? "text-indigo-600" : "text-slate-400"} />
                        <Label htmlFor="debug-mode" className="text-xs font-semibold cursor-pointer">Modo Debug</Label>
                        <Switch id="debug-mode" checked={isDebugMode} onCheckedChange={setIsDebugMode} />
                    </div>

                    {execution.status === 'FAILED' && (
                        <Button
                            onClick={handleRetry}
                            disabled={isRetrying}
                            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                        >
                            {isRetrying ? <RotateCw className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4" />}
                            Forzar Reintento
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Timeline / Logs */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Activity size={18} className="text-indigo-600" />
                                Sequence Timeline
                            </h2>
                            <span className="text-xs text-slate-500 font-medium">
                                {logs.length} Pasos ejecutados
                            </span>
                        </div>

                        <ScrollArea className="h-[600px]">
                            <div className="p-6">
                                {logs.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 italic text-sm">
                                        No hay logs disponibles para esta ejecución.
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                                        {logs.map((log: any, index: number) => {
                                            const isError = log.status === 'FAILED' || log.error;
                                            return (
                                                <div key={index} className="relative pl-8">
                                                    <div className={`absolute -left-[11px] top-1 p-0.5 rounded-full bg-white ${isError ? 'ring-2 ring-red-100' : ''}`}>
                                                        {getStatusIcon(log.status || 'SUCCESS')}
                                                    </div>

                                                    <div className={`p-4 rounded-lg border shadow-sm transition-all ${isError
                                                            ? 'bg-red-50 border-red-200 ring-1 ring-red-100'
                                                            : 'bg-white border-slate-100 hover:border-slate-300'
                                                        }`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className={`font-bold text-sm ${isError ? 'text-red-900' : 'text-slate-800'}`}>
                                                                    {log.stepId || log.type || 'Paso Desconocido'}
                                                                </h3>
                                                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                                    <Clock size={12} />
                                                                    {log.durationMs ? `${log.durationMs}ms latencia` : '< 1ms latencia'}
                                                                </p>
                                                            </div>
                                                            {isError && <Badge variant="destructive" className="text-xs">Error Crítico</Badge>}
                                                        </div>

                                                        {isError && log.error && (
                                                            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-xs text-red-800 font-mono flex items-start gap-2">
                                                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                                                <span className="break-all">{log.error}</span>
                                                            </div>
                                                        )}

                                                        {isDebugMode && log.payload && (
                                                            <div className="mt-4">
                                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                                                    Payload Inspector (State)
                                                                </span>
                                                                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-md text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
                                                                    {JSON.stringify(log.payload, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Configuration / Meta */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                            <Bug size={18} className="text-indigo-600" />
                            Run Context
                        </h3>
                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="text-slate-500 text-xs uppercase font-semibold">Workflow ID</dt>
                                <dd className="font-mono text-slate-900 mt-1 text-xs break-all">{execution.workflowId}</dd>
                            </div>
                            <Separator />
                            <div>
                                <dt className="text-slate-500 text-xs uppercase font-semibold">Trigger Payload</dt>
                                <dd className="mt-2">
                                    <pre className="bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-700 font-mono overflow-auto">
                                        {/* Mocking for now since triggerPayload isn't in schema directly, we use logs[0] usually */}
                                        {logs[0]?.payload ? JSON.stringify(logs[0].payload, null, 2) : '{"event": "Manual Run"}'}
                                    </pre>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Activity size={100} />
                        </div>
                        <h3 className="font-bold text-indigo-900 relative z-10 mb-2">Simulador Local</h3>
                        <p className="text-sm text-indigo-700 relative z-10 mb-4">
                            Usa el simulador para probar tus cambios en el Builder sin afectar datos reales.
                        </p>
                        <Link href={`/dashboard/admin/automation/builder?id=${execution.workflowId}`}>
                            <Button variant="outline" className="relative z-10 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                                Abrir en Builder
                            </Button>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
