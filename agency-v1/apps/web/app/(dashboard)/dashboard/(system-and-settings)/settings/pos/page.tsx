"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag, Shield, Landmark, Settings, Save, AlertTriangle,
    CheckCircle2, Printer, Wifi, RefreshCw, Key, ShieldCheck,
    DollarSign, Users, Store, ArrowRight, ToggleLeft, ToggleRight,
    Sliders, Receipt, MonitorCheck
} from "lucide-react";

interface PosGovernanceConfig {
    // 1. Políticas de Arqueo y Cajas
    requireSupervisorApprovalForClose: boolean;
    requireSupervisorPinForDeleteCartItem: boolean;
    supervisorDefaultPin: string;
    maxCashDrawerDiscrepancy: number;
    allowMultiCashierPerRegister: boolean;
    autoLockInactiveMinutes: number;

    // 2. Hardware y Periféricos
    defaultReceiptFormat: "thermal_80mm" | "thermal_58mm" | "dian_a4";
    printerIpAddress: string;
    autoOpenDrawerOnCashSale: boolean;
    soundEffectsEnabled: boolean;

    // 3. DIAN y Reglas Fiscales
    defaultTaxRate: number;
    requireCustomerDocForTicket: boolean;
    dianResolutionPrefix: string;
    dianResolutionNumber: string;

    // 4. Catálogo y Políticas de Descuentos
    maxCashierDiscountPercent: number;
    enableWholesaleTierPrices: boolean;
    defaultBranchName: string;
}

const DEFAULT_CONFIG: PosGovernanceConfig = {
    requireSupervisorApprovalForClose: true,
    requireSupervisorPinForDeleteCartItem: true,
    supervisorDefaultPin: "1234",
    maxCashDrawerDiscrepancy: 10000,
    allowMultiCashierPerRegister: true,
    autoLockInactiveMinutes: 30,

    defaultReceiptFormat: "thermal_80mm",
    printerIpAddress: "192.168.1.200:9100",
    autoOpenDrawerOnCashSale: true,
    soundEffectsEnabled: true,

    defaultTaxRate: 19,
    requireCustomerDocForTicket: false,
    dianResolutionPrefix: "SETG",
    dianResolutionNumber: "18760000001",

    maxCashierDiscountPercent: 10,
    enableWholesaleTierPrices: true,
    defaultBranchName: "Sucursal Bucaramanga - Principal",
};

export default function PosSettingsPage() {
    const [config, setConfig] = useState<PosGovernanceConfig>(DEFAULT_CONFIG);
    const [activeTab, setActiveTab] = useState<"SECURITY_SHIFTS" | "HARDWARE" | "FISCAL_DIAN" | "REGISTERS">("SECURITY_SHIFTS");
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [registers, setRegisters] = useState<any[]>([]);
    const [loadingRegisters, setLoadingRegisters] = useState(false);

    useEffect(() => {
        // Cargar configuración guardada en localStorage / settings
        try {
            const saved = localStorage.getItem("LEGACYMARK_POS_GOVERNANCE_CONFIG");
            if (saved) {
                setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
            }
        } catch (e) {}

        fetchRegisters();
    }, []);

    const fetchRegisters = async () => {
        setLoadingRegisters(true);
        try {
            const res = await fetch("/api/pos/registers");
            if (res.ok) {
                const data = await res.json();
                setRegisters(data.registers || []);
            }
        } catch (e) {
            console.warn("Error cargando cajas:", e);
        } finally {
            setLoadingRegisters(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSavedSuccess(false);

        try {
            // Guardar localmente
            localStorage.setItem("LEGACYMARK_POS_GOVERNANCE_CONFIG", JSON.stringify(config));
            
            // Simular persistencia a API / Server Action de Settings
            await new Promise((res) => setTimeout(res, 600));

            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3500);
        } catch (err: any) {
            alert("Error guardando la configuración: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-16">
            {/* Header de Gobernanza del POS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            Organización & Gobernanza
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Terminal POS Enterprise
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-teal-400" />
                        Configuración de Terminal POS Enterprise
                    </h1>
                    <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                        Gobierna las reglas de control de turnos, arqueo de caja con visto bueno de supervisor, impresión térmica, resolución DIAN y periféricos del punto de venta.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/dashboard/pos"
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 text-xs font-bold transition-all flex items-center gap-2"
                    >
                        Abrir Terminal POS <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("SECURITY_SHIFTS")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "SECURITY_SHIFTS"
                            ? "border-teal-500 text-teal-400 bg-teal-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <ShieldCheck className="w-4 h-4" /> Gobernanza de Turnos & Cajas
                </button>
                <button
                    onClick={() => setActiveTab("HARDWARE")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "HARDWARE"
                            ? "border-teal-500 text-teal-400 bg-teal-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Printer className="w-4 h-4" /> Impresoras & Cajón Monedero
                </button>
                <button
                    onClick={() => setActiveTab("FISCAL_DIAN")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "FISCAL_DIAN"
                            ? "border-teal-500 text-teal-400 bg-teal-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Landmark className="w-4 h-4" /> Facturación DIAN & Parámetros
                </button>
                <button
                    onClick={() => setActiveTab("REGISTERS")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "REGISTERS"
                            ? "border-teal-500 text-teal-400 bg-teal-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Store className="w-4 h-4" /> Cajas Registradoras Activas ({registers.length})
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* SUBTAB 1: GOBERNANZA DE TURNOS & SUPERVISIÓN */}
                {activeTab === "SECURITY_SHIFTS" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Políticas de Control de Turno y Supervisión</h3>
                                    <p className="text-xs text-slate-400">Garantiza el arqueo ciego y la aprobación dual de supervisor en cierres de caja.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-200">Visto Bueno Obligatorio de Supervisor</label>
                                        <input
                                            type="checkbox"
                                            checked={config.requireSupervisorApprovalForClose}
                                            onChange={(e) => setConfig({ ...config, requireSupervisorApprovalForClose: e.target.checked })}
                                            className="w-4 h-4 accent-teal-500 rounded"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Si está activo, al cerrar el turno con descuadre el sistema exigirá la firma y validación del supervisor a cargo para finalizar el Cierre Z.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-200">PIN de Supervisor para Anular Artículos</label>
                                        <input
                                            type="checkbox"
                                            checked={config.requireSupervisorPinForDeleteCartItem}
                                            onChange={(e) => setConfig({ ...config, requireSupervisorPinForDeleteCartItem: e.target.checked })}
                                            className="w-4 h-4 accent-teal-500 rounded"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Solicita un PIN de seguridad cada vez que un cajero intente eliminar un artículo ya registrado en el carrito de compras.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">PIN Maestro de Supervisor</label>
                                    <div className="relative">
                                        <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                                        <input
                                            type="password"
                                            value={config.supervisorDefaultPin}
                                            onChange={(e) => setConfig({ ...config, supervisorDefaultPin: e.target.value })}
                                            maxLength={6}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500">PIN numérico de 4 a 6 dígitos para autorizaciones de caja.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">Tolerancia Máxima de Descuadre ($ COP)</label>
                                    <div className="relative">
                                        <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                                        <input
                                            type="number"
                                            value={config.maxCashDrawerDiscrepancy}
                                            onChange={(e) => setConfig({ ...config, maxCashDrawerDiscrepancy: Number(e.target.value) || 0 })}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500">Monto máximo de diferencia aceptado antes de encender alarma de descuadre.</p>
                                </div>

                                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-200">Operación Multi-Cajero en la Misma Caja</label>
                                        <input
                                            type="checkbox"
                                            checked={config.allowMultiCashierPerRegister}
                                            onChange={(e) => setConfig({ ...config, allowMultiCashierPerRegister: e.target.checked })}
                                            className="w-4 h-4 accent-teal-500 rounded"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Permite que varios cajeros compartan la terminal registradora en turnos sucesivos cerrando y abriendo sus propios turnos independientes.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">Descuento Máximo Permitido al Cajero (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={config.maxCashierDiscountPercent}
                                        onChange={(e) => setConfig({ ...config, maxCashierDiscountPercent: Number(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Descuentos superiores requieren clave de autorización comercial.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUBTAB 2: HARDWARE & PERIFÉRICOS */}
                {activeTab === "HARDWARE" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Printer className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Impresoras Térmicas y Periféricos ESC/POS</h3>
                                    <p className="text-xs text-slate-400">Protocolo directo de impresión de tickets y apertura de gaveta de dinero.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">Formato Predeterminado de Tiquete</label>
                                    <select
                                        value={config.defaultReceiptFormat}
                                        onChange={(e) => setConfig({ ...config, defaultReceiptFormat: e.target.value as any })}
                                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                    >
                                        <option value="thermal_80mm">Térmico Estándar 80mm (ESC/POS)</option>
                                        <option value="thermal_58mm">Térmico Compacto 58mm (ESC/POS)</option>
                                        <option value="dian_a4">Factura Electrónica Estándar Carta / A4</option>
                                    </select>
                                    <p className="text-[10px] text-slate-500">El formato por defecto que se generará al presionar cobrar.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">Dirección IP / Puerto Impresora de Red</label>
                                    <input
                                        type="text"
                                        value={config.printerIpAddress}
                                        onChange={(e) => setConfig({ ...config, printerIpAddress: e.target.value })}
                                        placeholder="192.168.1.200:9100"
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Socket TCP RAW (puerto 9100) para envío de comandos directos.</p>
                                </div>

                                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-200">Apertura Automática del Cajón Monedero</label>
                                        <input
                                            type="checkbox"
                                            checked={config.autoOpenDrawerOnCashSale}
                                            onChange={(e) => setConfig({ ...config, autoOpenDrawerOnCashSale: e.target.checked })}
                                            className="w-4 h-4 accent-teal-500 rounded"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Envía el pulso eléctrico RJ11 (ESC p 0 25 250) al cajón monedero automáticamente tras una venta en efectivo.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-200">Efectos de Sonido en Escáner</label>
                                        <input
                                            type="checkbox"
                                            checked={config.soundEffectsEnabled}
                                            onChange={(e) => setConfig({ ...config, soundEffectsEnabled: e.target.checked })}
                                            className="w-4 h-4 accent-teal-500 rounded"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Beep sonoro de confirmación al pistolear códigos de barras con el lector láser 2D.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUBTAB 3: REGLAS FISCALES & DIAN */}
                {activeTab === "FISCAL_DIAN" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Landmark className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Parámetros Tributarios y Habilitación POS DIAN</h3>
                                    <p className="text-xs text-slate-400">Configuración de resoluciones, IVA predeterminado y prefijos de facturación.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">Prefijo de Resolución DIAN</label>
                                    <input
                                        type="text"
                                        value={config.dianResolutionPrefix}
                                        onChange={(e) => setConfig({ ...config, dianResolutionPrefix: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Ejemplo: SETG o POS.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">Número de Resolución DIAN</label>
                                    <input
                                        type="text"
                                        value={config.dianResolutionNumber}
                                        onChange={(e) => setConfig({ ...config, dianResolutionNumber: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Número del formulario 1876 otorgado por la DIAN.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">Tarifa de IVA Predeterminada (%)</label>
                                    <input
                                        type="number"
                                        value={config.defaultTaxRate}
                                        onChange={(e) => setConfig({ ...config, defaultTaxRate: Number(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Normalmente 19% o 0% para bienes excluidos/exentos.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300">Sucursal Predeterminada</label>
                                    <input
                                        type="text"
                                        value={config.defaultBranchName}
                                        onChange={(e) => setConfig({ ...config, defaultBranchName: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Sede física vinculada a las ventas del mostrador.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUBTAB 4: CAJAS REGISTRADORAS */}
                {activeTab === "REGISTERS" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                        <Store className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">Inventario de Terminales de Caja</h3>
                                        <p className="text-xs text-slate-400">Terminales físicas registradas en la empresa para cobro.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchRegisters}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRegisters ? "animate-spin" : ""}`} /> Refrescar
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {registers.length === 0 ? (
                                    <div className="col-span-2 p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                                        No hay cajas registradas actualmente. Se inicializarán automáticamente al abrir turno.
                                    </div>
                                ) : (
                                    registers.map((reg) => (
                                        <div key={reg.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{reg.name}</h4>
                                                <p className="text-xs text-slate-400">{reg.location || "Sede Principal"}</p>
                                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    reg.status === "OPEN" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                                                }`}>
                                                    {reg.status === "OPEN" ? "● EN SERVICIO (ABIERTA)" : "○ CERRADA"}
                                                </span>
                                            </div>
                                            <div className="text-right font-mono">
                                                <span className="text-[10px] text-slate-500 block">Saldo Actual</span>
                                                <span className="text-sm font-bold text-teal-400">
                                                    $ {Number(reg.currentBalance || 0).toLocaleString("es-CO")}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer de Guardar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div>
                        {savedSuccess && (
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                                <CheckCircle2 className="w-4 h-4" /> Parámetros de Terminal POS actualizados correctamente.
                            </span>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? "Guardando Parámetros..." : "Guardar Configuración POS"}
                    </button>
                </div>
            </form>
        </div>
    );
}
