'use client';

import { useState } from 'react';
import {
    FileText, Plus, Trash2, CheckCircle, Download, Send, X, DollarSign, ShieldCheck
} from 'lucide-react';
import { calculateQuote, createDigitalQuote, QuoteLineItem, DigitalQuote } from '@/lib/crm/cpq-engine';

interface CpqQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    dealId?: string;
    companyName?: string;
    clientEmail?: string;
}

export function CpqQuoteModal({
    isOpen,
    onClose,
    dealId = 'deal-101',
    companyName = 'Cliente Corporativo',
    clientEmail = 'contacto@empresa.com'
}: CpqQuoteModalProps) {
    const [items, setItems] = useState<QuoteLineItem[]>([
        { id: '1', productName: 'Licencia Software LegacyMark Pro', unitPrice: 1500, quantity: 2, discountPct: 10 },
        { id: '2', productName: 'Implementación & Onboarding Personalizado', unitPrice: 2000, quantity: 1, discountPct: 0 },
    ]);
    const [taxRate, setTaxRate] = useState<number>(19);
    const [generatedQuote, setGeneratedQuote] = useState<DigitalQuote | null>(null);

    if (!isOpen) return null;

    const calculation = calculateQuote(items, taxRate);

    const handleAddItem = () => {
        const newItem: QuoteLineItem = {
            id: Date.now().toString(),
            productName: 'Nuevo Servicio / Producto',
            unitPrice: 500,
            quantity: 1,
            discountPct: 0,
        };
        setItems([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleUpdateItem = (id: string, field: keyof QuoteLineItem, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const handleGenerateQuote = () => {
        const quote = createDigitalQuote(dealId, companyName, clientEmail, items, taxRate);
        setGeneratedQuote(quote);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white">Generador CPQ & Cotizaciones PDF</h3>
                            <p className="font-mono text-xs text-slate-500">Cálculo dinámico de impuestos, descuentos y firma digital</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {!generatedQuote ? (
                    <div className="space-y-4 font-mono text-xs">
                        
                        {/* Client Info Bar */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div>
                                <span className="text-slate-500">Cliente:</span>
                                <p className="font-bold text-white">{companyName}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Email:</span>
                                <p className="font-bold text-teal-400">{clientEmail}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 uppercase font-bold">Ítems de la Cotización:</span>
                                <button
                                    onClick={handleAddItem}
                                    className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-bold bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-lg"
                                >
                                    <Plus size={12} /> Agregar Ítem
                                </button>
                            </div>

                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                        <input
                                            type="text"
                                            value={item.productName}
                                            onChange={(e) => handleUpdateItem(item.id, 'productName', e.target.value)}
                                            className="col-span-5 bg-slate-900 border border-slate-800 text-white px-2 py-1 rounded"
                                        />
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="col-span-2 bg-slate-900 border border-slate-800 text-teal-400 text-right px-2 py-1 rounded"
                                        />
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="col-span-2 bg-slate-900 border border-slate-800 text-white text-center px-2 py-1 rounded"
                                        />
                                        <input
                                            type="number"
                                            placeholder="% desc"
                                            value={item.discountPct || 0}
                                            onChange={(e) => handleUpdateItem(item.id, 'discountPct', parseFloat(e.target.value) || 0)}
                                            className="col-span-2 bg-slate-900 border border-slate-800 text-amber-400 text-center px-2 py-1 rounded"
                                        />
                                        <button onClick={() => handleRemoveItem(item.id)} className="col-span-1 text-rose-400 hover:text-rose-300 flex justify-center">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Summary Card */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-right">
                            <p className="text-slate-400">Subtotal Brut: <strong className="text-slate-200">${calculation.subtotal.toLocaleString()}</strong></p>
                            <p className="text-slate-400">Descuentos Aplicados: <strong className="text-amber-400">-${calculation.discountTotal.toLocaleString()}</strong></p>
                            <p className="text-slate-400">IVA ({taxRate}%): <strong className="text-slate-200">+${calculation.taxAmount.toLocaleString()}</strong></p>
                            <p className="text-base font-black text-white pt-1 border-t border-slate-800">
                                Total General: <span className="text-emerald-400">${calculation.grandTotal.toLocaleString()}</span>
                            </p>
                        </div>

                        <button
                            onClick={handleGenerateQuote}
                            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 text-sm"
                        >
                            <FileText size={16} />
                            <span>Generar Cotización Digital PDF</span>
                        </button>
                    </div>
                ) : (
                    /* Generated Quote Preview */
                    <div className="space-y-4 font-mono text-xs">
                        <div className="bg-slate-950 p-6 rounded-xl border border-teal-500/40 space-y-4 shadow-xl">
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <div>
                                    <span className="text-teal-400 font-bold text-sm">{generatedQuote.quoteNumber}</span>
                                    <p className="text-slate-400">Válido hasta: {generatedQuote.validUntil}</p>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                                    ESTADO: {generatedQuote.status}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {generatedQuote.items.map(item => (
                                    <div key={item.id} className="flex justify-between border-b border-slate-900 pb-1">
                                        <span className="text-slate-300">{item.productName} (x{item.quantity})</span>
                                        <span className="text-white font-bold">${(item.unitPrice * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 text-right">
                                <span className="text-xs text-slate-500 uppercase">Total a Pagar:</span>
                                <p className="text-2xl font-black text-emerald-400">${generatedQuote.calculation.grandTotal.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setGeneratedQuote(null)}
                                className="flex-1 py-2.5 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all"
                            >
                                Editar Cotización
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                            >
                                <Send size={14} />
                                <span>Enviar Cotización a Cliente</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
