"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Edit, Trash2, Plus, MoreHorizontal, Power, PowerOff,
    Search, LayoutGrid, List as ListIcon, Copy, AlertCircle,
    TrendingUp, Activity, CheckCircle2, XCircle, Play, Pause, CopyPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { deleteWorkflow, toggleWorkflow, bulkDeleteWorkflows, bulkToggleWorkflows } from "@/actions/automation";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// --- TYPES ---
interface Workflow {
    id: string;
    name: string;
    triggerType: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { executions: number };
}

interface Analytics {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
    recentActivity: { status: string; _count: number }[];
    topWorkflows: Workflow[];
}

interface Execution {
    id: string;
    status: string;
    startedAt: Date;
    workflow: { name: string; id: string };
}

interface Props {
    initialWorkflows: Workflow[];
    analytics: Analytics;
    recentExecutions: Execution[];
}

export default function WorkflowListClient({ initialWorkflows, analytics, recentExecutions }: Props) {
    const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // --- FILTERING & SEARCH ---
    const filteredWorkflows = useMemo(() => {
        if (!searchQuery) return workflows;
        const q = searchQuery.toLowerCase();
        return workflows.filter(w =>
            w.name.toLowerCase().includes(q) ||
            w.id.toLowerCase().includes(q) ||
            w.triggerType.toLowerCase().includes(q)
        );
    }, [workflows, searchQuery]);

    // --- BULK SELECTION ---
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredWorkflows.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredWorkflows.map(w => w.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    // --- ACTIONS ---
    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este flujo de trabajo definitivamente?")) return;
        setIsLoading(id);
        const result = await deleteWorkflow(id);
        if (result.success) {
            setWorkflows(prev => prev.filter(w => w.id !== id));
            selectedIds.delete(id);
            setSelectedIds(new Set(selectedIds));
            toast.success("Flujo eliminado");
        } else {
            toast.error("Error al eliminar");
        }
        setIsLoading(null);
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setIsLoading(id);
        const result = await toggleWorkflow(id, !currentStatus);
        if (result.success) {
            setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: !currentStatus } : w));
            toast.success(currentStatus ? "Flujo pausado" : "Flujo activado");
        } else {
            toast.error("Error al cambiar estado");
        }
        setIsLoading(null);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`¿Eliminar ${selectedIds.size} flujo(s) definitivamente?`)) return;

        setIsLoading("bulk");
        const idsArray = Array.from(selectedIds);
        const result = await bulkDeleteWorkflows(idsArray);
        if (result.success) {
            setWorkflows(prev => prev.filter(w => !selectedIds.has(w.id)));
            setSelectedIds(new Set());
            toast.success(`${idsArray.length} flujos eliminados`);
        } else {
            toast.error("Error en eliminación masiva");
        }
        setIsLoading(null);
    };

    const handleBulkToggle = async (activate: boolean) => {
        if (selectedIds.size === 0) return;
        setIsLoading("bulk");
        const idsArray = Array.from(selectedIds);
        const result = await bulkToggleWorkflows(idsArray, activate);
        if (result.success) {
            setWorkflows(prev => prev.map(w => selectedIds.has(w.id) ? { ...w, isActive: activate } : w));
            setSelectedIds(new Set()); // Clear selection or keep it, clearing is usually better
            toast.success(`${idsArray.length} flujos ${activate ? 'activados' : 'pausados'}`);
        } else {
            toast.error("Error en operación masiva");
        }
        setIsLoading(null);
    };

    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        toast.info(message);
    };

    // --- BADGE HELPERS ---
    const getTriggerBadgeDetails = (type: string) => {
        if (type.includes("FORM")) return { label: "Formulario", color: "bg-purple-100 text-purple-800" };
        if (type.includes("DEAL") || type.includes("SCORE")) return { label: "CRM (Ventas)", color: "bg-blue-100 text-blue-800" };
        if (type.includes("SCHEDULE") || type.includes("TIME")) return { label: "Horario/Cron", color: "bg-orange-100 text-orange-800" };
        if (type.includes("WEBHOOK")) return { label: "Webhook/API", color: "bg-indigo-100 text-indigo-800" };
        return { label: type, color: "bg-gray-100 text-gray-800" };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.02em", margin: 0 }}>Automation Center</h1>
                    <p style={{ color: "#475569", marginTop: "4px", fontSize: "13px", fontFamily: "monospace" }}>Orquesta y monitorea todos tus flujos de trabajo automáticos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/admin/automation/builder?new=true`}>
                        <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", fontSize: "12px", fontWeight: 800, borderRadius: "10px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
                            <Plus size={14} /> Crear Nuevo Flujo
                        </button>
                    </Link>
                </div>
            </div>

            {/* KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Flujos Totales", value: analytics.totalWorkflows, sub: `${analytics.activeWorkflows} activos`, icon: <Activity size={15} />, color: "#6366f1" },
                    { label: "Ejecuciones", value: (analytics.totalExecutions || 0).toLocaleString(), sub: "disparos totales", icon: <TrendingUp size={15} />, color: "#2dd4bf" },
                    { label: "Tasa de Éxito", value: `${analytics.successRate}%`, sub: analytics.successRate > 90 ? "Excelente" : "Revisar", icon: <CheckCircle2 size={15} />, color: analytics.successRate > 90 ? "#34d399" : "#fbbf24" },
                    { label: "Fallos Recientes", value: recentExecutions.filter(e => e.status === 'FAILED').length, sub: "últimos 10 disparos", icon: <AlertCircle size={15} />, color: "#f87171" },
                ].map((m, i) => (
                    <div key={i} style={{ background: "rgba(15,20,35,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", fontFamily: "monospace", textTransform: "uppercase" }}>{m.label}</span>
                            <span style={{ color: m.color, opacity: 0.8 }}>{m.icon}</span>
                        </div>
                        <div style={{ fontSize: "28px", fontWeight: 900, color: m.color, fontFamily: "monospace", lineHeight: 1 }}>{m.value}</div>
                        <div style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace" }}>{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* OPERATIONS BAR */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", background: "rgba(11,15,25,0.7)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(30,41,59,0.8)" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "240px", maxWidth: "360px" }}>
                    <Search style={{ position: "absolute", left: "10px", top: "9px", width: "14px", height: "14px", color: "#475569" }} />
                    <input placeholder="Buscar por nombre, ID o disparador..."
                        style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "9px", padding: "8px 12px 8px 32px", fontSize: "12px", color: "#cbd5e1", outline: "none" }}
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {selectedIds.size > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "#6366f1", background: "rgba(99,102,241,0.12)", padding: "4px 10px", borderRadius: "6px", fontFamily: "monospace" }}>{selectedIds.size} sel.</span>
                            {[{ label: "Activar", fn: () => handleBulkToggle(true), c: "#34d399" }, { label: "Pausar", fn: () => handleBulkToggle(false), c: "#fbbf24" }, { label: "Eliminar", fn: handleBulkDelete, c: "#f87171" }].map(b => (
                                <button key={b.label} onClick={b.fn} disabled={isLoading === "bulk"}
                                    style={{ padding: "5px 10px", borderRadius: "7px", border: `1px solid ${b.c}40`, background: `${b.c}12`, color: b.c, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{b.label}</button>
                            ))}
                        </div>
                    )}
                    <div style={{ display: "flex", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "3px" }}>
                        {(["list", "grid"] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)}
                                style={{ padding: "5px", borderRadius: "5px", background: viewMode === m ? "rgba(30,41,59,0.9)" : "transparent", border: "none", color: viewMode === m ? "#2dd4bf" : "#475569", cursor: "pointer", display: "flex" }}>
                                {m === "list" ? <ListIcon size={15} /> : <LayoutGrid size={15} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* WORKFLOWS DISPLAY (LIST OR GRID) */}
            {filteredWorkflows.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 16px", background: "rgba(11,15,25,0.4)", border: "1px dashed rgba(30,41,59,0.8)", borderRadius: "14px" }}>
                    <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "50%", padding: "16px", marginBottom: "16px", color: "#6366f1" }}>
                        <Activity style={{ width: "36px", height: "36px" }} />
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#64748b", margin: "0 0 8px", fontFamily: "monospace" }}>Sin flujos de trabajo</h3>
                    <p style={{ fontSize: "12px", color: "#334155", textAlign: "center", maxWidth: "320px" }}>
                        {searchQuery ? "Sin resultados para tu búsqueda." : "Crea tu primera automatización."}
                    </p>
                    {!searchQuery && (
                        <Link href={`/dashboard/admin/automation/builder?new=true`} style={{ marginTop: "20px" }}>
                            <button style={{ padding: "8px 18px", background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", fontSize: "12px", fontWeight: 800, borderRadius: "9px", border: "none", cursor: "pointer" }}>Crear mi primer flujo</button>
                        </Link>
                    )}
                </div>
            ) : viewMode === "list" ? (
                /* LIST VIEW */
                <div style={{ background: "rgba(11,15,25,0.7)", borderRadius: "12px", border: "1px solid rgba(30,41,59,0.8)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(30,41,59,0.9)" }}>
                                <th style={{ padding: "10px 20px", textAlign: "left", width: "40px" }}>
                                    <Checkbox checked={selectedIds.size === filteredWorkflows.length && filteredWorkflows.length > 0} onCheckedChange={toggleSelectAll} />
                                </th>
                                {["Nombre del Flujo", "Disparador", "Estado", "Ejecuciones", "Actualizado", ""].map(h => (
                                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWorkflows.map((workflow, i) => {
                                const badge = getTriggerBadgeDetails(workflow.triggerType);
                                const isSelected = selectedIds.has(workflow.id);
                                return (
                                    <tr key={workflow.id}
                                        style={{ background: isSelected ? "rgba(99,102,241,0.08)" : i % 2 === 0 ? "rgba(15,20,35,0.5)" : "rgba(11,15,25,0.3)", borderBottom: "1px solid rgba(30,41,59,0.5)", transition: "background 0.1s" }}>
                                        <td style={{ padding: "12px 20px" }}><Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(workflow.id)} /></td>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{ padding: "7px", borderRadius: "8px", background: workflow.isActive ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.7)", color: workflow.isActive ? "#818cf8" : "#475569" }}>
                                                    <Activity size={15} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>{workflow.name}</div>
                                                    <div style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace", cursor: "pointer" }} onClick={() => copyToClipboard(workflow.id, "ID Copiado")}>{workflow.id.substring(0, 12)}…</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                            <span style={{ padding: "3px 10px", fontSize: "10px", fontWeight: 800, fontFamily: "monospace", borderRadius: "99px", color: "#a78bfa", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                            <button onClick={() => handleToggle(workflow.id, workflow.isActive)} disabled={isLoading === workflow.id}
                                                style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", fontSize: "10px", fontWeight: 800, fontFamily: "monospace", borderRadius: "99px", border: `1px solid ${workflow.isActive ? "rgba(52,211,153,0.35)" : "rgba(71,85,105,0.5)"}`, background: workflow.isActive ? "rgba(52,211,153,0.1)" : "rgba(71,85,105,0.1)", color: workflow.isActive ? "#34d399" : "#475569", cursor: "pointer" }}>
                                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: workflow.isActive ? "#34d399" : "#475569" }} />
                                                {workflow.isActive ? "On" : "Off"}
                                            </button>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b", fontFamily: "monospace" }}>{((workflow as any)._count?.executions || 0).toLocaleString()}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>{format(new Date(workflow.updatedAt), 'dd MMM yyyy')}</td>
                                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button style={{ padding: "5px", borderRadius: "7px", background: "rgba(30,41,59,0.7)", border: "1px solid rgba(30,41,59,0.9)", color: "#475569", cursor: "pointer", display: "flex" }}>
                                                        <MoreHorizontal style={{ width: "14px", height: "14px" }} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Acciones de Flujo</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <Link href={`/dashboard/admin/automation/builder?id=${workflow.id}`}><DropdownMenuItem className="cursor-pointer"><Edit className="mr-2 h-4 w-4 text-blue-600" /> Editar</DropdownMenuItem></Link>
                                                    <DropdownMenuItem onClick={() => copyToClipboard(workflow.id, "ID Copiado")}><Copy className="mr-2 h-4 w-4" /> Copiar ID</DropdownMenuItem>
                                                    <DropdownMenuItem disabled><CopyPlus className="mr-2 h-4 w-4" /> Duplicar (Próx.)</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleToggle(workflow.id, workflow.isActive)}>{workflow.isActive ? <Pause className="mr-2 h-4 w-4 text-orange-600" /> : <Play className="mr-2 h-4 w-4 text-green-600" />}{workflow.isActive ? 'Pausar' : 'Activar'}</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(workflow.id)} className="text-red-600 cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredWorkflows.map((workflow) => {
                        const badge = getTriggerBadgeDetails(workflow.triggerType);
                        const isSelected = selectedIds.has(workflow.id);
                        return (
                            <Card key={workflow.id} className={`group relative transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
                                <div className="absolute top-3 left-3 z-10">
                                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(workflow.id)} className="bg-white/80 backdrop-blur-sm" />
                                </div>
                                <div className="absolute top-3 right-3 z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white data-[state=open]:bg-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <Link href={`/dashboard/admin/automation/builder?id=${workflow.id}`}>
                                                <DropdownMenuItem className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuItem onClick={() => handleToggle(workflow.id, workflow.isActive)}>
                                                {workflow.isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                                                {workflow.isActive ? 'Pausar' : 'Activar'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(workflow.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <CardHeader className="pt-10 pb-2">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${workflow.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Activity size={24} />
                                    </div>
                                    <CardTitle className="text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                        <Link href={`/dashboard/admin/automation/builder?id=${workflow.id}`}>{workflow.name}</Link>
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 inline-flex text-[10px] font-medium rounded-full ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                        <span className={`px-2 py-0.5 inline-flex text-[10px] items-center gap-1 font-medium rounded-full border ${workflow.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${workflow.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                            {workflow.isActive ? 'Activo' : 'Pausado'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 pb-4 border-t mt-4 flex justify-between items-center text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Ejecuciones</span>
                                        <span className="font-medium text-gray-900">{((workflow as any)._count?.executions || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Actualizado</span>
                                        <span>{format(new Date(workflow.updatedAt), 'MMM d, yyyy')}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
