"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Package, Plus, Search, RefreshCw, Layers, Tag, DollarSign,
    Barcode, ArrowUpRight, ShoppingCart, CheckCircle2, ShieldCheck,
    SlidersHorizontal, TrendingUp, AlertCircle, Edit3, Trash2, Zap,
    Printer, FileSpreadsheet, History, MapPin, Grid, List, Download,
    Box, HelpCircle, Check, Copy, ArrowDownRight
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
    location?: string;
    variants?: string[];
    imageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface StockLog {
    id: string;
    date: string;
    type: "ENTRADA" | "VENTA_POS" | "AJUSTE" | "MERMA";
    deltaQty: number;
    newStock: number;
    reason: string;
    user: string;
}

export default function CatalogClient() {
    const [products, setProducts] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<CatalogItem | null>(null);
    const [selectedKardexProduct, setSelectedKardexProduct] = useState<CatalogItem | null>(null);
    const [stockAdjustmentModal, setStockAdjustmentModal] = useState<CatalogItem | null>(null);
    const [adjustmentDelta, setAdjustmentDelta] = useState("");
    const [adjustmentReason, setAdjustmentReason] = useState("Ingreso por compra a proveedor");

    // Form state for creating catalog item
    const [title, setTitle] = useState("");
    const [sku, setSku] = useState("");
    const [barcode, setBarcode] = useState("");
    const [category, setCategory] = useState("Servicios");
    const [unitPrice, setUnitPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [wholesalePrice, setWholesalePrice] = useState("");
    const [stock, setStock] = useState("50");
    const [location, setLocation] = useState("Bodega Principal - Pasillo A1");
    const [variantInput, setVariantInput] = useState("Talla M, Color Negro");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Mock Kardex history data generator
    const mockKardexLogs: StockLog[] = [
        { id: "log-1", date: new Date(Date.now() - 3600000 * 2).toLocaleString("es-CO"), type: "VENTA_POS", deltaQty: -2, newStock: 18, reason: "Venta Ticket POS-00982", user: "Cajero Principal" },
        { id: "log-2", date: new Date(Date.now() - 3600000 * 24).toLocaleString("es-CO"), type: "ENTRADA", deltaQty: 10, newStock: 20, reason: "Factura Proveedor F-9921", user: "Administrador" },
        { id: "log-3", date: new Date(Date.now() - 3600000 * 48).toLocaleString("es-CO"), type: "AJUSTE", deltaQty: +5, newStock: 10, reason: "Auditoría de Inventario Físico", user: "Gerencia" },
    ];

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
                    location,
                    variants: variantInput ? variantInput.split(",").map(s => s.trim()) : [],
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

    const [editingProduct, setEditingProduct] = useState<CatalogItem | null>(null);

    const handleEditOpen = (p: CatalogItem) => {
        setEditingProduct(p);
        setTitle(p.title);
        setSku(p.sku);
        setBarcode(p.barcode);
        setCategory(p.category);
        setUnitPrice(String(p.unitPrice));
        setCostPrice(String(p.costPrice || 0));
        setWholesalePrice(String(p.wholesalePrice || p.unitPrice * 0.85));
        setStock(String(p.stock));
        setLocation(p.location || "Bodega Principal");
        setDescription(p.description || "");
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setSubmitting(true);
        setFormError(null);

        try {
            const uPrice = parseFloat(unitPrice) || 0;
            const cPrice = parseFloat(costPrice) || 0;
            const wPrice = parseFloat(wholesalePrice) || (uPrice * 0.85);

            const res = await fetch(`/api/pos/products/${editingProduct.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    unitPrice: uPrice,
                    costPrice: cPrice,
                    wholesalePrice: wPrice,
                    stock: parseInt(stock, 10) || 0,
                    isActive: true,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Fallo al actualizar producto");

            const updatedProd = data.product;
            setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
            setEditingProduct(null);
            alert(`✅ Producto "${updatedProd.title}" actualizado exitosamente.`);
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (p: CatalogItem) => {
        if (!confirm(`¿Estás seguro de eliminar el producto "${p.title}" del catálogo?`)) return;

        try {
            const res = await fetch(`/api/pos/products/${p.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok && data.success) {
                setProducts(prev => prev.filter(x => x.id !== p.id));
                alert(`🗑️ Producto "${p.title}" eliminado exitosamente del catálogo.`);
            }
        } catch (err: any) {
            alert(`Error al eliminar producto: ${err.message}`);
        }
    };

    const handleStockAdjustmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockAdjustmentModal) return;

        const delta = parseInt(adjustmentDelta, 10);
        if (isNaN(delta) || delta === 0) return alert("Ingresa un ajuste numérico válido (+5 o -2)");

        try {
            const res = await fetch(`/api/pos/products/${stockAdjustmentModal.id}/stock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deltaQty: delta, reason: adjustmentReason }),
            });

            const data = await res.json();
            if (res.ok && data.product) {
                setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p));
                alert(`✅ Inventario actualizado para ${data.product.title}. Nuevo stock: ${data.product.stock} un.`);
                setStockAdjustmentModal(null);
            }
        } catch (err: any) {
            alert(`Fallo ajuste de kárdex: ${err.message}`);
        }
    };

    const exportToCSV = () => {
        const headers = ["ID", "SKU", "Barcode", "Nombre", "Categoria", "Precio Detal", "Precio Costo", "Precio Mayorista", "Stock", "Ubicacion"];
        const rows = products.map(p => [
            p.id, p.sku, p.barcode, `"${p.title.replace(/"/g, '""')}"`, p.category, p.unitPrice, p.costPrice || 0, p.wholesalePrice || 0, p.stock, `"${p.location || "N/A"}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `catalogo_productos_legacymark_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                            <h1 className="text-xl font-black text-white tracking-tight">Módulo de Catálogo & Productos Ultra-Pro</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Sincronizado POS & gRPC ⚡
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Gestión independiente de inventarios, kárdex histórico, etiquetas de barras y catálogo multi-tarifa.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => {
                            const publicUrl = `${window.location.origin}/catalog/public-menu`;
                            navigator.clipboard.writeText(publicUrl);
                            alert(`🌐 Enlace del Catálogo Público Copiado:\n${publicUrl}\n\nLos clientes pueden ver el catálogo y hacer autopedidos en línea.`);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <Zap className="w-3.5 h-3.5 text-teal-400" /> Catálogo Público Online
                    </button>

                    <button
                        onClick={exportToCSV}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" /> Exportar CSV
                    </button>

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

            {/* SEARCH, CATEGORY FILTER AND VIEW TOGGLE */}
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

                {/* Categories & View Mode */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
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

                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-slate-800 text-teal-400" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-slate-800 text-teal-400" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* PRODUCTS CONTAINER */}
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
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(p => {
                        const marginPercent = p.costPrice > 0
                            ? Math.round(((p.unitPrice - p.costPrice) / p.unitPrice) * 100)
                            : 0;

                        return (
                            <div
                                key={p.id}
                                className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-teal-500/5 group relative"
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

                                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                        <MapPin className="w-3 h-3 text-slate-500" />
                                        <span>{p.location || "Bodega Principal - Estante A1"}</span>
                                    </div>

                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                                        p.stock > 10
                                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                            : p.stock > 0
                                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                            : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                                    }`}>
                                        Stock: {p.stock} un.
                                    </span>
                                </div>

                                {/* ACTION BUTTONS BAR */}
                                <div className="flex items-center justify-between pt-2 gap-2">
                                    <button
                                        onClick={() => setSelectedBarcodeProduct(p)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                                    >
                                        <Printer className="w-3.5 h-3.5 text-indigo-400" /> Etiqueta Barras
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setStockAdjustmentModal(p)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                                        >
                                            <SlidersHorizontal className="w-3.5 h-3.5" /> Kárdex
                                        </button>

                                        <button
                                            onClick={() => setSelectedKardexProduct(p)}
                                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                                            title="Histórico Kárdex"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleEditOpen(p)}
                                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition-all"
                                            title="Editar Producto"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteProduct(p)}
                                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-all"
                                            title="Eliminar Producto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* TABLE VIEW MODE */
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                            <tr>
                                <th className="p-3.5">SKU / Barras</th>
                                <th className="p-3.5">Producto</th>
                                <th className="p-3.5">Categoría</th>
                                <th className="p-3.5">Precio Detal</th>
                                <th className="p-3.5">Precio Costo</th>
                                <th className="p-3.5">Mayorista</th>
                                <th className="p-3.5">Stock</th>
                                <th className="p-3.5">Ubicación</th>
                                <th className="p-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-3.5 font-mono text-indigo-300">{p.sku}</td>
                                    <td className="p-3.5 font-bold text-white">{p.title}</td>
                                    <td className="p-3.5"><span className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[10px] font-bold">{p.category}</span></td>
                                    <td className="p-3.5 font-bold font-mono text-white">{formatCOP(p.unitPrice)}</td>
                                    <td className="p-3.5 font-mono text-amber-400">{formatCOP(p.costPrice || 0)}</td>
                                    <td className="p-3.5 font-mono text-indigo-300">{formatCOP(p.wholesalePrice || p.unitPrice * 0.85)}</td>
                                    <td className="p-3.5 font-bold">{p.stock} un.</td>
                                    <td className="p-3.5 text-slate-400">{p.location || "Bodega Central"}</td>
                                    <td className="p-3.5 text-right space-x-1.5">
                                        <button onClick={() => setSelectedBarcodeProduct(p)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg" title="Imprimir Barras"><Printer className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setStockAdjustmentModal(p)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg" title="Kárdex"><SlidersHorizontal className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleEditOpen(p)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg" title="Editar"><Edit3 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDeleteProduct(p)} className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL 1: CREATE CATALOG ITEM */}
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
                            <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">✕</button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            {formError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">{formError}</div>}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-teal-400" /> Nombre del Producto o Servicio *</label>
                                <input type="text" required placeholder="Ej. Plan Branding Corporativo / Licencia SaaS" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition-all" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><Barcode className="w-3.5 h-3.5 text-indigo-400" /> SKU / Código Referencia</label>
                                    <input type="text" placeholder="Ej. BRAND-009" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-400" /> Categoría</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all">
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
                                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Precio Detal *</label>
                                    <input type="number" required placeholder="150000" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-amber-400" /> Precio Costo</label>
                                    <input type="number" placeholder="65000" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Mayorista (-15%)</label>
                                    <input type="number" placeholder="125000" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Stock Inicial</label>
                                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition-all font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Ubicación en Almacén</label>
                                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition-all" />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs transition-all">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2">
                                    {submitting ? "Sincronizando..." : <><CheckCircle2 className="w-4 h-4" /> Registrar & Sincronizar POS</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: BARCODE LABEL PRINTER */}
            {selectedBarcodeProduct && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Printer className="w-4 h-4 text-indigo-400" /> Impresión de Etiqueta Térmica</h3>
                            <button onClick={() => setSelectedBarcodeProduct(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        {/* Printable Sticker Mockup */}
                        <div className="bg-white text-black p-5 rounded-2xl shadow-inner text-center space-y-2 font-sans border-2 border-slate-300">
                            <p className="text-xs font-black tracking-wider uppercase">LegacyMark Store</p>
                            <p className="text-sm font-bold truncate">{selectedBarcodeProduct.title}</p>
                            <div className="my-2 bg-slate-100 p-2 rounded border border-slate-300 font-mono text-center">
                                <p className="text-xs font-bold">||| | |||| || ||| |||| |</p>
                                <p className="text-[10px] tracking-widest">{selectedBarcodeProduct.barcode}</p>
                            </div>
                            <p className="text-sm font-black">{formatCOP(selectedBarcodeProduct.unitPrice)}</p>
                        </div>

                        <button
                            onClick={() => { alert("🖨️ Etiqueta de código de barras enviada a la impresora térmica por USB/Bluetooth."); setSelectedBarcodeProduct(null); }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Imprimir Etiqueta Adhesiva
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 3: STOCK ADJUSTMENT KARDEX */}
            {stockAdjustmentModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-amber-400" /> Ajuste de Kárdex</h3>
                            <button onClick={() => setStockAdjustmentModal(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <p className="text-xs text-slate-400">Producto: <span className="font-bold text-white">{stockAdjustmentModal.title}</span> (Stock Actual: {stockAdjustmentModal.stock} un.)</p>

                        <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Variación de Stock (+10 para entrada, -3 para ajuste)</label>
                                <input type="number" required placeholder="+10 o -5" value={adjustmentDelta} onChange={(e) => setAdjustmentDelta(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Motivo del Ajuste</label>
                                <select value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500">
                                    <option value="Ingreso por compra a proveedor">Ingreso por compra a proveedor</option>
                                    <option value="Auditoría de inventario físico">Auditoría de inventario físico</option>
                                    <option value="Descuento por merma / daño">Descuento por merma / daño</option>
                                    <option value="Traslado a otra bodega">Traslado a otra bodega</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20">
                                Guardar Ajuste de Kárdex
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: KARDEX HISTORY LOG */}
            {selectedKardexProduct && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><History className="w-4 h-4 text-teal-400" /> Histórico de Kárdex Auditoría</h3>
                            <button onClick={() => setSelectedKardexProduct(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <p className="text-xs text-slate-400">Trazabilidad de movimientos para: <span className="font-bold text-white">{selectedKardexProduct.title}</span></p>

                        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                            {mockKardexLogs.map(log => (
                                <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.deltaQty > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                                                {log.type} ({log.deltaQty > 0 ? `+${log.deltaQty}` : log.deltaQty})
                                            </span>
                                            <span className="text-slate-400 text-[10px]">{log.date}</span>
                                        </div>
                                        <p className="text-slate-300 mt-1">{log.reason}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-slate-500 text-[10px] block">Stock Final</span>
                                        <span className="font-bold text-white font-mono">{log.newStock} un.</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 5: EDIT CATALOG ITEM */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Editar Producto del Catálogo</h2>
                                    <p className="text-xs text-slate-400">Actualizar tarifas y existencias en el microservicio POS</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingProduct(null)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">✕</button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                            {formError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">{formError}</div>}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Nombre del Producto o Servicio *</label>
                                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition-all" />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Precio Detal *</label>
                                    <input type="number" required value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Precio Costo</label>
                                    <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Mayorista (-15%)</label>
                                    <input type="number" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Stock Actual</label>
                                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition-all font-mono" />
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs transition-all">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2">
                                    {submitting ? "Actualizando..." : <><CheckCircle2 className="w-4 h-4" /> Guardar Cambios</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
