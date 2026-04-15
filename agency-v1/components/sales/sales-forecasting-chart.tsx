"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function SalesForecastingChart({ totalPipeline, weightedPipeline }: { totalPipeline: number; weightedPipeline: number }) {
  // A simple visual breakdown using HUD styling
  const fillPercentage = totalPipeline > 0 ? (weightedPipeline / totalPipeline) * 100 : 0;

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl opacity-50 rounded-full"></div>
      
      <CardHeader>
        <CardTitle className="text-slate-200 uppercase tracking-widest text-sm text-muted-foreground flex items-center gap-2">
          <span>Weighted Pipeline Forecast</span>
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
            <p className="text-xs text-slate-400 uppercase mb-1">Total Pipeline</p>
            <p className="text-2xl font-mono text-slate-300">{formatCurrency(totalPipeline)}</p>
          </div>
          <div className="p-4 rounded-lg bg-teal-950/30 border border-teal-900/50">
            <p className="text-xs text-teal-400 uppercase mb-1">Weighted (Expected)</p>
            <p className="text-2xl font-mono text-teal-300">{formatCurrency(weightedPipeline)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Probable Conversion</span>
            <span>{fillPercentage.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-1000 ease-out relative"
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
