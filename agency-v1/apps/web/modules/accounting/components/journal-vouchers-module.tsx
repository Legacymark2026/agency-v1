'use client';

import { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  History, 
  Lock, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Send, 
  Bot, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  recordJournalVoucherAction,
  parseNaturalLanguageJournalEntryAction,
  executePeriodClosingAction
} from '@/modules/accounting/actions/accounting';
import type { SiigoDocumentType } from '@/modules/accounting/types';

interface JournalVouchersModuleProps {
  pucCatalog: { code: string; name: string; category: string; nature: string }[];
  costCenters: any[];
  vouchersHistory: any[];
  onRefresh: () => void;
}

export function JournalVouchersModule({
  pucCatalog,
  costCenters,
  vouchersHistory,
  onRefresh,
}: JournalVouchersModuleProps) {
  const [subTab, setSubTab] = useState<'new_voucher' | 'ai_assistant' | 'history' | 'closing'>('new_voucher');

  // New Voucher State
  const [docType, setDocType] = useState<SiigoDocumentType>('CC');
  const [selectedCostCenter, setSelectedCostCenter] = useState('01');
  const [concept, setConcept] = useState('Prestación de Servicios de Consultoría');
  const [voucherNum, setVoucherNum] = useState(`CC-${Date.now().toString().slice(-6)}`);
  const [lines, setLines] = useState([
    { accountCode: '110505', accountName: 'Caja General', debit: 5000000, credit: 0, thirdPartyNit: '902028722-3', costCenterCode: '01' },
    { accountCode: '413501', accountName: 'Ingresos por Servicios de Software y Consultoría', debit: 0, credit: 5000000, thirdPartyNit: '902028722-3', costCenterCode: '01' },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('Venta de servicios de software cloud por $5,000,000 COP a Tech SAS NIT 900123456 con retención en la fuente del 3.5% e IVA del 19%');
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [aiSuggestedResult, setAiSuggestedResult] = useState<any>(null);

  // Fiscal Closing State
  const [closingPeriod, setClosingPeriod] = useState(`Diciembre ${new Date().getFullYear()}`);
  const [isClosing, setIsClosing] = useState(false);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '', accountName: '', debit: 0, credit: 0, thirdPartyNit: '', costCenterCode: selectedCostCenter }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) {
      toast.error('Un comprobante debe tener al menos 2 asientos (Partida Doble).');
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleAccountSelect = (idx: number, code: string) => {
    const found = pucCatalog.find(p => p.code === code);
    const updated = [...lines];
    updated[idx].accountCode = code;
    if (found) updated[idx].accountName = found.name;
    setLines(updated);
  };

  const handleSaveVoucher = async () => {
    if (!isBalanced) {
      toast.error(`Partida Doble desbalanceada: Débito ($ ${totalDebit.toLocaleString()}) ≠ Crédito ($ ${totalCredit.toLocaleString()})`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await recordJournalVoucherAction({
        voucherNumber: voucherNum,
        documentType: docType,
        costCenterCode: selectedCostCenter,
        concept,
        lines,
      });

      if (res.success && res.voucher) {
        toast.success(`Comprobante ${docType}-${voucherNum} registrado y persistido en PostgreSQL.`);
        setVoucherNum(`${docType}-${Date.now().toString().slice(-6)}`);
        onRefresh();
      } else {
        toast.error(res.error || 'Error al asentar comprobante');
      }
    } catch (err: any) {
      toast.error('Error al guardar comprobante en base de datos');
    } finally {
      setIsSaving(false);
    }
  };

  const handleParseNaturalLanguage = async () => {
    if (!aiPrompt.trim()) return;
    setIsParsingAi(true);
    try {
      const res = await parseNaturalLanguageJournalEntryAction(aiPrompt);
      if (res.success && res.entry) {
        setAiSuggestedResult(res.entry);
        toast.success('¡Asiento contable interpretado por IA con éxito!');
      } else {
        toast.error('No se pudo estructurar el asiento automáticamente');
      }
    } catch (err: any) {
      toast.error('Error en servicio de IA contable');
    } finally {
      setIsParsingAi(false);
    }
  };

  const handleApplyAiToDraft = () => {
    if (!aiSuggestedResult) return;
    if (aiSuggestedResult.documentType) setDocType(aiSuggestedResult.documentType);
    if (aiSuggestedResult.concept) setConcept(aiSuggestedResult.concept);
    if (aiSuggestedResult.lines && aiSuggestedResult.lines.length > 0) {
      setLines(aiSuggestedResult.lines);
    }
    setSubTab('new_voucher');
    toast.success('Líneas sugeridas por la IA cargadas en el formulario de asiento.');
  };

  const handleExecuteClosing = async () => {
    setIsClosing(true);
    try {
      const res = await executePeriodClosingAction(closingPeriod);
      if (res.success) {
        toast.success(`Cierre fiscal ${closingPeriod} ejecutado y guardado en PostgreSQL.`);
        onRefresh();
        setSubTab('history');
      } else {
        toast.error(res.error || 'Error al ejecutar cierre');
      }
    } catch (err) {
      toast.error('Error al ejecutar asiento de cierre');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setSubTab('new_voucher')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'new_voucher'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-teal-400" />
          Nuevo Comprobante Contable
        </button>
        <button
          onClick={() => setSubTab('ai_assistant')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'ai_assistant'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          🤖 Asistente IA Contable
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'history'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5 text-teal-400" />
          Libro Diario (Historial)
        </button>
        <button
          onClick={() => setSubTab('closing')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'closing'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          🔒 Cierre de Periodo Fiscal
        </button>
      </div>

      {/* ── 1. NUEVO COMPROBANTE SUB-TAB ── */}
      {subTab === 'new_voucher' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                Asentador de Documentos Contables (Estándar Siigo Nube)
              </h3>
              <p className="text-xs text-slate-400">Registro de partida doble con verificación matemática en tiempo real.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={docType}
                onChange={(e: any) => {
                  const newType = e.target.value;
                  setDocType(newType);
                  setVoucherNum(`${newType}-${Date.now().toString().slice(-6)}`);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-teal-400 font-bold outline-none"
              >
                <option value="CC">CC - Comprobante Contable / Diario</option>
                <option value="RC">RC - Recibo de Caja / Ingreso</option>
                <option value="CE">CE - Comprobante de Egreso</option>
                <option value="FV">FV - Factura de Venta</option>
                <option value="FC">FC - Factura de Compra</option>
              </select>
              <input
                type="text"
                value={voucherNum}
                onChange={(e) => setVoucherNum(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-teal-400 font-bold w-36"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Concepto / Glosa del Asiento</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white mt-1 outline-none focus:border-teal-500"
                placeholder="Descripción general del comprobante..."
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Centro de Costos</label>
              <select
                value={selectedCostCenter}
                onChange={(e) => setSelectedCostCenter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-teal-400 font-mono mt-1 outline-none"
              >
                {costCenters.map(cc => (
                  <option key={cc.code} value={cc.code}>
                    {cc.code} - {cc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lines Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-2">
              <span>LÍNEAS DEL COMPROBANTE ({lines.length})</span>
              <span>SUMAS IGUALES NIIF</span>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 items-center">
                <div className="md:col-span-4">
                  <select
                    value={line.accountCode}
                    onChange={(e) => handleAccountSelect(idx, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-teal-400 font-mono outline-none"
                  >
                    <option value="">Seleccionar Cuenta PUC...</option>
                    {pucCatalog.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    placeholder="NIT / Cédula Tercero"
                    value={line.thirdPartyNit}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].thirdPartyNit = e.target.value;
                      setLines(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    placeholder="Débito"
                    value={line.debit || ''}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].debit = Number(e.target.value);
                      setLines(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-mono text-emerald-400 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    placeholder="Crédito"
                    value={line.credit || ''}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].credit = Number(e.target.value);
                      setLines(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-mono text-rose-400 outline-none"
                  />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <button 
                    type="button"
                    onClick={() => handleRemoveLine(idx)} 
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLine}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 text-xs font-bold border border-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar Línea Contable
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-800 font-mono text-xs gap-3">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${isBalanced ? 'text-teal-400' : 'text-rose-400'}`}>
                {isBalanced 
                  ? `✓ Balanceado: $${totalDebit.toLocaleString()} COP`
                  : `⚠ Descuadre: Débito $${totalDebit.toLocaleString()} ≠ Crédito $${totalCredit.toLocaleString()} (Dif: $${Math.abs(totalDebit - totalCredit).toLocaleString()})`
                }
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveVoucher}
              disabled={!isBalanced || isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-teal-500/20 transition-all"
            >
              {isSaving ? 'Guardando en PostgreSQL...' : 'Guardar Asiento en Libro Diario'}
            </button>
          </div>
        </div>
      )}

      {/* ── 2. ASISTENTE IA CONTABLE SUB-TAB ── */}
      {subTab === 'ai_assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              Asistente Contable por Lenguaje Natural
            </h3>
            <p className="text-xs text-slate-400">
              Escribe la transacción en español cotidiano. La IA identificará automáticamente las cuentas PUC aplicables, el tipo de documento y el cálculo de retenciones.
            </p>

            <textarea
              rows={5}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Pago de honorarios a abogado por $2,500,000 con retención del 11%..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-sans text-slate-200 outline-none focus:border-purple-500 transition-colors"
            />

            <button
              type="button"
              onClick={handleParseNaturalLanguage}
              disabled={isParsingAi}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <Sparkles className="w-4 h-4" />
              {isParsingAi ? 'Analizando con IA...' : 'Interpretar & Generar Asiento'}
            </button>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Propuesta Generada por la IA</span>
              {aiSuggestedResult && (
                <button
                  onClick={handleApplyAiToDraft}
                  className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Usar en Asiento
                </button>
              )}
            </h3>

            {aiSuggestedResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                  <p><strong className="text-purple-300">Concepto:</strong> {aiSuggestedResult.concept}</p>
                  <p><strong className="text-purple-300">Tipo Doc:</strong> {aiSuggestedResult.documentType}</p>
                </div>

                <div className="divide-y divide-slate-800/80 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {aiSuggestedResult.lines?.map((l: any, i: number) => (
                    <div key={i} className="py-2 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-bold text-teal-400">{l.accountCode}</span> - {l.accountName}
                      </div>
                      <div className="text-right">
                        {l.debit > 0 && <span className="text-emerald-400 font-bold">Débito: $${l.debit?.toLocaleString()}</span>}
                        {l.credit > 0 && <span className="text-rose-400 font-bold">Crédito: $${l.credit?.toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
                <Bot className="w-10 h-10 mb-2 text-slate-600" />
                <p>Escribe una transacción a la izquierda y presiona "Interpretar".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. HISTORIAL / LIBRO DIARIO SUB-TAB ── */}
      {subTab === 'history' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-teal-400" />
                Libro Diario & Historial de Comprobantes Registrados
              </h3>
              <p className="text-xs text-slate-400">Registro cronológico inmutable de asientos contables con sello hash.</p>
            </div>
            <button 
              onClick={onRefresh} 
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refrescar
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {vouchersHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No hay comprobantes registrados aún.</div>
            ) : (
              vouchersHistory.map((v, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center hover:border-slate-700 transition-colors">
                  <div>
                    <span className="font-bold text-teal-400">{v.documentType || 'CC'}-{v.voucherNumber}</span>
                    <p className="text-slate-200 font-sans mt-0.5">{v.concept}</p>
                    {v.hashSeal && (
                      <p className="text-[10px] text-slate-500 mt-1 truncate max-w-sm">Sello: {v.hashSeal}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">${v.totalDebit?.toLocaleString()} COP</span>
                    <span className="text-slate-500 block text-[10px]">{new Date(v.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 4. CIERRE DE PERIODO FISCAL SUB-TAB ── */}
      {subTab === 'closing' && (
        <div className="ds-card p-6 space-y-6 max-w-2xl mx-auto">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-400" />
              Cierre de Periodo Contable y Fiscal
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cancela las cuentas de resultado (Ingresos clase 4, Gastos clase 5, Costos clase 6) y traslada automáticamente la utilidad neta a la cuenta de Patrimonio 3605 (Utilidades del Ejercicio).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Periodo a Cerrar</label>
              <input
                type="text"
                value={closingPeriod}
                onChange={(e) => setClosingPeriod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm mt-1 outline-none focus:border-rose-500"
              />
            </div>

            <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                Acción Contable Irreversible
              </div>
              <p className="text-slate-300">
                Al ejecutar el cierre fiscal, se generará un comprobante especial tipo <strong>CC-CIERRE</strong> en PostgreSQL y las cuentas nominales quedarán con saldo en cero para el siguiente periodo contable.
              </p>
            </div>

            <button
              onClick={handleExecuteClosing}
              disabled={isClosing}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-600/20 transition-colors"
            >
              {isClosing ? 'Ejecutando Asiento de Cierre...' : `Ejecutar Cierre Fiscal (${closingPeriod})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
