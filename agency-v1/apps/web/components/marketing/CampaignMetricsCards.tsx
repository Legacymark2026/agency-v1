'use client';

import { DollarSign, MousePointerClick, TrendingUp, Eye } from "lucide-react";
import { DashboardKPI } from "@/components/dashboard/DashboardUI";

interface MetricsProps {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    cpa: number;
}

export default function CampaignMetricsCards({ metrics }: { metrics: MetricsProps }) {
    const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
    const num = (v: number) => new Intl.NumberFormat('en-US').format(v);

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardKPI
                label="Total Ad Spend"
                numericValue={metrics.totalSpend}
                formatValue={fmt}
                delta="Live"
                deltaUp={true}
                deltaText="Meta & Google"
                code="AD_SPN"
                icon={<DollarSign className="w-4 h-4" />}
                accentColor="teal"
                delay={0}
            />
            <DashboardKPI
                label="Total Impressions"
                numericValue={metrics.totalImpressions}
                formatValue={num}
                delta="Live"
                deltaUp={true}
                deltaText="Across all networks"
                code="IMP_TOT"
                icon={<Eye className="w-4 h-4" />}
                accentColor="slate"
                delay={0.08}
            />
            <DashboardKPI
                label="Total Clicks"
                numericValue={metrics.totalClicks}
                formatValue={num}
                delta="Live"
                deltaUp={true}
                deltaText="Aggregated live"
                code="CLK_TOT"
                icon={<MousePointerClick className="w-4 h-4" />}
                accentColor="amber"
                delay={0.16}
            />
            <DashboardKPI
                label={`Avg. CPA (${num(metrics.totalConversions)} leads)`}
                numericValue={metrics.cpa}
                formatValue={fmt}
                delta="Live"
                deltaUp={true}
                deltaText="Cost per acquisition"
                code="CPA_AVG"
                icon={<TrendingUp className="w-4 h-4" />}
                accentColor="teal"
                delay={0.24}
            />
        </div>
    );
}
