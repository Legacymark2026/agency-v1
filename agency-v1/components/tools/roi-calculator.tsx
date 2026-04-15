"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export function RoiCalculator() {
    const [hoursPerWeek, setHoursPerWeek] = useState(10);
    const [employees, setEmployees] = useState(2);
    const [hourlyRate, setHourlyRate] = useState(25);

    const calculations = useMemo(() => {
        const weeklyHoursSaved = hoursPerWeek * employees;
        const monthlyHoursSaved = weeklyHoursSaved * 4;
        const yearlyHoursSaved = weeklyHoursSaved * 52;

        const monthlySavings = monthlyHoursSaved * hourlyRate;
        const yearlySavings = yearlyHoursSaved * hourlyRate;

        return {
            monthlySavings,
            yearlySavings,
            yearlyHoursSaved
        };
    }, [hoursPerWeek, employees, hourlyRate]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <section id="calculator" className="py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Calculadora de ROI</p>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Cuánto dinero estás perdiendo en tareas manuales?</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Descubre el impacto financiero de automatizar tus procesos repetitivos.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {/* Inputs */}
                    <Card className="border-gray-200 shadow-lg">
                        <CardHeader>
                            <CardTitle>Configura tu Escenario</CardTitle>
                            <CardDescription>Ajusta los valores según la realidad de tu empresa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        <Clock size={18} className="text-blue-600" />
                                        Horas manuales por semana (por persona)
                                    </Label>
                                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                                        {hoursPerWeek}h
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="40"
                                    step="1"
                                    value={hoursPerWeek}
                                    onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <p className="text-xs text-gray-500">Ej: Entrada de datos, enviar emails, reportes.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-semibold flex items-center gap-2">
                                        <Users size={16} className="text-blue-600" />
                                        Empleados
                                    </Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={employees}
                                        onChange={(e) => setEmployees(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold flex items-center gap-2">
                                        <DollarSign size={16} className="text-blue-600" />
                                        Costo Hora ($)
                                    </Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    <div className="space-y-6">
                        <Card className="bg-blue-900 text-white border-blue-800 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none" />
                            <CardHeader>
                                <CardTitle className="text-blue-100">Ahorro Potencial Estimado</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8 relative z-10">
                                <div>
                                    <p className="text-blue-300 text-sm font-medium mb-1">Ahorro Anual</p>
                                    <p className="text-5xl font-bold tracking-tight text-white">
                                        {formatCurrency(calculations.yearlySavings)}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-blue-800/50">
                                    <div>
                                        <p className="text-blue-300 text-sm font-medium mb-1">Ahorro Mensual</p>
                                        <p className="text-2xl font-bold text-white">
                                            {formatCurrency(calculations.monthlySavings)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-blue-300 text-sm font-medium mb-1">Horas Recuperadas / Año</p>
                                        <p className="text-2xl font-bold text-white flex items-center gap-2">
                                            {calculations.yearlyHoursSaved.toLocaleString()} h
                                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">
                                                ≈ {Math.round(calculations.yearlyHoursSaved / 8)} días
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">¿Qué harías con {calculations.yearlyHoursSaved.toLocaleString()} horas extra?</h3>
                            <ul className="space-y-2 mb-6 text-gray-600">
                                <li className="flex items-center gap-2">✅ Enfocarte en estrategia y crecimiento</li>
                                <li className="flex items-center gap-2">✅ Mejorar la atención al cliente</li>
                                <li className="flex items-center gap-2">✅ Reducir el burnout de tu equipo</li>
                            </ul>
                            <Link href={`/contacto?subject=Consulta%20ROI%20Automatizacion&savings=${Math.round(calculations.yearlySavings)}&hours=${Math.round(calculations.yearlyHoursSaved)}`}>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 shadow-md hover:shadow-lg transition-all group">
                                    Empieza a Ahorrar Hoy
                                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
