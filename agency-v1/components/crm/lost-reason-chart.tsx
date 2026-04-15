"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { CRM_TOOLTIP_STYLE, chartConfig, CRM_CHART_COLORS } from "@/lib/crm-charts-config";
import { ArrowUpRight } from "lucide-react";

interface LostReason {
    reason: string;
    count: number;
}

interface LostReasonChartProps {
    data: LostReason[];
}

export function LostReasonChart({ data }: LostReasonChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="col-span-4 transition-all hover:shadow-md">
                <CardHeader>
                    <CardTitle>Razones de Pérdida</CardTitle>
                    <CardDescription>No hay deals perdidos con razones registradas.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="col-span-4 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Razones de Pérdida</CardTitle>
                    <CardDescription>Análisis de deals cerrados como perdidos</CardDescription>
                </div>
                <Link href="/dashboard/admin/crm/pipeline?stage=LOST" className="text-muted-foreground hover:text-primary transition-colors">
                    <ArrowUpRight className="h-5 w-5" />
                </Link>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="reason"
                                type="category"
                                {...chartConfig.yAxis}
                                width={100}
                            />
                            <Tooltip contentStyle={CRM_TOOLTIP_STYLE} />
                            <Bar
                                dataKey="count"
                                fill={CRM_CHART_COLORS.danger}
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
