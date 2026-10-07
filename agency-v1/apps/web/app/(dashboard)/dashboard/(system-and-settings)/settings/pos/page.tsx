"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag, Shield, Landmark, Settings, Save, AlertTriangle,
    CheckCircle2, Printer, Wifi, RefreshCw, Key, ShieldCheck,
    DollarSign, Users, Store, ArrowRight, ToggleLeft, ToggleRight,
    Sliders, Receipt, MonitorCheck, Plus, Trash2, Edit3, CreditCard,
    Radio, Activity, Check, X, QrCode, FileText, Smartphone, Lock, Eye
} from "lucide-react";
import { ShiftClosingActaModal, ShiftActaData } from "@/components/pos/shift-closing-acta-modal";

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
    config?: {
        printer?: {
            format: "thermal_80mm" | "thermal_58mm" | "dian_a4";
            ipAddress: string;
            autoOpenDrawer: boolean;
        };
        datafonoId?: string;
        qrMenu?: {
            qrSlug: string;
            tablePrefix: string;
            tables: string[];
            allowedCategories: string[];
        };
        maxCashLimit?: number;
    };
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
    const [activeTab, setActiveTab] = useState<"REGISTERS" | "DATAFONOS" | "ACTAS_AUDIT" | "SECURITY_SHIFTS" | "HARDWARE" | "FISCAL_DIAN">("REGISTERS");
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // ==========================================
    // ESTADO DE CAJAS REGISTRADORAS (CRUD)
    // ==========================================
    const [registers, setRegisters] = useState<CashRegisterItem[]>([
        {
            id: "caja_1",
            name: "Caja Principal 01 - Recepción",
            location: "Sede Bucaramanga",
            initialFloat: 200000,
            currentBalance: 850000,
            status: "OPEN",
            config: {
                printer: { format: "thermal_80mm", ipAddress: "192.168.1.200:9100", autoOpenDrawer: true },
                datafonoId: "dat_bold_01",
                qrMenu: {
                    qrSlug: "recepcion-caja-1",
                    tablePrefix: "Mesa",
                    tables: ["Mesa 01", "Mesa 02", "Mesa 03", "Mesa VIP 01", "Barra 01"],
                    allowedCategories: ["Todos"]
                },
                maxCashLimit: 2000000,
            }
        },
        {
            id: "caja_2",
            name: "Caja Registradora 02 - Norte",
            location: "Sede Bogotá",
            initialFloat: 150000,
            currentBalance: 150000,
            status: "CLOSED",
            config: {
                printer: { format: "thermal_80mm", ipAddress: "192.168.2.200:9100", autoOpenDrawer: true },
                datafonoId: "dat_redeban_02",
                qrMenu: {
                    qrSlug: "norte-caja-2",
                    tablePrefix: "Mesa Terraza",
                    tables: ["Mesa Terraza 01", "Mesa Terraza 02", "Mesa Terraza 03"],
                    allowedCategories: ["Todos"]
                },
                maxCashLimit: 1500000,
            }
        }
    ]);
    const [loadingRegisters, setLoadingRegisters] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [editingRegister, setEditingRegister] = useState<CashRegisterItem | null>(null);
    const [registerModalTab, setRegisterModalTab] = useState<"GENERAL" | "HARDWARE" | "QR_MENU" | "DATAFONO">("GENERAL");

    // Campos de formulario de Caja
    const [regName, setRegName] = useState("");
    const [regLocation, setRegLocation] = useState("Sede Bucaramanga - Principal");
    const [regFloat, setRegFloat] = useState("200000");
    const [regPrinterFormat, setRegPrinterFormat] = useState<"thermal_80mm" | "thermal_58mm" | "dian_a4">("thermal_80mm");
    const [regPrinterIp, setRegPrinterIp] = useState("192.168.1.200:9100");
    const [regAutoOpenDrawer, setRegAutoOpenDrawer] = useState(true);
    const [regDatafonoId, setRegDatafonoId] = useState("");
    const [regQrSlug, setRegQrSlug] = useState("");
    const [regTablePrefix, setRegTablePrefix] = useState("Mesa");
    const [regTablesText, setRegTablesText] = useState("Mesa 01, Mesa 02, Mesa 03, Mesa VIP 01, Barra 01");
    const [regMaxCashLimit, setRegMaxCashLimit] = useState("2000000");

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

    // ==========================================
    // ESTADO DE ACTAS OFICIALES & AUDITORÍA
    // ==========================================
    const [shiftsActas, setShiftsActas] = useState<ShiftActaData[]>([]);
    const [loadingActas, setLoadingActas] = useState(false);
    const [selectedActaForModal, setSelectedActaForModal] = useState<ShiftActaData | null>(null);
    const [isActaModalOpen, setIsActaModalOpen] = useState(false);

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
        fetchShiftsActas();
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

    const fetchShiftsActas = async () => {
        setLoadingActas(true);
        try {
            const res = await fetch("/api/pos/shifts/history");
            if (res.ok) {
                const data = await res.json();
                if (data.shifts && data.shifts.length > 0) {
                    setShiftsActas(data.shifts);
                }
            }
        } catch (e) {
            console.warn("Error cargando actas de turnos:", e);
        } finally {
            setLoadingActas(false);
        }
    };

    // ==========================================
    // OPERACIONES CRUD CAJAS REGISTRADORAS
    // ==========================================
    const handleOpenRegisterModal = (reg?: CashRegisterItem) => {
        setRegisterModalTab("GENERAL");
        if (reg) {
            setEditingRegister(reg);
            setRegName(reg.name);
            setRegLocation(reg.location);
            setRegFloat(reg.initialFloat.toString());
            setRegPrinterFormat(reg.config?.printer?.format || "thermal_80mm");
            setRegPrinterIp(reg.config?.printer?.ipAddress || "192.168.1.200:9100");
            setRegAutoOpenDrawer(reg.config?.printer?.autoOpenDrawer ?? true);
            setRegDatafonoId(reg.config?.datafonoId || "");
            setRegQrSlug(reg.config?.qrMenu?.qrSlug || `caja-${reg.id}`);
            setRegTablePrefix(reg.config?.qrMenu?.tablePrefix || "Mesa");
            setRegTablesText(reg.config?.qrMenu?.tables?.join(", ") || "Mesa 01, Mesa 02, Mesa 03, Barra 01");
            setRegMaxCashLimit(reg.config?.maxCashLimit?.toString() || "2000000");
        } else {
            setEditingRegister(null);
            const tempId = `caja_${Date.now()}`;
            setRegName("");
            setRegLocation("Sede Bucaramanga - Principal");
            setRegFloat("200000");
            setRegPrinterFormat("thermal_80mm");
            setRegPrinterIp("192.168.1.200:9100");
            setRegAutoOpenDrawer(true);
            setRegDatafonoId("");
            setRegQrSlug(`caja-${tempId}`);
            setRegTablePrefix("Mesa");
            setRegTablesText("Mesa 01, Mesa 02, Mesa 03, Barra 01");
            setRegMaxCashLimit("2000000");
        }
        setShowRegisterModal(true);
    };

    const handleSaveRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regName.trim()) return;

        const floatNum = Number(regFloat) || 0;
        const tablesArray = regTablesText.split(",").map(s => s.trim()).filter(Boolean);

        const registerConfig = {
            printer: {
                format: regPrinterFormat,
                ipAddress: regPrinterIp,
                autoOpenDrawer: regAutoOpenDrawer,
            },
            datafonoId: regDatafonoId || undefined,
            qrMenu: {
                qrSlug: regQrSlug || `caja-${Date.now()}`,
                tablePrefix: regTablePrefix,
                tables: tablesArray.length > 0 ? tablesArray : ["Mesa 01", "Mesa 02"],
                allowedCategories: ["Todos"],
            },
            maxCashLimit: Number(regMaxCashLimit) || 2000000,
        };

        if (editingRegister) {
            // Editar existente
            const updated = registers.map(r => r.id === editingRegister.id ? {
                ...r,
                name: regName,
                location: regLocation,
                initialFloat: floatNum,
                config: registerConfig,
            } : r);
            setRegisters(updated);
            localStorage.setItem("LEGACYMARK_POS_REGISTERS", JSON.stringify(updated));
            try {
                await fetch(`/api/pos/registers/${editingRegister.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: regName,
                        location: regLocation,
                        initialFloat: floatNum,
                        config: registerConfig,
                    })
                });
            } catch (_) {}
        } else {
            // Crear nueva
            const newRegId = `caja_${Date.now()}`;
            const newReg: CashRegisterItem = {
                id: newRegId,
                name: regName,
                location: regLocation,
                initialFloat: floatNum,
                currentBalance: floatNum,
                status: "CLOSED",
                config: registerConfig,
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
            setDatTerminalId(`TERM-${Date.now().toString().slice(-4)}`);
            setDatMerchantId("MERC-LEGACYMARK");
            setDatHmacKey("");
            setDatIsDefault(false);
        }
        setShowDatafonoModal(true);
    };

    const handleSaveDatafono = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!datName.trim()) return;

        let updated: DatafonoTerminalItem[];
        if (editingDatafono) {
            updated = datafonos.map(d => d.id === editingDatafono.id ? {
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
                isDefault: datIsDefault,
            } : (datIsDefault ? { ...d, isDefault: false } : d));
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
            updated = datIsDefault 
                ? [...datafonos.map(d => ({ ...d, isDefault: false })), newDat]
                : [...datafonos, newDat];
        }

        setDatafonos(updated);
        localStorage.setItem("LEGACYMARK_POS_DATAFONOS", JSON.stringify(updated));
        setShowDatafonoModal(false);

        try {
            await fetch("/api/pos/datafonos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated)
            });
        } catch (_) {}
    };

    const handleDeleteDatafono = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar datáfono "${name}"?`)) return;
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

    const formatCOP = (val: number) => `$ ${Number(val || 0).toLocaleString("es-CO")}`;

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
                        Ajustes estructurales por cada <strong>Caja Registradora</strong> (Menú QR, Impresora/Cajón, Datáfono, Límites), gestión de datáfonos y módulo de <strong>Actas Oficiales de Turno & Arqueo Z</strong>.
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
                    onClick={() => setActiveTab("ACTAS_AUDIT")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "ACTAS_AUDIT"
                            ? "border-teal-500 text-teal-400 bg-teal-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <FileText className="w-4 h-4" /> Actas & Auditoría de Turnos ({shiftsActas.length})
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
                    <Printer className="w-4 h-4" /> Periféricos Globales
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
                                    <p className="text-xs text-slate-400">Cada caja posee su propio Menú QR, cajón monedero, impresora y datáfono asignado.</p>
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
                            {registers.map(reg => {
                                const matchedDat = datafonos.find(d => d.id === reg.config?.datafonoId);
                                return (
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

                                            {/* Configuración individual de la caja */}
                                            <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                                                <div className="flex justify-between items-center text-slate-300">
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <QrCode className="w-3 h-3 text-teal-400" /> Menú QR:
                                                    </span>
                                                    <span className="font-mono text-teal-300 font-bold truncate max-w-[130px]">
                                                        /{reg.config?.qrMenu?.qrSlug || `caja-${reg.id}`}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-slate-300">
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <Printer className="w-3 h-3 text-indigo-400" /> Cajón / Impresora:
                                                    </span>
                                                    <span className="font-mono text-slate-300 truncate max-w-[130px]">
                                                        {reg.config?.printer?.ipAddress || "LAN 9100"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-slate-300">
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <CreditCard className="w-3 h-3 text-purple-400" /> Datáfono:
                                                    </span>
                                                    <span className="font-semibold text-purple-300 truncate max-w-[130px]">
                                                        {matchedDat?.name || "Sin datáfono fijo"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
                                                <div>
                                                    <span className="text-[10px] text-slate-500 block">Base Predeterminada</span>
                                                    <span className="font-bold text-slate-200">{formatCOP(reg.initialFloat)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-500 block">Saldo en Turno</span>
                                                    <span className="font-bold text-teal-400">{formatCOP(reg.currentBalance)}</span>
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
                                                    title="Editar Ajustes de esta Caja"
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
                                );
                            })}
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
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDatafono(dat.id, dat.name)}
                                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Terminal ID</span>
                                            <span>{dat.terminalId}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Merchant ID</span>
                                            <span>{dat.merchantId}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                        <button
                                            onClick={() => handleToggleDatafonoDefault(dat.id)}
                                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition ${
                                                dat.isDefault
                                                    ? "border-teal-500/30 text-teal-300 bg-teal-500/10"
                                                    : "border-slate-800 text-slate-400 hover:text-white"
                                            }`}
                                        >
                                            {dat.isDefault ? "Datáfono Predeterminado" : "Marcar Predeterminado"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 3: ACTAS OFICIALES & AUDITORÍA DE TURNOS (NUEVA)  */}
            {/* ======================================================== */}
            {activeTab === "ACTAS_AUDIT" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Actas Oficiales de Turno & Arqueos de Cierre Z</h3>
                                    <p className="text-xs text-slate-400">Expediente inmutable de cierres fiscales con desglose por denominaciones, firmas y dictamen de supervisión.</p>
                                </div>
                            </div>
                            <button
                                onClick={fetchShiftsActas}
                                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingActas ? "animate-spin" : ""}`} /> Actualizar Actas
                            </button>
                        </div>

                        {shiftsActas.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                                No se registran actas de turno aún. Se generarán automáticamente al completar los cierres de caja en la terminal.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                                        <tr>
                                            <th className="p-3">Código Acta</th>
                                            <th className="p-3">Caja / Terminal</th>
                                            <th className="p-3">Cajero</th>
                                            <th className="p-3">Supervisor</th>
                                            <th className="p-3">Base</th>
                                            <th className="p-3">Ventas</th>
                                            <th className="p-3">Diferencia</th>
                                            <th className="p-3">Estado</th>
                                            <th className="p-3 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/80 font-mono">
                                        {shiftsActas.map(shift => {
                                            const diff = Number(shift.difference || 0);
                                            return (
                                                <tr key={shift.id} className="hover:bg-slate-950/50 transition">
                                                    <td className="p-3 font-bold text-white flex items-center gap-1.5">
                                                        <FileText className="w-3.5 h-3.5 text-teal-400" />
                                                        {shift.shiftCode}
                                                    </td>
                                                    <td className="p-3 font-sans text-slate-200">{shift.registerName}</td>
                                                    <td className="p-3 font-sans text-slate-300">{shift.cashierName}</td>
                                                    <td className="p-3 font-sans text-indigo-300">{shift.supervisorName || "—"}</td>
                                                    <td className="p-3">{formatCOP(shift.openingFloat)}</td>
                                                    <td className="p-3 font-bold text-emerald-400">{formatCOP(shift.totalSales)}</td>
                                                    <td className={`p-3 font-bold ${diff === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                        {formatCOP(diff)}
                                                    </td>
                                                    <td className="p-3 font-sans">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            shift.status === "CLOSED_BALANCED"
                                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                                : shift.status === "CLOSED_DISCREPANCY"
                                                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                                        }`}>
                                                            {shift.status === "CLOSED_BALANCED" ? "CUADRE EXACTO" : shift.status === "CLOSED_DISCREPANCY" ? "DESCUADRE" : "ABIERTO"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedActaForModal(shift);
                                                                setIsActaModalOpen(true);
                                                            }}
                                                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg font-bold text-xs transition flex items-center gap-1 ml-auto"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Ver Acta
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 4: GOBERNANZA DE TURNOS */}
            {/* ======================================================== */}
            {activeTab === "SECURITY_SHIFTS" && (
                <form onSubmit={handleSaveGovernance} className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Políticas de Control y Cuadre de Caja</h3>
                                <p className="text-xs text-slate-400">Requerimientos de supervisión, PIN de desbloqueo y tolerancia a descuadres.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-200">Requerir Visto Bueno de Supervisor en Cierre Z</label>
                                    <input
                                        type="checkbox"
                                        checked={config.requireSupervisorApprovalForClose}
                                        onChange={(e) => setConfig({ ...config, requireSupervisorApprovalForClose: e.target.checked })}
                                        className="w-4 h-4 accent-teal-500 rounded"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Exige validación de PIN y firma digital de supervisor para formalizar el Cierre Z.
                                </p>
                            </div>

                            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-200">PIN de Supervisor para Anular Ítems</label>
                                    <input
                                        type="checkbox"
                                        checked={config.requireSupervisorPinForDeleteCartItem}
                                        onChange={(e) => setConfig({ ...config, requireSupervisorPinForDeleteCartItem: e.target.checked })}
                                        className="w-4 h-4 accent-teal-500 rounded"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Impide que cajeros eliminen ítems marcados o vacíen el carrito sin PIN autorizado.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">PIN Maestro de Supervisor</label>
                                <input
                                    type="password"
                                    value={config.supervisorDefaultPin}
                                    onChange={(e) => setConfig({ ...config, supervisorDefaultPin: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono tracking-widest focus:border-teal-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">Descuadre Máximo Tolerado sin Auditoría Inmediata ($ COP)</label>
                                <input
                                    type="number"
                                    value={config.maxCashDrawerDiscrepancy}
                                    onChange={(e) => setConfig({ ...config, maxCashDrawerDiscrepancy: Number(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
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
                            <Save className="w-4 h-4" /> {isSaving ? "Guardando..." : "Guardar Políticas de Seguridad"}
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 5: PERIFÉRICOS GLOBALES */}
            {/* ======================================================== */}
            {activeTab === "HARDWARE" && (
                <form onSubmit={handleSaveGovernance} className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <Printer className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Configuración Global de Hardware</h3>
                                <p className="text-xs text-slate-400">Valores de respaldo para terminales que no especifiquen periféricos propios.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">Formato Predeterminado de Tiquete</label>
                                <select
                                    value={config.defaultReceiptFormat}
                                    onChange={(e) => setConfig({ ...config, defaultReceiptFormat: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                >
                                    <option value="thermal_80mm">Térmico 80mm Estándar (ESC/POS)</option>
                                    <option value="thermal_58mm">Térmico 58mm Portátil</option>
                                    <option value="dian_a4">Factura Electrónica A4 Completa</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">IP de Respaldo Impresora de Red</label>
                                <input
                                    type="text"
                                    value={config.printerIpAddress}
                                    onChange={(e) => setConfig({ ...config, printerIpAddress: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-slate-800">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Guardar Periféricos
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 6: FISCAL & DIAN */}
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
                            <Save className="w-4 h-4" /> Guardar Parámetros Fiscales
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================================== */}
            {/* MODAL MULTI-PESTAÑA: CREAR / EDITAR CAJA REGISTRADORA    */}
            {/* ======================================================== */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        {editingRegister ? `Configuración de ${editingRegister.name}` : "Nueva Caja Registradora"}
                                    </h2>
                                    <p className="text-xs text-slate-400">Ajustes específicos de hardware, datáfono, menú QR y límites</p>
                                </div>
                            </div>
                            <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        {/* SUB-PESTAÑAS DEL MODAL DE CAJA */}
                        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-3">
                            <button
                                type="button"
                                onClick={() => setRegisterModalTab("GENERAL")}
                                className={`py-2.5 text-xs font-bold border-b-2 transition-all ${
                                    registerModalTab === "GENERAL" ? "border-teal-400 text-teal-300" : "border-transparent text-slate-400"
                                }`}
                            >
                                General & Base
                            </button>
                            <button
                                type="button"
                                onClick={() => setRegisterModalTab("HARDWARE")}
                                className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 ${
                                    registerModalTab === "HARDWARE" ? "border-teal-400 text-teal-300" : "border-transparent text-slate-400"
                                }`}
                            >
                                <Printer className="w-3.5 h-3.5" /> Impresora & Cajón
                            </button>
                            <button
                                type="button"
                                onClick={() => setRegisterModalTab("QR_MENU")}
                                className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 ${
                                    registerModalTab === "QR_MENU" ? "border-teal-400 text-teal-300" : "border-transparent text-slate-400"
                                }`}
                            >
                                <QrCode className="w-3.5 h-3.5" /> Menú QR
                            </button>
                            <button
                                type="button"
                                onClick={() => setRegisterModalTab("DATAFONO")}
                                className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 ${
                                    registerModalTab === "DATAFONO" ? "border-teal-400 text-teal-300" : "border-transparent text-slate-400"
                                }`}
                            >
                                <CreditCard className="w-3.5 h-3.5" /> Datáfono
                            </button>
                        </div>

                        <form onSubmit={handleSaveRegister} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {registerModalTab === "GENERAL" && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Nombre de la Caja / Terminal *</label>
                                        <input
                                            type="text"
                                            required
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            placeholder="Ej. Caja Principal 01 - Barra"
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Sede o Ubicación Física *</label>
                                        <input
                                            type="text"
                                            required
                                            value={regLocation}
                                            onChange={(e) => setRegLocation(e.target.value)}
                                            placeholder="Ej. Sede Bucaramanga - Principal"
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Base Predeterminada ($)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={regFloat}
                                                onChange={(e) => setRegFloat(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold focus:border-teal-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Límite Máximo en Efectivo</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={regMaxCashLimit}
                                                onChange={(e) => setRegMaxCashLimit(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {registerModalTab === "HARDWARE" && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Formato de Impresora para esta Caja</label>
                                        <select
                                            value={regPrinterFormat}
                                            onChange={(e) => setRegPrinterFormat(e.target.value as any)}
                                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                        >
                                            <option value="thermal_80mm">Térmico 80mm Estándar (ESC/POS)</option>
                                            <option value="thermal_58mm">Térmico 58mm Portátil</option>
                                            <option value="dian_a4">Factura Electrónica A4 Completa</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Dirección IP y Puerto de Impresora / Cajón</label>
                                        <input
                                            type="text"
                                            value={regPrinterIp}
                                            onChange={(e) => setRegPrinterIp(e.target.value)}
                                            placeholder="192.168.1.200:9100"
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            El botón 'Abrir Cajón' de esta caja enviará el pulso eléctrico RJ11 directamente a esta IP.
                                        </p>
                                    </div>

                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold block text-white">Disparo Automático RJ11 en Venta Efectivo</span>
                                            <span className="text-[11px] text-slate-400">Abre el cajón monedero al facturar ventas en efectivo.</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={regAutoOpenDrawer}
                                            onChange={(e) => setRegAutoOpenDrawer(e.target.checked)}
                                            className="w-4 h-4 accent-teal-500 rounded"
                                        />
                                    </div>
                                </div>
                            )}

                            {registerModalTab === "QR_MENU" && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Identificador / Slug del Menú QR</label>
                                        <input
                                            type="text"
                                            value={regQrSlug}
                                            onChange={(e) => setRegQrSlug(e.target.value)}
                                            placeholder="ej. caja-principal"
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500"
                                        />
                                        <p className="text-[11px] text-teal-400 font-mono">
                                            URL generada: /menu/{regQrSlug || "caja-1"}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Prefijo de Mesas / Ubicación</label>
                                        <input
                                            type="text"
                                            value={regTablePrefix}
                                            onChange={(e) => setRegTablePrefix(e.target.value)}
                                            placeholder="Mesa / Barra / Terraza"
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Mesas asignadas a esta Caja (separadas por coma)</label>
                                        <textarea
                                            value={regTablesText}
                                            onChange={(e) => setRegTablesText(e.target.value)}
                                            rows={2}
                                            placeholder="Mesa 01, Mesa 02, Mesa 03, Barra 01"
                                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-teal-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {registerModalTab === "DATAFONO" && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Datáfono Vinculado a esta Caja</label>
                                        <select
                                            value={regDatafonoId}
                                            onChange={(e) => setRegDatafonoId(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                        >
                                            <option value="">— Ninguno / Selección manual en cobro —</option>
                                            {datafonos.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} ({d.provider} - {d.connectionType})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-slate-500">
                                            Al cobrar con tarjeta en esta caja, se enlazará automáticamente con esta terminal de pagos.
                                        </p>
                                    </div>
                                </div>
                            )}

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
                                    {editingRegister ? "Guardar Ajustes de Caja" : "Crear Caja"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL: CREAR / EDITAR DATÁFONO                           */}
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
                                    <label className="text-xs font-bold text-slate-300">Puerto COM / Serial</label>
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
                                    <label className="text-xs font-bold text-slate-300">Terminal ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={datTerminalId}
                                        onChange={(e) => setDatTerminalId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Merchant ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={datMerchantId}
                                        onChange={(e) => setDatMerchantId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Clave Secreta HMAC / API Key</label>
                                <input
                                    type="password"
                                    value={datHmacKey}
                                    onChange={(e) => setDatHmacKey(e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                                />
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
                                    Guardar Datáfono
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL: VER ACTA OFICIAL DE TURNO & SUPERVISIÓN           */}
            {/* ======================================================== */}
            {isActaModalOpen && selectedActaForModal && (
                <ShiftClosingActaModal
                    isOpen={isActaModalOpen}
                    onClose={() => {
                        setIsActaModalOpen(false);
                        setSelectedActaForModal(null);
                    }}
                    shiftData={selectedActaForModal}
                    isSupervisorMode={false}
                />
            )}

        </div>
    );
}
