"use client";

import { useState, useRef } from "react";
import {
  FileText, ShieldCheck, Printer, CheckCircle2, AlertTriangle,
  User, Calendar, Clock, DollarSign, Calculator, Lock, X, Check,
  Building2, Hash, ArrowDownRight, ArrowUpRight
} from "lucide-react";

export interface ShiftActaData {
  id: string;
  shiftCode: string;
  registerName: string;
  cashierName: string;
  cashierId?: string;
  supervisorName: string;
  supervisorId?: string;
  openedAt: string;
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
    supervisorName: string;
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
  // Conteo de denominaciones interactivo
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    if (shiftData.denominationsCount && typeof shiftData.denominationsCount === "object") {
      return shiftData.denominationsCount;
    }
    return {};
  });

  const [activeTab, setActiveTab] = useState<"ACTA_SUMMARY" | "ARQUEO_CONTEO" | "SUPERVISOR_SIGN">(
    isSupervisorMode ? "ARQUEO_CONTEO" : "ACTA_SUMMARY"
  );

  const [supervisorName, setSupervisorName] = useState(shiftData.supervisorName || "Supervisor de Turno");
  const [supervisorNotes, setSupervisorNotes] = useState(shiftData.supervisorNotes || "");
  const [supervisorPin, setSupervisorPin] = useState("");
  const [supervisorVerdict, setSupervisorVerdict] = useState<"APPROVED" | "APPROVED_DISCREPANCY" | "REJECTED">("APPROVED");
  const [submitting, setSubmitting] = useState(false);

  const printableRef = useRef<HTMLDivElement>(null);

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

  const handleSubmitSupervision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorPin) {
      alert("Por favor ingrese su PIN de Supervisor para certificar el acta.");
      return;
    }
    if (supervisorPin !== "1234") {
      alert("PIN de Supervisor inválido.");
      return;
    }

    if (!onConfirmSupervision) return;

    setSubmitting(true);
    try {
      const finalStatus = currentDiff === 0 ? "CLOSED_BALANCED" : "CLOSED_DISCREPANCY";
      await onConfirmSupervision({
        status: finalStatus,
        supervisorName,
        supervisorNotes: supervisorNotes || `Arqueo validado por supervisor con diferencia de ${fmtCOP(currentDiff)}`,
        supervisorPin,
        declaredCash: declaredOrCalculated,
        denominations: counts,
      });
      alert("✅ Acta de Cierre Z y Supervisión oficial firmada y registrada.");
      onClose();
    } catch (err: any) {
      alert("Error al guardar supervisión: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
                <h2 className="text-base font-bold text-white">Acta Oficial de Turno & Arqueo de Cierre Z</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 text-xs font-mono border border-slate-700">
                  {shiftData.shiftCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría fiscal de caja, cuadre contable DIAN, desglose por denominaciones y visto bueno legal.
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
              onClick={() => setActiveTab("SUPERVISOR_SIGN")}
              className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "SUPERVISOR_SIGN"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Supervisión & Firma de Cierre
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

                {/* Metadatos del Turno */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Caja Registradora</span>
                    <span className="text-white font-bold">{shiftData.registerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Cajero Responsable</span>
                    <span className="text-white font-bold">{shiftData.cashierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Supervisor Encargado</span>
                    <span className="text-teal-300 font-bold">{shiftData.supervisorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Apertura</span>
                    <span className="text-white">{new Date(shiftData.openedAt).toLocaleTimeString("es-CO")}</span>
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
                    <span className="text-slate-400 text-[10px] block">Efectivo Sistema (Base + Ventas)</span>
                    <span className="text-base font-bold text-slate-300">{fmtCOP(shiftData.expectedCash)}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    currentDiff === 0 
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-950/30 border-rose-500/30 text-rose-300"
                  }`}>
                    <span className="text-[10px] block">Diferencia Final</span>
                    <span className="text-base font-bold">{fmtCOP(currentDiff)}</span>
                  </div>
                </div>

                {shiftData.cashierNotes && (
                  <div className="pt-2 text-xs">
                    <span className="text-slate-400 font-bold block mb-1">Observaciones del Cajero:</span>
                    <p className="text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 italic">
                      "{shiftData.cashierNotes}"
                    </p>
                  </div>
                )}

                {shiftData.supervisorNotes && (
                  <div className="pt-2 text-xs">
                    <span className="text-teal-400 font-bold block mb-1">Dictamen del Supervisor:</span>
                    <p className="text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 italic">
                      "{shiftData.supervisorNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Firmas de Responsabilidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-center space-y-2">
                  <div className="h-12 border-b border-dashed border-slate-700 flex items-end justify-center pb-1">
                    <span className="text-xs font-mono text-teal-400 font-bold">{shiftData.cashierName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold block">Firma Cajero Responsable</span>
                  <p className="text-[10px] text-slate-500">Declara la entrega exacta del efectivo y comprobantes.</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-center space-y-2">
                  <div className="h-12 border-b border-dashed border-slate-700 flex items-end justify-center pb-1">
                    <span className="text-xs font-mono text-indigo-400 font-bold">{shiftData.supervisorName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold block">Firma & Visto Bueno Supervisor</span>
                  <p className="text-[10px] text-slate-500">Valida la recepción conforme para ingreso a tesorería.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARQUEO FÍSICO Y CONTEO POR DENOMINACIÓN */}
          {activeTab === "ARQUEO_CONTEO" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">Desglose Físico por Denominación</h4>
                  <p className="text-xs text-slate-400">Ingresa la cantidad física contada de cada billete y moneda.</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-slate-400 block">Total Físico Contado</span>
                  <span className="text-lg font-bold text-teal-400">{fmtCOP(calculatedPhysicalCash)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_DENOMINATIONS.map((den) => {
                  const qty = counts[den.key] || 0;
                  const subtotalDen = qty * den.value;
                  return (
                    <div key={den.key} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-white block">{den.label}</span>
                        <span className="text-[11px] font-mono text-teal-400 font-bold">{fmtCOP(subtotalDen)}</span>
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

          {/* TAB 3: SUPERVISIÓN Y FIRMA DE CIERRE */}
          {activeTab === "SUPERVISOR_SIGN" && isSupervisorMode && (
            <form onSubmit={handleSubmitSupervision} className="space-y-5">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-teal-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Validación y Firma de Supervisor</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Nombre del Supervisor *</label>
                    <input
                      type="text"
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">PIN de Seguridad (Ej. 1234) *</label>
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
                  <label className="text-slate-400 font-bold block mb-1 text-xs">Dictamen / Notas de Cierre</label>
                  <textarea
                    value={supervisorNotes}
                    onChange={(e) => setSupervisorNotes(e.target.value)}
                    rows={3}
                    placeholder="Escriba comentarios sobre el arqueo, justificación de diferencias o novedades..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

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
                  {submitting ? "Firmando Acta..." : "Aprobar & Certificar Acta Z"}
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
            <span>Audit Trail Inmutable</span>
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
