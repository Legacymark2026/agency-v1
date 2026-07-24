"use client";

import { useState } from "react";
import { CreditCard, Wifi, CheckCircle2, RefreshCw, AlertTriangle, ShieldCheck, Zap, Smartphone, Radio } from "lucide-react";

interface SmartPosTerminalModalProps {
    amount: number;
    customerName: string;
    onClose: () => void;
    onPaymentApproved: (approvalCode: string, cardType: string) => void;
}

export function SmartPosTerminalModal({ amount, customerName, onClose, onPaymentApproved }: SmartPosTerminalModalProps) {
    const [status, setStatus] = useState<"IDLE" | "PAIRING" | "TRANSMITTING" | "APPROVED" | "FAILED">("IDLE");
    const [selectedProvider, setSelectedProvider] = useState<"BOLD" | "REDEBAN" | "WOMPI" | "CREDIBANCO">("BOLD");
    const [connectionType, setConnectionType] = useState<"BLUETOOTH" | "WIFI" | "USB_SERIAL">("BLUETOOTH");
    const [terminalIp, setTerminalIp] = useState("192.168.1.150:8080");
    const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null);
    const [approvalDetails, setApprovalDetails] = useState<{ code: string; card: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fmtCOP = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

    // ── 1. REAL WEB-BLUETOOTH HARDWARE DRIVER ────────────────────────────────
    const handleBluetoothPairingAndTransmit = async () => {
        setStatus("PAIRING");
        setErrorMessage(null);

        try {
            if (!navigator.bluetooth) {
                // Browser doesn't support WebBluetooth natively, switch to direct API transport
                return await executeNetworkTransmission();
            }

            // Request Bluetooth device pairing via Browser Dialog
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    "0000ffe0-0000-1000-8000-00805f9b34fb",
                    "0000180f-0000-1000-8000-00805f9b34fb",
                    "00001101-0000-1000-8000-00805f9b34fb"
                ]
            });

            setBluetoothDeviceName(device.name || "Datáfono Bluetooth POS");
            setStatus("TRANSMITTING");

            // Connect to GATT Server
            if (device.gatt) {
                const server = await device.gatt.connect();
                console.log(`📡 Datáfono Bluetooth Conectado: ${device.name}`);

                // Try writing transaction binary payload to GATT service if available
                const services = await server.getPrimaryServices();
                if (services.length > 0) {
                    const characteristics = await services[0].getCharacteristics();
                    if (characteristics.length > 0) {
                        // Protocol Binary Packet: [STX (0x02), CMD_SALE (0x30), Amount (12 bytes), ETX (0x03)]
                        const textEncoder = new TextEncoder();
                        const amountStr = String(Math.round(amount * 100)).padStart(12, "0");
                        const payload = textEncoder.encode(`\x0230${amountStr}\x03`);
                        await characteristics[0].writeValueWithResponse(payload);
                    }
                }
            }

            await executeNetworkTransmission();
        } catch (err: any) {
            console.warn("Notice during WebBluetooth flow:", err.message);
            // If user cancelled browser picker or BLE missing, execute server gateway transmission
            await executeNetworkTransmission();
        }
    };

    // ── 2. REAL WEB-SERIAL (USB POS CABLE) DRIVER ─────────────────────────────
    const handleUsbSerialTransmit = async () => {
        setStatus("PAIRING");
        setErrorMessage(null);

        try {
            if ("serial" in navigator) {
                const navSerial = (navigator as any).serial;
                const port = await navSerial.requestPort();
                await port.open({ baudRate: 115200 });

                const writer = port.writable.getWriter();
                const encoder = new TextEncoder();
                const packet = encoder.encode(`POS_SALE|AMOUNT:${amount}|CURR:COP\n`);
                await writer.write(packet);
                writer.releaseLock();
            }
            await executeNetworkTransmission();
        } catch (err: any) {
            await executeNetworkTransmission();
        }
    };

    // ── 3. REAL NETWORK HTTP / GATEWAY TRANSMISSION ──────────────────────────
    const executeNetworkTransmission = async () => {
        setStatus("TRANSMITTING");
        try {
            const res = await fetch("/api/pos/terminal/transmit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: selectedProvider,
                    terminalIp: connectionType === "WIFI" ? terminalIp : undefined,
                    amount,
                    reference: `REF-${Date.now()}`,
                    customerName
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setApprovalDetails({
                    code: data.approvalCode,
                    card: data.cardType
                });
                setStatus("APPROVED");
            } else {
                setErrorMessage(data.error || "Error al comunicarse con el Datáfono.");
                setStatus("FAILED");
            }
        } catch (err: any) {
            setErrorMessage("Error de conexión red con el Datáfono.");
            setStatus("FAILED");
        }
    };

    const handleStartTransmit = () => {
        if (connectionType === "BLUETOOTH") handleBluetoothPairingAndTransmit();
        else if (connectionType === "USB_SERIAL") handleUsbSerialTransmit();
        else executeNetworkTransmission();
    };

    const handleConfirm = () => {
        if (approvalDetails) {
            onPaymentApproved(approvalDetails.code, approvalDetails.card);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                {/* HEADER */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Datáfono POS Hardware Directo</h3>
                            <p className="text-xs text-slate-400">Transmisión física por WebBluetooth / WiFi IP / USB</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
                </div>

                {/* CONNECTION TYPE SELECTOR */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                        onClick={() => setConnectionType("BLUETOOTH")}
                        className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                            connectionType === "BLUETOOTH" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Radio className="w-3.5 h-3.5" /> Bluetooth
                    </button>
                    <button
                        onClick={() => setConnectionType("WIFI")}
                        className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                            connectionType === "WIFI" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Wifi className="w-3.5 h-3.5" /> WiFi Red IP
                    </button>
                    <button
                        onClick={() => setConnectionType("USB_SERIAL")}
                        className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                            connectionType === "USB_SERIAL" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5" /> Cable USB
                    </button>
                </div>

                {/* PROVIDER SELECTOR */}
                <div className="grid grid-cols-4 gap-2">
                    {(["BOLD", "REDEBAN", "WOMPI", "CREDIBANCO"] as const).map((prov) => (
                        <button
                            key={prov}
                            onClick={() => setSelectedProvider(prov)}
                            className={`py-1.5 rounded-xl text-[11px] font-extrabold border transition-all ${
                                selectedProvider === prov
                                    ? "bg-teal-600 border-teal-500 text-white shadow-md"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                        >
                            {prov}
                        </button>
                    ))}
                </div>

                {/* WIFI IP INPUT IF SELECTED */}
                {connectionType === "WIFI" && (
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Dirección IP del Datáfono en Red Local</label>
                        <input
                            type="text"
                            value={terminalIp}
                            onChange={(e) => setTerminalIp(e.target.value)}
                            placeholder="192.168.1.150:8080"
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                )}

                {/* AMOUNT DISPLAY */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                    <span className="text-xs text-slate-400">Monto A Transmitir al Datáfono {selectedProvider}:</span>
                    <div className="text-2xl font-black text-teal-400 font-mono">{fmtCOP(amount)}</div>
                    <span className="text-[11px] text-slate-400 block">Cliente: {customerName || "Consumidor Final"}</span>
                </div>

                {/* LIVE HARDWARE STATUS DISPLAY */}
                <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3 text-center min-h-[160px]">
                    {status === "IDLE" && (
                        <>
                            <Smartphone className="w-8 h-8 text-indigo-400" />
                            <span className="font-bold text-xs text-slate-200">Datáfono {selectedProvider} Listo</span>
                            <button
                                onClick={handleStartTransmit}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4" /> Transmitir ${amount.toLocaleString("es-CO")} al Datáfono
                            </button>
                        </>
                    )}

                    {status === "PAIRING" && (
                        <>
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="font-bold text-xs text-indigo-300">Emparejando Dispositivo {connectionType}...</span>
                            <span className="text-[11px] text-slate-400">Buscando datáfono por canal físico WebBluetooth/USB</span>
                        </>
                    )}

                    {status === "TRANSMITTING" && (
                        <>
                            <Radio className="w-8 h-8 text-amber-400 animate-pulse" />
                            <span className="font-bold text-xs text-amber-300">Transmitiendo Monto al Datáfono {selectedProvider}...</span>
                            <span className="text-[11px] text-slate-400">Deslice o acerque la tarjeta en la pantalla del Datáfono.</span>
                            {bluetoothDeviceName && (
                                <span className="text-[10px] bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 border border-indigo-500/30">
                                    Dispositivo: {bluetoothDeviceName}
                                </span>
                            )}
                        </>
                    )}

                    {status === "APPROVED" && approvalDetails && (
                        <>
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            <div>
                                <span className="font-extrabold text-sm text-emerald-300 block">TRANSACCIÓN APROBADA #{approvalDetails.code}</span>
                                <span className="text-xs text-slate-400 font-mono">{approvalDetails.card}</span>
                            </div>
                        </>
                    )}

                    {status === "FAILED" && (
                        <>
                            <AlertTriangle className="w-8 h-8 text-rose-400" />
                            <span className="font-bold text-xs text-rose-400">{errorMessage || "Error en la transmisión al Datáfono"}</span>
                            <button onClick={handleStartTransmit} className="text-xs text-indigo-400 underline font-bold mt-1">Reintentar Transmisión</button>
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={status !== "APPROVED"}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                        <ShieldCheck className="w-4 h-4" /> Vincular a la Factura
                    </button>
                </div>
            </div>
        </div>
    );
}
