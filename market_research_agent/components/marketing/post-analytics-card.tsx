"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, ThumbsUp, MessageCircle, Share2, TrendingUp, Link2 } from "lucide-react";

const mockData = [
  { name: 'Día 1', views: 400, engagement: 24 },
  { name: 'Día 2', views: 800, engagement: 139 },
  { name: 'Día 3', views: 1200, engagement: 980 },
  { name: 'Día 4', views: 2780, engagement: 1908 },
  { name: 'Día 5', views: 3890, engagement: 2800 },
];

export function PostAnalyticsCard({ postId, platform }: { postId: string, platform?: string }) {
    // Aquí iría el fetching real de las analíticas si tuviéramos la API conectada
    // const { data, isLoading } = usePostAnalytics(postId);

    return (
        <div className="space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricBox icon={<Eye className="w-4 h-4 text-emerald-400" />} label="Impresiones" value="3.8k" trend="+12%" />
                <MetricBox icon={<ThumbsUp className="w-4 h-4 text-blue-400" />} label="Me Gusta" value="842" trend="+5%" />
                <MetricBox icon={<MessageCircle className="w-4 h-4 text-purple-400" />} label="Comentarios" value="124" trend="+2%" />
                <MetricBox icon={<Link2 className="w-4 h-4 text-amber-400" />} label="Clics (CTR)" value="4.2%" trend="+0.5%" />
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-teal-400" /> Rendimiento a 5 Días
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-mono">Engagement curve for {platform || "todas las redes"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricBox({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col items-start justify-center relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 {/* Icon SVG duplicate scaled up */}
                 <div className="transform scale-[4] rotate-12">{icon}</div>
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
                <div className="bg-slate-950 p-1.5 rounded-md border border-slate-800">
                    {icon}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
            </div>
            <div className="flex items-end gap-2 relative z-10">
                <span className="text-2xl font-bold text-white leading-none">{value}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded leading-none mb-0.5">{trend}</span>
            </div>
        </div>
    );
}
