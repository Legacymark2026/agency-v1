"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ArrowLeft, Loader2, Save, Plus, Trash2, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createInvoice } from "@/actions/invoices";

interface Lead {
    id: string;
    name: string | null;
    company: string | null;
    email: string;
}

interface InvoiceFormProps {
    leads: Lead[];
}

export function InvoiceForm({ leads }: InvoiceFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        clientName: "",
        clientNit: "",
        clientAddress: "",
        clientCity: "",
        clientPhone: "",
        leadId: "",
        dueDate: "",
        notes: "",
        terms: "",
        currency: "USD",
        advancePercentage: 100, // 100% means total is the final amount. 60% means advance is 60.
        isElectronic: true // DIAN control
    });

    const [items, setItems] = useState([
        { title: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0 }
    ]);

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { title: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    // Auto-calculations
    const calculations = useMemo(() => {
        let subtotal = 0;
        let tax = 0;
        
        const calculatedItems = items.map(item => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = itemTotal * item.taxRate;
            subtotal += itemTotal;
            tax += itemTax;
            return {
                ...item,
                totalAmount: itemTotal + itemTax
            };
        });

        const total = subtotal + tax; // ignoring discount logic for MVP form
        const finalAmount = total * (formData.advancePercentage / 100);
        const advanceAmount = total - finalAmount;

        return {
            subtotalAmount: subtotal,
            taxAmount: tax,
            discountAmount: 0,
            totalAmount: total,
            advanceAmount: advanceAmount,
            finalAmount: finalAmount,
            calculatedItems
        };
    }, [items, formData.advancePercentage]);

    const handleLeadSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const lead = leads.find(l => l.id === id);
        setFormData(prev => ({
            ...prev,
            leadId: id,
            clientName: lead ? (lead.company || lead.name || "") : prev.clientName
        }));
    };

    const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            
            if (items.some(i => !i.title)) {
                toast.error("Todos los conceptos deben tener un título");
                return;
            }

            const payload = {
                clientName: formData.clientName,
                clientNit: formData.clientNit,
                clientAddress: formData.clientAddress,
                clientCity: formData.clientCity,
                clientPhone: formData.clientPhone,
                leadId: formData.leadId || undefined,
                subtotalAmount: calculations.subtotalAmount,
                taxAmount: calculations.taxAmount,
                discountAmount: 0,
                totalAmount: calculations.totalAmount,
                advanceAmount: calculations.advanceAmount,
                finalAmount: calculations.finalAmount,
                dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
                notes: formData.notes,
                terms: formData.terms,
                isElectronic: formData.isElectronic,
                items: calculations.calculatedItems
            };

            const response = await createInvoice(payload);

            if (!response.success) throw new Error(response.error);

            toast.success("Factura emitida correctamente.");
            router.push("/dashboard/admin/invoices");
            router.refresh();
        } catch (error) {
            toast.error("Hubo un problema al crear la factura.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-8">
                
                {/* Section 0: Document Type */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Tipo de Documento (DIAN)</h3>
                        <p className="text-xs text-slate-400">Selecciona si este cobro se enviará oficialmente a la DIAN o si es solo de control interno.</p>
                    </div>
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, isElectronic: true }))}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-md transition-colors ${formData.isElectronic ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            Factura Electrónica
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, isElectronic: false }))}
                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-md transition-colors ${!formData.isElectronic ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            Control Interno
                        </button>
                    </div>
                </div>

                {/* Section 1: Client & Dates */}
                <div>
                    <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Detalles del Cliente</h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Vincular CRM (Opcional)</label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={formData.leadId}
                                onChange={handleLeadSelect}
                            >
                                <option value="">Ingresar cliente manual</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.id}>
                                        {lead.name} {lead.company ? `(${lead.company})` : ''} - {lead.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Empresa / Cliente Facturar</label>
                            <input
                                type="text"
                                required
                                placeholder="Nombre de la Institución o Cliente..."
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={formData.clientName}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">NIT / Documento</label>
                            <input
                                type="text"
                                placeholder="Ej: 901.123.456-7"
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={formData.clientNit}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientNit: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Dirección</label>
                            <input
                                type="text"
                                placeholder="Dirección del cliente"
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={formData.clientAddress}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Ciudad</label>
                            <input
                                type="text"
                                placeholder="Ciudad"
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={formData.clientCity}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientCity: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Teléfono</label>
                            <input
                                type="text"
                                placeholder="Teléfono de contacto"
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={formData.clientPhone}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Fecha de Vencimiento (Términos)</label>
                            <input
                                type="date"
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all [color-scheme:dark]"
                                value={formData.dueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Cobro Recibido (%)</label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={formData.advancePercentage}
                                onChange={(e) => setFormData(prev => ({ ...prev, advancePercentage: Number(e.target.value) }))}
                            >
                                <option value={100}>100% (Pago Único)</option>
                                <option value={60}>60% (Anticipo Fase 1)</option>
                                <option value={50}>50% (Anticipo Mitad)</option>
                                <option value={40}>40% (Remanente Fase 2)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 2: Line Items */}
                <div className="border-t border-slate-800 pt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Conceptos / Servicios</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-3 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Concepto (ej. Desarrollo Frontend)"
                                        required
                                        className="w-full bg-slate-950 border-b border-slate-700 px-2 py-1 text-sm text-white focus:border-teal-500 focus:outline-none"
                                        value={item.title}
                                        onChange={(e) => handleItemChange(index, "title", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Descripción adicional (opcional)"
                                        className="w-full bg-transparent border-none px-2 py-1 text-xs text-slate-400 focus:outline-none"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-[10px] text-slate-500 block mb-1">Cant.</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-[10px] text-slate-500 block mb-1">Precio Unitario</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-[10px] text-slate-500 block mb-1">Impuesto</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                                        value={item.taxRate}
                                        onChange={(e) => handleItemChange(index, "taxRate", Number(e.target.value))}
                                    >
                                        <option value={0}>0%</option>
                                        <option value={0.16}>16% IVA</option>
                                        <option value={0.19}>19% IVA</option>
                                    </select>
                                </div>
                                <div className="w-32 text-right pt-5">
                                    <div className="text-sm font-medium text-white">${(item.quantity * item.unitPrice * (1 + item.taxRate)).toLocaleString()}</div>
                                </div>
                                <div className="pt-4 sm:pt-5">
                                    <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50" disabled={items.length === 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={addItem} className="mt-4 flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium">
                        <Plus className="h-4 w-4" /> Agregar otro concepto
                    </button>
                </div>

                {/* Section 3: Totals & Notes */}
                <div className="border-t border-slate-800 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Notas para el cliente</label>
                            <textarea
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none h-20"
                                placeholder="Gracias por su negocio..."
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                    </div>
                    
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex justify-between text-sm text-slate-400">
                            <span>Subtotal</span>
                            <span>${calculations.subtotalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-400 pb-3 border-b border-slate-800">
                            <span>Impuestos (Taxes)</span>
                            <span>${calculations.taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base font-medium text-slate-200 pt-2">
                            <span>Total General</span>
                            <span>${calculations.totalAmount.toLocaleString()}</span>
                        </div>
                        {formData.advancePercentage < 100 && (
                            <div className="flex justify-between text-xs text-rose-400">
                                <span>No a cobrar todavía ({(100 - formData.advancePercentage)}%)</span>
                                <span>-${calculations.advanceAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-teal-400 pt-2 border-t border-slate-800 mt-2">
                            <span>Total a Procesar (PayU)</span>
                            <span>${calculations.finalAmount.toLocaleString()} USD</span>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-slate-950/80 backdrop-blur-md pb-6">
                <Link
                    href="/dashboard/admin/invoices"
                    className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-500 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Emitir y Generar Link
                </button>
            </div>
        </form>
    );
}
