"use client";

import { useState } from "react";
import { QrCode, ShoppingBag, Plus, Minus, Send, CheckCircle2, Utensils, Sparkles, Smartphone } from "lucide-react";

interface QrMenuModalProps {
    products: any[];
    onClose: () => void;
    onSubmitOrder: (order: any) => void;
}

export function QrMenuModal({ products, onClose, onSubmitOrder }: QrMenuModalProps) {
    const [selectedTable, setSelectedTable] = useState<string>("Mesa 02");
    const [qrCart, setQrCart] = useState<Array<{ id: string; title: string; unitPrice: number; quantity: number }>>([]);
    const [customerNote, setCustomerNote] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const fmtCOP = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

    const addToQrCart = (p: any) => {
        setQrCart(prev => {
            const existing = prev.find(item => item.id === p.id);
            if (existing) {
                return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { id: p.id, title: p.title, unitPrice: p.unitPrice, quantity: 1 }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setQrCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : null;
            }
            return item;
        }).filter(Boolean) as any);
    };

    const totalAmount = qrCart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

    const handleSendSelfOrder = () => {
        if (qrCart.length === 0) return alert("Selecciona al menos 1 producto del menú QR.");
        setSubmitted(true);
        setTimeout(() => {
            onSubmitOrder({
                table: selectedTable,
                items: qrCart,
                totalAmount,
                customerNote,
            });
        }, 1200);
    };

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
                {/* HEADER */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base">Menú Digital QR & Autopedido Móvil</h3>
                            <p className="text-xs text-slate-400">Vista previa de la interfaz que ve el cliente en su celular.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
                </div>

                {!submitted ? (
                    <div className="space-y-4">
                        {/* TABLE SELECTOR */}
                        <div className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                            <span className="text-slate-400 font-bold">Ubicación del Cliente:</span>
                            <select
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-teal-300 font-bold rounded-xl px-3 py-1 focus:outline-none"
                            >
                                <option value="Mesa 01">Mesa 01 (Comedor)</option>
                                <option value="Mesa 02">Mesa 02 (Comedor)</option>
                                <option value="Mesa VIP 01">Mesa VIP 01 (Terraza)</option>
                                <option value="Barra 01">Barra 01 (Coctelería)</option>
                            </select>
                        </div>

                        {/* PRODUCT CATALOG SIMULATION */}
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            <span className="text-xs font-bold text-slate-400 block">Carta Disponible:</span>
                            {products.map((p) => (
                                <div key={p.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                                    <div>
                                        <span className="font-bold text-white block">{p.title}</span>
                                        <span className="text-teal-400 font-mono font-bold">{fmtCOP(p.unitPrice)}</span>
                                    </div>
                                    <button
                                        onClick={() => addToQrCart(p)}
                                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-teal-600/20"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Agregar
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* CURRENT QR CART */}
                        {qrCart.length > 0 && (
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                                <span className="font-bold text-teal-300 flex items-center gap-1.5">
                                    <ShoppingBag className="w-4 h-4" /> Tu Pedido ({qrCart.length} ítems)
                                </span>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {qrCart.map(i => (
                                        <div key={i.id} className="flex justify-between items-center text-slate-200">
                                            <span>{i.title}</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateQty(i.id, -1)} className="w-5 h-5 bg-slate-800 rounded font-bold">-</button>
                                                <span className="font-bold">{i.quantity}</span>
                                                <button onClick={() => updateQty(i.id, 1)} className="w-5 h-5 bg-slate-800 rounded font-bold">+</button>
                                                <span className="font-mono text-teal-400 font-bold ml-2">{fmtCOP(i.unitPrice * i.quantity)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
                                    <span>TOTAL:</span>
                                    <span className="text-teal-300 font-mono">{fmtCOP(totalAmount)}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSendSelfOrder}
                            disabled={qrCart.length === 0}
                            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            <Send className="w-4 h-4" /> Enviar Autopedido a Cocina & POS
                        </button>
                    </div>
                ) : (
                    <div className="py-8 text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                        <h4 className="font-extrabold text-lg text-white">¡Autopedido Enviado!</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            Tu pedido fue transmitido en tiempo real a la Pantalla de Cocina (KDS) y a la Terminal POS en {selectedTable}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
