"use client";

import { useState } from "react";
import { Utensils, Users, CheckCircle2, Clock, Split, Send, DollarSign, Sparkles } from "lucide-react";

export interface RestaurantTable {
    id: string;
    number: number;
    name: string;
    zone: "Comedor Principal" | "Terraza / VIP" | "Barra & Coctelería";
    capacity: number;
    status: "LIBRE" | "OCUPADA" | "POR_COBRAR" | "RESERVADA";
    currentOrder?: {
        orderId: string;
        waiterName: string;
        itemCount: number;
        subtotal: number;
        openedAt: string;
    };
}

const DEFAULT_TABLES: RestaurantTable[] = [
    { id: "t1", number: 1, name: "Mesa 01", zone: "Comedor Principal", capacity: 4, status: "LIBRE" },
    {
        id: "t2", number: 2, name: "Mesa 02", zone: "Comedor Principal", capacity: 2, status: "OCUPADA",
        currentOrder: { orderId: "ord_101", waiterName: "Carlos M.", itemCount: 3, subtotal: 85000, openedAt: "11:15 AM" }
    },
    {
        id: "t3", number: 3, name: "Mesa 03", zone: "Comedor Principal", capacity: 6, status: "POR_COBRAR",
        currentOrder: { orderId: "ord_102", waiterName: "Laura G.", itemCount: 5, subtotal: 195000, openedAt: "10:45 AM" }
    },
    { id: "t4", number: 4, name: "Mesa 04", zone: "Comedor Principal", capacity: 4, status: "LIBRE" },
    { id: "t5", number: 5, name: "Mesa VIP 01", zone: "Terraza / VIP", capacity: 8, status: "RESERVADA" },
    {
        id: "t6", number: 6, name: "Mesa VIP 02", zone: "Terraza / VIP", capacity: 4, status: "OCUPADA",
        currentOrder: { orderId: "ord_103", waiterName: "Carlos M.", itemCount: 4, subtotal: 142000, openedAt: "11:30 AM" }
    },
    { id: "t7", number: 7, name: "Barra 01", zone: "Barra & Coctelería", capacity: 2, status: "LIBRE" },
    { id: "t8", number: 8, name: "Barra 02", zone: "Barra & Coctelería", capacity: 2, status: "LIBRE" },
];

interface RestaurantTableMapProps {
    onSelectTable: (table: RestaurantTable) => void;
}

export function RestaurantTableMap({ onSelectTable }: RestaurantTableMapProps) {
    const [tables, setTables] = useState<RestaurantTable[]>(DEFAULT_TABLES);
    const [selectedZone, setSelectedZone] = useState<string>("TODAS");
    const [splitModalTable, setSplitModalTable] = useState<RestaurantTable | null>(null);
    const [splitPersons, setSplitPersons] = useState<number>(2);

    const filteredTables = selectedZone === "TODAS"
        ? tables
        : tables.filter(t => t.zone === selectedZone);

    const statusColors = {
        LIBRE: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20",
        OCUPADA: "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20",
        POR_COBRAR: "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20",
        RESERVADA: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20",
    };

    const statusBadges = {
        LIBRE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        OCUPADA: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        POR_COBRAR: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        RESERVADA: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    };

    const fmtCOP = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

    const handleSendComanda = (table: RestaurantTable, e: React.MouseEvent) => {
        e.stopPropagation();
        alert(`🍳 Comanda de ${table.name} enviada exitosamente a la Impresora de Cocina & Pantalla KDS.`);
    };

    const handleOpenSplitModal = (table: RestaurantTable, e: React.MouseEvent) => {
        e.stopPropagation();
        setSplitModalTable(table);
        setSplitPersons(2);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 text-white">
            {/* HEADER & FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                        <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-white">Mapa de Mesas & Comandero Interactivo (KDS)</h3>
                        <p className="text-xs text-slate-400">Gestión de mesas en tiempo real, división de cuentas e impresión a cocina.</p>
                    </div>
                </div>

                {/* ZONE SELECTOR */}
                <div className="flex gap-1.5 flex-wrap">
                    {["TODAS", "Comedor Principal", "Terraza / VIP", "Barra & Coctelería"].map(zone => (
                        <button
                            key={zone}
                            onClick={() => setSelectedZone(zone)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                selectedZone === zone
                                    ? "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-600/20"
                                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                            }`}
                        >
                            {zone}
                        </button>
                    ))}
                </div>
            </div>

            {/* STATUS LEGEND */}
            <div className="flex flex-wrap gap-4 text-xs font-medium bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /> Disponible</span>
                <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Ocupada</span>
                <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Por Cobrar</span>
                <span className="flex items-center gap-1.5 text-indigo-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Reservada</span>
            </div>

            {/* 2D TABLES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTables.map(table => (
                    <div
                        key={table.id}
                        onClick={() => onSelectTable(table)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-48 space-y-3 relative group ${statusColors[table.status]}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="font-bold text-sm text-white block">{table.name}</span>
                                <span className="text-[11px] opacity-75">{table.zone}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadges[table.status]}`}>
                                {table.status}
                            </span>
                        </div>

                        {table.currentOrder ? (
                            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1 text-slate-300">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="flex items-center gap-1 text-slate-400"><Clock className="w-3 h-3 text-teal-400" /> {table.currentOrder.openedAt}</span>
                                    <span className="font-semibold text-slate-200">{table.currentOrder.waiterName}</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-white pt-1 border-t border-slate-800">
                                    <span>{table.currentOrder.itemCount} Ítems</span>
                                    <span className="text-teal-400">{fmtCOP(table.currentOrder.subtotal)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-4 text-xs opacity-60">
                                <Users className="w-4 h-4 mr-1.5" /> Capacidad: {table.capacity} Personas
                            </div>
                        )}

                        {/* ACTIONS FOR OCCUPIED / PENDING TABLES */}
                        {table.currentOrder && (
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={(e) => handleSendComanda(table, e)}
                                    title="Enviar Comanda a Cocina"
                                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold text-[11px] flex items-center justify-center gap-1"
                                >
                                    <Send className="w-3 h-3" /> Comanda
                                </button>
                                <button
                                    onClick={(e) => handleOpenSplitModal(table, e)}
                                    title="Dividir Cuenta (Split Bill)"
                                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-[11px] flex items-center justify-center gap-1"
                                >
                                    <Split className="w-3 h-3" /> Dividir
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* SPLIT BILL MODAL */}
            {splitModalTable && splitModalTable.currentOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 text-white shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h4 className="font-bold text-base flex items-center gap-2">
                                <Split className="w-5 h-5 text-amber-400" /> Dividir Cuenta — {splitModalTable.name}
                            </h4>
                            <button onClick={() => setSplitModalTable(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Total de la Cuenta:</span>
                                <span className="font-bold text-white">{fmtCOP(splitModalTable.currentOrder.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                <span className="text-xs font-bold text-amber-300">Número de Personas a Dividir:</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSplitPersons(Math.max(2, splitPersons - 1))}
                                        className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700"
                                    >-</button>
                                    <span className="font-bold text-base text-white">{splitPersons}</span>
                                    <button
                                        onClick={() => setSplitPersons(splitPersons + 1)}
                                        className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700"
                                >+</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-center space-y-1">
                            <span className="text-xs text-slate-300">Valor por Persona ({splitPersons} partes iguales):</span>
                            <div className="text-xl font-extrabold text-teal-300">
                                {fmtCOP(Math.ceil(splitModalTable.currentOrder.subtotal / splitPersons))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setSplitModalTable(null)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    alert(`✅ Cuenta dividida en ${splitPersons} partes de ${fmtCOP(Math.ceil(splitModalTable.currentOrder.subtotal / splitPersons))}. Listos para cobrar separadamente.`);
                                    setSplitModalTable(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20"
                            >
                                Confirmar División
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
