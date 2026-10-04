"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Send, Percent, Receipt, FileText } from "lucide-react";
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
        clientEmail: "",
        clientType: "PERSONA_JURIDICA",
        paymentMethod: "TRANSFERENCIA",
        paymentForm: "CONTADO", // DIAN: Contado o Crédito
        documentNature: "FACTURA_VENTA", // DIAN: Factura o Nota Crédito/Débito
        leadId: "",
        dueDate: "",
        notes: "",
        terms: "",
        currency: "COP", // Moneda
        advancePercentage: 100,
        reteFuente: 0,
        reteICA: 0,
        reteIVA: 0,
        isElectronic: true
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

        const total = subtotal + tax;
        const reteFuenteAmount = subtotal * (formData.reteFuente / 100);
        const reteICAAmount = subtotal * (formData.reteICA / 1000); // ICA is per mil
        const reteIVAAmount = tax * (formData.reteIVA / 100); // ReteIVA is over the IVA amount

        const finalCalculated = total - reteFuenteAmount - reteICAAmount - reteIVAAmount;

        return {
            subtotalAmount: subtotal,
            taxAmount: tax,
            discountAmount: 0,
            totalAmount: total,
            reteFuenteAmount,
            reteICAAmount,
            reteIVAAmount,
            advanceAmount: 0,
            finalAmount: finalCalculated,
            calculatedItems
        };
    }, [items, formData.reteFuente, formData.reteICA, formData.reteIVA]);

    const handleLeadSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const lead = leads.find(l => l.id === id);
        setFormData(prev => ({
            ...prev,
            leadId: id,
            clientName: lead ? (lead.company || lead.name || "") : prev.clientName,
            clientEmail: lead ? (lead.email || "") : prev.clientEmail
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
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
                discountAmount: calculations.discountAmount,
                totalAmount: calculations.totalAmount,
                advanceAmount: calculations.advanceAmount,
                finalAmount: calculations.finalAmount,
                reteFuente: calculations.reteFuenteAmount,
                reteICA: calculations.reteICAAmount,
                reteIVA: calculations.reteIVAAmount,
                dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
                notes: formData.notes,
                terms: formData.terms,
                isElectronic: formData.isElectronic,
                clientEmail: formData.clientEmail,
                clientType: formData.clientType,
                paymentMethod: formData.paymentMethod,
                items: calculations.calculatedItems
            };

            const response = await createInvoice(payload);

            if (!response.success) throw new Error(response.error);

            toast.success(formData.isElectronic ? "Documento DIAN emitido correctamente." : "Documento guardado localmente.");
            router.push("/dashboard/invoicing");
            router.refresh();
        } catch (error) {
            toast.error("Hubo un problema al crear el documento.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-8">
                
                {/* 1. Naturaleza y Tipología Documental */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 mb-4 text-amber-500">
                        <FileText className="w-5 h-5" />
                        <h3 className="font-semibold uppercase tracking-wider">Tipología Documental</h3>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Naturaleza</label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.documentNature}
                                onChange={(e) => setFormData(prev => ({ ...prev, documentNature: e.target.value }))}
                            >
                                <option value="FACTURA_VENTA">Factura Electrónica de Venta</option>
                                <option value="NOTA_CREDITO">Nota Crédito</option>
                                <option value="NOTA_DEBITO">Nota Débito</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Entorno Emisión</label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.isElectronic ? "DIAN" : "LOCAL"}
                                onChange={(e) => setFormData(prev => ({ ...prev, isElectronic: e.target.value === "DIAN" }))}
                            >
                                <option value="DIAN">Trasmisión DIAN UBL 2.1</option>
                                <option value="LOCAL">Comprobante de Control Interno</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Moneda (Divisa)</label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.currency}
                                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                            >
                                <option value="COP">COP (Pesos Colombianos)</option>
                                <option value="USD">USD (Dólares)</option>
                                <option value="EUR">EUR (Euros)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Cliente */}
                <div>
                    <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider border-b border-slate-800 pb-2">Información del Receptor</h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Vincular Lead CRM</label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.leadId}
                                onChange={handleLeadSelect}
                            >
                                <option value="">Seleccionar del CRM o escribir manual</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.id}>
                                        {lead.name} {lead.company ? `(${lead.company})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Razón Social</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.clientName}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">NIT / Documento</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.clientNit}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientNit: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email Recepción Electrónica</label>
                            <input
                                type="email"
                                required
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.clientEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Condiciones de Pago */}
                <div>
                    <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider border-b border-slate-800 pb-2">Condiciones Comerciales y RADIAN</h3>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Forma de Pago</label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.paymentForm}
                                onChange={(e) => setFormData(prev => ({ ...prev, paymentForm: e.target.value }))}
                            >
                                <option value="CONTADO">Contado</option>
                                <option value="CREDITO">Crédito (A Plazos)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Medio de Pago</label>
                            <select
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            >
                                <option value="TRANSFERENCIA">Transferencia / Consignación</option>
                                <option value="TARJETA_CREDITO">Tarjeta Débito/Crédito</option>
                                <option value="EFECTIVO">Efectivo</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Fecha Vencimiento RADIAN</label>
                            <input
                                type="date"
                                required={formData.paymentForm === "CREDITO"}
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 [color-scheme:dark]"
                                value={formData.dueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Líneas */}
                <div className="border-t border-slate-800 pt-8">
                    <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Conceptos Facturados</h3>
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-3 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Descripción DIAN..."
                                        required
                                        className="w-full bg-slate-950 border-b border-slate-700 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
                                        value={item.title}
                                        onChange={(e) => handleItemChange(index, "title", e.target.value)}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-slate-500 block mb-1">Cant.</label>
                                    <input
                                        type="number" min="1" required
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-xs text-slate-500 block mb-1">Val. Unitario</label>
                                    <input
                                        type="number" min="0" step="1" required
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-slate-500 block mb-1">IVA</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                                        value={item.taxRate}
                                        onChange={(e) => handleItemChange(index, "taxRate", Number(e.target.value))}
                                    >
                                        <option value={0}>0%</option>
                                        <option value={0.19}>19%</option>
                                        <option value={0.05}>5%</option>
                                    </select>
                                </div>
                                <div className="w-32 text-right pt-5">
                                    <div className="text-sm font-medium text-white">${(item.quantity * item.unitPrice * (1 + item.taxRate)).toLocaleString()}</div>
                                </div>
                                <div className="pt-4 sm:pt-5">
                                    <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors" disabled={items.length === 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addItem} className="mt-4 flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-medium">
                        <Plus className="h-4 w-4" /> Agregar Línea
                    </button>
                </div>

                {/* 5. Retenciones y Totales */}
                <div className="border-t border-slate-800 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 text-rose-400 mb-2">
                            <Percent className="w-4 h-4" />
                            <h4 className="font-medium text-sm">Aplicar Retenciones (Opcional)</h4>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">ReteFuente (%)</label>
                                <input
                                    type="number" min="0" max="11" step="0.1"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                                    value={formData.reteFuente}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reteFuente: Number(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">ReteICA (x 1000)</label>
                                <input
                                    type="number" min="0" max="13.8" step="0.1"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                                    value={formData.reteICA}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reteICA: Number(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">ReteIVA (%)</label>
                                <input
                                    type="number" min="0" max="15" step="0.1"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                                    value={formData.reteIVA}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reteIVA: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Valores automáticos reflejados en el Liquidador.</p>
                    </div>
                    
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex justify-between text-sm text-slate-400">
                            <span>Subtotal Bruto</span>
                            <span>${calculations.subtotalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-400">
                            <span>Impuestos (IVA)</span>
                            <span>${calculations.taxAmount.toLocaleString()}</span>
                        </div>
                        
                        {(calculations.reteFuenteAmount > 0 || calculations.reteICAAmount > 0 || calculations.reteIVAAmount > 0) && (
                            <div className="py-2 my-2 border-y border-slate-800 space-y-1">
                                {calculations.reteFuenteAmount > 0 && (
                                    <div className="flex justify-between text-xs text-rose-400">
                                        <span>(-) Retención en la Fuente ({formData.reteFuente}%)</span>
                                        <span>-${calculations.reteFuenteAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {calculations.reteICAAmount > 0 && (
                                    <div className="flex justify-between text-xs text-rose-400">
                                        <span>(-) ReteICA ({formData.reteICA}x1000)</span>
                                        <span>-${calculations.reteICAAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {calculations.reteIVAAmount > 0 && (
                                    <div className="flex justify-between text-xs text-rose-400">
                                        <span>(-) ReteIVA ({formData.reteIVA}%)</span>
                                        <span>-${calculations.reteIVAAmount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between text-lg font-bold text-amber-400 pt-2 border-t border-slate-800">
                            <span>Neto a Pagar</span>
                            <span>${calculations.finalAmount.toLocaleString()} {formData.currency}</span>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-slate-950/80 backdrop-blur-md pb-6 z-10">
                <Link
                    href="/dashboard/invoicing"
                    className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                    Descartar
                </Link>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-amber-500 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {formData.isElectronic ? "Firmar y Transmitir a la DIAN" : "Crear Borrador Local"}
                </button>
            </div>
        </form>
    );
}
