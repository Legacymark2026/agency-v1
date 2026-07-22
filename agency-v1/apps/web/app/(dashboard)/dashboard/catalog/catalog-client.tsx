"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Package, Plus, Search, RefreshCw, Layers, Tag, DollarSign,
    Barcode, ArrowUpRight, ShoppingCart, CheckCircle2, ShieldCheck,
    SlidersHorizontal, TrendingUp, AlertCircle, Edit3, Trash2, Zap
} from "lucide-react";

interface CatalogItem {
    id: string;
    companyId: string;
    sku: string;
    barcode: string;
    title: string;
    description?: string;
    category: string;
    unitPrice: number;
    costPrice: number;
    wholesalePrice: number;
    taxRate: number;
    stock: number;
    isActive: boolean;
    imageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export default function CatalogClient() {
    const [products, setProducts] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Form state for creating catalog item
    const [title, setTitle] = useState("");
    const [sku, setSku] = useState("");
    const [barcode, setBarcode] = useState("");
    const [category, setCategory] = useState("Servicios");
    const [unitPrice, setUnitPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [wholesalePrice, setWholesalePrice] = useState("");
    const [stock, setStock] = useState("50");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const categoriesList = ["Todos", "Servicios", "Diseño", "Desarrollo", "SaaS", "Hardware", "General"];

    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pos/products");
            if (res.ok) {
                const data = await res.json();
                if (data.products) setProducts(data.products);
            }
        } catch (err) {
            console.error("Error al cargar catálogo:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const broadcastCatalogSync = (item: CatalogItem) => {
        try {
            const bc = new BroadcastChannel("pos-catalog-sync");
            bc.postMessage({ type: "PRODUCT_CREATED", product: item });
            bc.close();
        } catch (e) {
            // BroadcastChannel fallback
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const uPrice = parseFloat(unitPrice) || 0;
            const cPrice = parseFloat(costPrice) || 0;
            const wPrice = parseFloat(wholesalePrice) || (uPrice * 0.85);

            const res = await fetch("/api/pos/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    sku: sku || `SKU-${Date.now().toString().slice(-5)}`,
                    barcode: barcode || `770${Date.now().toString().slice(-9)}`,
                    category,
                    unitPrice: uPrice,
                    costPrice: cPrice,
                    wholesalePrice: wPrice,
                    taxRate: 0.19,
                    stock: parseInt(stock, 10) || 0,
                    description,
                    isActive: true,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Fallo al registrar producto en microservicio de catálogo");
            }

            const newProd = data.product;
            setProducts(prev => [newProd, ...prev]);
            broadcastCatalogSync(newProd);

            setShowCreateModal(false);
            // Reset form
            setTitle("");
            setSku("");
            setBarcode("");
            setUnitPrice("");
            setCostPrice("");
            setWholesalePrice("");
            setDescription("");
            alert(`✅ Producto "${newProd.title}" creado y sincronizado exitosamente con los Terminales POS.`);
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === "Todos" || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch = !searchQuery ||
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    const formatCOP = (amount: number) => {
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-lg shadow-teal-500/10">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-white tracking-tight">Módulo de Catálogo & Productos</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Sincronizado POS ⚡
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Gestión aislada de catálogo con emisión de eventos gRPC & Redis Streams en tiempo real.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCatalog}
                        disabled={loading}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
                        <span>Refrescar</span>
                    </button>

                    <Link
                        href="/dashboard/pos"
                        className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition-all flex items-center gap-2"
                    >
                        <ShoppingCart className="w-4 h-4 text-indigo-400" /> Ir a Terminal POS
                    </Link>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Crear Producto
                    </button>
                </div>
            </div>

            {/* SEARCH AND CATEGORY FILTER BAR */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU o código de barras..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all"
                    />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {categoriesList.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                                selectedCategory === cat
                                    ? "bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-md"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* PRODUCTS DATA TABLE & CARDS GRID */}
            {loading ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-400" />
                    <p className="text-xs font-bold">Cargando ítems desde el Microservicio de Catálogo...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 space-y-3">
                    <Package className="w-10 h-10 mx-auto text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-300">No se encontraron productos en esta categoría</h3>
                    <p className="text-xs text-slate-500">Crea tu primer producto para sincronizarlo inmediatamente con las cajas registradoras POS.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-500 transition-all inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Crear Nuevo Producto
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(p => {
                        const marginPercent = p.costPrice > 0
                            ? Math.round(((p.unitPrice - p.costPrice) / p.unitPrice) * 100)
                            : 0;

                        return (
                            <div
                                key={p.id}
                                className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-teal-500/5 group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-indigo-300">
                                                {p.sku}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-[10px] font-bold text-teal-300">
                                                {p.category}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                                            {p.title}
                                        </h3>
                                    </div>

                                    {marginPercent > 0 && (
                                        <span className="px-2 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-extrabold shrink-0 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> +{marginPercent}%
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-medium block">Precio Detal</span>
                                        <span className="font-bold text-white font-mono">{formatCOP(p.unitPrice)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-medium block">Precio Costo</span>
                                        <span className="font-bold text-amber-400 font-mono">{formatCOP(p.costPrice || 0)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-medium block">Mayorista (-15%)</span>
                                        <span className="font-bold text-indigo-300 font-mono">{formatCOP(p.wholesalePrice || p.unitPrice * 0.85)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-1">
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                                        <Barcode className="w-3.5 h-3.5 text-slate-500" />
                                        <span className="font-mono">{p.barcode}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                            p.stock > 10
                                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                                : p.stock > 0
                                                ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                                        }`}>
                                            Stock: {p.stock} un.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CREATE PRODUCT MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Crear Producto / Servicio (Módulo Aislado)</h2>
                                    <p className="text-xs text-slate-400">Emite evento Redis Streams & gRPC en tiempo real para el POS</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-teal-400" /> Nombre del Producto o Servicio *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Plan Branding Corporativo / Licencia SaaS"
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
                                        placeholder="Ej. BRAND-009"
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
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
                                >
                                    {submitting ? "Sincronizando..." : <><CheckCircle2 className="w-4 h-4" /> Registrar & Sincronizar POS</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
