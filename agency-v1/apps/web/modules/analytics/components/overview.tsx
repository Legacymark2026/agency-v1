import { Users, TrendingUp, Clock, Activity, Eye, MousePointerClick } from "lucide-react";
import { getAnalyticsOverview } from "@/modules/analytics/actions/analytics";
import { DashboardKPI } from "@/components/dashboard/DashboardUI";

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

export async function AnalyticsOverview() {
    const data = await getAnalyticsOverview(30);

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <DashboardKPI
                label="Visitantes"
                numericValue={data.visitors}
                formatValue={formatNumber}
                delta={`${data.trends.visitors >= 0 ? '+' : ''}${data.trends.visitors}%`}
                deltaUp={data.trends.visitors >= 0}
                deltaText="vs. periodo anterior"
                code="VIS"
                icon={<Users className="w-4 h-4" />}
                accentColor="teal"
                delay={0}
            />
            <DashboardKPI
                label="Sesiones"
                numericValue={data.sessions}
                formatValue={formatNumber}
                delta={`${data.trends.sessions >= 0 ? '+' : ''}${data.trends.sessions}%`}
                deltaUp={data.trends.sessions >= 0}
                deltaText="últimos 30 días"
                code="SES"
                icon={<Activity className="w-4 h-4" />}
                accentColor="sky"
                delay={0.05}
            />
            <DashboardKPI
                label="Páginas Vistas"
                numericValue={data.pageViews}
                formatValue={formatNumber}
                delta={`${data.pagesPerSession} págs/ses.`}
                deltaUp={true}
                deltaText="engagement"
                code="PGV"
                icon={<Eye className="w-4 h-4" />}
                accentColor="emerald"
                delay={0.10}
            />
            <DashboardKPI
                label="Tasa de Rebote"
                numericValue={data.bounceRate}
                formatValue={(v) => `${v.toFixed(1)}%`}
                delta={`${data.trends.bounceRate >= 0 ? '+' : ''}${data.trends.bounceRate}%`}
                deltaUp={data.trends.bounceRate <= 0}
                deltaText={data.trends.bounceRate <= 0 ? "mejorando" : "necesita atención"}
                code="BNC"
                icon={<MousePointerClick className="w-4 h-4" />}
                accentColor={data.trends.bounceRate <= 0 ? "teal" : "red"}
                delay={0.15}
            />
            <DashboardKPI
                label="Duración"
                numericValue={data.avgDuration}
                formatValue={formatDuration}
                delta="por sesión"
                deltaUp={true}
                deltaText="tiempo en el sitio"
                code="DUR"
                icon={<Clock className="w-4 h-4" />}
                accentColor="violet"
                delay={0.20}
            />
            <DashboardKPI
                label="Conversiones"
                numericValue={data.conversions}
                formatValue={(v) => Math.floor(v).toString()}
                delta={`${data.conversionRate}% tasa`}
                deltaUp={data.trends.conversions >= 0}
                deltaText="tasa de conversión"
                code="CVR"
                icon={<TrendingUp className="w-4 h-4" />}
                accentColor="amber"
                delay={0.25}
            />
        </div>
    );
}
