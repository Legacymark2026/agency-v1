"use client";

import React, { useState } from "react";
import { generatePilaCsv, generateBankDispersalTxt, calculatePilaContributions } from "@/lib/payroll-pila-export";
import { Download, FileText, Landmark, Clock, Calculator, ShieldCheck, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function PayrollPilaCalculator() {
    const [selectedTab, setSelectedTab] = useState<"pila" | "extra_hours" | "severance">("pila");

    // Extra Hours State
    const [baseSalary, setBaseSalary] = useState(2000000);
    const [diurnalExtraHours, setDiurnalExtraHours] = useState(5);
    const [nocturnalExtraHours, setNocturnalExtraHours] = useState(2);
    const [sundayExtraHours, setSundayExtraHours] = useState(0);

    // Hourly Rate Calculation (240 hrs / month standard CST)
    const hourlyRate = baseSalary / 240;
    const diurnalCost = diurnalExtraHours * (hourlyRate * 1.25);
    const nocturnalCost = nocturnalExtraHours * (hourlyRate * 1.75);
    const sundayCost = sundayExtraHours * (hourlyRate * 2.00);
    const totalExtraHoursCost = diurnalCost + nocturnalCost + sundayCost;

    // Social Benefits State (Cesantías, Intereses, Prima, Vacaciones)
    const [workedDaysYear, setWorkedDaysYear] = useState(360);
    const cesantiasEst = (baseSalary * workedDaysYear) / 360;
    const interesesCesantiasEst = (cesantiasEst * workedDaysYear * 0.12) / 360;
    const primaServiciosEst = (baseSalary * 180) / 360; // Semestral
    const vacacionesEst = (baseSalary * workedDaysYear) / 720;
    const totalPrestaciones = cesantiasEst + interesesCesantiasEst + primaServiciosEst + vacacionesEst;

    const sampleEmployees = [
        { id: "1", documentType: "CC", documentNumber: "1007306770", firstName: "HEYBER", lastName: "FLOREZ", baseSalary: 2000000, workedDays: 30, epsName: "EPS Sura", afpName: "Porvenir", arlName: "ARL Sura", riskLevel: 1, bankName: "Bancolombia", bankAccountType: "AHORROS", bankAccount: "03149819284" },
        { id: "2", documentType: "CC", documentNumber: "5493509", firstName: "ENRIQUE", lastName: "BOHORQUEZ", baseSalary: 3500000, workedDays: 30, epsName: "Sanitas", afpName: "Proteccion", arlName: "Positiva", riskLevel: 2, bankName: "Davivienda", bankAccountType: "AHORROS", bankAccount: "4820194819" },
    ];

    const handleDownloadPilaCsv = () => {
        const csvContent = generatePilaCsv(sampleEmployees);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Planilla_PILA_Operadores_${new Date().toISOString().substring(0, 7)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Archivo de Planilla PILA exportado correctamente");
    };

    const handleDownloadBankTxt = () => {
        const txtContent = generateBankDispersalTxt(sampleEmployees);
        const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Dispersion_Bancaria_ACH_PAB_${new Date().toISOString().substring(0, 7)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Archivo de Dispersión Bancaria PAB / ACH exportado correctamente");
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Centro de Liquidación Avanzada de Nómina & PILA 🇨🇴
                        </h3>
                        <p className="text-xs text-slate-400">
                            Generación de Planillas PILA, Dispersión Bancaria ACH, Horas Extras (CST) y Liquidador de Prestaciones Sociales.
                        </p>
                    </div>
                </div>

                <div className="flex gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
                    <button
                        onClick={() => setSelectedTab("pila")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedTab === "pila" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <ShieldCheck className="w-3.5 h-3.5" /> Planilla PILA & Bancos
                    </button>
                    <button
                        onClick={() => setSelectedTab("extra_hours")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedTab === "extra_hours" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" /> Horas Extras & Recargos
                    </button>
                    <button
                        onClick={() => setSelectedTab("severance")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedTab === "severance" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Landmark className="w-3.5 h-3.5" /> Prestaciones Sociales
                    </button>
                </div>
            </div>

            {/* TAB 1: PLANILLA PILA & DISPERSIÓN BANCARIA */}
            {selectedTab === "pila" && (
                <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-4 h-4 text-teal-400" /> Exportar Planilla PILA (SOI, MiPlanilla, Aportes en Línea)
                            </h4>
                            <p className="text-slate-400 text-xs">
                                Genera el archivo plano codificado con aportes a EPS (12.5%), Pensiones (16%), ARL (Riesgo 1-5), Caja (4%), SENA (2%) e ICBF (3%).
                            </p>
                            <button
                                onClick={handleDownloadPilaCsv}
                                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
                            >
                                <Download className="w-4 h-4" /> Exportar Archivo PILA (.CSV)
                            </button>
                        </div>

                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                                <Landmark className="w-4 h-4 text-indigo-400" /> Dispersión Masiva Bancaria (Bancolombia PAB / ACH)
                            </h4>
                            <p className="text-slate-400 text-xs">
                                Exporta la estructura estandarizada de pago directo a cuentas de Ahorro/Corriente/Daviplata para nómina de 50+ empleados.
                            </p>
                            <button
                                onClick={handleDownloadBankTxt}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                            >
                                <FileText className="w-4 h-4" /> Exportar Plano Bancario (.TXT ACH)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: CALCULADORA DE HORAS EXTRAS Y RECARGOS (CST) */}
            {selectedTab === "extra_hours" && (
                <div className="space-y-6 text-xs">
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <h4 className="font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Liquidador de Horas Extras y Recargos (Art. 168 CST)
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Salario Básico Mensual ($)</label>
                                <input
                                    type="number" step="50000"
                                    value={baseSalary} onChange={(e) => setBaseSalary(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Horas Extras Diurnas (1.25x)</label>
                                <input
                                    type="number" min="0"
                                    value={diurnalExtraHours} onChange={(e) => setDiurnalExtraHours(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Horas Extras Nocturnas (1.75x)</label>
                                <input
                                    type="number" min="0"
                                    value={nocturnalExtraHours} onChange={(e) => setNocturnalExtraHours(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Dominicales / Festivas (2.00x)</label>
                                <input
                                    type="number" min="0"
                                    value={sundayExtraHours} onChange={(e) => setSundayExtraHours(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
                            <div>
                                <span className="text-[10px] text-slate-400 block font-sans">Valor Hora Ordinaria (240h)</span>
                                <span className="font-bold text-white">${hourlyRate.toFixed(2)} COP</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block font-sans">Total Recargos a Pagar</span>
                                <span className="font-bold text-emerald-400">${totalExtraHoursCost.toLocaleString("es-CO")} COP</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block font-sans">Salario Total + Extras</span>
                                <span className="font-bold text-teal-300">${(baseSalary + totalExtraHoursCost).toLocaleString("es-CO")} COP</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: PRESTACIONES SOCIALES */}
            {selectedTab === "severance" && (
                <div className="space-y-6 text-xs">
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <h4 className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Landmark className="w-4 h-4" /> Liquidador de Prestaciones Sociales Anuales
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Salario Básico Base ($)</label>
                                <input
                                    type="number" step="50000"
                                    value={baseSalary} onChange={(e) => setBaseSalary(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">Días Trabajados en el Año</label>
                                <input
                                    type="number" min="1" max="360"
                                    value={workedDaysYear} onChange={(e) => setWorkedDaysYear(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono pt-2">
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-sans">Cesantías (1 Mes)</span>
                                <span className="font-bold text-white">${cesantiasEst.toLocaleString("es-CO")}</span>
                            </div>
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-sans">Intereses Cesantías (12%)</span>
                                <span className="font-bold text-teal-300">${interesesCesantiasEst.toLocaleString("es-CO")}</span>
                            </div>
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-sans">Prima de Servicios</span>
                                <span className="font-bold text-indigo-300">${primaServiciosEst.toLocaleString("es-CO")}</span>
                            </div>
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 block font-sans">Vacaciones (15 Días)</span>
                                <span className="font-bold text-amber-300">${vacacionesEst.toLocaleString("es-CO")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
