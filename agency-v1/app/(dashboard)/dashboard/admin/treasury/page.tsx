"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, Activity, CreditCard, Landmark, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getFinancialAccounts, getRecentTransactions } from "@/actions/treasury";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

export default function TreasuryDashboard() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [accRes, txRes] = await Promise.all([
                getFinancialAccounts(),
                getRecentTransactions(20)
            ]);
            
            if (accRes.success) setAccounts(accRes.data);
            if (txRes.success) setTransactions(txRes.data);
            setIsLoading(false);
        }
        fetchData();
    }, []);

    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

    const getAccountIcon = (type: string) => {
        switch (type) {
            case 'BANK_ACCOUNT': return <Landmark className="w-5 h-5 text-blue-400" />;
            case 'CREDIT_CARD': return <CreditCard className="w-5 h-5 text-violet-400" />;
            case 'DIGITAL_WALLET': return <Wallet className="w-5 h-5 text-teal-400" />;
            default: return <Wallet className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-3">
                        <Activity className="w-3.5 h-3.5" />
                        <span>TESORERÍA Y FINANZAS</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Cuentas y Saldos</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Control total sobre el capital líquido, ingresos y egresos de la agencia.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/treasury/transactions/new"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                    >
                        <Plus className="h-4 w-4 text-emerald-500" />
                        Registrar Movimiento
                    </Link>
                    <Link
                        href="/dashboard/admin/treasury/accounts/new"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        <Landmark className="h-4 w-4" />
                        Nueva Cuenta
                    </Link>
                </div>
            </div>

            {/* Gran Total */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-center shadow-lg">
                 {/* Decorative background glow */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
                 
                 <div className="relative z-10 w-full md:w-auto">
                     <p className="text-sm text-slate-400 font-medium tracking-widest uppercase mb-1">Capital Total Disponible</p>
                     <p className="text-4xl md:text-5xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
                         {isLoading ? "Consultando..." : formatCurrency(totalBalance)}
                     </p>
                 </div>
                 
                 <div className="relative z-10 w-full md:w-auto mt-6 md:mt-0 flex gap-4 md:border-l border-slate-800 md:pl-8">
                     <div>
                         <p className="text-xs text-slate-500 font-mono uppercase">Cuentas Activas</p>
                         <p className="text-xl font-bold text-white">{isLoading ? "-" : accounts.length}</p>
                     </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Lista de Cuentas */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-500" /> Tus Cuentas
                    </h3>
                    
                    {isLoading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                    ) : accounts.length === 0 ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500">
                            No hay cuentas configuradas.<br/>Crea una para comenzar.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {accounts.map(acc => (
                                <div key={acc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-emerald-500/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-800/80">
                                                {getAccountIcon(acc.type)}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-200">{acc.name}</h4>
                                                <p className="text-[10px] text-slate-500 font-mono tracking-widest">{acc.currency}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-800/60 flex justify-between items-end">
                                        <span className="text-xs text-slate-500">Saldo actual</span>
                                        <span className="text-lg font-bold text-white">{formatCurrency(acc.balance)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Libro Mayor (Transacciones) */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" /> Libro Mayor (Últimos Movimientos)
                    </h3>
                    
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] font-bold tracking-widest text-slate-500 uppercase bg-slate-900/50 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Fecha / Detalle</th>
                                        <th className="px-6 py-4">Cuenta</th>
                                        <th className="px-6 py-4 text-center">Tipo</th>
                                        <th className="px-6 py-4 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {isLoading ? (
                                         <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-500"/></td></tr>
                                    ) : transactions.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No hay movimientos registrados.</td></tr>
                                    ) : transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-200">{tx.description || tx.category.replace("_", " ")}</div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    {format(new Date(tx.date), "d MMM yyyy", { locale: es })}
                                                    {tx.reference && ` • Ref: ${tx.reference}`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    {getAccountIcon(tx.account.type)} {tx.account.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    {tx.type === 'INCOME' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            <ArrowUpRight className="w-3 h-3" /> DEPOSITO
                                                        </span>
                                                    ) : tx.type === 'EXPENSE' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                                                            <ArrowDownRight className="w-3 h-3" /> RETIRO
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            TRANSF
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-mono font-medium ${tx.type === 'INCOME' ? 'text-emerald-400' : tx.type === 'EXPENSE' ? 'text-red-400' : 'text-blue-400'}`}>
                                                    {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                                                    {formatCurrency(tx.amount)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
