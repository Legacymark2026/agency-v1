"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Landmark, Filter, Loader2 } from "lucide-react";
import { generateDraftPayrollFromTimesheets } from "@/actions/payroll-operations";

const mockTransactions = [
  {
    id: "tx-1",
    date: "Mar 16, 2026",
    description: "Nómina Quincena 1 Marzo",
    category: "PAYROLL",
    type: "EXPENSE",
    amount: 14500.00,
    account: "Cuenta Corriente Bancolombia",
    status: "COMPLETED"
  },
  {
    id: "tx-2",
    date: "Mar 15, 2026",
    description: "Pago Inicial - NexaWebsite",
    category: "CLIENT_PAYMENT",
    type: "INCOME",
    amount: 8200.00,
    account: "Cuenta Corriente Bancolombia",
    status: "COMPLETED"
  },
  {
    id: "tx-3",
    date: "Mar 14, 2026",
    description: "Suscripción AWS",
    category: "SOFTWARE",
    type: "EXPENSE",
    amount: 1250.00,
    account: "Tarjeta Crédito Corporativa",
    status: "COMPLETED"
  },
  {
    id: "tx-4",
    date: "Mar 14, 2026",
    description: "Campaña Meta Ads - Marzo",
    category: "AD_SPEND",
    type: "EXPENSE",
    amount: 3500.00,
    account: "Tarjeta Crédito Corporativa",
    status: "COMPLETED"
  }
];

export default function TreasuryDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPending, startTransition] = useTransition();

  const handleGeneratePayroll = () => {
    startTransition(async () => {
      // Dummy company ID and dates for the mock.
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      await generateDraftPayrollFromTimesheets("mock-company-id", firstDay, now);
      alert("Payroll draft generated successfully from approved Timesheets!");
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-3">
            <Landmark className="w-8 h-8 text-teal-400" />
            Treasury & Cashflow
          </h1>
          <p className="text-slate-400 mt-1">
            CFO Command Center: Runway, burn rate, and financial reconciliation.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors text-slate-300">
            <Filter className="w-4 h-4 text-slate-400" />
            Monthly Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-teal-500/20">
            <ArrowUpRight className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      {/* CFO Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-teal-500/10 to-transparent backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium text-sm">Total Liquid Assets</span>
            <span className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-100">$124,500</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-teal-400">
            <TrendingUp className="w-4 h-4" />
            <span>+8.4% vs last month</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-red-500/10 to-transparent backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium text-sm">Monthly Burn Rate</span>
            <span className="p-2 rounded-lg bg-red-500/20 text-red-400">
               <TrendingDown className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-100">$28,400</span>
            <span className="text-sm font-medium text-slate-400">/mo</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>+2.1% (High AD_SPEND)</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium text-sm">Estimated Runway</span>
            <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-100">4.3</span>
            <span className="text-sm font-medium text-slate-400">Months</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-400">
            <span>Stable, tracking well</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-purple-500/10 to-transparent backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium text-sm">AR Aging (Receivables)</span>
            <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-100">$18,200</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-purple-400">
            <span>2 invoices &gt; 30 days overdue</span>
          </div>
        </motion.div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Ledger / Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-semibold text-slate-200">Recent Transactions</h2>
             <button className="text-sm text-teal-400 hover:text-teal-300 font-medium">View Ledger</button>
          </div>
          
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800/50 text-sm font-medium text-slate-400">
              <div className="col-span-5">Transaction</div>
              <div className="col-span-3">Account</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {mockTransactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/20 transition-colors cursor-pointer">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'INCOME' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.type === 'INCOME' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{tx.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{tx.category}</p>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> {tx.account}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-slate-400">{tx.date}</span>
                  </div>
                  <div className={`col-span-2 text-right text-sm font-bold ${tx.type === 'INCOME' ? 'text-teal-400' : 'text-slate-200'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Quick Actions & Financial Accounts */}
        <div className="space-y-6">
          <div className="space-y-4">
             <h2 className="text-xl font-semibold text-slate-200">Financial Accounts</h2>
             <div className="space-y-3">
                
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <Landmark className="w-4 h-4 text-teal-400" />
                      Cuenta Corriente Bancolombia
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-100">$95,200.00 <span className="text-sm font-normal text-slate-500">COP</span></div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      Tarjeta de Crédito Corp.
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-100">-$2,450.00 <span className="text-sm font-normal text-slate-500">COP (Deuda)</span></div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-1/4" />
                  </div>
                  <span className="text-xs text-slate-500 text-right">Limit: $10,000</span>
                </div>

             </div>
          </div>
          
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4 relative overflow-hidden">
             <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full" />
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Payroll Integration</h3>
             <p className="text-sm text-slate-300 leading-relaxed">
               You have 3 approved timesheets ready to be converted into a Draft Payroll run for this period.
             </p>
             <button 
               onClick={handleGeneratePayroll}
               disabled={isPending}
               className={`w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
               {isPending ? "Generating..." : "Generate Payroll Draft"}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
