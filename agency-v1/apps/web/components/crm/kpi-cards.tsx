"use client";

import { DollarSign, Briefcase, TrendingUp, Target } from "lucide-react";
import { DashboardKPI } from "@/components/dashboard/DashboardUI";

interface StatsProps {
    stats: {
        pipelineValue: number;
        activeDeals: number;
        winRate: number;
        avgDealSize: number;
    }
}

export function KPICards({ stats }: StatsProps) {
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardKPI
                label="Pipeline Total"
                numericValue={stats.pipelineValue}
                formatValue={(v) => fmt.format(v)}
                delta="+20.1%"
                deltaUp={true}
                deltaText="vs mes ant."
                code="PIP_VAL"
                icon={<DollarSign className="w-4 h-4" />}
                accentColor="teal"
                delay={0}
            />
            <DashboardKPI
                label="Deals Activos"
                numericValue={stats.activeDeals}
                formatValue={(v) => Math.floor(v).toString()}
                delta="+5 esta sem."
                deltaUp={true}
                deltaText="vs mes ant."
                code="ACT_DEL"
                icon={<Briefcase className="w-4 h-4" />}
                accentColor="blue"
                delay={0.08}
            />
            <DashboardKPI
                label="Win Rate"
                numericValue={stats.winRate}
                formatValue={(v) => `${Math.floor(v)}%`}
                delta="+2.4%"
                deltaUp={true}
                deltaText="vs mes ant."
                code="WIN_PCT"
                icon={<Target className="w-4 h-4" />}
                accentColor="emerald"
                delay={0.16}
            />
            <DashboardKPI
                label="Ticket Promedio"
                numericValue={stats.avgDealSize}
                formatValue={(v) => fmt.format(v)}
                delta="-1.2%"
                deltaUp={false}
                deltaText="vs mes ant."
                code="AVG_DL"
                icon={<TrendingUp className="w-4 h-4" />}
                accentColor="amber"
                delay={0.24}
            />
        </div>
    );
}
