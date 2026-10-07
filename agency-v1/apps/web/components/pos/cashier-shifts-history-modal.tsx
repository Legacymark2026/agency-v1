"use client";

import { useState } from "react";
import { 
  History, Users, User, ShieldCheck, Calendar, Clock, 
  DollarSign, CheckCircle2, AlertTriangle, Filter, Search, 
  ChevronRight, ArrowUpDown, X, Printer, Lock
} from "lucide-react";

interface ShiftRecord {
  id: string;
  shiftCode: string;
  registerName: string;
  cashierName: string;
  cashierId: string;
  supervisorName?: string;
  status: string;
  openedAt: string;
  verifiedClosedAt?: string;
  openingFloat: number;
  declaredCash?: number;
  expectedCash: number;
  difference: number;
  totalSales: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  transferSalesTotal: number;
  creditSalesTotal: number;
  orderCount: number;
  cashierNotes?: string;
  supervisorNotes?: string;
}

interface CashierShiftsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: ShiftRecord[];
  cashiers: Array<{ id: string; name: string }>;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

export function CashierShiftsHistoryModal({
  isOpen,
  onClose,
  shifts,
  cashiers,
  onRefresh,
  isLoading = false,
}: CashierShiftsHistoryModalProps) {
  const [selectedCashier, setSelectedCashier] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<ShiftRecord | null>(null);

  if (!isOpen) return null;

  const formatCOP = (val: number) => `$ ${Number(val || 0).toLocaleString("es-CO")}`;

  const filteredShifts = shifts.filter((s) => {
    const matchesCashier = selectedCashier === "ALL" || s.cashierId === selectedCashier || s.cashierName === selectedCashier;
    const matchesStatus = selectedStatus === "ALL" || s.status === selectedStatus;
    const matchesSearch =
      s.shiftCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.registerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.supervisorName && s.supervisorName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCashier && matchesStatus && matchesSearch;
  });

  // Métricas agregadas del filtro seleccionado
  const totalVolume = filteredShifts.reduce((acc, s) => acc + s.totalSales, 0);
  const totalOrders = filteredShifts.reduce((acc, s) => acc + s.orderCount, 0);
  const totalDifference = filteredShifts.reduce((acc, s) => acc + s.difference, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Historial de Turnos y Cajeros</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 text-[10px] font-mono border border-slate-700">
                  {filteredShifts.length} turnos registrados
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría individual de ventas, base de caja, conteo ciego y visto bueno de supervisor por turno.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar & Metrics */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Filtro por Cajero */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-400" /> Filtrar por Cajero
              </label>
              <select
                value={selectedCashier}
                onChange={(e) => setSelectedCashier(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 text-white p-2.5 outline-none focus:border-teal-500"
              >
                <option value="ALL">Todos los cajeros</option>
                {cashiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Estado de Turno
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 text-white p-2.5 outline-none focus:border-teal-500"
              >
                <option value="ALL">Todos los estados</option>
                <option value="OPEN">En Curso (Abierto)</option>
                <option value="PENDING_SUPERVISION">Pendiente de Supervisor</option>
                <option value="CLOSED_BALANCED">Cerrado Exacto (Auditado)</option>
                <option value="CLOSED_DISCREPANCY">Cerrado con Descuadre</option>
              </select>
            </div>

            {/* Búsqueda rápida */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-slate-400" /> Buscar Turno o Supervisor
              </label>
              <input
                type="text"
                placeholder="Código de turno, caja, cajero o supervisor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 text-white p-2.5 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Total Ventas Filtradas</span>
                <span className="text-sm font-black text-emerald-400 font-mono">{formatCOP(totalVolume)}</span>
              </div>
              <DollarSign className="w-5 h-5 text-emerald-400/30" />
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Órdenes Atendidas</span>
                <span className="text-sm font-black text-white font-mono">{totalOrders} tiquetes</span>
              </div>
              <Users className="w-5 h-5 text-teal-400/30" />
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Balance de Descuadres</span>
                <span className={`text-sm font-black font-mono ${totalDifference === 0 ? "text-slate-300" : totalDifference > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {totalDifference === 0 ? "Cuadre $ 0" : formatCOP(totalDifference)}
                </span>
              </div>
              <ShieldCheck className="w-5 h-5 text-indigo-400/30" />
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredShifts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <History className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
              <p className="text-sm">No se encontraron turnos con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredShifts.map((shift) => {
                const isOpen = shift.status === "OPEN";
                const isPending = shift.status === "PENDING_SUPERVISION";
                const isBalanced = shift.status === "CLOSED_BALANCED";
                const isDiscrepancy = shift.status === "CLOSED_DISCREPANCY";

                return (
                  <div
                    key={shift.id}
                    onClick={() => setSelectedShiftDetails(shift)}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 rounded-2xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isOpen
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isPending
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : isBalanced
                          ? "bg-slate-800 text-teal-400 border border-slate-700"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}>
                        {isOpen ? "ACT" : isPending ? "REV" : isBalanced ? "OK" : "DIF"}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{shift.shiftCode}</span>
                          <span className="text-[11px] text-slate-400">• {shift.registerName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOpen
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : isPending
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : isBalanced
                              ? "bg-slate-800 text-teal-300 border border-teal-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}>
                            {isOpen ? "En Curso" : isPending ? "Por Supervisar" : isBalanced ? "Cuadrado Exacto" : "Con Descuadre"}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 text-slate-200 font-medium">
                            <User className="w-3.5 h-3.5 text-teal-400" /> Cajero: <strong className="text-white">{shift.cashierName}</strong>
                          </span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Supervisor: <strong className="text-indigo-300">{shift.supervisorName || "En turno"}</strong>
                          </span>
                          <span className="text-slate-500 text-[11px] hidden sm:inline">
                            Apertura: {new Date(shift.openedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-slate-800/80 pt-2 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Ventas del Turno ({shift.orderCount})</span>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono">{formatCOP(shift.totalSales)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Diferencia Arqueo</span>
                        <span className={`text-xs font-bold font-mono ${shift.difference === 0 ? "text-slate-400" : shift.difference > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {shift.difference === 0 ? "$ 0" : (shift.difference > 0 ? `+${formatCOP(shift.difference)}` : formatCOP(shift.difference))}
                        </span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition hidden md:block" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Detalle Exhaustivo del Turno */}
        {selectedShiftDetails && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-400" /> Detalle del Turno: {selectedShiftDetails.shiftCode}
                  </h3>
                  <p className="text-xs text-slate-400">Terminal: {selectedShiftDetails.registerName}</p>
                </div>
                <button
                  onClick={() => setSelectedShiftDetails(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Cajero Titular:</span>
                  <span className="font-bold text-teal-300">{selectedShiftDetails.cashierName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Supervisor Responsable:</span>
                  <span className="font-bold text-indigo-300">{selectedShiftDetails.supervisorName || "Pendiente de firma"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Inicial (Apertura):</span>
                  <span className="text-white font-bold">{formatCOP(selectedShiftDetails.openingFloat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ventas en Efectivo:</span>
                  <span className="text-white font-bold">{formatCOP(selectedShiftDetails.cashSalesTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ventas Datáfono / Tarjetas:</span>
                  <span className="text-white">{formatCOP(selectedShiftDetails.cardSalesTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transferencias (Nequi/PSE):</span>
                  <span className="text-white">{formatCOP(selectedShiftDetails.transferSalesTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-slate-300 font-bold">
                  <span>Efectivo Esperado en Gaveta:</span>
                  <span className="text-white">{formatCOP(selectedShiftDetails.expectedCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Efectivo Contado Declarado:</span>
                  <span className="text-white font-bold">{selectedShiftDetails.declaredCash !== null ? formatCOP(selectedShiftDetails.declaredCash!) : "Sin conteo aún"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-400">Diferencia Liquidada:</span>
                  <span className={`font-bold ${selectedShiftDetails.difference === 0 ? "text-emerald-400" : selectedShiftDetails.difference > 0 ? "text-emerald-300" : "text-rose-400"}`}>
                    {selectedShiftDetails.difference === 0 ? "✓ Cuadre Exacto ($ 0)" : formatCOP(selectedShiftDetails.difference)}
                  </span>
                </div>
              </div>

              {selectedShiftDetails.cashierNotes && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[10px] block font-semibold mb-1">Nota del Cajero:</span>
                  <p className="text-slate-300 italic">{selectedShiftDetails.cashierNotes}</p>
                </div>
              )}

              {selectedShiftDetails.supervisorNotes && (
                <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/30 text-xs">
                  <span className="text-indigo-400 text-[10px] block font-semibold mb-1">Visto Bueno / Dictamen del Supervisor:</span>
                  <p className="text-indigo-200">{selectedShiftDetails.supervisorNotes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedShiftDetails(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
