"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText, ShieldCheck, Printer, CheckCircle2, AlertTriangle,
  User, Calendar, Clock, DollarSign, Calculator, Lock, X, Check,
  Building2, Hash, ArrowDownRight, ArrowUpRight, Key, Users
} from "lucide-react";

export interface ShiftActaData {
  id: string;
  shiftCode: string;
  registerName: string;
  cashierName: string;
  cashierId?: string;
  cashierApproved?: boolean;
  cashierSignedAt?: string | null;
  supervisorName: string;
  supervisorId?: string;
  supervisorApproved?: boolean;
  supervisorSignedAt?: string | null;
  openedAt: string;
  declaredClosedAt?: string | null;
  verifiedClosedAt?: string | null;
  openingFloat: number;
  expectedCash: number;
  declaredCash?: number | null;
  difference: number;
  totalSales: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  transferSalesTotal: number;
  creditSalesTotal: number;
  orderCount: number;
  cashierNotes?: string | null;
  supervisorNotes?: string | null;
  status: string;
  denominationsCount?: any;
}

interface ShiftClosingActaModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: ShiftActaData;
  isSupervisorMode?: boolean; // Si está cerrando o auditando
  onConfirmSupervision?: (acta: {
    status: string;
    cashierId?: string;
    cashierName: string;
    cashierApproved: boolean;
    cashierSignedAt: string;
    cashierPin?: string;
    cashierNotes?: string;
    supervisorId?: string;
    supervisorName: string;
    supervisorApproved: boolean;
    supervisorSignedAt: string;
    supervisorNotes: string;
    supervisorPin: string;
    declaredCash: number;
    denominations: Record<string, number>;
  }) => Promise<void>;
}

const DEFAULT_DENOMINATIONS = [
  { key: "billete_100k", label: "Billete $ 100.000", value: 100000 },
  { key: "billete_50k", label: "Billete $ 50.000", value: 50000 },
  { key: "billete_20k", label: "Billete $ 20.000", value: 20000 },
  { key: "billete_10k", label: "Billete $ 10.000", value: 10000 },
  { key: "billete_5k", label: "Billete $ 5.000", value: 5000 },
  { key: "billete_2k", label: "Billete $ 2.000", value: 2000 },
  { key: "moneda_1k", label: "Moneda $ 1.000", value: 1000 },
  { key: "moneda_500", label: "Moneda $ 500", value: 500 },
  { key: "moneda_200", label: "Moneda $ 200", value: 200 },
  { key: "moneda_100", label: "Moneda $ 100", value: 100 },
  { key: "moneda_50", label: "Moneda $ 50", value: 50 },
];

export function ShiftClosingActaModal({
  isOpen,
  onClose,
  shiftData,
  isSupervisorMode = false,
  onConfirmSupervision,
}: ShiftClosingActaModalProps) {
  const [activeTab, setActiveTab] = useState<"ACTA_SUMMARY" | "ARQUEO_CONTEO" | "DUAL_APPROVAL">("ACTA_SUMMARY");

  // Denominaciones físicas de efectivo
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    return shiftData.denominationsCount || {};
  });

  // Usuarios elegibles activos desde la base de datos
  const [eligibleUsers, setEligibleUsers] = useState<{
    cashiers: Array<{ id: string; name: string; email: string; role: string }>;
    supervisors: Array<{ id: string; name: string; email: string; role: string }>;
  }>({ cashiers: [], supervisors: [] });
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Estados de aprobación del CAJERO
  const [selectedCashierId, setSelectedCashierId] = useState(shiftData.cashierId || "");
  const [cashierName, setCashierName] = useState(shiftData.cashierName || "");
  const [cashierPin, setCashierPin] = useState("");
  const [cashierNotes, setCashierNotes] = useState(shiftData.cashierNotes || "");
  const [cashierAprobado, setCashierAprobado] = useState(true);

  // Estados de aprobación del SUPERVISOR
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(shiftData.supervisorId || "");
  const [supervisorName, setSupervisorName] = useState(shiftData.supervisorName || "Supervisor General");
  const [supervisorPin, setSupervisorPin] = useState("");
  const [supervisorNotes, setSupervisorNotes] = useState(shiftData.supervisorNotes || "");
  const [supervisorAprobado, setSupervisorAprobado] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  // Cargar usuarios activos elegibles
  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/pos/users/eligible");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setEligibleUsers({
              cashiers: data.cashiers || [],
              supervisors: data.supervisors || [],
            });
            // Si el cajero actual está en la lista, asegurar su ID
            if (!selectedCashierId && data.cashiers.length > 0) {
              const found = data.cashiers.find((c: any) => c.name === shiftData.cashierName) || data.cashiers[0];
              setSelectedCashierId(found.id);
              setCashierName(found.name);
            }
            // Si el supervisor no tiene ID
            if (!selectedSupervisorId && data.supervisors.length > 0) {
              const foundSup = data.supervisors.find((s: any) => s.name === shiftData.supervisorName) || data.supervisors[0];
              setSelectedSupervisorId(foundSup.id);
              setSupervisorName(foundSup.name);
            }
          }
        }
      } catch (err) {
        console.warn("[ShiftClosingActaModal] Error cargando usuarios:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const fmtCOP = (val: number) => `$ ${Number(val || 0).toLocaleString("es-CO")}`;

  // Calcular total físico a partir de denominaciones
  const calculatedPhysicalCash = DEFAULT_DENOMINATIONS.reduce((acc, d) => {
    const qty = counts[d.key] || 0;
    return acc + (qty * d.value);
  }, 0);

  const declaredOrCalculated = isSupervisorMode
    ? calculatedPhysicalCash
    : (shiftData.declaredCash ?? calculatedPhysicalCash);

  const currentDiff = declaredOrCalculated - shiftData.expectedCash;

  const handleCountChange = (key: string, qty: number) => {
    setCounts(prev => ({
      ...prev,
      [key]: Math.max(0, qty)
    }));
  };

  const handlePrintThermal = () => {
    window.print();
  };

  const handleCashierSelect = (userId: string) => {
    setSelectedCashierId(userId);
    const u = eligibleUsers.cashiers.find(c => c.id === userId);
    if (u) setCashierName(u.name);
  };

  const handleSupervisorSelect = (userId: string) => {
    setSelectedSupervisorId(userId);
    const u = eligibleUsers.supervisors.find(s => s.id === userId);
    if (u) setSupervisorName(u.name);
  };

  const handleSubmitDualApproval = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cashierAprobado) {
      alert("El cajero debe marcar su casilla de conformidad y aprobación del arqueo.");
      return;
    }

    if (!supervisorAprobado) {
      alert("El supervisor debe marcar su casilla de verificación y dictamen favorable.");
      return;
    }

    if (!supervisorPin) {
      alert("Por favor ingrese el PIN de seguridad del Supervisor para sellar el acta.");
      return;
    }

    if (supervisorPin !== "1234") {
      alert("PIN de Supervisor inválido. Ingrese el PIN autorizado para cerrar turnos.");
      return;
    }

    if (!onConfirmSupervision) return;

    setSubmitting(true);
    try {
      const finalStatus = currentDiff === 0 ? "CLOSED_BALANCED" : "CLOSED_DISCREPANCY";
      const nowIso = new Date().toISOString();

      await onConfirmSupervision({
        status: finalStatus,
        cashierId: selectedCashierId || shiftData.cashierId,
        cashierName: cashierName || shiftData.cashierName,
        cashierApproved: true,
        cashierSignedAt: nowIso,
        cashierPin: cashierPin || undefined,
        cashierNotes: cashierNotes || undefined,
        supervisorId: selectedSupervisorId || shiftData.supervisorId,
        supervisorName: supervisorName || shiftData.supervisorName,
        supervisorApproved: true,
        supervisorSignedAt: nowIso,
        supervisorNotes: supervisorNotes || `Arqueo con doble firma cajero/supervisor. Diferencia: ${fmtCOP(currentDiff)}`,
        supervisorPin,
        declaredCash: declaredOrCalculated,
        denominations: counts,
      });

      alert("✅ Acta Oficial Z firmada y aprobada con éxito por ambas partes (Cajero y Supervisor).");
      onClose();
    } catch (err: any) {
      alert("Error al registrar acta de doble aprobación: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closedDateDisplay = shiftData.verifiedClosedAt
    ? new Date(shiftData.verifiedClosedAt).toLocaleString("es-CO")
    : `${new Date().toLocaleDateString("es-CO")} ${new Date().toLocaleTimeString("es-CO")} (Hora Actual de Cierre)`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* HEADER DE ACTA OFICIAL */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Acta Oficial de Turno & Arqueo Z</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-400 text-xs font-mono border border-slate-700">
                  {shiftData.shiftCode}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  DOBLE APROBACIÓN REQUERIDA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría fiscal de caja, trazabilidad de horas de apertura y cierre, y firmas mancomunadas de Cajero y Supervisor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintThermal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Imprimir Acta"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUBNAVEGACIÓN DE PESTAÑAS */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-4">
          <button
            onClick={() => setActiveTab("ACTA_SUMMARY")}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "ACTA_SUMMARY"
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Acta Contable Z
          </button>
          <button
            onClick={() => setActiveTab("ARQUEO_CONTEO")}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "ARQUEO_CONTEO"
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Arqueo Físico (Billetes / Monedas)
          </button>
          {isSupervisorMode && (
            <button
              onClick={() => setActiveTab("DUAL_APPROVAL")}
              className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "DUAL_APPROVAL"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Doble Aprobación & Firmas
            </button>
          )}
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: ACTA CONTABLE Z RESUMEN */}
          {activeTab === "ACTA_SUMMARY" && (
            <div ref={printableRef} className="space-y-6 print:text-black">
              {/* Membrete del Acta */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-400" />
                      ACTA DE ARQUEO Y CIERRE FISCAL DE CAJA
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Consecutivo Legal: <span className="text-teal-400 font-bold">{shiftData.shiftCode}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      currentDiff === 0
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    }`}>
                      {currentDiff === 0 ? "● CUADRE EXACTO" : `▲ DESCUADRE: ${fmtCOP(currentDiff)}`}
                    </span>
                  </div>
                </div>

                {/* Metadatos del Turno y Tiempos de Apertura / Cierre */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Caja Registradora</span>
                    <span className="text-white font-bold">{shiftData.registerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Cajero Asignado</span>
                    <span className="text-white font-bold">{cashierName || shiftData.cashierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Supervisor Encargado</span>
                    <span className="text-teal-300 font-bold">{supervisorName || shiftData.supervisorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Estado de Turno</span>
                    <span className="text-amber-400 font-bold uppercase">{shiftData.status}</span>
                  </div>
                </div>

                {/* Registro Inmutable de Tiempos de Auditoría */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Fecha & Hora Exacta de Apertura</span>
                      <span className="text-white font-mono font-bold">
                        {new Date(shiftData.openedAt).toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Fecha & Hora Exacta de Cierre</span>
                      <span className="text-white font-mono font-bold">
                        {closedDateDisplay}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de Valores Contables */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Base Inicial de Caja</span>
                  <span className="text-lg font-mono font-bold text-slate-200">{fmtCOP(shiftData.openingFloat)}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Ventas en Efectivo</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{fmtCOP(shiftData.cashSalesTotal)}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Efectivo Teórico Esperado</span>
                  <span className="text-lg font-mono font-bold text-teal-400">{fmtCOP(shiftData.expectedCash)}</span>
                </div>
              </div>

              {/* Comparativa: Esperado vs Físico */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dictamen de Arqueo Físico</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Efectivo Físico Declarado</span>
                    <span className="text-base font-bold text-white">{fmtCOP(declaredOrCalculated)}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Total Ventas Electrónicas</span>
                    <span className="text-base font-bold text-sky-400">
                      {fmtCOP(shiftData.cardSalesTotal + shiftData.transferSalesTotal)}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    currentDiff === 0
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}>
                    <span className="text-[10px] opacity-80 block">Discrepancia / Diferencia</span>
                    <span className="text-base font-bold">{fmtCOP(currentDiff)}</span>
                  </div>
                </div>
              </div>

              {/* Registro de Doble Firma en Acta */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Firmas y Certificación Mancomunada</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-400" /> Firma del Cajero
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        CONFORME
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-bold">{cashierName || shiftData.cashierName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Certifico haber contado físicamente el dinero de caja en presencia de la supervisión.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Firma del Supervisor
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                        SUPERVISADO
                      </span>
                    </div>
                    <p className="text-xs text-teal-300 font-bold">{supervisorName || shiftData.supervisorName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      PIN y credenciales verificadas. Arqueo fiscal ratificado sin enmiendas.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ARQUEO FÍSICO POR DENOMINACIONES */}
          {activeTab === "ARQUEO_CONTEO" && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Desglose Físico por Billetes y Monedas</h4>
                  <p className="text-xs text-slate-400">Ingrese la cantidad contada de cada denominación para el arqueo ciego.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Físico Contado:</span>
                  <span className="text-lg font-mono font-bold text-teal-400">{fmtCOP(calculatedPhysicalCash)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DEFAULT_DENOMINATIONS.map(den => {
                  const qty = counts[den.key] || 0;
                  const subtotal = qty * den.value;
                  return (
                    <div key={den.key} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">{den.label}</span>
                        <span className="text-[11px] font-mono text-teal-400">{fmtCOP(subtotal)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCountChange(den.key, qty - 1)}
                          className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty === 0 ? "" : qty}
                          onChange={(e) => handleCountChange(den.key, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-16 text-center bg-slate-900 border border-slate-700 rounded-xl py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleCountChange(den.key, qty + 1)}
                          className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra de Diferencia en Vivo */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                currentDiff === 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}>
                <div>
                  <span className="text-xs font-bold block">
                    {currentDiff === 0 ? "✓ Cuadre Físico Perfecto" : "▲ Diferencia en Efectivo"}
                  </span>
                  <span className="text-[11px] opacity-80">
                    Esperado en sistema: {fmtCOP(shiftData.expectedCash)}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-base font-bold">{fmtCOP(currentDiff)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOBLE APROBACIÓN (CAJERO & SUPERVISOR) */}
          {activeTab === "DUAL_APPROVAL" && isSupervisorMode && (
            <form onSubmit={handleSubmitDualApproval} className="space-y-6">
              
              {/* SECCIÓN 1: FIRMA Y CONFORMIDAD DEL CAJERO */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-teal-400">
                  <User className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">1. Aprobación y Conformidad del Cajero</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Cajero Activo Responsable *</label>
                    <select
                      value={selectedCashierId}
                      onChange={(e) => handleCashierSelect(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                    >
                      {eligibleUsers.cashiers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">PIN / Validación de Cajero (Opcional)</label>
                    <input
                      type="password"
                      value={cashierPin}
                      onChange={(e) => setCashierPin(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tracking-widest focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1 text-xs">Observaciones del Cajero</label>
                  <input
                    type="text"
                    value={cashierNotes}
                    onChange={(e) => setCashierNotes(e.target.value)}
                    placeholder="Comentarios del cajero sobre billetes deteriorados, faltantes o turnos..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-teal-300">
                      Yo, {cashierName}, apruebo el arqueo físico y el cierre de este turno.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cashierAprobado}
                    onChange={(e) => setCashierAprobado(e.target.checked)}
                    className="w-5 h-5 accent-teal-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: DICTAMEN Y FIRMA DEL SUPERVISOR */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">2. Certificación y Firma del Supervisor Habilitado</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Supervisor Activo Autorizado *</label>
                    <select
                      value={selectedSupervisorId}
                      onChange={(e) => handleSupervisorSelect(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                    >
                      {eligibleUsers.supervisors.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">PIN Maestro de Supervisor (PIN: 1234) *</label>
                    <input
                      type="password"
                      value={supervisorPin}
                      onChange={(e) => setSupervisorPin(e.target.value)}
                      placeholder="••••"
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tracking-widest focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1 text-xs">Dictamen / Notas de Cierre del Supervisor</label>
                  <textarea
                    value={supervisorNotes}
                    onChange={(e) => setSupervisorNotes(e.target.value)}
                    rows={2}
                    placeholder="Escriba comentarios sobre el arqueo, justificación de diferencias o novedades..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300">
                      Yo, {supervisorName}, valido y otorgo la aprobación de supervisión al Acta Z.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={supervisorAprobado}
                    onChange={(e) => setSupervisorAprobado(e.target.checked)}
                    className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 flex items-center gap-2"
                >
                  {submitting ? "Firmando Acta..." : "Aprobar & Certificar con Doble Firma"}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span>DIAN POS 2.0</span>
            <span>•</span>
            <span>Doble Aprobación Obligatoria</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
