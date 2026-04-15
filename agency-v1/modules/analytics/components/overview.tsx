import { Users, TrendingUp, Clock, Activity, ArrowUpRight, ArrowDownRight, Eye, MousePointerClick } from "lucide-react";
import { getAnalyticsOverview } from "@/modules/analytics/actions/analytics";

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

    const metrics = [
        {
            title: "Visitantes",
            value: formatNumber(data.visitors),
            change: `${data.trends.visitors >= 0 ? '+' : ''}${data.trends.visitors}%`,
            trend: data.trends.visitors >= 0 ? "up" : "down",
            description: "vs. periodo anterior",
            icon: Users,
            accentColor: "teal",
            code: "VIS",
        },
        {
            title: "Sesiones",
            value: formatNumber(data.sessions),
            change: `${data.trends.sessions >= 0 ? '+' : ''}${data.trends.sessions}%`,
            trend: data.trends.sessions >= 0 ? "up" : "down",
            description: "últimos 30 días",
            icon: Activity,
            accentColor: "sky",
            code: "SES",
        },
        {
            title: "Páginas Vistas",
            value: formatNumber(data.pageViews),
            change: `${data.pagesPerSession} págs/ses.`,
            trend: "up" as const,
            description: "engagement",
            icon: Eye,
            accentColor: "emerald",
            code: "PGV",
        },
        {
            title: "Tasa de Rebote",
            value: `${data.bounceRate}%`,
            change: `${data.trends.bounceRate >= 0 ? '+' : ''}${data.trends.bounceRate}%`,
            trend: data.trends.bounceRate <= 0 ? "up" : "down",
            description: data.trends.bounceRate <= 0 ? "mejorando" : "necesita atención",
            icon: MousePointerClick,
            accentColor: data.trends.bounceRate <= 0 ? "teal" : "red",
            code: "BNC",
        },
        {
            title: "Duración",
            value: formatDuration(data.avgDuration),
            change: "por sesión",
            trend: "up" as const,
            description: "tiempo en el sitio",
            icon: Clock,
            accentColor: "violet",
            code: "DUR",
        },
        {
            title: "Conversiones",
            value: data.conversions.toString(),
            change: `${data.conversionRate}% tasa`,
            trend: data.trends.conversions >= 0 ? "up" : "down",
            description: "tasa de conversión",
            icon: TrendingUp,
            accentColor: "amber",
            code: "CVR",
        },
    ];

    const accentMap: Record<string, string> = {
        teal: "border-teal-500/30 shadow-teal-500/5",
        sky: "border-sky-500/30 shadow-sky-500/5",
        emerald: "border-emerald-500/30 shadow-emerald-500/5",
        violet: "border-violet-500/30 shadow-violet-500/5",
        amber: "border-amber-500/30 shadow-amber-500/5",
        red: "border-red-500/30 shadow-red-500/5",
    };

    const iconAccentMap: Record<string, string> = {
        teal: "text-teal-400",
        sky: "text-sky-400",
        emerald: "text-emerald-400",
        violet: "text-violet-400",
        amber: "text-amber-400",
        red: "text-red-400",
    };

    const barAccentMap: Record<string, string> = {
        teal: "from-teal-500 to-teal-400",
        sky: "from-sky-500 to-sky-400",
        emerald: "from-emerald-500 to-emerald-400",
        violet: "from-violet-500 to-violet-400",
        amber: "from-amber-500 to-amber-400",
        red: "from-red-500 to-red-400",
    };

    return (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric) => (
                <div
                    key={metric.title}
                    className={`ds-card group relative overflow-hidden hover:shadow-lg transition-all duration-300 border ${accentMap[metric.accentColor]} hover:shadow-sm`}
                >
                    {/* Code tag */}
                    <span className="absolute top-2 right-2 font-mono text-[8px] text-slate-700 uppercase tracking-widest">[{metric.code}]</span>

                    {/* Icon */}
                    <div className="ds-icon-box w-8 h-8 mb-3">
                        <metric.icon size={14} className={iconAccentMap[metric.accentColor]} strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-1">
                        {metric.title}
                    </p>

                    {/* Value + trend */}
                    <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-2xl font-black text-white tracking-tight">
                            {metric.value}
                        </span>
                        <span className={`flex items-center text-[10px] font-bold ${metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {metric.trend === 'up'
                                ? <ArrowUpRight className="h-3 w-3" />
                                : <ArrowDownRight className="h-3 w-3" />}
                            {metric.change}
                        </span>
                    </div>

                    <p className="text-[10px] text-slate-600 leading-tight">{metric.description}</p>

                    {/* Bottom accent bar */}
                    <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${barAccentMap[metric.accentColor]} w-0 group-hover:w-full transition-all duration-500`} />
                </div>
            ))}
        </div>
    );
}
