"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function LeaderboardGamification({ leaderboard }: { leaderboard: any[] }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200">Sales Leaderboard 🏆</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">No closed won deals this period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center justify-between">
          Sales Leaderboard 🏆
          <span className="text-xs px-2 py-1 rounded bg-teal-500/20 text-teal-400 font-mono">
            LIVE
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {leaderboard.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-sm font-bold border border-slate-700">
                {item.rank}
              </div>
              <div>
                <p className="font-semibold text-slate-200">{item.user?.name || item.user?.firstName || "Unknown Agent"}</p>
                {item.badge && <p className="text-xs text-teal-400 font-mono">{item.badge}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-slate-100">{formatCurrency(item.totalSold)}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Won</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
