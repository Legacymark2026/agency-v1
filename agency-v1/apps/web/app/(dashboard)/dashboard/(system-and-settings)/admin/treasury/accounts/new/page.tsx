"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, Landmark } from "lucide-react";
import { toast } from "sonner";
import { createFinancialAccount } from "@/actions/treasury";

export default function NewAccountPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: "",
        type: "BANK_ACCOUNT" as "BANK_ACCOUNT" | "CREDIT_CARD" | "DIGITAL_WALLET" | "CASH",
        currency: "COP",
        initialBalance: 0,
        description: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const res = await createFinancialAccount(formData);
        if (res.success) {
            toast.success("Cuenta financiera agregada");
            router.push("/dashboard/admin/treasury");
        } else {
            toast.error(res.error || "Hubo un error al agregar la cuenta");
        }
        setIsLoading(false);
    };

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
                        <Landmark className="w-6 h-6 text-emerald-500" />
                        Agregar Cuenta Financiera
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Registra una nueva cuenta bancaria, tarjeta de crédito o billetera digital.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm shadow-slate-900/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-8">
                    
                    <div className="space-y-2 col-span-full">
                        <label className="text-xs font-medium text-slate-300">Nombre o Alias de la Cuenta *</label>
                        <input
                            type="text" required name="name"
                            placeholder="Ej: Cuenta Corriente Bancolombia, o Tarjeta de Crédito Nu"
                            value={formData.name} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Tipo de Producto *</label>
                        <select
                            name="type" required
                            value={formData.type} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow"
                        >
                            <option value="BANK_ACCOUNT">Cuenta Bancaria (Ahorros / Corriente)</option>
                            <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                            <option value="DIGITAL_WALLET">Billetera Digital (Nequi, Daviplata, Paypal)</option>
                            <option value="CASH">Efectivo (Caja Menor)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Moneda Base *</label>
                        <select
                            name="currency" required
                            value={formData.currency} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow"
                        >
                            <option value="COP">COP (Pesos Colombianos)</option>
                            <option value="USD">USD (Dólares)</option>
                            <option value="EUR">EUR (Euros)</option>
                        </select>
                    </div>

                    <div className="space-y-2 col-span-full">
                        <label className="text-xs font-medium text-slate-300">Saldo Inicial (Opcional)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-emerald-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number" step="1" name="initialBalance"
                                value={formData.initialBalance} onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow font-mono"
                            />
                        </div>
                        <p className="text-xs text-slate-500">¿Con cuánto dinero en positivo o saldo en negativo arranca esta cuenta en el sistema?</p>
                    </div>

                    <div className="space-y-2 col-span-full">
                         <label className="text-xs font-medium text-slate-300">Descripción o Últimos 4 Dígitos (Opcional)</label>
                         <textarea
                             name="description" rows={2} placeholder="Ej: Terminada en 4512"
                             value={formData.description} onChange={handleChange}
                             className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow resize-none"
                         />
                    </div>
                </div>

                <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3 mt-auto">
                    <Link
                        href="/dashboard/admin/treasury"
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)] min-w-[140px] justify-center"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Crear Cuenta
                    </button>
                </div>
            </form>
        </div>
    );
}
