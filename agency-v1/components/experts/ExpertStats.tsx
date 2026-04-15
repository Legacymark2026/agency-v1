"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, EyeOff, Activity } from "lucide-react";

interface ExpertStatsProps {
    total: number;
    active: number;
    hidden: number;
}

export function ExpertStats({ total, active, hidden }: ExpertStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Experts</CardTitle>
                    <Users className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-100">{total}</div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">
                        Total members in DB
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Active (Visible)</CardTitle>
                    <Eye className="h-4 w-4 text-teal-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-100">{active}</div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">
                        Live on "About Us"
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Hidden</CardTitle>
                    <EyeOff className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-100">{hidden}</div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">
                        Drafts or inactive
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Team Health</CardTitle>
                    <Activity className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-100">100%</div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">
                        System operational
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
