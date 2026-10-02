"use client";

import React, { useState, useEffect } from "react";
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { 
    Plus, DollarSign, Filter, Download, Briefcase, TrendingUp, Search, Activity
} from "lucide-react";

export default function CostAccountingPage() {
    const [costData, setCostData] = useState({
        fixed: 12500000,
        variable: 8400000,
        cif: 3200000
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    const dataPie = [
        { name: "Costos Fijos", value: costData.fixed, color: "#14b8a6" },     // Teal
        { name: "Costos Variables", value: costData.variable, color: "#f43f5e" }, // Rose
        { name: "CIF", value: costData.cif, color: "#8b5cf6" },               // Violet
    ];

    const dataBar = [
        { name: "Ene", fijos: 12000000, variables: 7500000, cif: 3000000 },
        { name: "Feb", fijos: 12000000, variables: 8100000, cif: 3100000 },
        { name: "Mar", fijos: 12500000, variables: 8400000, cif: 3200000 },
    ];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Activity className="text-emerald-500" />
                        Contabilidad de Costos (Enterprise)
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Control de Costos Fijos, Variables y CIF. Analítica para rentabilidad.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-all text-sm font-medium flex items-center gap-2">
                        <Download size={16} /> Exportar Reporte
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} /> Registrar Costo
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Costos Fijos</p>
                            <h3 className="text-2xl font-bold text-slate-100 mt-2">
                                ${costData.fixed.toLocaleString("es-CO")}
                            </h3>
                        </div>
                        <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                            <Briefcase size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Arriendos, nómina base, software.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Costos Variables</p>
                            <h3 className="text-2xl font-bold text-slate-100 mt-2">
                                ${costData.variable.toLocaleString("es-CO")}
                            </h3>
                        </div>
                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Comisiones, MPD, viáticos operacionales.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">CIF</p>
                            <h3 className="text-2xl font-bold text-slate-100 mt-2">
                                ${costData.cif.toLocaleString("es-CO")}
                            </h3>
                        </div>
                        <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Servicios públicos, depreciación, insumos.</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 col-span-1 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribución de Costos</h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataPie}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dataPie.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => `$${value.toLocaleString('es-CO')}`}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 col-span-1 lg:col-span-2 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Tendencia Histórica Q1</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataBar} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} />
                                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} tickFormatter={(value) => `$${(value/1000000)}M`} />
                                <Tooltip 
                                    formatter={(value: number) => `$${value.toLocaleString('es-CO')}`}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                    cursor={{fill: '#1e293b'}}
                                />
                                <Legend />
                                <Bar dataKey="fijos" name="C. Fijos" stackId="a" fill="#14b8a6" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="variables" name="C. Variables" stackId="a" fill="#f43f5e" />
                                <Bar dataKey="cif" name="CIF" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Modal for Cost Registration */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-100">Registrar Causación de Costo</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Concepto / Título</label>
                                <input type="text" placeholder="Ej: Pago arriendo abril" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Monto (COP)</label>
                                    <input type="number" placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Costo</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500">
                                        <option value="FIXED">Costo Fijo</option>
                                        <option value="VARIABLE">Costo Variable</option>
                                        <option value="CIF">Costos Indirectos (CIF)</option>
                                        <option value="MOD">Mano de Obra Directa</option>
                                        <option value="MPD">Materia Prima Directa</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Centro de Costos (C.C)</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500">
                                    <option value="">Seleccione Centro de Costo...</option>
                                    <option value="CC-PROD">CC-PROD (Producción y Servidores)</option>
                                    <option value="CC-VENT">CC-VENT (Fuerza Comercial)</option>
                                    <option value="CC-ADM">CC-ADM (Administrativo)</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20" />
                                    <span className="text-sm text-slate-300">Costo Deducible de Impuestos (Art 107 ET)</span>
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-slate-800 transition-all text-sm font-medium">
                                Cancelar
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all text-sm font-medium shadow-lg shadow-emerald-500/20">
                                Guardar Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
