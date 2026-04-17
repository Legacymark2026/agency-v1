"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragStartEvent,
    DragEndEvent
} from "@dnd-kit/core";
import { updateDealStage, updateDeal } from "@/actions/crm";
import { createPortal } from "react-dom";
import { DealDetailsDialog } from "./DealDetailsDialog";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, Rows, Filter, CheckSquare } from "lucide-react";
import { STAGES } from "@/lib/crm-config";
import confetti from "canvas-confetti";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DealCard } from "./DealCard";
import { DealContextMenu } from "./DealContextMenu";
import { toast } from "sonner";
import { createDeal, deleteDeal } from "@/actions/crm";
import { Deal } from "@/modules/crm/actions/crm";
import React, { memo, useCallback } from "react";

export interface StageType {
    id: string;
    label: string;
    color: string;
    accent?: string;
}

function DroppableStage({ stage, children, totalValue, dealCount, onQuickAdd, stagnantCount, avgDaysInStage }: {
    stage: StageType,
    children: React.ReactNode,
    totalValue: number,
    dealCount: number,
    onQuickAdd?: () => void,
    stagnantCount?: number,
    avgDaysInStage?: number
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: stage.id,
    });

    const avgValue = dealCount > 0 ? totalValue / dealCount : 0;
    const isBottleneck = (stagnantCount || 0) > 2; // More than 2 stagnant deals = bottleneck

    return (
        <div
            ref={setNodeRef}
            style={{
                minWidth: "300px", width: "300px", flexShrink: 0,
                display: "flex", flexDirection: "column",
                borderRadius: "16px",
                border: isOver ? "1px solid rgba(56,189,248,0.5)" : isBottleneck ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(30,41,59,0.8)",
                background: isOver ? "rgba(56,189,248,0.06)" : isBottleneck ? "rgba(248,113,113,0.04)" : "rgba(11,15,25,0.6)",
                transition: "all 0.3s",
                overflow: "hidden",
                transform: isOver ? "scale(1.01)" : undefined,
                boxShadow: isOver ? "0 0 24px rgba(56,189,248,0.15)" : undefined,
                position: "relative",
            }}
        >
            <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(30,41,59,0.9)",
                background: "rgba(15,20,35,0.85)",
                backdropFilter: "blur(10px)",
                position: "sticky", top: 0, zIndex: 10,
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: stage.accent || "#2dd4bf", boxShadow: `0 0 8px ${stage.accent || "#2dd4bf"}` }} />
                        <h3 style={{ fontWeight: 800, fontSize: "11px", color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: 0 }}>{stage.label}</h3>
                        {isBottleneck && (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(248,113,113,0.15)", fontSize: "10px" }} title="Alerta: +2 deals estancados">
                                ⚠️
                            </span>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {onQuickAdd && (
                            <button onClick={onQuickAdd}
                                style={{ padding: "4px", borderRadius: "6px", background: "rgba(30,41,59,0.7)", border: "none", color: "#475569", cursor: "pointer", display: "flex" }}
                                title="Añadir Deal Rápido">
                                <svg style={{ width: "12px", height: "12px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                        <span style={{ padding: "2px 8px", fontSize: "10px", fontWeight: 800, fontFamily: "monospace", borderRadius: "99px", color: "#2dd4bf", background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.25)" }}>
                            ${(totalValue / 1000).toFixed(1)}k
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "#334155", fontFamily: "monospace" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Rows style={{ width: "10px", height: "10px" }} /> {dealCount}
                        </span>
                        {avgDaysInStage !== undefined && avgDaysInStage > 0 && (
                            <span style={{ color: "#818cf8", display: "flex", alignItems: "center", gap: "4px", background: "rgba(99,102,241,0.1)", padding: "1px 6px", borderRadius: "4px" }} title="Promedio de días en etapa">
                                ⏱️ ~{avgDaysInStage}d
                            </span>
                        )}
                    </div>
                    <div>
                        {(stagnantCount || 0) > 0 && (
                            <span style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "2px 8px", borderRadius: "6px", fontWeight: 800 }}>
                                ⏳ {stagnantCount} estancados
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto min-h-0 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="space-y-3 min-h-[150px] relative z-10 pb-4">
                    {dealCount === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "128px", border: "2px dashed rgba(30,41,59,0.8)", borderRadius: "12px", margin: "6px", color: "#334155" }}>
                            <svg style={{ width: "28px", height: "28px", marginBottom: "8px", opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace" }}>Soltar Aquí</span>
                        </div>
                    ) : children}
                </div>
            </div>
        </div>
    );
}

const DraggableDeal = memo(function DraggableDeal({
    deal, onClick, onEdit, onDuplicate, onDelete,
    onQuickUpdate, isBulkMode, isSelected, onToggleSelect, users
}: {
    deal: Deal, onClick: () => void, onEdit: () => void, onDuplicate: () => void, onDelete: () => void,
    onQuickUpdate?: (id: string, updates: Partial<Deal>) => void,
    isBulkMode?: boolean,
    isSelected?: boolean,
    onToggleSelect?: () => void,
    users?: { id: string; name: string | null; email: string | null }[]
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: deal.id,
        data: deal
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50, // Keep dragged item above others
    } : undefined;

    if (isDragging) {
        return (
            <div ref={setNodeRef} style={style} className="opacity-40 scale-105 transition-transform duration-200 cursor-grabbing">
                <div className="pointer-events-none shadow-2xl ring-2 ring-blue-500 rounded-xl relative">
                    <DealCard deal={deal} />
                </div>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform duration-200 relative">
            <DealContextMenu
                deal={deal}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                users={users ?? []}
            >
                <div onClick={(e) => {
                    if (isBulkMode && onToggleSelect) {
                        e.stopPropagation();
                        onToggleSelect();
                    } else {
                        onClick();
                    }
                }} className="group">
                    {isBulkMode && (
                        <div className="absolute top-2 left-2 z-20">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(); }}
                                className="w-5 h-5 rounded-[6px] border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/50 backdrop-blur shadow-sm cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                    <DealCard deal={deal} onQuickUpdate={onQuickUpdate} />
                    {/* Visual Hover Feedback Ring */}
                    <div className={`absolute inset-0 rounded-xl transition-colors pointer-events-none ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/10' : 'ring-2 ring-transparent group-hover:ring-blue-200'}`} />
                </div>
            </DealContextMenu>
        </div>
    );
});

export function KanbanBoard({ initialDeals, users = [] }: { initialDeals: Deal[]; users?: { id: string; name: string | null; email: string | null }[] }) {
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<"date" | "value">("date");
    const [compactMode, setCompactMode] = useState(false);

    // Bulk Mode State
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Sincronizar estado local cuando llegan nuevos props del servidor (por ejemplo al borrar o editar)
    useEffect(() => {
        setDeals(initialDeals);
    }, [initialDeals]);

    // Filter deals
    const filteredDeals = deals.filter(deal => {
        const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deal.contactName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'ALL' || deal.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    // Sort deals
    const sortedDeals = [...filteredDeals].sort((a, b) => {
        if (sortBy === 'value') {
            return b.value - a.value;
        }
        // Default to date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    function handleDragStart(event: DragStartEvent) {
        setActiveDeal((event.active.data.current as Deal) || null);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveDeal(null);

        if (!over) return;

        const dealId = active.id as string;
        const newStage = over.id as string;
        const currentDeal = deals.find(d => d.id === dealId);

        if (currentDeal && currentDeal.stage !== newStage) {
            // Fase 2 - Validation Rule upon dropping
            if (newStage === 'LOST') {
                const reason = window.prompt("⚠️ Regla de validación: Por favor ingresa el motivo de pérdida del deal.");
                if (reason === null || reason.trim() === '') {
                    toast.error("Movimiento cancelado: Motivo requerido para deals perdidos.");
                    return;
                }
            }

            // Confetti v2: Enhanced for WON deals, extra for big deals > $10k
            if (newStage === 'WON') {
                const isBigDeal = currentDeal.value >= 10000;
                if (isBigDeal) {
                    // Fireworks effect for big deals!
                    const duration = 3 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

                    const interval = setInterval(() => {
                        const timeLeft = animationEnd - Date.now();
                        if (timeLeft <= 0) return clearInterval(interval);
                        const particleCount = 50 * (timeLeft / duration);
                        confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
                    }, 250);
                } else {
                    // Normal celebration
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            }

            setDeals(deals.map(d =>
                d.id === dealId ? { ...d, stage: newStage, lastActivity: new Date() } : d
            ));

            try {
                // We use updateDealStage which now calls updateDeal (generic)
                await updateDealStage(dealId, newStage);
            } catch (e) {
                console.error(e);
            }
        }
    }

    // --- Fase 2: Mutaciones de Productividad Senior ---
    const handleQuickUpdate = useCallback(async (dealId: string, updates: Partial<Deal>) => {
        setDeals(deals => deals.map(d => d.id === dealId ? { ...d, ...updates } : d));
        try {
            await updateDeal(dealId, updates);
            toast.success("Valor actualizado");
        } catch (e) {
            toast.error("Error al actualizar rápidamente");
        }
    }, []);

    const toggleSelection = useCallback((dealId: string) => {
        setSelectedDealIds(prev => prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]);
    }, []);

    const toggleBulkMode = useCallback(() => {
        setIsBulkMode(prev => !prev);
        setSelectedDealIds([]);
    }, []);

    const handleBulkMove = async (newStage: string) => {
        if (selectedDealIds.length === 0) return;

        // Optimistic UI update
        const count = selectedDealIds.length;
        setDeals(deals.map(d => selectedDealIds.includes(d.id) ? { ...d, stage: newStage, lastActivity: new Date() } : d));

        const idsToUpdate = [...selectedDealIds];
        setSelectedDealIds([]);
        setIsBulkMode(false);

        try {
            await Promise.all(idsToUpdate.map(id => updateDealStage(id, newStage)));
            toast.success(`Movidos ${count} deals a ${STAGES.find(s => s.id === newStage)?.label}`);
        } catch (e) {
            toast.error("Error moviendo en lote");
        }
    }

    // Handlers for Context Menu
    const executeDuplicate = useCallback(async (dealToDupe: Deal) => {
        try {
            const { id, createdAt, updatedAt, ...dealData } = dealToDupe;
            const res = await createDeal({
                ...dealData,
                title: `${dealData.title} (Copy)`,
            });
            if (res.error) toast.error("Error al duplicar deal");
            else toast.success("Deal duplicado con éxito");
        } catch (e) {
            toast.error("Error intentando duplicar...");
        }
    }, []);

    const executeDelete = useCallback(async (dealId: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar este Deal? Esta acción no se puede deshacer.")) {
            try {
                const res = await deleteDeal(dealId);
                if (res.error) toast.error("Error al eliminar deal");
                else toast.success("Deal eliminado");
            } catch (e) {
                toast.error("Error inesperado al borrar");
            }
        }
    }, []);

    if (!mounted) {
        return (
            <div className="flex gap-4 h-[calc(100vh-250px)] overflow-x-auto pb-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-80 bg-muted/50 rounded-xl p-4 space-y-4">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    // Phase 15 Batch B: Calculate Pipeline Metrics
    const totalPipeline = deals.reduce((sum, d) => sum + (d.stage !== 'WON' && d.stage !== 'LOST' ? d.value : 0), 0);
    const weightedForecast = deals.reduce((sum, d) => sum + (d.stage !== 'WON' && d.stage !== 'LOST' ? d.value * (d.probability || 50) / 100 : 0), 0);
    const wonDeals = deals.filter(d => d.stage === 'WON').length;
    const closedDeals = deals.filter(d => d.stage === 'WON' || d.stage === 'LOST').length;
    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    // Phase 15: Calculate funnel data
    const funnelData = STAGES.filter(s => s.id !== 'WON' && s.id !== 'LOST').map(stage => ({
        name: stage.label,
        count: deals.filter(d => d.stage === stage.id).length
    }));
    const maxFunnelCount = Math.max(...funnelData.map(d => d.count), 1);

    // DEBUG: Show raw deal stages to diagnose sync issues (REMOVE AFTER FIX)
    const DEBUG_MODE = process.env.NODE_ENV === 'development' || deals.every(d => funnelData.every(s => deals.filter(deal => deal.stage === STAGES.find(st => st.label === s.name)?.id).length === 0));

    return (
        <div className="flex flex-col h-full space-y-5">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {[
                    { label: "Tubería Total", value: `$${(totalPipeline / 1000).toFixed(1)}`, unit: "mil", color: "#60a5fa", icon: "$", code: "PPL" },
                    { label: "Pronóstico Ponderado", value: `$${(weightedForecast / 1000).toFixed(1)}`, unit: "mil", color: "#34d399", icon: "📊", code: "WGT" },
                    { label: "Tasa de Victorias", value: `${winRate}`, unit: "%", color: "#a78bfa", icon: "🏆", code: "WIN" },
                    { label: "Ofertas Activas", value: `${deals.filter(d => d.stage !== 'WON' && d.stage !== 'LOST').length}`, unit: "", color: "#fbbf24", icon: "📋", code: "ACT" },
                ].map((m, i) => (
                    <div key={i} style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "14px", padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <p style={{ fontSize: "9px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", margin: 0 }}>{m.label}</p>
                            <span style={{ fontSize: "14px" }}>{m.icon}</span>
                        </div>
                        <p style={{ fontSize: "28px", fontWeight: 900, color: m.color, fontFamily: "monospace", lineHeight: 1, marginTop: "8px" }}>
                            {m.value}<span style={{ fontSize: "14px", color: "#475569" }}>{m.unit}</span>
                        </p>
                    </div>
                ))}

                {/* Funnel Visual */}
                <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", minHeight: "90px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.12em", color: "#334155", position: "absolute", top: "12px", left: "14px", fontFamily: "monospace" }}>Embudo de Conversión</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "44px", marginTop: "20px" }}>
                        {funnelData.map((stage, i) => (
                            <div key={stage.name} className="flex-1 rounded-t-sm transition-all duration-700 hover:opacity-100 opacity-80 group/bar relative"
                                style={{ height: `${Math.max((stage.count / maxFunnelCount) * 100, 15)}%`, background: `linear-gradient(to top, rgba(13,148,136,0.5), rgba(45,212,191,${0.3 + i * 0.08}))` }}>
                                <div style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", fontWeight: 800, color: "#2dd4bf", background: "rgba(11,15,25,0.9)", padding: "1px 4px", borderRadius: "4px", opacity: 0, fontFamily: "monospace" }} className="group-hover/bar:opacity-100 transition-opacity">
                                    {stage.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toolbar Principal */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "10px 12px", background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "12px" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "380px" }}>
                    <Search style={{ position: "absolute", left: "10px", top: "9px", width: "13px", height: "13px", color: "#475569" }} />
                    <input
                        placeholder="Buscar deals, clientes, emails..."
                        style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "9px", padding: "8px 12px 8px 30px", fontSize: "12px", color: "#cbd5e1", outline: "none" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "4px 8px", gap: "5px" }}>
                        <ArrowUpDown style={{ width: "12px", height: "12px", color: "#475569" }} />
                        <select
                            style={{ fontSize: "11px", background: "transparent", border: "none", color: "#94a3b8", fontFamily: "monospace", outline: "none", cursor: "pointer" }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "date" | "value")}
                        >
                            <option value="date">Ordenar por Fecha</option>
                            <option value="value">Ordenar por Valor</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "4px 8px", gap: "5px" }}>
                        <Filter style={{ width: "12px", height: "12px", color: "#475569" }} />
                        <select
                            style={{ fontSize: "11px", background: "transparent", border: "none", color: "#94a3b8", fontFamily: "monospace", outline: "none", cursor: "pointer" }}
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="ALL">Todo</option>
                            <option value="HIGH">Alta Prioridad 🔥</option>
                            <option value="MEDIUM">Prioridad Media</option>
                            <option value="LOW">Baja Prioridad</option>
                        </select>
                    </div>

                    <button onClick={() => setCompactMode(!compactMode)}
                        style={{ padding: "7px", borderRadius: "8px", border: `1px solid ${compactMode ? "rgba(99,102,241,0.4)" : "rgba(30,41,59,0.9)"}`, background: compactMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.8)", color: compactMode ? "#818cf8" : "#475569", cursor: "pointer", display: "flex" }}
                        title={compactMode ? 'Vista Extendida' : 'Vista Compacta'}>
                        <Rows style={{ width: "13px", height: "13px" }} />
                    </button>

                    <button onClick={toggleBulkMode}
                        style={{ padding: "7px", borderRadius: "8px", border: `1px solid ${isBulkMode ? "rgba(99,102,241,0.5)" : "rgba(30,41,59,0.9)"}`, background: isBulkMode ? "rgba(99,102,241,0.2)" : "rgba(15,23,42,0.8)", color: isBulkMode ? "#818cf8" : "#475569", cursor: "pointer", display: "flex", boxShadow: isBulkMode ? "0 0 12px rgba(99,102,241,0.3)" : undefined }}
                        title="Selección Múltiple">
                        <CheckSquare style={{ width: "13px", height: "13px" }} />
                    </button>

                    {isBulkMode && selectedDealIds.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "9px", padding: "4px 8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "#818cf8", fontFamily: "monospace" }}>{selectedDealIds.length} sel.</span>
                            <select
                                style={{ fontSize: "11px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "6px", color: "#94a3b8", fontFamily: "monospace", outline: "none", cursor: "pointer", padding: "3px 6px" }}
                                onChange={(e) => { if (e.target.value) handleBulkMove(e.target.value); e.target.value = ''; }}
                                defaultValue="">
                                <option value="" disabled>Mover a...</option>
                                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-5 h-[calc(100vh-320px)] overflow-x-auto pb-6 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {STAGES.map(stage => {
                        const stageDeals = sortedDeals.filter(d => d.stage === stage.id);
                        const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

                        // Phase 15: Calculate stagnant count (deals > 7 days in stage)
                        const stagnantCount = stageDeals.filter(d => {
                            const daysInStage = d.lastActivity
                                ? Math.floor((new Date().getTime() - new Date(d.lastActivity).getTime()) / (1000 * 3600 * 24))
                                : 0;
                            return daysInStage > 7;
                        }).length;

                        // Phase 15: Calculate avg days in stage
                        const avgDaysInStage = stageDeals.length > 0
                            ? Math.round(stageDeals.reduce((sum, d) => {
                                const days = d.lastActivity
                                    ? Math.floor((new Date().getTime() - new Date(d.lastActivity).getTime()) / (1000 * 3600 * 24))
                                    : 0;
                                return sum + days;
                            }, 0) / stageDeals.length)
                            : 0;

                        return (
                            <DroppableStage
                                key={stage.id}
                                stage={stage}
                                totalValue={totalValue}
                                dealCount={stageDeals.length}
                                stagnantCount={stagnantCount}
                                avgDaysInStage={avgDaysInStage}
                            >
                                {stageDeals.map(deal => (
                                    <DraggableDeal
                                        key={deal.id}
                                        deal={deal}
                                        onClick={() => setSelectedDeal(deal)}
                                        onEdit={() => setSelectedDeal(deal)}
                                        onDuplicate={() => executeDuplicate(deal)}
                                        onDelete={() => executeDelete(deal.id)}
                                        onQuickUpdate={handleQuickUpdate}
                                        isBulkMode={isBulkMode}
                                        isSelected={selectedDealIds.includes(deal.id)}
                                        onToggleSelect={() => toggleSelection(deal.id)}
                                        users={users}
                                    />
                                ))}
                            </DroppableStage>
                        )
                    })}
                </div>

                {createPortal(
                    <DragOverlay>
                        {activeDeal ? <DealCard deal={activeDeal} /> : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>

            {selectedDeal && (
                <DealDetailsDialog
                    deal={selectedDeal}
                    open={!!selectedDeal}
                    onOpenChange={(open) => {
                        if (!open) setSelectedDeal(null);
                    }}
                />
            )}
        </div>
    )
}
