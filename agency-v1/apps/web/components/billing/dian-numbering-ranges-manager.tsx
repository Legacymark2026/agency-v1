"use client";

import React, { useState } from "react";
import { Hash, Plus, Calendar, ShieldCheck, CheckCircle2, AlertCircle, Trash2, Edit3, Key, Layers, Server } from "lucide-react";
import { toast } from "sonner";

export interface DianNumberingRange {
    id: string;
    documentType: "FACTURA_ELECTRONICA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "DOCUMENTO_SOPORTE" | "POS_ELECTRONICO";
    prefix: string;
    resolutionNumber: string;
    startDate: string;
    endDate: string;
    fromNumber: number;
    toNumber: number;
    currentNumber: number;
    technicalKey: string;
    environment: "1" | "2"; // 1 = Producción, 2 = Pruebas / Habilitación
    isActive: boolean;
}

export function DianNumberingRangesManager() {
    const [ranges, setRanges] = useState<DianNumberingRange[]>([
        {
            id: "1",
            documentType: "FACTURA_ELECTRONICA",
            prefix: "SETP",
            resolutionNumber: "18760000001",
            startDate: "2026-01-15",
            endDate: "2027-01-15",
            fromNumber: 1,
            toNumber: 10000,
            currentNumber: 154,
            technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38112d7d06e23b2075a6e87a25032d8471a5c689d0f488f7b764b8a2135678",
            environment: "2",
            isActive: true,
        },
        {
            id: "2",
            documentType: "NOTA_CREDITO",
            prefix: "NC",
            resolutionNumber: "18760000002",
            startDate: "2026-01-15",
            endDate: "2027-01-15",
            fromNumber: 1,
            toNumber: 5000,
            currentNumber: 12,
            technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38112d7d06e23b2075a6e87a25032d8471a5c689d0f488f7b764b8a2135678",
            environment: "2",
            isActive: true,
        },
        {
            id: "3",
            documentType: "DOCUMENTO_SOPORTE",
            prefix: "DS",
            resolutionNumber: "18760000003",
            startDate: "2026-02-01",
            endDate: "2027-02-01",
            fromNumber: 1,
            toNumber: 2000,
            currentNumber: 45,
            technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38112d7d06e23b2075a6e87a25032d8471a5c689d0f488f7b764b8a2135678",
            environment: "2",
            isActive: true,
        },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<DianNumberingRange | null>(null);

    const [form, setForm] = useState<Partial<DianNumberingRange>>({
        documentType: "FACTURA_ELECTRONICA",
        prefix: "FE",
        resolutionNumber: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        fromNumber: 1,
        toNumber: 10000,
        currentNumber: 1,
        technicalKey: "",
        environment: "2",
        isActive: true,
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.resolutionNumber || !form.prefix) {
            toast.error("Complete el número de resolución y el prefijo.");
            return;
        }

        if (editingItem) {
            setRanges(prev => prev.map(r => r.id === editingItem.id ? { ...r, ...form } as DianNumberingRange : r));
            toast.success("Rango de numeración DIAN actualizado correctamente");
        } else {
            const newRange: DianNumberingRange = {
                id: Date.now().toString(),
                documentType: form.documentType as any,
                prefix: form.prefix || "FE",
                resolutionNumber: form.resolutionNumber || "",
                startDate: form.startDate || "",
                endDate: form.endDate || "",
                fromNumber: Number(form.fromNumber) || 1,
                toNumber: Number(form.toNumber) || 10000,
                currentNumber: Number(form.currentNumber) || 1,
                technicalKey: form.technicalKey || "",
                environment: form.environment as any || "2",
                isActive: true,
            };
            setRanges(prev => [...prev, newRange]);
            toast.success("Nuevo rango de numeración DIAN registrado");
        }

        setShowModal(false);
        setEditingItem(null);
    };

    const handleDelete = (id: string) => {
        if (!confirm("¿Desea eliminar este rango de numeración DIAN?")) return;
        setRanges(prev => prev.filter(r => r.id !== id));
        toast.success("Rango eliminado");
    };

    const docTypeLabels: Record<string, string> = {
        FACTURA_ELECTRONICA: "Factura Electrónica de Venta (FE)",
        NOTA_CREDITO: "Nota Crédito Electrónica (NC)",
        NOTA_DEBITO: "Nota Débito Electrónica (ND)",
        DOCUMENTO_SOPORTE: "Documento Soporte en Adquisiciones (DS)",
        POS_ELECTRONICO: "Tiquete POS Electrónico",
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400">
                        <Hash className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Configuración de Rangos de Numeración DIAN 🇨🇴
                        </h3>
                        <p className="text-xs text-slate-400">
                            Resoluciones de facturación, prefijos, rangos autorizados y Clave Técnica SHA-384.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setEditingItem(null);
                        setForm({
                            documentType: "FACTURA_ELECTRONICA",
                            prefix: "FE",
                            resolutionNumber: "",
                            startDate: new Date().toISOString().split("T")[0],
                            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                            fromNumber: 1,
                            toNumber: 10000,
                            currentNumber: 1,
                            technicalKey: "",
                            environment: "2",
                            isActive: true,
                        });
                        setShowModal(true);
                    }}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-teal-600/20"
                >
                    <Plus className="w-4 h-4" /> Agregar Resolución DIAN
                </button>
            </div>

            {/* List Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                    <thead className="text-slate-400 uppercase bg-slate-900 border-b border-slate-800 text-[10px]">
                        <tr>
                            <th className="p-3.5 font-bold">Tipo Documento & Prefijo</th>
                            <th className="p-3.5 font-bold">N° Resolución DIAN</th>
                            <th className="p-3.5 font-bold text-center">Vigencia (Desde / Hasta)</th>
                            <th className="p-3.5 font-bold text-center">Rango Autorizado</th>
                            <th className="p-3.5 font-bold text-center">Consecutivo Actual</th>
                            <th className="p-3.5 font-bold text-center">Ambiente</th>
                            <th className="p-3.5 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                        {ranges.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3.5">
                                    <div className="font-bold text-white text-sm">{docTypeLabels[r.documentType]}</div>
                                    <div className="text-teal-400 font-mono font-bold text-xs">Prefijo: {r.prefix}</div>
                                </td>
                                <td className="p-3.5 font-mono text-slate-200 font-bold">{r.resolutionNumber}</td>
                                <td className="p-3.5 text-center font-mono text-slate-400">
                                    {r.startDate} a {r.endDate}
                                </td>
                                <td className="p-3.5 text-center font-mono font-bold text-slate-300">
                                    {r.fromNumber.toLocaleString()} - {r.toNumber.toLocaleString()}
                                </td>
                                <td className="p-3.5 text-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        #{r.prefix}-{r.currentNumber}
                                    </span>
                                </td>
                                <td className="p-3.5 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        r.environment === "1" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}>
                                        {r.environment === "1" ? "1 - Producción" : "2 - Pruebas / Habilitación"}
                                    </span>
                                </td>
                                <td className="p-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button
                                            onClick={() => {
                                                setEditingItem(r);
                                                setForm({ ...r });
                                                setShowModal(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
                        <h4 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                            <Hash className="w-5 h-5 text-teal-400" />
                            {editingItem ? "Editar Resolución DIAN" : "Nueva Resolución de Numeración DIAN"}
                        </h4>

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="font-bold text-slate-300">Tipo de Documento</label>
                                    <select
                                        value={form.documentType}
                                        onChange={e => setForm({ ...form, documentType: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-teal-500"
                                    >
                                        <option value="FACTURA_ELECTRONICA">Factura Electrónica de Venta (FE)</option>
                                        <option value="NOTA_CREDITO">Nota Crédito Electrónica (NC)</option>
                                        <option value="NOTA_DEBITO">Nota Débito Electrónica (ND)</option>
                                        <option value="DOCUMENTO_SOPORTE">Documento Soporte en Adquisiciones (DS)</option>
                                        <option value="POS_ELECTRONICO">Tiquete POS Electrónico</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Prefijo Autorizado *</label>
                                    <input
                                        type="text" required placeholder="Ej: SETP, FE, NC"
                                        value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-teal-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">N° Resolución DIAN *</label>
                                    <input
                                        type="text" required placeholder="Ej: 18760000001"
                                        value={form.resolutionNumber} onChange={e => setForm({ ...form, resolutionNumber: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-teal-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Fecha Inicio Vigencia</label>
                                    <input
                                        type="date"
                                        value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-teal-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Fecha Fin Vigencia</label>
                                    <input
                                        type="date"
                                        value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-teal-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Rango Desde</label>
                                    <input
                                        type="number" min="1"
                                        value={form.fromNumber} onChange={e => setForm({ ...form, fromNumber: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-teal-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Rango Hasta</label>
                                    <input
                                        type="number" min="1"
                                        value={form.toNumber} onChange={e => setForm({ ...form, toNumber: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-teal-500"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2">
                                    <label className="font-bold text-slate-300">Clave Técnica DIAN (64 caracteres Hex SHA-384)</label>
                                    <input
                                        type="text" placeholder="fc8eac422eba16e22ffd8c6f94b3f4..."
                                        value={form.technicalKey} onChange={e => setForm({ ...form, technicalKey: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono outline-none focus:border-teal-500"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2">
                                    <label className="font-bold text-slate-300">Ambiente de Operación</label>
                                    <select
                                        value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-teal-500"
                                    >
                                        <option value="2">2 - Pruebas / Habilitación (Set de Pruebas DIAN)</option>
                                        <option value="1">1 - Producción Oficial DIAN</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20"
                                >
                                    Guardar Resolución
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
