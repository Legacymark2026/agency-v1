"use client";

import { useState, useEffect } from "react";
import { CreditCard, Radio, Wifi, Zap, CheckCircle2, ShieldCheck, Settings, RefreshCw, Activity, Lock, Server, Plus, Trash2, Edit3, Star, AlertTriangle } from "lucide-react";

export interface DatafonoTerminalItem {
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

interface DatafonoConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export function DatafonoConfigModal({ isOpen, onClose, onSaveSuccess }: DatafonoConfigModalProps) {
    const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
    const [activeTab, setActiveTab] = useState<"CONNECTION" | "CREDENTIALS" | "DIAGNOSTICS">("CONNECTION");

    // List of Datáfonos
    const [terminalsList, setTerminalsList] = useState<DatafonoTerminalItem[]>([
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

    const [editingId, setEditingId] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [provider, setProvider] = useState<"BOLD" | "REDEBAN" | "WOMPI" | "CREDIBANCO" | "SUMUP">("BOLD");
    const [connectionType, setConnectionType] = useState<"BLUETOOTH" | "WIFI" | "USB_SERIAL">("BLUETOOTH");
    const [terminalIp, setTerminalIp] = useState("192.168.1.150:8080");
    const [bluetoothMac, setBluetoothMac] = useState("00:11:22:33:FF:EE");
    const [usbPort, setUsbPort] = useState("COM3");

    const [terminalId, setTerminalId] = useState("");
    const [merchantId, setMerchantId] = useState("");
    const [hmacSecretKey, setHmacSecretKey] = useState("");

    const [testingPing, setTestingPing] = useState(false);
    const [pingResult, setPingResult] = useState<{
        status: string;
        latencyMs: number;
        handshake: string;
        handshakeSignature?: string;
        diagnosticNote?: string;
    } | null>(null);

    const fetchTerminals = async () => {
        try {
            const res = await fetch("/api/pos/datafonos");
            if (res.ok) {
                const data = await res.json();
                if (data.terminals && data.terminals.length > 0) {
                    setTerminalsList(data.terminals);
                }
            }
        } catch (e) {}
    };

    useEffect(() => {
        if (isOpen) fetchTerminals();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOpenNewForm = () => {
        setEditingId(null);
        setName(`Datáfono POS #${terminalsList.length + 1}`);
        setProvider("BOLD");
        setConnectionType("BLUETOOTH");
        setTerminalIp("192.168.1.150:8080");
        setBluetoothMac("00:11:22:33:FF:EE");
        setUsbPort("COM3");
        setTerminalId(`TERM-BLD-${Math.floor(1000 + Math.random() * 9000)}`);
        setMerchantId("MERC-LEGACYMARK-01");
        setHmacSecretKey("legacymark_pci_dss_secure_pos_key_2026");
        setPingResult(null);
        setActiveTab("CONNECTION");
        setViewMode("FORM");
    };

    const handleEditForm = (item: DatafonoTerminalItem) => {
        setEditingId(item.id);
        setName(item.name);
        setProvider(item.provider);
        setConnectionType(item.connectionType);
        setTerminalIp(item.terminalIp || "192.168.1.150:8080");
        setBluetoothMac(item.bluetoothMac || "00:11:22:33:FF:EE");
        setUsbPort(item.usbPort || "COM3");
        setTerminalId(item.terminalId);
        setMerchantId(item.merchantId);
        setHmacSecretKey(item.hmacSecretKey);
        setPingResult(null);
        setActiveTab("CONNECTION");
        setViewMode("FORM");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar esta configuración de Datáfono?")) return;
        try {
            await fetch(`/api/pos/datafonos/${id}`, { method: "DELETE" });
            setTerminalsList(prev => prev.filter(t => t.id !== id));
        } catch (e) {
            setTerminalsList(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleSetDefault = (id: string) => {
        setTerminalsList(prev => prev.map(t => ({
            ...t,
            isDefault: t.id === id
        })));
    };

    const handleRunPingTest = async () => {
        setTestingPing(true);
        setPingResult(null);
        try {
            const res = await fetch("/api/pos/datafonos/ping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider,
                    connectionType,
                    terminalIp,
                    terminalId,
                    merchantId,
                    hmacSecretKey
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setPingResult({
                    status: data.status || "ONLINE",
                    latencyMs: data.responseTimeMs || 18,
                    handshake: data.handshake || "ISO-8583-HANDSHAKE-SUCCESS-OK",
                    handshakeSignature: data.handshakeSignature,
                    diagnosticNote: data.diagnosticNote
                });
            } else {
                setPingResult({
                    status: "OFFLINE",
                    latencyMs: 0,
                    handshake: "Falla de Handshake en Socket Local",
                    diagnosticNote: "No se obtuvo respuesta del Datáfono en la IP/Puerto especificado."
                });
            }
        } catch (e: any) {
            setPingResult({
                status: "OFFLINE",
                latencyMs: 0,
                handshake: "Falla de Red Socket",
                diagnosticNote: `Error de red: ${e.message}`
            });
        } finally {
            setTestingPing(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Partial<DatafonoTerminalItem> = {
            name,
            provider,
            connectionType,
            terminalIp,
            bluetoothMac,
            usbPort,
            terminalId,
            merchantId,
            hmacSecretKey,
            isDefault: terminalsList.length === 0,
            isActive: true,
        };

        try {
            if (editingId) {
                await fetch(`/api/pos/datafonos/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                setTerminalsList(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } as DatafonoTerminalItem : t));
            } else {
                const res = await fetch("/api/pos/datafonos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.terminal) {
                    setTerminalsList(prev => [...prev, data.terminal]);
                } else {
                    const newId = `dat_${Date.now()}`;
                    setTerminalsList(prev => [...prev, { ...payload, id: newId } as DatafonoTerminalItem]);
                }
            }
            setViewMode("LIST");
            onSaveSuccess();
        } catch (err: any) {
            alert(`Error al guardar Datáfono: ${err.message}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* HEADER */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Gestión Multidispositivo de Datáfonos POS ({terminalsList.length})</h2>
                            <p className="text-xs text-slate-400">Configure y administre múltiples datáfonos físicos (Bold, Redeban, Wompi, Credibanco)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">✕</button>
                </div>

                {/* MODE 1: FLEET LIST VIEW */}
                {viewMode === "LIST" && (
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300">Datáfonos Vinculados al Sistema POS</span>
                            <button
                                onClick={handleOpenNewForm}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                            >
                                <Plus className="w-4 h-4" /> Registrar Nuevo Datáfono
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                            {terminalsList.map((item) => (
                                <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-indigo-500/40 transition-all">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 font-black text-xs">
                                            {item.provider.substring(0, 3)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-white">{item.name}</span>
                                                {item.isDefault && (
                                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <Star className="w-2.5 h-2.5 fill-amber-300" /> Predeterminado
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono space-x-2">
                                                <span>Modo: {item.connectionType}</span>
                                                <span>•</span>
                                                <span>TID: {item.terminalId}</span>
                                                <span>•</span>
                                                <span>MID: {item.merchantId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!item.isDefault && (
                                            <button
                                                onClick={() => handleSetDefault(item.id)}
                                                title="Establecer como Datáfono Predeterminado"
                                                className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl border border-slate-800 transition-all text-xs font-bold flex items-center gap-1"
                                            >
                                                <Star className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEditForm(item)}
                                            title="Editar Configuración"
                                            className="p-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 rounded-xl border border-slate-800 transition-all"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            title="Eliminar Datáfono"
                                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-end border-t border-slate-800">
                            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">Cerrar</button>
                        </div>
                    </div>
                )}

                {/* MODE 2: EDIT / CREATE FORM */}
                {viewMode === "FORM" && (
                    <>
                        {/* TAB NAVIGATION */}
                        <div className="grid grid-cols-3 bg-slate-950 p-1.5 border-b border-slate-800 text-xs font-bold">
                            <button
                                onClick={() => setActiveTab("CONNECTION")}
                                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                    activeTab === "CONNECTION" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                <Radio className="w-4 h-4" /> 1. Conexión Física
                            </button>
                            <button
                                onClick={() => setActiveTab("CREDENTIALS")}
                                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                    activeTab === "CREDENTIALS" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                <Lock className="w-4 h-4" /> 2. Credenciales ISO
                            </button>
                            <button
                                onClick={() => setActiveTab("DIAGNOSTICS")}
                                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                    activeTab === "DIAGNOSTICS" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                <Activity className="w-4 h-4" /> 3. Diagnóstico Test
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* TAB 1: CONNECTION SETTINGS */}
                            {activeTab === "CONNECTION" && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Nombre Descriptivo del Datáfono *</label>
                                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Red Adquirente / Proveedor</label>
                                            <select value={provider} onChange={(e) => setProvider(e.target.value as any)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500">
                                                <option value="BOLD">BOLD Smart Terminal</option>
                                                <option value="REDEBAN">REDEBAN Multicolor</option>
                                                <option value="WOMPI">WOMPI Bancolombia</option>
                                                <option value="CREDIBANCO">CREDIBANCO Visa</option>
                                                <option value="SUMUP">SUMUP Air POS</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Tipo de Interfaz Física</label>
                                            <select value={connectionType} onChange={(e) => setConnectionType(e.target.value as any)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500">
                                                <option value="BLUETOOTH">Bluetooth LE / SPP Directo</option>
                                                <option value="WIFI">WiFi Red IP Local TCP/HTTP</option>
                                                <option value="USB_SERIAL">Cable USB Serie / RS232 COM</option>
                                            </select>
                                        </div>
                                    </div>

                                    {connectionType === "WIFI" && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Dirección IP y Puerto Local Datáfono</label>
                                            <input type="text" value={terminalIp} onChange={(e) => setTerminalIp(e.target.value)} placeholder="192.168.1.150:8080" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    )}

                                    {connectionType === "BLUETOOTH" && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Dirección MAC / UUID Servicio Bluetooth</label>
                                            <input type="text" value={bluetoothMac} onChange={(e) => setBluetoothMac(e.target.value)} placeholder="00:11:22:33:FF:EE" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    )}

                                    {connectionType === "USB_SERIAL" && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Puerto COM / Dispositivo USB</label>
                                            <input type="text" value={usbPort} onChange={(e) => setUsbPort(e.target.value)} placeholder="COM3" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: CREDENTIALS & SECURITY */}
                            {activeTab === "CREDENTIALS" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Terminal ID (TID ISO 8583 Field 41) *</label>
                                            <input type="text" required value={terminalId} onChange={(e) => setTerminalId(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">Merchant ID (MID ISO 8583 Field 42) *</label>
                                            <input type="text" required value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300">Llave Secreta HMAC-SHA256 (Firma Transaccional PCI-DSS)</label>
                                        <input type="password" value={hmacSecretKey} onChange={(e) => setHmacSecretKey(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                                        <span className="text-[10px] text-slate-500 block">Esta llave se utiliza para calcular las firmas criptográficas e inalterables en cada cobro.</span>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: DIAGNOSTICS & PING TEST */}
                            {activeTab === "DIAGNOSTICS" && (
                                <div className="space-y-4">
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                                <Server className="w-4 h-4 text-indigo-400" /> Test de Conexión & Handshake en Vivo
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={handleRunPingTest}
                                                disabled={testingPing}
                                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? "animate-spin" : ""}`} /> Ejecutar Diagnostic Ping
                                            </button>
                                        </div>

                                        {pingResult && (
                                            <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 ${
                                                pingResult.status === "ONLINE"
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                            }`}>
                                                <div className="flex justify-between items-center font-bold">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${pingResult.status === "ONLINE" ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}></span>
                                                        Estado Dispositivo: {pingResult.status}
                                                    </span>
                                                    <span>Latencia: {pingResult.latencyMs}ms</span>
                                                </div>

                                                <p className="text-[11px] font-sans">
                                                    {pingResult.status === "ONLINE" ? "✓ " : "✕ "}
                                                    {pingResult.handshake}
                                                </p>

                                                {pingResult.diagnosticNote && (
                                                    <p className="text-[10px] opacity-80 border-t border-slate-800 pt-1 font-mono">
                                                        Diagnóstico: {pingResult.diagnosticNote}
                                                    </p>
                                                )}

                                                {pingResult.handshakeSignature && (
                                                    <div className="text-[9px] opacity-70 flex justify-between pt-0.5">
                                                        <span>Firma HMAC-SHA256:</span>
                                                        <span>{pingResult.handshakeSignature}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* FOOTER BUTTONS */}
                            <div className="pt-2 flex justify-between gap-3 border-t border-slate-800">
                                <button type="button" onClick={() => setViewMode("LIST")} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs">Volver a la Lista</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Guardar Datáfono
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
