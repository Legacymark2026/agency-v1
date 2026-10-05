"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, Loader2, Save, Plus, Trash2, Send, Percent, Receipt, FileText, 
    Building2, UserCheck, Calendar, CreditCard, ShieldCheck, QrCode, 
    Sparkles, CheckCircle2, AlertTriangle, Eye, HelpCircle, Hash
} from "lucide-react";
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

// Algoritmo oficial DIAN Módulo 11 para cálculo del Dígito de Verificación (DV)
function calculateNitDV(nit: string): number | null {
    const clean = nit.replace(/\D/g, "");
    if (!clean || clean.length < 5 || clean.length > 15) return null;
    const primes = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    let total = 0;
    const len = clean.length;
    for (let i = 0; i < len; i++) {
        total += parseInt(clean[len - 1 - i], 10) * primes[i];
    }
    const remainder = total % 11;
    if (remainder > 1) return 11 - remainder;
    return remainder;
}

export function InvoiceForm({ leads }: InvoiceFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<"receptor" | "items" | "impuestos" | "comercial">("receptor");
    
    const [formData, setFormData] = useState({
        clientName: "",
        clientNit: "",
        clientAddress: "",
        clientCity: "Bogotá D.C.",
        clientPhone: "",
        clientEmail: "",
        clientType: "PERSONA_JURIDICA",
        paymentMethod: "TRANSFERENCIA",
        paymentForm: "CONTADO", // DIAN: Contado o Crédito
        documentNature: "FACTURA_VENTA", // DIAN: Factura o Nota
        leadId: "",
        dueDate: "",
        notes: "",
        terms: "Pago según condiciones comerciales pactadas. Esta factura electrónica constituye título valor una vez aceptada expresa o tácitamente según Art. 772 del Código de Comercio.",
        currency: "COP",
        advancePercentage: 100,
        reteFuente: 0,
        reteICA: 0,
        reteIVA: 0,
        isElectronic: true
    });

    const [items, setItems] = useState([
        { title: "Servicios Profesionales de Estrategia y Consultoría", description: "Mes en curso", quantity: 1, unitPrice: 2500000, taxRate: 0.19, unitCode: "E48" }
    ]);

    // Calcular DV en tiempo real
    const nitDv = useMemo(() => calculateNitDV(formData.clientNit), [formData.clientNit]);

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { title: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0.19, unitCode: "E48" }]);
    };

    const addPresetItem = (title: string, unitPrice: number) => {
        setItems([...items, { title, description: "Servicios de tecnología y marketing", quantity: 1, unitPrice, taxRate: 0.19, unitCode: "E48" }]);
        toast.info(`Línea agregada: ${title}`);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    // Cálculos aritméticos balanceados
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

        const totalBruto = subtotal + tax;
        const reteFuenteAmount = Math.round(subtotal * (formData.reteFuente / 100));
        const reteICAAmount = Math.round(subtotal * (formData.reteICA / 1000));
        const reteIVAAmount = Math.round(tax * (formData.reteIVA / 100));

        const totalRetenciones = reteFuenteAmount + reteICAAmount + reteIVAAmount;
        const finalCalculated = Math.max(0, totalBruto - totalRetenciones);

        return {
            subtotalAmount: subtotal,
            taxAmount: tax,
            discountAmount: 0,
            totalAmount: totalBruto,
            reteFuenteAmount,
            reteICAAmount,
            reteIVAAmount,
            totalRetenciones,
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
        if (lead) toast.success(`Lead vinculado: ${lead.name}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            
            if (items.some(i => !i.title.trim())) {
                toast.error("Todos los conceptos deben tener un título o descripción");
                return;
            }

            if (!formData.clientNit.trim()) {
                toast.error("El NIT o número de documento del cliente es obligatorio");
                return;
            }

            const payload = {
                clientName: formData.clientName,
                clientNit: nitDv !== null ? `${formData.clientNit.replace(/\D/g, '')}-${nitDv}` : formData.clientNit,
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
                documentNature: formData.documentNature,
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

            toast.success(formData.isElectronic ? "Factura electrónica guardada y lista para transmisión DIAN." : "Borrador de factura guardado.");
            router.push("/dashboard/invoicing");
            router.refresh();
        } catch (error: any) {
            toast.error(`Error al crear la factura: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <Link 
                        href="/dashboard/invoicing" 
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-slate-800 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Nueva Factura Electrónica
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                                Anexo Técnico 1.9 DIAN
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">Completa los campos con validación en tiempo real del receptor y liquidación de impuestos.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar & Transmitir
                    </button>
                </div>
            </div>

            {/* Split Screen Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Smart Form Fields (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* SECTION 1: Configuración & Tipología */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                <FileText size={15} /> Tipología & Régimen
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">DIAN UBL 2.1</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Naturaleza Documental</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-colors"
                                    value={formData.documentNature}
                                    onChange={(e) => setFormData(prev => ({ ...prev, documentNature: e.target.value }))}
                                >
                                    <option value="FACTURA_VENTA">01 - Factura de Venta</option>
                                    <option value="NOTA_CREDITO">91 - Nota Crédito</option>
                                    <option value="NOTA_DEBITO">92 - Nota Débito</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Modo de Transmisión</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-colors"
                                    value={formData.isElectronic ? "DIAN" : "LOCAL"}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isElectronic: e.target.value === "DIAN" }))}
                                >
                                    <option value="DIAN">Emisión Electrónica DIAN</option>
                                    <option value="LOCAL">Borrador de Control Interno</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Moneda (Divisa)</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-colors"
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

                    {/* SECTION 2: Datos del Receptor / Cliente */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                <Building2 size={15} /> Adquirente (Receptor)
                            </span>
                            <span className="text-[11px] text-slate-500">Datos fiscales validados</span>
                        </div>

                        {/* CRM Lead Quick Select */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Cargar Lead del CRM (Opcional)</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-800 text-sm text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-colors"
                                value={formData.leadId}
                                onChange={handleLeadSelect}
                            >
                                <option value="">Ingresar datos manualmente...</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.id}>
                                        {lead.name} {lead.company ? `(${lead.company})` : ''} - {lead.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Razón Social o Nombre Completo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Alianza Estratégica SAS"
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                                    <span>NIT o Cédula *</span>
                                    {nitDv !== null && (
                                        <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                                            <CheckCircle2 size={11} /> DV DIAN: -{nitDv}
                                        </span>
                                    )}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: 901234567"
                                        className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 font-mono"
                                        value={formData.clientNit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, clientNit: e.target.value }))}
                                    />
                                    {nitDv !== null && (
                                        <span className="px-3 py-2.5 bg-slate-800 border border-slate-700 text-emerald-400 rounded-xl text-sm font-mono font-bold flex items-center">
                                            -{nitDv}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Recepción Facturas (DIAN) *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="facturacion@empresa.com"
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                                    value={formData.clientEmail}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Tipo de Persona</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                                    value={formData.clientType}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientType: e.target.value }))}
                                >
                                    <option value="PERSONA_JURIDICA">1 - Persona Jurídica (Empresa)</option>
                                    <option value="PERSONA_NATURAL">2 - Persona Natural</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Condiciones Comerciales & RADIAN */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                <CreditCard size={15} /> Condiciones de Pago & RADIAN
                            </span>
                            <span className="text-[11px] text-slate-500">Título Valor</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Forma de Pago</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                                    value={formData.paymentForm}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentForm: e.target.value }))}
                                >
                                    <option value="CONTADO">1 - Contado</option>
                                    <option value="CREDITO">2 - Crédito (Exigible RADIAN)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Medio de Pago DIAN</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                >
                                    <option value="TRANSFERENCIA">47 - Transferencia Bancaria</option>
                                    <option value="TARJETA_CREDITO">48 - Tarjeta de Crédito</option>
                                    <option value="EFECTIVO">10 - Efectivo</option>
                                    <option value="ACUERDO_MUTUO">ZZ - Acuerdo Mutuo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Vencimiento {formData.paymentForm === "CREDITO" && "*"}
                                </label>
                                <input
                                    type="date"
                                    required={formData.paymentForm === "CREDITO"}
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: Conceptos & Líneas Facturadas */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                <Receipt size={15} /> Conceptos & Líneas Facturadas
                            </span>
                            {/* Quick Presets */}
                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => addPresetItem("Consultoría Estratégica", 2000000)}
                                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                >
                                    + Consultoría
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addPresetItem("Desarrollo de Software a la Medida", 5000000)}
                                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                >
                                    + Software
                                </button>
                            </div>
                        </div>

                        {/* Items Rows */}
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3 group hover:border-slate-700 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Descripción del bien o servicio..."
                                                className="w-full bg-transparent border-b border-slate-800 text-sm font-semibold text-white pb-1.5 focus:border-amber-400 focus:outline-none"
                                                value={item.title}
                                                onChange={(e) => handleItemChange(index, "title", e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            disabled={items.length === 1}
                                            className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg transition-colors disabled:opacity-30"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <label className="text-slate-500 block mb-1">Cantidad</label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-slate-500 block mb-1">Precio Unitario ($)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                required
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-slate-500 block mb-1">Tarifa IVA</label>
                                            <select
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                                                value={item.taxRate}
                                                onChange={(e) => handleItemChange(index, "taxRate", Number(e.target.value))}
                                            >
                                                <option value={0.19}>19% (General)</option>
                                                <option value={0.05}>5% (Especial)</option>
                                                <option value={0}>0% (Exento)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-slate-500 block mb-1">Total Línea</label>
                                            <div className="py-1.5 text-right font-mono font-bold text-white">
                                                ${(item.quantity * item.unitPrice * (1 + item.taxRate)).toLocaleString("es-CO")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 py-1"
                        >
                            <Plus size={15} /> Agregar Otra Línea
                        </button>
                    </div>

                    {/* SECTION 5: Retenciones & Impuestos Especiales */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                                <Percent size={15} /> Retenciones Fiscales (Régimen Colombiano)
                            </span>
                            <span className="text-[11px] text-slate-500">Deducción en el pago</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* ReteFuente */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-slate-300">ReteFuente (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.1"
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2 font-mono"
                                    value={formData.reteFuente}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reteFuente: Number(e.target.value) }))}
                                />
                                <div className="flex gap-1 flex-wrap">
                                    {[0, 2.5, 3.5, 4, 11].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, reteFuente: r }))}
                                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                                formData.reteFuente === r 
                                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold' 
                                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                                            }`}
                                        >
                                            {r}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ReteICA */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-slate-300">ReteICA (x 1000)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.01"
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2 font-mono"
                                    value={formData.reteICA}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reteICA: Number(e.target.value) }))}
                                />
                                <div className="flex gap-1 flex-wrap">
                                    {[0, 4.14, 6.9, 9.66, 11.04].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, reteICA: r }))}
                                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                                formData.reteICA === r 
                                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold' 
                                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                                            }`}
                                        >
                                            {r}‰
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ReteIVA */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-slate-300">ReteIVA (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2 font-mono"
                                    value={formData.reteIVA}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reteIVA: Number(e.target.value) }))}
                                />
                                <div className="flex gap-1 flex-wrap">
                                    {[0, 15].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, reteIVA: r }))}
                                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                                formData.reteIVA === r 
                                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold' 
                                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                                            }`}
                                        >
                                            {r}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Live Interactive UBL 2.1 Invoice Mockup (5 Cols, Sticky) */}
                <div className="lg:col-span-5 sticky top-24 space-y-4">
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
                        {/* Decorative watermark */}
                        <div className="absolute right-4 top-4 text-slate-800/40 pointer-events-none select-none font-black text-6xl opacity-10">
                            UBL 2.1
                        </div>

                        {/* Mockup Header */}
                        <div className="border-b border-slate-800/80 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-extrabold text-white text-base tracking-tight">LEGACYMARK S.A.S.</h4>
                                    <p className="text-[11px] text-slate-400 font-mono">NIT: 901.234.567-8 | IVA Régimen Común</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                        FE-PREVIEW
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mockup Receptor Summary */}
                        <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/60 space-y-1 text-xs">
                            <p className="text-slate-500 font-semibold uppercase text-[10px]">Adquirente</p>
                            <p className="font-bold text-white">{formData.clientName || "Nombre del Cliente / Empresa"}</p>
                            <p className="text-slate-400 font-mono">
                                NIT: {formData.clientNit || "000000000"}{nitDv !== null ? `-${nitDv}` : ""}
                            </p>
                            <p className="text-slate-500 text-[11px] truncate">{formData.clientEmail || "email@ejemplo.com"}</p>
                        </div>

                        {/* Mockup Items Preview */}
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Desglose de Conceptos</p>
                            <div className="divide-y divide-slate-800/60 text-xs">
                                {items.map((item, idx) => (
                                    <div key={idx} className="py-2 flex items-center justify-between">
                                        <div className="pr-2 truncate">
                                            <p className="text-white font-medium truncate">{item.title || "Concepto sin título"}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                {item.quantity} x ${item.unitPrice.toLocaleString("es-CO")} (IVA {(item.taxRate * 100)}%)
                                            </p>
                                        </div>
                                        <span className="font-mono text-slate-300 whitespace-nowrap">
                                            ${(item.quantity * item.unitPrice * (1 + item.taxRate)).toLocaleString("es-CO")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Liquidación Final */}
                        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal Gravable</span>
                                <span className="font-mono">${calculations.subtotalAmount.toLocaleString("es-CO")}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Impuesto al Valor Agregado (IVA)</span>
                                <span className="font-mono text-emerald-400">+${calculations.taxAmount.toLocaleString("es-CO")}</span>
                            </div>

                            {calculations.totalRetenciones > 0 && (
                                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                                    {calculations.reteFuenteAmount > 0 && (
                                        <div className="flex justify-between text-rose-400 text-[11px]">
                                            <span>ReteFuente ({formData.reteFuente}%)</span>
                                            <span className="font-mono">-${calculations.reteFuenteAmount.toLocaleString("es-CO")}</span>
                                        </div>
                                    )}
                                    {calculations.reteICAAmount > 0 && (
                                        <div className="flex justify-between text-rose-400 text-[11px]">
                                            <span>ReteICA ({formData.reteICA}‰)</span>
                                            <span className="font-mono">-${calculations.reteICAAmount.toLocaleString("es-CO")}</span>
                                        </div>
                                    )}
                                    {calculations.reteIVAAmount > 0 && (
                                        <div className="flex justify-between text-rose-400 text-[11px]">
                                            <span>ReteIVA ({formData.reteIVA}%)</span>
                                            <span className="font-mono">-${calculations.reteIVAAmount.toLocaleString("es-CO")}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                                <div>
                                    <span className="font-bold text-white text-sm">Total Neto a Pagar</span>
                                    <p className="text-[10px] text-slate-500 font-mono">Exigible RADIAN</p>
                                </div>
                                <span className="text-xl font-black font-mono text-amber-400">
                                    ${calculations.finalAmount.toLocaleString("es-CO")} <span className="text-xs font-normal text-slate-400">{formData.currency}</span>
                                </span>
                            </div>
                        </div>

                        {/* Sello de Seguridad */}
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                            <ShieldCheck size={24} className="text-emerald-400 shrink-0" />
                            <div className="text-[11px] text-slate-400">
                                <p className="font-semibold text-emerald-300">Firma XAdES-EPES Certificada</p>
                                <p className="text-slate-500">Al emitir, se generará el CUFE SHA-384 canónico y se enviará por SOAP MTOM.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
