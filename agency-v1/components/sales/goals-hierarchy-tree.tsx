"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function GoalsHierarchyTree({ goals, deals }: { goals: any[], deals: any[] }) {
  const totalRevenue = deals.reduce((acc, deal) => acc + deal.value, 0);

  const agencyGoal = goals.find(g => g.level === "AGENCY")?.targetAmount || 0;
  const progress = agencyGoal > 0 ? (totalRevenue / agencyGoal) * 100 : 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-200">Goal Hierarchy & Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          
          {/* Agency Level */}
          <div className="border border-slate-700/50 rounded-lg p-4 bg-slate-950/50 relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
             
             <div className="flex justify-between items-end mb-2">
               <div>
                  <h4 className="text-slate-300 font-semibold flex items-center gap-2">
                    <span className="text-teal-400 p-1 bg-teal-500/10 rounded uppercase text-xs">Agency</span>
                    Global Target
                  </h4>
               </div>
               <div className="text-right">
                 <p className="text-2xl font-mono text-slate-100">{formatCurrency(totalRevenue)}</p>
                 <p className="text-xs text-slate-400">of {formatCurrency(agencyGoal)}</p>
               </div>
             </div>

             <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-teal-500'}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
             </div>
          </div>

          {/* Individual Goals */}
          <div className="pl-4 border-l border-slate-800 space-y-4">
            {goals.filter(g => g.level === "INDIVIDUAL").map((goal, idx) => {
              const userDeals = deals.filter(d => d.assignedTo === goal.userId);
              const userRev = userDeals.reduce((acc, d) => acc + d.value, 0);
              const userProg = goal.targetAmount > 0 ? (userRev / goal.targetAmount) * 100 : 0;

              return (
                <div key={idx} className="p-3 bg-slate-800/30 rounded border border-slate-700/30">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-slate-300">{goal.user?.name || 'Unassigned'}</p>
                    <p className="text-xs font-mono text-slate-400">{formatCurrency(userRev)} / {formatCurrency(goal.targetAmount)}</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${userProg >= 100 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min(userProg, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
