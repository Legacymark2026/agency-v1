"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, Loader2, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { recordTransaction, getFinancialAccounts } from "@/actions/treasury";

export default function NewTransactionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultType = searchParams.get('type') || 'EXPENSE';

    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        accountId: "",
        type: defaultType as "INCOME" | "EXPENSE" | "TRANSFER",
        amount: 0,
        category: "OPERATIONS",
        description: "",
        date: new Date().toISOString().split('T')[0],
        reference: "",
    });

    useEffect(() => {
        async function fetchAccounts() {
            const res = await getFinancialAccounts();
            if (res.success) setAccounts(res.data);
        }
        fetchAccounts();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const res = await recordTransaction({...formData, date: new Date(formData.date).toISOString()});
        if (res.success) {
            toast.success("Movimiento registrado correctamente");
            router.push("/dashboard/admin/treasury");
        } else {
            toast.error(res.error || "Hubo un error al registrar el movimiento");
        }
        setIsLoading(false);
    };

    const isIncome = formData.type === 'INCOME';

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 flex flex-col h-full">
            <div className="flex items-center gap-4">
                <Link 
                    href="/dashboard/admin/treasury" 
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Activity className={`w-6 h-6 ${isIncome ? 'text-emerald-500' : 'text-red-500'}`} />
                        Registrar Movimiento Manual
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Ingresa un depósito externo o registra un gasto operativo.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="flex bg-slate-950 border-b border-slate-800">
                    <button type="button" onClick={() => setFormData({...formData, type: 'INCOME'})} className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors flex justify-center items-center gap-2 ${isIncome ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>
                        <ArrowUpRight className="w-4 h-4" /> Ingreso
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'EXPENSE'})} className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors flex justify-center items-center gap-2 ${!isIncome ? 'text-red-400 border-b-2 border-red-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>
                        <ArrowDownRight className="w-4 h-4" /> Egreso
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-8 overflow-y-auto">
                    
                    <div className="space-y-2 col-span-full">
                        <label className="text-xs font-medium text-slate-300">Cuenta de Destino/Origen *</label>
                        <select
                            name="accountId" required
                            value={formData.accountId} onChange={handleChange}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-shadow ${isIncome ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'focus:border-red-500 focus:ring-1 focus:ring-red-500'}`}
                        >
                            <option value="" disabled>Selecciona una cuenta...</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency}) - Saldo: ${acc.balance}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Monto Final *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className={`sm:text-sm font-bold ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>$</span>
                            </div>
                            <input
                                type="number" required min="1" step="1" name="amount"
                                value={formData.amount || ''} onChange={handleChange}
                                className={`w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition-shadow font-mono ${isIncome ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'focus:border-red-500 focus:ring-1 focus:ring-red-500'}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Categoría Contable *</label>
                        <select
                            name="category" required
                            value={formData.category} onChange={handleChange}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-shadow ${isIncome ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'focus:border-red-500 focus:ring-1 focus:ring-red-500'}`}
                        >
                            {isIncome ? (
                                <>
                                    <option value="CLIENT_PAYMENT">Pago de Cliente Independiente</option>
                                    <option value="INVESTMENT">Inyección de Efectivo</option>
                                    <option value="OTHER_INCOME">Otro Ingreso Operativo</option>
                                </>
                            ) : (
                                <>
                                    <option value="SOFTWARE">Suscripción SaaS / Software</option>
                                    <option value="AD_SPEND">Publicidad / Pauta (Meta, Google)</option>
                                    <option value="OPERATIONS">Operaciones y Compras</option>
                                    <option value="TAXES">Impuestos y Retenciones</option>
                                    <option value="OTHER_EXPENSE">Otro Egreso Operativo</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Fecha del Movimiento *</label>
                        <input
                            type="date" required name="date"
                            value={formData.date} onChange={handleChange}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-shadow ${isIncome ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'focus:border-red-500 focus:ring-1 focus:ring-red-500'}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Referencia / Comprobante (Opcional)</label>
                        <input
                            type="text" name="reference"
                            placeholder="Ej: TRX-99812"
                            value={formData.reference} onChange={handleChange}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-shadow ${isIncome ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'focus:border-red-500 focus:ring-1 focus:ring-red-500'}`}
                        />
                    </div>

                    <div className="space-y-2 col-span-full">
                         <label className="text-xs font-medium text-slate-300">Descripción o Concepto (Opcional)</label>
                         <textarea
                             name="description" rows={2} placeholder="Detalles de la transacción..."
                             value={formData.description} onChange={handleChange}
                             className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition-shadow resize-none ${isIncome ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'focus:border-red-500 focus:ring-1 focus:ring-red-500'}`}
                         />
                    </div>
                </div>

                <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3 mt-auto">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 min-w-[140px] justify-center ${isIncome ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isIncome ? 'Registrar Ingreso' : 'Registrar Egreso'}
                    </button>
                </div>
            </form>
        </div>
    );
}
