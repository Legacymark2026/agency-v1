"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag, Shield, Landmark, Settings, Save, AlertTriangle,
    CheckCircle2, Printer, Wifi, RefreshCw, Key, ShieldCheck,
    DollarSign, Users, Store, ArrowRight, ToggleLeft, ToggleRight,
    Sliders, Receipt, MonitorCheck, Plus, Trash2, Edit3, CreditCard,
    Radio, Activity, Check, X
} from "lucide-react";

interface PosGovernanceConfig {
    requireSupervisorApprovalForClose: boolean;
    requireSupervisorPinForDeleteCartItem: boolean;
    supervisorDefaultPin: string;
    maxCashDrawerDiscrepancy: number;
    allowMultiCashierPerRegister: boolean;
    autoLockInactiveMinutes: number;

    defaultReceiptFormat: "thermal_80mm" | "thermal_58mm" | "dian_a4";
    printerIpAddress: string;
    autoOpenDrawerOnCashSale: boolean;
    soundEffectsEnabled: boolean;

    defaultTaxRate: number;
    requireCustomerDocForTicket: boolean;
    dianResolutionPrefix: string;
    dianResolutionNumber: string;

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

interface CashRegisterItem {
    id: string;
    name: string;
    location: string;
    initialFloat: number;
    currentBalance: number;
    status: "OPEN" | "CLOSED";
}

interface DatafonoTerminalItem {
    id: string;
    name: string;
    provider: "BOLD" | "REDEBAN" | "WOMPI" | "CREDIBANCO" | "SUMUP";
    connectionType: "BLUETOOTH" | "WIFI" | "USB_SERIAL";
    terminalIp?: string;
    bluetoothMac?: string;
    usbPort?: string;
    terminalId: string;
    merchantId: string;
    hmacSecretKey: string;
    isDefault: boolean;
    isActive: boolean;
}

export default function PosSettingsPage() {
    const [config, setConfig] = useState<PosGovernanceConfig>(DEFAULT_CONFIG);
    const [activeTab, setActiveTab] = useState<"SECURITY_SHIFTS" | "REGISTERS" | "DATAFONOS" | "HARDWARE" | "FISCAL_DIAN">("REGISTERS");
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // ==========================================
    // ESTADO DE CAJAS REGISTRADORAS (CRUD)
    // ==========================================
    const [registers, setRegisters] = useState<CashRegisterItem[]>([
        { id: "caja_1", name: "Caja Principal 01 - Recepción", location: "Sede Bucaramanga", initialFloat: 200000, currentBalance: 850000, status: "OPEN" },
        { id: "caja_2", name: "Caja Registradora 02 - Norte", location: "Sede Bogotá", initialFloat: 150000, currentBalance: 150000, status: "CLOSED" }
    ]);
    const [loadingRegisters, setLoadingRegisters] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [editingRegister, setEditingRegister] = useState<CashRegisterItem | null>(null);
    const [regName, setRegName] = useState("");
    const [regLocation, setRegLocation] = useState("Sede Bucaramanga - Principal");
    const [regFloat, setRegFloat] = useState("200000");

    // ==========================================
    // ESTADO DE DATÁFONOS (CRUD)
    // ==========================================
    const [datafonos, setDatafonos] = useState<DatafonoTerminalItem[]>([
        {
            id: "dat_bold_01",
            name: "Datáfono Bold Smart POS Principal",
            provider: "BOLD",
            connectionType: "BLUETOOTH",
            bluetoothMac: "00:11:22:33:FF:EE",
            terminalId: "TERM-BLD-8821",
            merchantId: "MERC-LEGACYMARK-01",
            hmacSecretKey: "legacymark_pci_dss_secure_pos_key_2026",
            isDefault: true,
            isActive: true
        },
        {
            id: "dat_redeban_02",
            name: "Datáfono Redeban WiFi Caja 2",
            provider: "REDEBAN",
            connectionType: "WIFI",
            terminalIp: "192.168.1.150:8080",
            terminalId: "TERM-RDB-4921",
            merchantId: "MERC-LEGACYMARK-02",
            hmacSecretKey: "redeban_secret_key_2026",
            isDefault: false,
            isActive: true
        }
    ]);
    const [loadingDatafonos, setLoadingDatafonos] = useState(false);
    const [showDatafonoModal, setShowDatafonoModal] = useState(false);
    const [editingDatafono, setEditingDatafono] = useState<DatafonoTerminalItem | null>(null);
    const [datName, setDatName] = useState("");
    const [datProvider, setDatProvider] = useState<"BOLD" | "REDEBAN" | "WOMPI" | "CREDIBANCO" | "SUMUP">("BOLD");
    const [datConnectionType, setDatConnectionType] = useState<"BLUETOOTH" | "WIFI" | "USB_SERIAL">("BLUETOOTH");
    const [datTerminalIp, setDatTerminalIp] = useState("192.168.1.150:8080");
    const [datBluetoothMac, setDatBluetoothMac] = useState("00:11:22:33:FF:EE");
    const [datUsbPort, setDatUsbPort] = useState("COM3");
    const [datTerminalId, setDatTerminalId] = useState("");
    const [datMerchantId, setDatMerchantId] = useState("");
    const [datHmacKey, setDatHmacKey] = useState("");
    const [datIsDefault, setDatIsDefault] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("LEGACYMARK_POS_GOVERNANCE_CONFIG");
            if (saved) {
                setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
            }
            const savedRegs = localStorage.getItem("LEGACYMARK_POS_REGISTERS");
            if (savedRegs) {
                setRegisters(JSON.parse(savedRegs));
            }
            const savedDats = localStorage.getItem("LEGACYMARK_POS_DATAFONOS");
            if (savedDats) {
                setDatafonos(JSON.parse(savedDats));
            }
        } catch (e) {}

        fetchRegisters();
        fetchDatafonos();
    }, []);

    const fetchRegisters = async () => {
        setLoadingRegisters(true);
        try {
            const res = await fetch("/api/pos/registers");
            if (res.ok) {
                const data = await res.json();
                if (data.registers && data.registers.length > 0) {
                    setRegisters(data.registers);
                }
            }
        } catch (e) {
            console.warn("Error cargando cajas:", e);
        } finally {
            setLoadingRegisters(false);
        }
    };

    const fetchDatafonos = async () => {
        setLoadingDatafonos(true);
        try {
            const res = await fetch("/api/pos/datafonos");
            if (res.ok) {
                const data = await res.json();
                if (data.terminals && data.terminals.length > 0) {
                    setDatafonos(data.terminals);
                }
            }
        } catch (e) {
            console.warn("Error cargando datáfonos:", e);
        } finally {
            setLoadingDatafonos(false);
        }
    };

    // ==========================================
    // OPERACIONES CRUD CAJAS REGISTRADORAS
    // ==========================================
    const handleOpenRegisterModal = (reg?: CashRegisterItem) => {
        if (reg) {
            setEditingRegister(reg);
            setRegName(reg.name);
            setRegLocation(reg.location);
            setRegFloat(reg.initialFloat.toString());
        } else {
            setEditingRegister(null);
            setRegName("");
            setRegLocation("Sede Bucaramanga - Principal");
            setRegFloat("200000");
        }
        setShowRegisterModal(true);
    };

    const handleSaveRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regName.trim()) return;

        const floatNum = Number(regFloat) || 0;
        if (editingRegister) {
            // Editar existente
            const updated = registers.map(r => r.id === editingRegister.id ? {
                ...r,
                name: regName,
                location: regLocation,
                initialFloat: floatNum,
            } : r);
            setRegisters(updated);
            localStorage.setItem("LEGACYMARK_POS_REGISTERS", JSON.stringify(updated));
            try {
                await fetch(`/api/pos/registers/${editingRegister.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: regName, location: regLocation, initialFloat: floatNum })
                });
            } catch (_) {}
        } else {
            // Crear nueva
            const newReg: CashRegisterItem = {
                id: `caja_${Date.now()}`,
                name: regName,
                location: regLocation,
                initialFloat: floatNum,
                currentBalance: floatNum,
                status: "CLOSED"
            };
            const updated = [...registers, newReg];
            setRegisters(updated);
            localStorage.setItem("LEGACYMARK_POS_REGISTERS", JSON.stringify(updated));
            try {
                await fetch("/api/pos/registers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newReg)
                });
            } catch (_) {}
        }
        setShowRegisterModal(false);
    };

    const handleDeleteRegister = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar la caja registradora "${name}"? Esta acción borrará sus configuraciones.`)) return;
        const updated = registers.filter(r => r.id !== id);
        setRegisters(updated);
        localStorage.setItem("LEGACYMARK_POS_REGISTERS", JSON.stringify(updated));
        try {
            await fetch(`/api/pos/registers/${id}`, { method: "DELETE" });
        } catch (_) {}
    };

    const handleToggleRegisterStatus = async (id: string) => {
        const updated = registers.map(r => r.id === id ? {
            ...r,
            status: (r.status === "OPEN" ? "CLOSED" : "OPEN") as "OPEN" | "CLOSED"
        } : r);
        setRegisters(updated);
        localStorage.setItem("LEGACYMARK_POS_REGISTERS", JSON.stringify(updated));
        try {
            await fetch(`/api/pos/registers/${id}`, { method: "PATCH" });
        } catch (_) {}
    };

    // ==========================================
    // OPERACIONES CRUD DATÁFONOS
    // ==========================================
    const handleOpenDatafonoModal = (dat?: DatafonoTerminalItem) => {
        if (dat) {
            setEditingDatafono(dat);
            setDatName(dat.name);
            setDatProvider(dat.provider);
            setDatConnectionType(dat.connectionType);
            setDatTerminalIp(dat.terminalIp || "192.168.1.150:8080");
            setDatBluetoothMac(dat.bluetoothMac || "00:11:22:33:FF:EE");
            setDatUsbPort(dat.usbPort || "COM3");
            setDatTerminalId(dat.terminalId);
            setDatMerchantId(dat.merchantId);
            setDatHmacKey(dat.hmacSecretKey);
            setDatIsDefault(dat.isDefault);
        } else {
            setEditingDatafono(null);
            setDatName("");
            setDatProvider("BOLD");
            setDatConnectionType("BLUETOOTH");
            setDatTerminalIp("192.168.1.150:8080");
            setDatBluetoothMac("00:11:22:33:FF:EE");
            setDatUsbPort("COM3");
            setDatTerminalId(`TERM-${Math.floor(1000 + Math.random() * 9000)}`);
            setDatMerchantId("MERC-LEGACYMARK");
            setDatHmacKey("");
            setDatIsDefault(false);
        }
        setShowDatafonoModal(true);
    };

    const handleSaveDatafono = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!datName.trim()) return;

        let updatedList: DatafonoTerminalItem[];
        if (editingDatafono) {
            updatedList = datafonos.map(d => {
                if (d.id === editingDatafono.id) {
                    return {
                        ...d,
                        name: datName,
                        provider: datProvider,
                        connectionType: datConnectionType,
                        terminalIp: datConnectionType === "WIFI" ? datTerminalIp : undefined,
                        bluetoothMac: datConnectionType === "BLUETOOTH" ? datBluetoothMac : undefined,
                        usbPort: datConnectionType === "USB_SERIAL" ? datUsbPort : undefined,
                        terminalId: datTerminalId,
                        merchantId: datMerchantId,
                        hmacSecretKey: datHmacKey,
                        isDefault: datIsDefault
                    };
                }
                return datIsDefault ? { ...d, isDefault: false } : d;
            });
        } else {
            const newDat: DatafonoTerminalItem = {
                id: `dat_${Date.now()}`,
                name: datName,
                provider: datProvider,
                connectionType: datConnectionType,
                terminalIp: datConnectionType === "WIFI" ? datTerminalIp : undefined,
                bluetoothMac: datConnectionType === "BLUETOOTH" ? datBluetoothMac : undefined,
                usbPort: datConnectionType === "USB_SERIAL" ? datUsbPort : undefined,
                terminalId: datTerminalId,
                merchantId: datMerchantId,
                hmacSecretKey: datHmacKey,
                isDefault: datIsDefault,
                isActive: true
            };
            updatedList = [
                ...datafonos.map(d => datIsDefault ? { ...d, isDefault: false } : d),
                newDat
            ];
        }

        setDatafonos(updatedList);
        localStorage.setItem("LEGACYMARK_POS_DATAFONOS", JSON.stringify(updatedList));
        try {
            await fetch("/api/pos/datafonos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedList)
            });
        } catch (_) {}

        setShowDatafonoModal(false);
    };

    const handleDeleteDatafono = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar el datáfono "${name}"?`)) return;
        const updated = datafonos.filter(d => d.id !== id);
        setDatafonos(updated);
        localStorage.setItem("LEGACYMARK_POS_DATAFONOS", JSON.stringify(updated));
        try {
            await fetch("/api/pos/datafonos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated)
            });
        } catch (_) {}
    };

    const handleToggleDatafonoDefault = (id: string) => {
        const updated = datafonos.map(d => ({
            ...d,
            isDefault: d.id === id
        }));
        setDatafonos(updated);
        localStorage.setItem("LEGACYMARK_POS_DATAFONOS", JSON.stringify(updated));
    };

    const handleSaveGovernance = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSavedSuccess(false);

        try {
            localStorage.setItem("LEGACYMARK_POS_GOVERNANCE_CONFIG", JSON.stringify(config));
            await new Promise((res) => setTimeout(res, 500));
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3500);
        } catch (err: any) {
            alert("Error: " + err.message);
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
                        Panel administrativo centralizado para la creación, configuración y edición de <strong>Cajas Registradoras</strong>, <strong>Datáfonos (Redeban, Bold, Credibanco)</strong>, periféricos y políticas fiscales de turnos.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/dashboard/pos"
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 text-xs font-bold transition-all flex items-center gap-2"
                    >
                        Ir al Terminal Operativo POS <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("REGISTERS")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "REGISTERS"
                            ? "border-teal-500 text-teal-400 bg-teal-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Store className="w-4 h-4" /> Cajas Registradoras ({registers.length})
                </button>
                <button
                    onClick={() => setActiveTab("DATAFONOS")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "DATAFONOS"
                            ? "border-teal-500 text-teal-400 bg-teal-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <CreditCard className="w-4 h-4" /> Configuración de Datáfonos ({datafonos.length})
                </button>
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
                    <Landmark className="w-4 h-4" /> Parámetros DIAN & Impuestos
                </button>
            </div>

            {/* ======================================================== */}
            {/* PESTAÑA 1: GESTIÓN DE CAJAS REGISTRADORAS (CRUD COMPLETO) */}
            {/* ======================================================== */}
            {activeTab === "REGISTERS" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Cajas Registradoras de la Empresa</h3>
                                    <p className="text-xs text-slate-400">Crea, modifica, inhabilita o elimina cajas terminales del sistema.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenRegisterModal()}
                                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Nueva Caja Registradora
                                </button>
                                <button
                                    onClick={fetchRegisters}
                                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRegisters ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {registers.map(reg => (
                                <div key={reg.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{reg.name}</h4>
                                                <p className="text-xs text-slate-400">{reg.location}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                reg.status === "OPEN" 
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                                                    : "bg-slate-800 text-slate-400"
                                            }`}>
                                                {reg.status === "OPEN" ? "● EN SERVICIO" : "○ INACTIVA"}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 font-mono text-xs">
                                            <div>
                                                <span className="text-[10px] text-slate-500 block">Base Predeterminada</span>
                                                <span className="font-bold text-slate-200">$ {Number(reg.initialFloat || 0).toLocaleString("es-CO")}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-500 block">Saldo en Turno</span>
                                                <span className="font-bold text-teal-400">$ {Number(reg.currentBalance || 0).toLocaleString("es-CO")}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                                        <button
                                            onClick={() => handleToggleRegisterStatus(reg.id)}
                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                                reg.status === "OPEN"
                                                    ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                            }`}
                                        >
                                            {reg.status === "OPEN" ? "Inhabilitar" : "Activar"}
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleOpenRegisterModal(reg)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                                title="Editar Caja"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRegister(reg.id, reg.name)}
                                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                title="Eliminar Caja"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 2: GESTIÓN DE DATÁFONOS (CRUD COMPLETO) */}
            {/* ======================================================== */}
            {activeTab === "DATAFONOS" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Datáfonos & Terminales de Tarjetas</h3>
                                    <p className="text-xs text-slate-400">Configura protocolos Redeban, Bold, Credibanco, Wompi y SumUp.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenDatafonoModal()}
                                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Nuevo Datáfono
                                </button>
                                <button
                                    onClick={fetchDatafonos}
                                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingDatafonos ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {datafonos.map(dat => (
                                <div key={dat.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-white">{dat.name}</h4>
                                                {dat.isDefault && (
                                                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] font-bold">
                                                        PREDETERMINADO
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-mono font-bold text-purple-400 uppercase mt-0.5 block">
                                                {dat.provider} • {dat.connectionType}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenDatafonoModal(dat)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDatafono(dat.id, dat.name)}
                                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/60 rounded-xl font-mono text-[11px] text-slate-400 border border-slate-800/60">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Terminal ID (TID)</span>
                                            <span className="text-white font-bold">{dat.terminalId}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Comercio ID (MID)</span>
                                            <span className="text-white font-bold">{dat.merchantId}</span>
                                        </div>
                                        <div className="col-span-2 pt-1 border-t border-slate-800/40">
                                            <span className="text-[10px] text-slate-500 block">Parámetro Conexión</span>
                                            <span className="text-teal-400">
                                                {dat.connectionType === "WIFI" && `IP: ${dat.terminalIp}`}
                                                {dat.connectionType === "BLUETOOTH" && `MAC: ${dat.bluetoothMac}`}
                                                {dat.connectionType === "USB_SERIAL" && `Puerto: ${dat.usbPort}`}
                                            </span>
                                        </div>
                                    </div>

                                    {!dat.isDefault && (
                                        <button
                                            onClick={() => handleToggleDatafonoDefault(dat.id)}
                                            className="w-full py-1.5 rounded-lg border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                                        >
                                            Marcar como Datáfono Predeterminado
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 3: GOBERNANZA DE TURNOS & SUPERVISIÓN */}
            {/* ======================================================== */}
            {activeTab === "SECURITY_SHIFTS" && (
                <form onSubmit={handleSaveGovernance} className="space-y-6 animate-in fade-in duration-200">
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

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <div>
                            {savedSuccess && (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                                    <CheckCircle2 className="w-4 h-4" /> Parámetros guardados con éxito.
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> {isSaving ? "Guardando..." : "Guardar Parámetros de Turnos"}
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 4: HARDWARE & PERIFÉRICOS */}
            {/* ======================================================== */}
            {activeTab === "HARDWARE" && (
                <form onSubmit={handleSaveGovernance} className="space-y-6 animate-in fade-in duration-200">
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
                                    Envía el pulso eléctrico RJ11 al cajón monedero automáticamente tras una venta en efectivo.
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
                                    Beep sonoro de confirmación al pistolear códigos de barras.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-slate-800">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> {isSaving ? "Guardando..." : "Guardar Configuración Hardware"}
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 5: FISCAL & DIAN */}
            {/* ======================================================== */}
            {activeTab === "FISCAL_DIAN" && (
                <form onSubmit={handleSaveGovernance} className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Parámetros Tributarios y Habilitación POS DIAN</h3>
                                <p className="text-xs text-slate-400">Resoluciones de facturación, IVA y sucursal predeterminada.</p>
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
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">Número de Resolución DIAN</label>
                                <input
                                    type="text"
                                    value={config.dianResolutionNumber}
                                    onChange={(e) => setConfig({ ...config, dianResolutionNumber: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">Tarifa de IVA Predeterminada (%)</label>
                                <input
                                    type="number"
                                    value={config.defaultTaxRate}
                                    onChange={(e) => setConfig({ ...config, defaultTaxRate: Number(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">Sucursal Predeterminada</label>
                                <input
                                    type="text"
                                    value={config.defaultBranchName}
                                    onChange={(e) => setConfig({ ...config, defaultBranchName: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-slate-800">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> {isSaving ? "Guardando..." : "Guardar Parámetros Fiscales"}
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================================== */}
            {/* MODAL: CREAR / EDITAR CAJA REGISTRADORA */}
            {/* ======================================================== */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        {editingRegister ? "Editar Caja Registradora" : "Crear Nueva Caja Registradora"}
                                    </h2>
                                    <p className="text-xs text-slate-400">Terminal física para transacciones y turnos POS</p>
                                </div>
                            </div>
                            <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSaveRegister} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Nombre de la Terminal / Caja</label>
                                <input
                                    type="text"
                                    required
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    placeholder="Ej. Caja Principal 01"
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Ubicación / Sede Física</label>
                                <input
                                    type="text"
                                    required
                                    value={regLocation}
                                    onChange={(e) => setRegLocation(e.target.value)}
                                    placeholder="Ej. Sede Bucaramanga - Principal"
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Fondo Base Predeterminado ($ COP)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={regFloat}
                                    onChange={(e) => setRegFloat(e.target.value)}
                                    placeholder="200000"
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold focus:border-teal-500"
                                />
                            </div>

                            <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-600/20"
                                >
                                    {editingRegister ? "Actualizar Caja" : "Crear Caja"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL: CREAR / EDITAR DATÁFONO */}
            {/* ======================================================== */}
            {showDatafonoModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        {editingDatafono ? "Editar Terminal Datáfono" : "Configurar Nuevo Datáfono"}
                                    </h2>
                                    <p className="text-xs text-slate-400">Parámetros de conexión y credenciales de procesamiento</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDatafonoModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSaveDatafono} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Nombre Descriptivo</label>
                                <input
                                    type="text"
                                    required
                                    value={datName}
                                    onChange={(e) => setDatName(e.target.value)}
                                    placeholder="Ej. Datáfono Redeban Caja 1"
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Proveedor / Red</label>
                                    <select
                                        value={datProvider}
                                        onChange={(e) => setDatProvider(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                    >
                                        <option value="BOLD">Bold Colombia</option>
                                        <option value="REDEBAN">Redeban Multicolor</option>
                                        <option value="CREDIBANCO">Credibanco</option>
                                        <option value="WOMPI">Wompi Bancolombia</option>
                                        <option value="SUMUP">SumUp</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Tipo de Conexión</label>
                                    <select
                                        value={datConnectionType}
                                        onChange={(e) => setDatConnectionType(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                    >
                                        <option value="BLUETOOTH">Bluetooth BLE</option>
                                        <option value="WIFI">WiFi TCP/IP</option>
                                        <option value="USB_SERIAL">USB / Puerto Serial</option>
                                    </select>
                                </div>
                            </div>

                            {datConnectionType === "WIFI" && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Dirección IP y Puerto Datáfono</label>
                                    <input
                                        type="text"
                                        required
                                        value={datTerminalIp}
                                        onChange={(e) => setDatTerminalIp(e.target.value)}
                                        placeholder="192.168.1.150:8080"
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                    />
                                </div>
                            )}

                            {datConnectionType === "BLUETOOTH" && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Dirección MAC Bluetooth</label>
                                    <input
                                        type="text"
                                        required
                                        value={datBluetoothMac}
                                        onChange={(e) => setDatBluetoothMac(e.target.value)}
                                        placeholder="00:11:22:33:FF:EE"
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                    />
                                </div>
                            )}

                            {datConnectionType === "USB_SERIAL" && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Puerto COM / Dispositivo</label>
                                    <input
                                        type="text"
                                        required
                                        value={datUsbPort}
                                        onChange={(e) => setDatUsbPort(e.target.value)}
                                        placeholder="COM3 o /dev/ttyUSB0"
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Terminal ID (TID)</label>
                                    <input
                                        type="text"
                                        required
                                        value={datTerminalId}
                                        onChange={(e) => setDatTerminalId(e.target.value)}
                                        placeholder="TERM-1234"
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Merchant ID (MID)</label>
                                    <input
                                        type="text"
                                        required
                                        value={datMerchantId}
                                        onChange={(e) => setDatMerchantId(e.target.value)}
                                        placeholder="MERC-001"
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Llave Secreta HMAC / API Key</label>
                                <input
                                    type="password"
                                    value={datHmacKey}
                                    onChange={(e) => setDatHmacKey(e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isDef"
                                    checked={datIsDefault}
                                    onChange={(e) => setDatIsDefault(e.target.checked)}
                                    className="w-4 h-4 accent-purple-500 rounded"
                                />
                                <label htmlFor="isDef" className="text-xs font-bold text-slate-300 cursor-pointer">
                                    Establecer como datáfono principal por defecto
                                </label>
                            </div>

                            <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowDatafonoModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20"
                                >
                                    {editingDatafono ? "Actualizar Datáfono" : "Guardar Datáfono"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
