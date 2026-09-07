'use client';

import { useState } from 'react';
import { 
  Receipt, 
  Search, 
  ShieldCheck, 
  UploadCloud, 
  Building2, 
  CheckCircle2, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAuxiliaryLedgerAction,
  calculateDianDVAction,
  importBulkThirdPartiesAction
} from '@/modules/accounting/actions/accounting';

interface AuxiliaryLedgerModuleProps {
  initialAuxLedgerData: any;
}

export function AuxiliaryLedgerModule({ initialAuxLedgerData }: AuxiliaryLedgerModuleProps) {
  const [subTab, setSubTab] = useState<'auxiliary' | 'nit_validator' | 'bulk_import'>('auxiliary');

  // Auxiliary Ledger State
  const [auxAccountFilter, setAuxAccountFilter] = useState('');
  const [auxNitFilter, setAuxNitFilter] = useState('');
  const [auxLedgerData, setAuxLedgerData] = useState<any>(initialAuxLedgerData);
  const [isLoadingAux, setIsLoadingAux] = useState(false);

  // NIT Validator State
  const [rawNitInput, setRawNitInput] = useState('902028722');
  const [validatedNitResult, setValidatedNitResult] = useState<any>(null);

  // Bulk Importer State
  const [csvImportText, setCsvImportText] = useState("900123456,Tecnología Andina S.A.S.\n901876543,Comunicaciones del Oriente S.A.\n1098765432,Carlos Eduardo Mendoza");
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleLoadAuxiliary = async () => {
    setIsLoadingAux(true);
    try {
      const res = await getAuxiliaryLedgerAction({
        accountCode: auxAccountFilter || undefined,
        thirdPartyNit: auxNitFilter || undefined,
      });
      if (res.success) {
        setAuxLedgerData(res);
        toast.success('Libro auxiliar actualizado');
      }
    } catch (e) {
      toast.error('Error al cargar libro auxiliar');
    } finally {
      setIsLoadingAux(false);
    }
  };

  const handleValidateNit = async (nit: string) => {
    if (!nit.trim()) return;
    const res = await calculateDianDVAction(nit);
    setValidatedNitResult(res);
  };

  const handleImportThirdParties = async () => {
    setIsImporting(true);
    try {
      const res = await importBulkThirdPartiesAction(csvImportText);
      setImportResult(res);
      if (res.success) {
        toast.success(`¡${res.importedCount} terceros importados exitosamente a PostgreSQL!`);
      }
    } catch (e) {
      toast.error('Error importando terceros');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setSubTab('auxiliary')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'auxiliary'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-teal-400" />
          Libro Auxiliar por Cuenta & Tercero
        </button>
        <button
          onClick={() => setSubTab('nit_validator')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'nit_validator'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          Validador NIT (Módulo 11 DIAN)
        </button>
        <button
          onClick={() => setSubTab('bulk_import')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'bulk_import'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
          Importador Masivo CSV / Excel
        </button>
      </div>

      {/* ── 1. LIBRO AUXILIAR SUB-TAB ── */}
      {subTab === 'auxiliary' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-400" />
                Libro Auxiliar por Cuenta y Tercero (Extracto Detallado)
              </h3>
              <p className="text-xs text-slate-400">Drill-down cronológico con saldo acumulado por cuenta contable y NIT de tercero.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Filtrar Cuenta (ej: 1105, 1305)..."
                value={auxAccountFilter}
                onChange={(e) => setAuxAccountFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-teal-400 font-mono outline-none w-44"
              />
              <input
                type="text"
                placeholder="Filtrar NIT Tercero..."
                value={auxNitFilter}
                onChange={(e) => setAuxNitFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono outline-none w-36"
              />
              <button
                onClick={handleLoadAuxiliary}
                disabled={isLoadingAux}
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                {isLoadingAux ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Doc</th>
                  <th className="pb-3">Comprobante</th>
                  <th className="pb-3">Cuenta PUC</th>
                  <th className="pb-3">Tercero</th>
                  <th className="pb-3 text-right">Débito</th>
                  <th className="pb-3 text-right">Crédito</th>
                  <th className="pb-3 text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auxLedgerData?.items?.map((it: any) => (
                  <tr key={it.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 text-slate-400">{it.date}</td>
                    <td className="py-2.5 font-bold text-teal-400">{it.documentType}</td>
                    <td className="py-2.5 text-white font-bold">{it.voucherNumber}</td>
                    <td className="py-2.5 text-teal-300">{it.accountCode} - {it.accountName}</td>
                    <td className="py-2.5 text-slate-300">{it.thirdPartyNit}</td>
                    <td className="py-2.5 text-right text-emerald-400">{it.debit > 0 ? `$${it.debit.toLocaleString()}` : '-'}</td>
                    <td className="py-2.5 text-right text-rose-400">{it.credit > 0 ? `$${it.credit.toLocaleString()}` : '-'}</td>
                    <td className="py-2.5 text-right font-bold text-white">${it.runningBalance?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2. NIT VALIDATOR SUB-TAB ── */}
      {subTab === 'nit_validator' && (
        <div className="ds-card p-6 space-y-6 max-w-xl mx-auto">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Validador de NIT Oficial DIAN (Algoritmo Módulo 11)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Calcula matemáticamente el Dígito de Verificación (DV) según la resolución vigente de la DIAN para personas naturales y jurídicas en Colombia.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Número de Identificación Tributaria (sin guion)</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={rawNitInput}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setRawNitInput(cleaned);
                    handleValidateNit(cleaned);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none focus:border-teal-500"
                  placeholder="Ej: 902028722"
                />
                <button
                  type="button"
                  onClick={() => handleValidateNit(rawNitInput)}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Verificar
                </button>
              </div>
            </div>

            {validatedNitResult && (
              <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-2 font-mono">
                <span className="text-[10px] text-teal-400 uppercase font-bold">NIT FORMATEADO & VERIFICADO</span>
                <p className="text-2xl font-black text-white">{validatedNitResult.formattedNit || `${rawNitInput}-${validatedNitResult.verificationDigit}`}</p>
                <div className="text-xs text-slate-300 pt-2 border-t border-slate-800/80 flex justify-between">
                  <span>Dígito de Verificación: <strong className="text-teal-400 text-sm">{validatedNitResult.verificationDigit}</strong></span>
                  <span className="text-emerald-400 font-bold">✓ Algoritmo Módulo 11 OK</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. BULK IMPORT SUB-TAB ── */}
      {subTab === 'bulk_import' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-teal-400" />
              Migración Masiva de Terceros (Clientes / Proveedores)
            </h3>
            <p className="text-xs text-slate-400">
              Pega filas CSV con formato <code className="text-teal-400 font-mono">NIT,Razón Social</code> para importar terceros en lote directamente a PostgreSQL.
            </p>

            <textarea
              rows={8}
              value={csvImportText}
              onChange={(e) => setCsvImportText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-teal-500"
            />

            <button
              onClick={handleImportThirdParties}
              disabled={isImporting}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20 transition-all"
            >
              {isImporting ? 'Cargando a Base de Datos...' : 'Procesar & Cargar a PostgreSQL'}
            </button>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Resultado de la Importación Masiva</h3>

            {importResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold">
                  ✓ {importResult.importedCount} Registros procesados e insertados con éxito.
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 max-h-64 overflow-y-auto">
                  {importResult.details?.map((d: string, idx: number) => (
                    <div key={idx} className="text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
                <UploadCloud className="w-10 h-10 mb-2 text-slate-600" />
                <p>Presiona el botón para procesar la lista de terceros a la izquierda.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
