"use client";

import { DollarSign, Globe, Hash, Clock, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { updateCompanyDefaultSettings } from "@/app/actions/settings";

export function DefaultCompanySettings({ initialData }: { initialData?: any }) {
    const [currency, setCurrency] = useState(initialData?.currency || "USD");
    const [timezone, setTimezone] = useState(initialData?.timezone || "America/Bogota");
    const [dateFormat, setDateFormat] = useState(initialData?.dateFormat || "DD/MM/YYYY");
    const [language, setLanguage] = useState(initialData?.language || "es");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Guardando configuraciones por defecto...");

        const result = await updateCompanyDefaultSettings({
            currency,
            timezone,
            dateFormat,
            language
        });

        if (result.success) {
            toast.success("Ajustes globales guardados correctamente.", { id: toastId });
        } else {
            toast.error(result.error || "Ocurrió un grave error al guardar", { id: toastId });
        }
        setIsSaving(false);
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-400" />
                        Configuración Regional Pordefecto
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Establece las preferencias predeterminadas que aplicarán para los nuevos miembros del equipo globalmente.
                    </p>
                </div>
                <Button disabled={isSaving} onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                    {isSaving ? "Guardando..." : "Guardar Ajustes"}
                </Button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 gap-y-10">
                {/* Moneda */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" /> Moneda Base
                    </label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                        <option value="USD">USD ($) - Dólar Estadounidense</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="MXN">MXN ($) - Peso Mexicano</option>
                        <option value="COP">COP ($) - Peso Colombiano</option>
                    </select>
                </div>

                {/* Zona Horaria */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                        <Map className="w-4 h-4 text-slate-400" /> Zona Horaria Central
                    </label>
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                        <option value="America/Bogota">(GMT-05:00) Bogotá, Lima, Quito</option>
                        <option value="America/Mexico_City">(GMT-06:00) Ciudad de México</option>
                        <option value="America/New_York">(GMT-05:00) Eastern Time (US & Canada)</option>
                        <option value="Europe/Madrid">(GMT+01:00) Madrid, París</option>
                    </select>
                </div>

                {/* Formato de Fecha */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" /> Formato de Fecha
                    </label>
                    <select
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Ej: 31/12/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (Ej: 12/31/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (Ej: 2026-12-31)</option>
                    </select>
                </div>

                {/* Idioma por defecto */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-400" /> Idioma del Workspace
                    </label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                        <option value="es">Español (América Latina)</option>
                        <option value="en">English (US)</option>
                        <option value="pt">Português (Brasil)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
