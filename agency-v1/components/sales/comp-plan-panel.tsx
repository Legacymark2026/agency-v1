"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function CompPlanPanel({ rules, commissions }: { rules: any[], commissions: any[] }) {
  const totalPaid = commissions.filter(c => c.status === "PAID").reduce((acc, c) => acc + c.amount, 0);
  const totalPending = commissions.filter(c => c.status === "PENDING").reduce((acc, c) => acc + c.amount, 0);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-200">Commission Engine</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded">
            <p className="text-xs text-slate-400 mb-1">Total Paid (MTD)</p>
            <p className="text-xl font-mono text-green-400">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded">
            <p className="text-xs text-slate-400 mb-1">Pending Approval</p>
            <p className="text-xl font-mono text-amber-400">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300">Active Rules</h4>
          {rules.length === 0 ? (
            <p className="text-xs text-slate-500">No active commission rules</p>
          ) : (
            rules.map((rule, idx) => (
               <div key={idx} className="flex justify-between items-center p-2 rounded bg-slate-800/10 border border-slate-700/20">
                 <div>
                   <p className="text-sm text-slate-300">{rule.user?.name || 'Global Default'}</p>
                   <p className="text-xs text-slate-500">Rate: {(rule.rate * 100).toFixed(1)}%</p>
                 </div>
                 {rule.capAmount && (
                   <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                     Cap: {formatCurrency(rule.capAmount)}
                   </span>
                 )}
               </div>
            ))
          )}
        </div>

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            Recent Activity
            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] uppercase font-bold tracking-wider">Clawbacks Active</span>
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {commissions.slice(0, 5).map((comm, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-slate-950/40 border border-slate-800/50">
                <div>
                  <span className="text-slate-300 block">{comm.user?.name}</span>
                  <span className="text-xs text-slate-500 block truncate max-w-[120px]">{comm.deal?.title}</span>
                </div>
                <div className="text-right">
                  <span className={`font-mono block ${comm.type === 'CLAWBACK' ? 'text-red-400' : comm.type === 'ACCELERATOR' ? 'text-teal-400' : 'text-slate-200'}`}>
                    {formatCurrency(comm.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase">{comm.type}</span>
                </div>
              </div>
            ))}
            {commissions.length === 0 && <p className="text-xs text-slate-500">No commission history yet.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
