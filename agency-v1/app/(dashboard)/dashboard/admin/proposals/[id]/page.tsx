"use client";

import { useState, useEffect } from "react";
import { Save, Trash2, ArrowLeft, Settings, Layers, RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkRichTextEditor } from "@/components/ui/dark-rich-text-editor";
import { motion, AnimatePresence } from "framer-motion";
import { use } from "react";

export default function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        contactName: "",
        contactEmail: "",
        value: 0,
        currency: "USD",
        content: "",
        expiresAt: "",
        status: "DRAFT"
    });

    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchProposal = async () => {
            try {
                // we'll need a GET endpoint for the single proposal
                const res = await fetch(`/api/admin/proposals/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        title: data.title || "",
                        contactName: data.contactName || "",
                        contactEmail: data.contactEmail || "",
                        value: data.value || 0,
                        currency: data.currency || "USD",
                        content: data.content || "",
                        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().split('T')[0] : "",
                        status: data.status || "DRAFT"
                    });
                    
                    if (data.items && data.items.length > 0) {
                        setItems(data.items.map((i: any) => ({
                            id: i.id || Math.random().toString(),
                            title: i.title || "",
                            description: i.description || "",
                            quantity: i.quantity || 1,
                            price: i.price || 0,
                            taxRate: i.taxRate || 0
                        })));
                    }
                } else {
                    alert("Propuesta no encontrada");
                    router.push("/dashboard/admin/proposals");
                }
            } catch (error) {
                console.error("Error fetching proposal:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProposal();
        }
    }, [id, router]);

    const handleItemChange = (itemId: string, field: string, value: any) => {
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };

    const addItem = () => {
        setItems(prev => [...prev, { id: Math.random().toString(), title: "", description: "", quantity: 1, price: 0, taxRate: 0 }]);
    };

    const removeItem = (itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    const calculateSubtotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    };

    const calculateTaxes = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.price * (item.taxRate / 100)), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTaxes();
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                value: calculateTotal(),
                items: items
            };
            
            const res = await fetch(`/api/admin/proposals/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push("/dashboard/admin/proposals");
            } else {
                alert("Error al actualizar la propuesta");
            }
        } catch (e) {
            console.error("Error saving proposal", e);
            alert("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="h-full flex items-center justify-center text-slate-400">Cargando propuesta...</div>;
    }

    // Only allow editing if it is DRAFT or VIEWED, etc. For now, we will allow saving anytime.
    const isSigned = formData.status === "SIGNED";

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] bg-slate-950 text-slate-200 overflow-hidden">
            
            {/* ENCABEZADO Y CANVAS PRINCIPAL (IZQUIERDA) */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/admin/proposals" className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="h-4 w-4 text-slate-400" />
                        </Link>
                        <div>
                            <input 
                                type="text" 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                disabled={isSigned}
                                className="bg-transparent border-none text-2xl font-bold text-white tracking-tight focus:outline-none focus:ring-0 p-0 placeholder-slate-600 w-full min-w-[300px] disabled:opacity-50"
                                placeholder="Nombre de la Propuesta (Ej. E-Commerce B2B)"
                            />
                            {isSigned && <span className="text-teal-400 text-xs mt-1 block tracking-wider font-semibold">ESTA PROPUESTA YA FUE FIRMADA Y ESTÁ BLOQUEADA</span>}
                        </div>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto px-8 py-8 space-y-12">
                    
                    {/* SECCIÓN: ALCANCE Y METODOLOGÍA */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="h-5 w-5 text-teal-500" />
                            <h2 className="text-xl font-semibold text-white">Alcance y Condiciones</h2>
                        </div>
                        {isSigned ? (
                            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800/80 text-slate-300 pointer-events-none opacity-80" dangerouslySetInnerHTML={{__html: formData.content}} />
                        ) : (
                            <DarkRichTextEditor 
                                initialValue={formData.content} 
                                onChange={(html) => setFormData({...formData, content: html})} 
                            />
                        )}
                    </section>

                    {/* SECCIÓN: ÍTEMS Y COTIZACIÓN */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center bg-teal-500/10 text-teal-400 rounded-lg w-8 h-8">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                </span>
                                <h2 className="text-xl font-semibold text-white">Desglose de Cotización</h2>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <div className="col-span-6">Concepto</div>
                                <div className="col-span-2 text-center">Cant.</div>
                                <div className="col-span-3 text-right">Precio Unitario</div>
                                <div className="col-span-1 text-center"></div>
                            </div>
                            
                            {/* Items List */}
                            <div className="divide-y divide-slate-800/50 p-2 space-y-2">
                                <AnimatePresence>
                                    {items.map((item, index) => (
                                        <motion.div 
                                            key={item.id}
                                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="grid grid-cols-12 gap-4 items-start px-4 py-3 bg-slate-950/40 hover:bg-slate-800/40 rounded-xl group transition-colors border border-transparent hover:border-slate-700/50"
                                        >
                                            <div className="col-span-6 space-y-2">
                                                <input 
                                                    type="text" 
                                                    value={item.title}
                                                    onChange={(e) => handleItemChange(item.id, "title", e.target.value)}
                                                    disabled={isSigned}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-200 focus:ring-0 placeholder-slate-600 disabled:opacity-50"
                                                    placeholder="Nombre del servicio o producto..."
                                                />
                                                <input 
                                                    type="text" 
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                                                    disabled={isSigned}
                                                    className="w-full bg-transparent border-none p-0 text-xs text-slate-500 focus:ring-0 placeholder-slate-700 disabled:opacity-50"
                                                    placeholder="Descripción detallada (opcional)..."
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)}
                                                    disabled={isSigned}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-center text-slate-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="col-span-3 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">$</span>
                                                <input 
                                                    type="number" 
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(item.id, "price", parseFloat(e.target.value) || 0)}
                                                    disabled={isSigned}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-sm text-right text-slate-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center items-center h-full">
                                                {!isSigned && (
                                                    <button 
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-slate-600 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {!isSigned && (
                                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800">
                                    <button 
                                        onClick={addItem} 
                                        className="text-teal-400 hover:text-teal-300 transition-colors text-sm font-medium flex items-center gap-1.5 hover:bg-teal-500/10 px-3 py-1.5 rounded-md"
                                    >
                                        <Plus className="h-4 w-4" /> Añadir Ítem de Cotización
                                    </button>
                                </div>
                            )}

                            {/* Totales */}
                            <div className="bg-slate-950 p-6 border-t border-slate-800 space-y-3">
                                <div className="flex justify-end items-center gap-8 text-sm text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="font-mono">${calculateSubtotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-end items-center gap-8 text-sm text-slate-400">
                                    <span>Impuestos Estimados</span>
                                    <span className="font-mono">${calculateTaxes().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-end items-center gap-8 text-lg font-bold text-white pt-4 border-t border-slate-800/80">
                                    <span>Total a Pagar</span>
                                    <span className="font-mono text-teal-400 flex items-center gap-2">
                                        <span className="text-xs text-slate-500 font-sans mt-1">{formData.currency}</span>
                                        ${calculateTotal().toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* BARRA LATERAL (DERECHA) - CONFIGURACIONES */}
            <div className="w-80 border-l border-slate-800 bg-slate-900/40 flex flex-col relative z-20">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-200">Configuración</h3>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    
                    {/* Cliente */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Información del Cliente</h4>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 ml-1">Nombre / Empresa</label>
                            <input 
                                type="text" 
                                value={formData.contactName}
                                onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                                disabled={isSigned}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50"
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 ml-1">Correo Electrónico</label>
                            <input 
                                type="email" 
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                                disabled={isSigned}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50"
                                placeholder="juan@empresa.com"
                            />
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ajustes Generales</h4>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 ml-1">Moneda</label>
                            <select 
                                value={formData.currency}
                                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                                disabled={isSigned}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50"
                            >
                                <option value="USD">USD - Dólar Estadounidense</option>
                                <option value="MXN">MXN - Peso Mexicano</option>
                                <option value="COP">COP - Peso Colombiano</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 ml-1">Fecha de Expiración</label>
                            <input 
                                type="date" 
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                                disabled={isSigned}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all css-color-scheme-dark disabled:opacity-50"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer Barra Lateral */}
                {!isSigned && (
                    <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-3">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || !formData.title}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:shadow-none"
                        >
                            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}
