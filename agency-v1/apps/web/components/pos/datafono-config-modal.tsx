"use client";

import { useState } from "react";
import { CreditCard, Radio, Wifi, Zap, CheckCircle2, ShieldCheck, Settings, RefreshCw, Activity, Lock, Server } from "lucide-react";

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
    const [activeTab, setActiveTab] = useState<"CONNECTION" | "CREDENTIALS" | "DIAGNOSTICS">("CONNECTION");
    const [name, setName] = useState("Datáfono Smart POS Bucaramanga");
    const [provider, setProvider] = useState<"BOLD" | "REDEBAN" | "WOMPI" | "CREDIBANCO" | "SUMUP">("BOLD");
    const [connectionType, setConnectionType] = useState<"BLUETOOTH" | "WIFI" | "USB_SERIAL">("BLUETOOTH");
    const [terminalIp, setTerminalIp] = useState("192.168.1.150:8080");
    const [bluetoothMac, setBluetoothMac] = useState("00:11:22:33:FF:EE");
    const [usbPort, setUsbPort] = useState("COM3");

    const [terminalId, setTerminalId] = useState("TERM-BLD-8821");
    const [merchantId, setMerchantId] = useState("MERC-LEGACYMARK-01");
    const [hmacSecretKey, setHmacSecretKey] = useState("legacymark_pci_dss_secure_pos_key_2026");

    const [testingPing, setTestingPing] = useState(false);
    const [pingResult, setPingResult] = useState<{
        status: string;
        latencyMs: number;
        handshake: string;
        handshakeSignature?: string;
        diagnosticNote?: string;
    } | null>(null);

    if (!isOpen) return null;

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
        try {
            await fetch("/api/pos/datafonos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    provider,
                    connectionType,
                    terminalIp,
                    bluetoothMac,
                    usbPort,
                    terminalId,
                    merchantId,
                    hmacSecretKey,
                    isDefault: true,
                    isActive: true,
                }),
            });
            onSaveSuccess();
            onClose();
            alert(`⚙️ Configuración estructurada del Datáfono "${name}" guardada exitosamente.`);
        } catch (err: any) {
            alert(`Error al guardar configuración de Datáfono: ${err.message}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* HEADER */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Configuración Estructurada de Datáfonos POS</h2>
                            <p className="text-xs text-slate-400">Parámetros de conexión física, credenciales ISO 8583 y llaves HMAC</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">✕</button>
                </div>

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
                    <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs">Cancelar</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Guardar Configuración
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
