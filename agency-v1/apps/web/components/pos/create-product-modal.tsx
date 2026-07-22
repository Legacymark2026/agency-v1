"use client";

import React, { useState } from "react";
import { Plus, X, Package, Tag, DollarSign, Layers, Barcode, CheckCircle2 } from "lucide-react";

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: (product: any) => void;
}

export function CreateProductModal({ isOpen, onClose, onCreated }: CreateProductModalProps) {
    const [title, setTitle] = useState("");
    const [sku, setSku] = useState("");
    const [barcode, setBarcode] = useState("");
    const [category, setCategory] = useState("Servicios");
    const [unitPrice, setUnitPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [wholesalePrice, setWholesalePrice] = useState("");
    const [stock, setStock] = useState("50");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/pos/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    sku: sku || `SKU-${Date.now().toString().slice(-5)}`,
                    barcode: barcode || `770${Date.now().toString().slice(-9)}`,
                    category,
                    unitPrice: parseFloat(unitPrice) || 0,
                    costPrice: parseFloat(costPrice) || 0,
                    wholesalePrice: parseFloat(wholesalePrice) || (parseFloat(unitPrice) * 0.85),
                    stock: parseInt(stock, 10) || 0,
                    description,
                    taxRate: 0.19,
                    isActive: true,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Fallo al guardar producto en catálogo");
            }

            if (onCreated) onCreated(data.product);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Nuevo Producto / Servicio</h2>
                            <p className="text-xs text-slate-400">Agregar ítem al Catálogo del Microservicio POS</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-teal-400" /> Nombre del Producto o Servicio *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Consultoría DIAN / Combo Impresora POS"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                <Barcode className="w-3.5 h-3.5 text-indigo-400" /> SKU / Código Referencia
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. SERV-009"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-amber-400" /> Categoría
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                            >
                                <option value="Servicios">Servicios</option>
                                <option value="Diseño">Diseño</option>
                                <option value="Desarrollo">Desarrollo</option>
                                <option value="SaaS">SaaS</option>
                                <option value="Hardware">Hardware</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Precio Detal *
                            </label>
                            <input
                                type="number"
                                required
                                placeholder="150000"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Precio Costo
                            </label>
                            <input
                                type="number"
                                placeholder="65000"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Mayorista (-15%)
                            </label>
                            <input
                                type="number"
                                placeholder="125000"
                                value={wholesalePrice}
                                onChange={(e) => setWholesalePrice(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Stock Inicial de Inventario</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition-all font-mono"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
                        >
                            {loading ? "Guardando..." : <><CheckCircle2 className="w-4 h-4" /> Guardar Producto</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
