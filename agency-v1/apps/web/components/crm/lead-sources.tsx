"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    Sector
} from "recharts";
import { CRM_TOOLTIP_STYLE, CRM_CHART_COLORS } from "@/lib/crm-charts-config";
import { ArrowUpRight, PieChart as PieChartIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface LeadSource {
    name: string;
    value: number;
}

interface LeadSourcesProps {
    data: LeadSource[];
}

const COLORS = [
    CRM_CHART_COLORS.primary,
    CRM_CHART_COLORS.secondary,
    CRM_CHART_COLORS.tertiary,
    CRM_CHART_COLORS.quaternary,
    CRM_CHART_COLORS.quinary
];

const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xl font-bold font-mono">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                cursor="pointer"
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 10}
                outerRadius={outerRadius + 14}
                fill={fill}
            />
        </g>
    );
};

export function LeadSources({ data }: LeadSourcesProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    if (!data || data.length === 0) {
        return (
            <Card className="col-span-3 h-full bg-white/70 backdrop-blur-xl border border-slate-200/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-500 uppercase tracking-widest text-sm font-bold">Fuentes de Leads</CardTitle>
                    <CardDescription>Sin datos de leads registrados.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="col-span-4 lg:col-span-3 h-full bg-white/70 backdrop-blur-xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between relative z-10 pb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 p-1.5 rounded-lg shadow-sm">
                        <PieChartIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
                            Fuentes de Leads
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-400">
                            Distribución e interacción interactiva
                        </CardDescription>
                    </div>
                </div>
                <Link href="/dashboard/admin/crm/leads" className="text-slate-400 hover:text-fuchsia-600 transition-colors bg-slate-50 hover:bg-fuchsia-50 p-2 rounded-full shadow-sm">
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </CardHeader>
            <CardContent className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-[280px] w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                {COLORS.map((color, index) => (
                                    <linearGradient key={`grad-${index}`} id={`colorGrad${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={1} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0.7} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                activeShape={renderActiveShape}
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={6}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                animationDuration={1000}
                                stroke="none"
                                cornerRadius={6}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#colorGrad${index % COLORS.length})`} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ ...CRM_TOOLTIP_STYLE, borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}
                                itemStyle={{ fontWeight: 700, fontSize: '13px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                    {data.map((entry, i) => (
                        <div
                            key={entry.name}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer border ${activeIndex === i ? 'bg-slate-50 border-slate-200/60 shadow-sm shadow-slate-200/30' : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                            onMouseEnter={() => setActiveIndex(i)}
                        >
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold text-slate-600 truncate">{entry.name}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
