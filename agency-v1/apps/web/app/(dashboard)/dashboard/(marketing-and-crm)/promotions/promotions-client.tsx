"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Percent, Plus, Search, RefreshCw, Edit3, Trash2, ToggleLeft, ToggleRight,
    Zap, ShoppingCart, CheckCircle2, ShieldCheck, Tag, DollarSign, Calendar
} from "lucide-react";

interface CouponRule {
    id: string;
    companyId: string;
    code: string;
    discountType: "PERCENTAGE" | "FIXED_COP" | "BUY_X_GET_Y";
    discountValue: number;
    minPurchaseAmount?: number;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    validUntil?: string;
    description: string;
    createdAt: string;
}

export default function PromotionsClient() {
    const [coupons, setCoupons] = useState<CouponRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponRule | null>(null);

    // Form state
    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_COP">("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [minPurchaseAmount, setMinPurchaseAmount] = useState("");
    const [usageLimit, setUsageLimit] = useState("100");
    const [validUntil, setValidUntil] = useState("2026-12-31");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pos/promotions/coupons");
            if (res.ok) {
                const data = await res.json();
                if (data.coupons) setCoupons(data.coupons);
            }
        } catch (err) {
            console.error("Error al cargar cupones:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch("/api/pos/promotions/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: code.toUpperCase().trim(),
                    discountType,
                    discountValue: parseFloat(discountValue) || 0,
                    minPurchaseAmount: parseFloat(minPurchaseAmount) || 0,
                    usageLimit: parseInt(usageLimit, 10) || 100,
                    validUntil,
                    description,
                    isActive: true,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Fallo al crear regla de cupón");
            }

            setCoupons(prev => [data.coupon, ...prev]);
            setShowCreateModal(false);
            resetForm();
            alert(`✅ Cupón de Descuento "${data.coupon.code}" creado y activado exitosamente.`);
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditOpen = (c: CouponRule) => {
        setEditingCoupon(c);
        setCode(c.code);
        setDiscountType(c.discountType as any);
        setDiscountValue(String(c.discountValue));
        setMinPurchaseAmount(String(c.minPurchaseAmount || ""));
        setUsageLimit(String(c.usageLimit || "100"));
        setValidUntil(c.validUntil || "2026-12-31");
        setDescription(c.description || "");
    };

    const handleUpdateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCoupon) return;
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch(`/api/pos/promotions/coupons/${editingCoupon.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: code.toUpperCase().trim(),
                    discountType,
                    discountValue: parseFloat(discountValue) || 0,
                    minPurchaseAmount: parseFloat(minPurchaseAmount) || 0,
                    usageLimit: parseInt(usageLimit, 10) || 100,
                    validUntil,
                    description,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Fallo al actualizar cupón");

            setCoupons(prev => prev.map(c => c.id === data.coupon.id ? data.coupon : c));
            setEditingCoupon(null);
            resetForm();
            alert(`✅ Cupón "${data.coupon.code}" actualizado exitosamente.`);
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCoupon = async (c: CouponRule) => {
        if (!confirm(`¿Estás seguro de eliminar el cupón "${c.code}"?`)) return;

        try {
            const res = await fetch(`/api/pos/promotions/coupons/${c.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok && data.success) {
                setCoupons(prev => prev.filter(x => x.id !== c.id));
                alert(`🗑️ Cupón "${c.code}" eliminado exitosamente.`);
            }
        } catch (err: any) {
            alert(`Error al eliminar cupón: ${err.message}`);
        }
    };

    const handleToggleCoupon = async (id: string) => {
        try {
            const res = await fetch(`/api/pos/promotions/coupons/${id}/toggle`, { method: "PATCH" });
            const data = await res.json();
            if (res.ok && data.coupon) {
                setCoupons(prev => prev.map(c => c.id === data.coupon.id ? data.coupon : c));
            }
        } catch (err: any) {
            alert(`Error al cambiar estado del cupón: ${err.message}`);
        }
    };

    const resetForm = () => {
        setCode("");
        setDiscountValue("");
        setMinPurchaseAmount("");
        setDescription("");
    };

    const formatCOP = (amount: number) => {
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                        <Percent className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-white tracking-tight">Gestión de Promociones & Cupones (CRUD)</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Reglas en Tiempo Real
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Crea, edita, activa y elimina cupones y reglas de descuento motivadas libremente por el usuario.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCoupons}
                        disabled={loading}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
                        <span>Refrescar</span>
                    </button>

                    <Link
                        href="/dashboard/pos"
                        className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition-all flex items-center gap-2"
                    >
                        <ShoppingCart className="w-4 h-4 text-indigo-400" /> Ir a Terminal POS
                    </Link>

                    <button
                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Crear Cupón / Promoción
                    </button>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por código de cupón o descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                    />
                </div>
            </div>

            {/* COUPONS GRID */}
            {loading ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
                    <p className="text-xs font-bold">Cargando reglas de promociones y cupones...</p>
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 space-y-3">
                    <Percent className="w-10 h-10 mx-auto text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-300">No hay reglas de cupones registradas</h3>
                    <p className="text-xs text-slate-500">Crea tu primer código de descuento para aplicarlo en las ventas POS y clientes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCoupons.map(c => (
                        <div
                            key={c.id}
                            className={`bg-slate-900/80 border ${c.isActive ? "border-amber-500/40" : "border-slate-800 opacity-60"} rounded-2xl p-5 space-y-4 transition-all relative group shadow-xl`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-black text-sm tracking-wider">
                                            {c.code}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${c.isActive ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-800 text-slate-500 border-slate-700"}`}>
                                            {c.isActive ? "ACTIVO" : "INACTIVO"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300 font-medium pt-1">{c.description}</p>
                                </div>

                                <button
                                    onClick={() => handleToggleCoupon(c.id)}
                                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                                    title={c.isActive ? "Desactivar Cupón" : "Activar Cupón"}
                                >
                                    {c.isActive ? <ToggleRight className="w-6 h-6 text-amber-400" /> : <ToggleLeft className="w-6 h-6 text-slate-500" />}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-500 font-medium block">Valor Descuento</span>
                                    <span className="font-bold text-emerald-400 font-mono text-sm">
                                        {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : formatCOP(c.discountValue)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-medium block">Usos Realizados</span>
                                    <span className="font-bold text-white font-mono">{c.usedCount} / {c.usageLimit || "∞"}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                                <span>Compra Min: {c.minPurchaseAmount ? formatCOP(c.minPurchaseAmount) : "N/A"}</span>
                                
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleEditOpen(c)}
                                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-all"
                                        title="Editar Cupón"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCoupon(c)}
                                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-all"
                                        title="Eliminar Cupón"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL: CREATE / EDIT COUPON (PROFESSIONAL DESIGN) */}
            {(showCreateModal || editingCoupon) && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                                    <Percent className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">{editingCoupon ? "Editar Regla de Cupón" : "Crear Nueva Regla de Cupón"}</h2>
                                    <p className="text-xs text-slate-400">Descuentos y promociones configurados libremente</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowCreateModal(false); setEditingCoupon(null); }} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">✕</button>
                        </div>

                        <form onSubmit={editingCoupon ? handleUpdateCoupon : handleCreateCoupon} className="p-6 space-y-4">
                            {formError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">{formError}</div>}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Código del Cupón *</label>
                                <input type="text" required placeholder="Ej. BIENVENIDA20" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase font-mono font-bold focus:outline-none focus:border-amber-500 transition-all" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Tipo de Descuento</label>
                                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500">
                                        <option value="PERCENTAGE">Porcentaje (% OFF)</option>
                                        <option value="FIXED_COP">Monto Fijo COP ($)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Valor Descuento *</label>
                                    <input type="number" required placeholder={discountType === "PERCENTAGE" ? "15" : "30000"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Compra Mínima (COP)</label>
                                    <input type="number" placeholder="100000" value={minPurchaseAmount} onChange={(e) => setMinPurchaseAmount(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Límite de Usos</label>
                                    <input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Descripción de la Promoción</label>
                                <input type="text" placeholder="Ej. 15% OFF en primera compra mayores a $100.000" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500" />
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                                <button type="button" onClick={() => { setShowCreateModal(false); setEditingCoupon(null); }} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs transition-all">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
                                    {submitting ? "Guardando..." : <><CheckCircle2 className="w-4 h-4" /> Guardar Promoción</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
