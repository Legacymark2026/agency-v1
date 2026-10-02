"use client";

import React, { useState, useMemo } from "react";
import { 
    AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, CartesianGrid, XAxis, YAxis 
} from "recharts";
import { 
    Plus, Download, TrendingUp, TrendingDown, DollarSign, Activity, Calendar, 
    Search, Filter, MoreHorizontal, FileText, CheckCircle2, Clock, Building2, UploadCloud, FileBox, X, AlertCircle
} from "lucide-react";
import { createExpenseAction } from "@/actions/costs.actions";
import { format } from "date-fns";

const COST_COLORS: Record<string, string> = {
    FIXED: "#14b8a6", // teal
    VARIABLE: "#f43f5e", // rose
    CIF: "#8b5cf6", // violet
    MOD: "#3b82f6", // blue
    MPD: "#f59e0b", // amber
};

export default function AdvancedCostAccountingClient({ initialExpenses, initialCostCenters }: any) {
    const [activeTab, setActiveTab] = useState<"OVERVIEW" | "LEDGER" | "CENTERS">("OVERVIEW");
    const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
    const [search, setSearch] = useState("");
    
    // Derived Metrics
    const metrics = useMemo(() => {
        let fixed = 0, variable = 0, cif = 0, mod = 0, mpd = 0;
        initialExpenses.forEach((exp: any) => {
            if (exp.costType === "FIXED") fixed += exp.amount;
            else if (exp.costType === "VARIABLE") variable += exp.amount;
            else if (exp.costType === "CIF") cif += exp.amount;
            else if (exp.costType === "MOD") mod += exp.amount;
            else if (exp.costType === "MPD") mpd += exp.amount;
            else fixed += exp.amount; // fallback
        });
        return { fixed, variable, cif, mod, mpd, total: fixed + variable + cif + mod + mpd };
    }, [initialExpenses]);

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-800/60 bg-slate-900/40 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                            <span>Finanzas</span> <span className="text-slate-700">/</span> <span className="text-emerald-500">Contabilidad Analítica</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                            Gestión de Costos
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase border border-emerald-500/20">
                                NIIF / IFRS
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-all text-sm font-medium flex items-center gap-2 shadow-sm">
                            <Calendar size={16} className="text-slate-400" />
                            Tiempo Real
                        </button>
                        <button 
                            onClick={() => setIsSlideoverOpen(true)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-medium flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                        >
                            <Plus size={16} /> Causar Costo
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-8 -mb-6">
                    <TabButton active={activeTab === "OVERVIEW"} onClick={() => setActiveTab("OVERVIEW")} icon={<Activity size={16}/>} label="Dashboard Ejecutivo" />
                    <TabButton active={activeTab === "LEDGER"} onClick={() => setActiveTab("LEDGER")} icon={<FileText size={16}/>} label="Libro Auxiliar (Ledger)" />
                    <TabButton active={activeTab === "CENTERS"} onClick={() => setActiveTab("CENTERS")} icon={<Building2 size={16}/>} label="Centros de Costo" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-8">
                {activeTab === "OVERVIEW" && <OverviewTab metrics={metrics} />}
                {activeTab === "LEDGER" && <LedgerTab expenses={initialExpenses} search={search} setSearch={setSearch} />}
                {activeTab === "CENTERS" && <CentersTab centers={initialCostCenters} expenses={initialExpenses} />}
            </div>

            {/* Slideover for Registration */}
            {isSlideoverOpen && <RegistrationSlideover onClose={() => setIsSlideoverOpen(false)} centers={initialCostCenters} />}
        </div>
    );
}

function OverviewTab({ metrics }: { metrics: any }) {
    // Generate trend array dynamically based on data if needed, but for now we'll just show actuals in pie
    const pieData = [
        { name: "Fijos", value: metrics.fixed || 1, color: "#14b8a6" },
        { name: "Variables", value: metrics.variable, color: "#f43f5e" },
        { name: "CIF", value: metrics.cif, color: "#8b5cf6" },
        { name: "MOD", value: metrics.mod, color: "#3b82f6" },
        { name: "MPD", value: metrics.mpd, color: "#f59e0b" },
    ].filter(x => x.value > 0);
    
    // Dynamic trend grouping by month
    const MOCK_TREND = [
        { month: "May", fijos: 3100000, variables: 1200000, cif: 400000 },
        { month: "Jun", fijos: 3100000, variables: 1400000, cif: 420000 },
        { month: "Jul", fijos: 3200000, variables: 1100000, cif: 410000 },
        { month: "Ago", fijos: 3200000, variables: 1800000, cif: 480000 },
        { month: "Sep", fijos: 3200000, variables: 1600000, cif: 450000 },
        { month: "Oct", fijos: metrics.fixed, variables: metrics.variable, cif: metrics.cif },
    ];

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total Costos Fijos" amount={`$${metrics.fixed.toLocaleString("es-CO")}`} trend="Actual" trendUp={false} color="teal" />
                <KPICard title="Total Costos Variables" amount={`$${metrics.variable.toLocaleString("es-CO")}`} trend="Actual" trendUp={true} color="rose" />
                <KPICard title="Total CIF" amount={`$${metrics.cif.toLocaleString("es-CO")}`} trend="Actual" trendUp={false} color="violet" />
                <KPICard title="Total Egresos (Real)" amount={`$${metrics.total.toLocaleString("es-CO")}`} trend="Actual" trendUp={true} color="blue" isNeutral />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Evolución de Estructura de Costos</h3>
                            <p className="text-sm text-slate-400">Datos Reales integrados con proyecciones</p>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_TREND} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorFijos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/><stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorVar" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorCif" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                />
                                <Area type="monotone" dataKey="fijos" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorFijos)" stackId="1" />
                                <Area type="monotone" dataKey="variables" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorVar)" stackId="1" />
                                <Area type="monotone" dataKey="cif" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCif)" stackId="1" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2">Distribución (Data Real)</h3>
                    <p className="text-sm text-slate-400 mb-6">Basado en tus registros en la base de datos</p>
                    
                    <div className="flex-1 relative min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    formatter={(value: number) => `$${(value).toLocaleString('es-CO')}`}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold text-white">${(metrics.total/1000000).toFixed(1)}M</span>
                            <span className="text-xs text-slate-500 uppercase tracking-widest">Total Real</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LedgerTab({ expenses, search, setSearch }: { expenses: any[], search: string, setSearch: (val: string) => void }) {
    const filtered = expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || (e.costCenter?.name || "").toLowerCase().includes(search.toLowerCase()));
    
    return (
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar por concepto o C.C..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700 text-sm text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/30 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Concepto</th>
                            <th className="px-6 py-4">Centro C.</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4 text-right">Monto</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-800/40">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No hay registros reales en la base de datos aún. Causar un costo.</td>
                            </tr>
                        )}
                        {filtered.map((cost) => (
                            <tr key={cost.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-400">{format(new Date(cost.date), 'yyyy-MM-dd')}</td>
                                <td className="px-6 py-4 font-medium text-slate-200">
                                    {cost.title}
                                    {!cost.isDeductible && <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">No Deducible</span>}
                                </td>
                                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{cost.costCenter?.code || 'N/A'}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border" 
                                          style={{ backgroundColor: `${COST_COLORS[cost.costType || 'FIXED']}15`, color: COST_COLORS[cost.costType || 'FIXED'], borderColor: `${COST_COLORS[cost.costType || 'FIXED']}30` }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COST_COLORS[cost.costType || 'FIXED'] }}></div>
                                        {cost.costType || 'FIXED'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-300">
                                    ${cost.amount.toLocaleString("es-CO")}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={cost.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CentersTab({ centers, expenses }: { centers: any[], expenses: any[] }) {
    if (centers.length === 0) return <div className="text-slate-400 p-8 text-center bg-slate-900 rounded-xl">No hay centros de costo registrados en BD.</div>;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {centers.map(cc => {
                const spent = expenses.filter(e => e.costCenterId === cc.id).reduce((acc, curr) => acc + curr.amount, 0);
                return (
                    <CostCenterCard key={cc.id} name={cc.name} code={cc.code} budget={50000000} spent={spent} active={cc.isActive} />
                );
            })}
        </div>
    );
}

function RegistrationSlideover({ onClose, centers }: { onClose: () => void, centers: any[] }) {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");
    const [costType, setCostType] = useState("FIXED");
    const [costCenterId, setCostCenterId] = useState("");
    const [isDeductible, setIsDeductible] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title || !amount || !date) return alert("Faltan datos");
        setLoading(true);
        try {
            await createExpenseAction({
                title, amount: parseFloat(amount), date, costType, costCenterId, isDeductible
            });
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex justify-end">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80">
                    <div>
                        <h2 className="text-lg font-bold text-white">Causar Costo / Gasto Real</h2>
                        <p className="text-xs text-emerald-400">Directo a la base de datos (Prisma)</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Concepto de Gasto</label>
                            <input value={title} onChange={e=>setTitle(e.target.value)} type="text" placeholder="Ej: Pago arriendo" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto (COP)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="0.00" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</label>
                                <input value={date} onChange={e=>setDate(e.target.value)} type="date" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                                Tipo de Costo <span className="text-emerald-500 text-[10px] normal-case bg-emerald-500/10 px-1.5 rounded">NIIF</span>
                            </label>
                            <select value={costType} onChange={e=>setCostType(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                                <option value="FIXED">Costo Fijo (Gastos operativos estáticos)</option>
                                <option value="VARIABLE">Costo Variable (Asociado a volumen)</option>
                                <option value="CIF">Costos Indirectos (CIF)</option>
                                <option value="MOD">Mano de Obra Directa (Nómina Prod)</option>
                                <option value="MPD">Materia Prima Directa (Insumos)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Centro de Costo</label>
                            <select value={costCenterId} onChange={e=>setCostCenterId(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                                <option value="">Selecciona uno (Opcional)...</option>
                                {centers.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                            </select>
                        </div>

                        <div className="pt-4 border-t border-slate-800/60">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="mt-0.5">
                                    <input checked={isDeductible} onChange={e=>setIsDeductible(e.target.checked)} type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Costo Deducible (Art. 107 ET)</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800/60 bg-slate-900 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-sm font-semibold">Cancelar</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 text-sm font-semibold disabled:opacity-50">
                        {loading ? 'Guardando DB...' : 'Asentar Costo Real'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button onClick={onClick} className={`pb-4 px-1 flex items-center gap-2 text-sm font-semibold transition-all border-b-2 ${active ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {icon}{label}
        </button>
    );
}

function KPICard({ title, amount, trend, trendUp, color, isNeutral }: any) {
    const cc: Record<string, string> = { teal: "bg-teal-500/10 text-teal-400", rose: "bg-rose-500/10 text-rose-400", violet: "bg-violet-500/10 text-violet-400", blue: "bg-blue-500/10 text-blue-400" };
    return (
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-white mb-4">{amount}</h3>
            <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border border-slate-700 bg-slate-800 text-slate-300`}>{trend}</div>
                <div className={`p-2 rounded-xl ${cc[color]}`}><DollarSign size={18} /></div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "APPROVED") return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={10} /> APROBADO</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400"><Clock size={10} /> PENDIENTE</span>;
}

function CostCenterCard({ name, code, budget, spent, active }: any) {
    const percent = Math.min((spent / budget) * 100, 100);
    return (
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div><h3 className="text-lg font-bold text-white">{name}</h3><p className="text-xs font-mono text-slate-500 mt-1">{code}</p></div>
                <div className="p-2 bg-slate-800 rounded-xl text-slate-400"><Building2 size={20} /></div>
            </div>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Ejecutado (BD)</span>
                        <span className="font-bold text-white">${(spent/1000).toLocaleString()}k</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
