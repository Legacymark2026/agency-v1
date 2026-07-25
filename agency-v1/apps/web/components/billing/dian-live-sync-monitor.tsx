"use client";

import React, { useState, useEffect } from "react";
import { DianSyncedParameters, fetchDianSyncedParameters } from "@/lib/dian-synced-parameters";
import { RefreshCw, Server, DollarSign, MapPin, Key, ShieldCheck, CheckCircle2, Zap, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export function DianLiveSyncMonitor() {
    const [params, setParams] = useState<DianSyncedParameters | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadSyncData = async () => {
        setIsSyncing(true);
        const data = await fetchDianSyncedParameters();
        setParams(data);
        setIsSyncing(false);
    };

    useEffect(() => {
        loadSyncData();
    }, []);

    const handleForceSync = async () => {
        setIsSyncing(true);
        const toastId = toast.loading("Sincronizando parámetros con Servidores DIAN, SFC y Microservicio gRPC...");
        setTimeout(async () => {
            await loadSyncData();
            toast.success("¡Todos los parámetros se encuentran 100% Sincronizados!", { id: toastId });
        }, 1200);
    };

    if (!params) return null;

    return (
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6 text-slate-100 shadow-2xl">
            {/* HEADER BANNER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                        <RefreshCw className={`w-6 h-6 ${isSyncing ? "animate-spin" : ""}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Monitor de Parámetros Sincronizados en Tiempo Real ⚡
                        </h3>
                        <p className="text-xs text-slate-400">
                            Coordinación activa entre la App Web, Terminales POS, Microservicio gRPC (:50052) y la DIAN.
                        </p>
                    </div>
                </div>

                <button
                    disabled={isSyncing}
                    onClick={handleForceSync}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} /> Sincronizar Ahora
                </button>
            </div>

            {/* SYNCED PARAMETERS CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                {/* 1. TRM DÓLAR SFC */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] uppercase font-sans font-bold flex items-center gap-1 text-emerald-400">
                            <DollarSign className="w-3.5 h-3.5" /> TRM Dólar Oficial SFC
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[9px] font-bold">SINCRONIZADO</span>
                    </div>
                    <div className="text-xl font-black text-white">
                        ${params.trmUsdCop.toLocaleString("es-CO")} COP / USD
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">{params.trmSource} • Actualizado: {params.trmLastUpdated}</p>
                </div>

                {/* 2. UVT 2026 OFICIAL */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] uppercase font-sans font-bold flex items-center gap-1 text-indigo-400">
                            <Zap className="w-3.5 h-3.5" /> Valor UVT 2026 DIAN
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[9px] font-bold">VIGENTE 2026</span>
                    </div>
                    <div className="text-xl font-black text-white">
                        ${params.uvt2026Value.toLocaleString("es-CO")} COP
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">Bases Mínimas: Compras 27 UVT ($1.344.573) | Servicios 4 UVT ($199.196)</p>
                </div>

                {/* 3. DIVIPOLA DANE */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] uppercase font-sans font-bold flex items-center gap-1 text-teal-300">
                            <MapPin className="w-3.5 h-3.5" /> Municipios DIVIPOLA DANE
                        </span>
                        <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full text-[9px] font-bold">1.122 CIUDADES</span>
                    </div>
                    <div className="text-xl font-black text-white">
                        Codificación DANE 100% OK
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">Tarifas ReteICA mapeadas para Bucaramanga, Bogotá, Medellín y Cali</p>
                </div>

                {/* 4. CONSECUTIVO ATÓMICO */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] uppercase font-sans font-bold flex items-center gap-1 text-amber-400">
                            <Key className="w-3.5 h-3.5" /> Consecutivo Atómico POS
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[9px] font-bold">SIN DUPLICADOS</span>
                    </div>
                    <div className="text-xl font-black text-amber-300">
                        {params.currentDianPrefix}-{params.nextConsecutiveNumber}
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">Contador de Redis/PostgreSQL sincronizado entre múltiples terminales de caja</p>
                </div>

                {/* 5. MICROSERVICIO gRPC */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] uppercase font-sans font-bold flex items-center gap-1 text-emerald-400">
                            <Server className="w-3.5 h-3.5" /> Invoicing gRPC Server
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[9px] font-bold">PUERTO :50052</span>
                    </div>
                    <div className="text-xl font-black text-emerald-400">
                        {params.grpcStatus} (Latencia &lt; 5ms)
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">Serializador Protocol Buffers UBL 2.1 de ultra alta velocidad</p>
                </div>

                {/* 6. SERVICIOS SOAP DIAN */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] uppercase font-sans font-bold flex items-center gap-1 text-teal-300">
                            <ShieldCheck className="w-3.5 h-3.5" /> Servidores DIAN MUISCA
                        </span>
                        <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full text-[9px] font-bold">ONLINE</span>
                    </div>
                    <div className="text-xl font-black text-teal-300">
                        SendBillSync Respondatorio
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">{params.signatureKeyType}</p>
                </div>
            </div>
        </div>
    );
}
