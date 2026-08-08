"use client";

import React, { useState } from "react";
import { Package, Plus, DollarSign, Tag, Edit3, Trash2, ShieldCheck, Search, Percent, HeartPulse } from "lucide-react";
import { toast } from "sonner";

export interface DianProductRecord {
    id: string;
    code: string; // SKU o Código Interno
    unspscCode: string; // Código Estándar UNSPSC DIAN (ej: 43231500)
    name: string;
    type: "PRODUCTO" | "SERVICIO";
    price: number;
    vatRate: 19 | 5 | 0; // Tarifa IVA 19%, 5% o 0% Exento
    isExcludedVat: boolean; // IVA Excluido Art. 424 ET
    unitMeasure: string; // WSD (Servicio), EA (Unidad), KGM (Kilo)
    hasInc: boolean; // Impuesto al Consumo INC 8%
    hasHealthyTax: boolean; // Impuesto Saludable ICUI / IBUA (Ley 2277)
    healthyTaxRate?: number; // % Impuesto Saludable (ej. 10%, 15%, 20%)
}

export function DianProductsServicesManager() {
    const [products, setProducts] = useState<DianProductRecord[]>([
        {
            id: "1",
            code: "PROD-001",
            unspscCode: "22211500",
            name: "Bolsa Plástica Biodegradable 30x40 cm",
            type: "PRODUCTO",
            price: 450,
            vatRate: 19,
            isExcludedVat: false,
            unitMeasure: "EA - Unidad",
            hasInc: false,
            hasHealthyTax: false,
        },
        {
            id: "2",
            code: "SERV-101",
            unspscCode: "81111500",
            name: "Desarrollo y Parametrización de Software ERP",
            type: "SERVICIO",
            price: 2500000,
            vatRate: 19,
            isExcludedVat: false,
            unitMeasure: "WSD - Servicio",
            hasInc: false,
            hasHealthyTax: false,
        },
        {
            id: "3",
            code: "BEB-202",
            unspscCode: "50202300",
            name: "Bebida Azucarada Refrescante 500ml",
            type: "PRODUCTO",
            price: 3200,
            vatRate: 19,
            isExcludedVat: false,
            unitMeasure: "EA - Unidad",
            hasInc: false,
            hasHealthyTax: true,
            healthyTaxRate: 15,
        },
    ]);

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<DianProductRecord | null>(null);

    const [form, setForm] = useState<Partial<DianProductRecord>>({
        code: "",
        unspscCode: "81111500",
        name: "",
        type: "PRODUCTO",
        price: 0,
        vatRate: 19,
        isExcludedVat: false,
        unitMeasure: "EA - Unidad",
        hasInc: false,
        hasHealthyTax: false,
        healthyTaxRate: 15,
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.code) {
            toast.error("Ingrese Nombre y Código del Producto/Servicio.");
            return;
        }

        if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...form } as DianProductRecord : p));
            toast.success("Producto / Servicio actualizado");
        } else {
            const newProduct: DianProductRecord = {
                id: Date.now().toString(),
                code: form.code || "",
                unspscCode: form.unspscCode || "81111500",
                name: form.name || "",
                type: form.type as any || "PRODUCTO",
                price: Number(form.price) || 0,
                vatRate: Number(form.vatRate) as any || 19,
                isExcludedVat: Boolean(form.isExcludedVat),
                unitMeasure: form.unitMeasure || "EA - Unidad",
                hasInc: Boolean(form.hasInc),
                hasHealthyTax: Boolean(form.hasHealthyTax),
                healthyTaxRate: Number(form.healthyTaxRate) || 15,
            };
            setProducts(prev => [...prev, newProduct]);
            toast.success("Nuevo Producto / Servicio registrado en el catálogo DIAN");
        }

        setShowModal(false);
        setEditingProduct(null);
    };

    const handleDelete = (id: string) => {
        if (!confirm("¿Desea eliminar este elemento del catálogo?")) return;
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success("Producto / Servicio eliminado");
    };

    const fmtMoney = (n: number) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.unspscCode.includes(search)
    );

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Catálogo Maestro de Productos & Servicios DIAN 🇨🇴
                        </h3>
                        <p className="text-xs text-slate-400">
                            Códigos UNSPSC, Tarifas IVA (19%/5%/Exento), Impuesto Saludable ICUI/IBUA e INC 8%.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por SKU, Nombre o UNSPSC..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setForm({
                                code: "",
                                unspscCode: "81111500",
                                name: "",
                                type: "PRODUCTO",
                                price: 0,
                                vatRate: 19,
                                isExcludedVat: false,
                                unitMeasure: "EA - Unidad",
                                hasInc: false,
                                hasHealthyTax: false,
                                healthyTaxRate: 15,
                            });
                            setShowModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Producto / Servicio
                    </button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                    <thead className="text-slate-400 uppercase bg-slate-900 border-b border-slate-800 text-[10px]">
                        <tr>
                            <th className="p-3.5 font-bold">Código SKU / UNSPSC DIAN</th>
                            <th className="p-3.5 font-bold">Nombre / Descripción Comercial</th>
                            <th className="p-3.5 font-bold">Tipo & Unidad Medida</th>
                            <th className="p-3.5 font-bold text-right">Precio Unitario</th>
                            <th className="p-3.5 font-bold text-center">Tratamiento Tributario</th>
                            <th className="p-3.5 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                        {filtered.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3.5">
                                    <div className="font-bold text-white font-mono">{p.code}</div>
                                    <div className="text-emerald-400 font-mono text-[10px]">UNSPSC: {p.unspscCode}</div>
                                </td>
                                <td className="p-3.5 font-bold text-slate-200 text-sm">
                                    {p.name}
                                </td>
                                <td className="p-3.5">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 mr-1">
                                        {p.type}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">{p.unitMeasure}</span>
                                </td>
                                <td className="p-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                                    {fmtMoney(p.price)}
                                </td>
                                <td className="p-3.5 text-center">
                                    <div className="flex flex-wrap items-center justify-center gap-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            p.isExcludedVat ? "bg-slate-800 text-slate-400" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        }`}>
                                            {p.isExcludedVat ? "IVA Excluido" : `IVA ${p.vatRate}%`}
                                        </span>

                                        {p.hasHealthyTax && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                <HeartPulse className="w-3 h-3" /> Saludable {p.healthyTaxRate}%
                                            </span>
                                        )}

                                        {p.hasInc && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                INC 8%
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button
                                            onClick={() => {
                                                setEditingProduct(p);
                                                setForm({ ...p });
                                                setShowModal(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
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
                            <Package className="w-5 h-5 text-emerald-400" />
                            {editingProduct ? "Editar Producto / Servicio DIAN" : "Nuevo Producto o Servicio DIAN"}
                        </h4>

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Código Interno / SKU *</label>
                                    <input
                                        type="text" required placeholder="PROD-001"
                                        value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Código Estándar UNSPSC DIAN *</label>
                                    <input
                                        type="text" required placeholder="22211500"
                                        value={form.unspscCode} onChange={e => setForm({ ...form, unspscCode: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2">
                                    <label className="font-bold text-slate-300">Nombre / Descripción Comercial *</label>
                                    <input
                                        type="text" required placeholder="Ej: Bolsa Plástica Biodegradable 30x40 cm"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Tipo de Bien</label>
                                    <select
                                        value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-emerald-500"
                                    >
                                        <option value="PRODUCTO">Producto / Mercancía</option>
                                        <option value="SERVICIO">Servicio Profesionales / Técnico</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Precio Unitario de Venta ($) *</label>
                                    <input
                                        type="number" required min="0" step="100" placeholder="25000"
                                        value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Tarifa IVA (%)</label>
                                    <select
                                        value={form.vatRate} onChange={e => setForm({ ...form, vatRate: Number(e.target.value) as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-emerald-500"
                                    >
                                        <option value={19}>19% - Tarifa General IVA</option>
                                        <option value={5}>5% - Tarifa Diferencial</option>
                                        <option value={0}>0% - Exento de IVA</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Unidad de Medida WCO/DIAN</label>
                                    <select
                                        value={form.unitMeasure} onChange={e => setForm({ ...form, unitMeasure: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-emerald-500"
                                    >
                                        <option value="EA - Unidad">EA - Unidad</option>
                                        <option value="WSD - Servicio">WSD - Servicio</option>
                                        <option value="KGM - Kilogramo">KGM - Kilogramo</option>
                                        <option value="LTR - Litro">LTR - Litro</option>
                                        <option value="MTR - Metro">MTR - Metro</option>
                                    </select>
                                </div>

                                <div className="space-y-2 col-span-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <span className="font-bold text-slate-300 block mb-1">Impuestos Especiales (Ley 2277)</span>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={form.isExcludedVat} onChange={e => setForm({ ...form, isExcludedVat: e.target.checked })}
                                                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                                            />
                                            <span>IVA Excluido (Art. 424 ET)</span>
                                        </label>

                                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={form.hasHealthyTax} onChange={e => setForm({ ...form, hasHealthyTax: e.target.checked })}
                                                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                                            />
                                            <span>Impuesto Saludable (ICUI/IBUA)</span>
                                        </label>
                                    </div>
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
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20"
                                >
                                    Guardar Producto / Servicio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
