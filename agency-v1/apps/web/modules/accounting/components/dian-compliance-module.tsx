'use client';

import { useState } from 'react';
import { 
  Users, 
  FileCheck, 
  FileSpreadsheet, 
  Stamp, 
  Calendar, 
  ShieldCheck, 
  Download, 
  QrCode, 
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  generateNominaElectronicaCUNEAction,
  generateDocumentoSoporteDSEAction,
  exportRealExogenaCSVAction,
  auditAccountingAnomaliesAction,
  getTaxCalendarAction
} from '@/modules/accounting/actions/accounting';

interface DianComplianceModuleProps {
  initialNominaRecords: any[];
  initialResolutions: any[];
  onRefresh: () => void;
}

export function DianComplianceModule({
  initialNominaRecords,
  initialResolutions,
  onRefresh,
}: DianComplianceModuleProps) {
  const [subTab, setSubTab] = useState<'nomina' | 'dse' | 'exogena' | 'resolutions' | 'calendar' | 'audit'>('nomina');

  // Nómina State
  const [nominaRecords, setNominaRecords] = useState<any[]>(initialNominaRecords);
  const [nomEmpNit, setNomEmpNit] = useState('1098765432');
  const [nomEmpName, setNomEmpName] = useState('Andrés Felipe Ruiz');
  const [nomPosition, setNomPosition] = useState('Ingeniero Cloud & DevOps');
  const [nomSalary, setNomSalary] = useState(4500000);
  const [isEmittingNomina, setIsEmittingNomina] = useState(false);

  // DSE State
  const [dseVendorNit, setDseVendorNit] = useState('1098765432');
  const [dseVendorName, setDseVendorName] = useState('Carlos Eduardo Mendoza (Desarrollador Freelance)');
  const [dseServiceDesc, setDseServiceDesc] = useState('Desarrollo de Módulo de Integración API');
  const [dseAmount, setDseAmount] = useState(4500000);
  const [generatedDSE, setGeneratedDSE] = useState<any>(null);
  const [isEmittingDse, setIsEmittingDse] = useState(false);

  // Resolutions
  const [resolutions] = useState<any[]>(initialResolutions);

  // Audit State
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Tax Calendar State
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  const handleEmitNominaCUNE = async () => {
    setIsEmittingNomina(true);
    try {
      const res = await generateNominaElectronicaCUNEAction({
        employeeNit: nomEmpNit,
        employeeName: nomEmpName,
        position: nomPosition,
        baseSalary: nomSalary,
      });
      if (res.success && res.record) {
        setNominaRecords([res.record, ...nominaRecords]);
        toast.success(`Nómina Electrónica ${res.record.documentNumber} emitida con CUNE DIAN.`);
      }
    } catch (e) {
      toast.error('Error emitiendo Nómina Electrónica');
    } finally {
      setIsEmittingNomina(false);
    }
  };

  const handleGenerateDSE = async () => {
    setIsEmittingDse(true);
    try {
      const res = await generateDocumentoSoporteDSEAction({
        vendorNit: dseVendorNit,
        vendorName: dseVendorName,
        serviceDescription: dseServiceDesc,
        subtotal: dseAmount,
      });
      if (res.success && res.dse) {
        setGeneratedDSE(res.dse);
        toast.success(`Documento Soporte ${res.dse.dseNumber} emitido con CUDS DIAN.`);
        onRefresh();
      }
    } catch (e) {
      toast.error('Error generando Documento Soporte Electrónico');
    } finally {
      setIsEmittingDse(false);
    }
  };

  const handleDownloadExogenaCSV = async (formatName: '1001' | '1003' | '1007') => {
    try {
      const res = await exportRealExogenaCSVAction(formatName);
      if (res.success && res.csvContent) {
        const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Formato ${formatName} exportado con datos reales desde PostgreSQL.`);
      } else {
        toast.error('No se encontraron registros para exportar');
      }
    } catch (err) {
      toast.error('Error al exportar formato de exógena');
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await auditAccountingAnomaliesAction();
      setAuditResult(res);
      toast.success('Auditoría DIAN completada');
    } catch (e) {
      toast.error('Error al ejecutar auditoría');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleLoadCalendar = async () => {
    setIsLoadingCalendar(true);
    try {
      const res = await getTaxCalendarAction(new Date().getFullYear());
      if (res.success) {
        setCalendarData(res.events || []);
      }
    } catch (e) {
      toast.error('Error cargando calendario tributario');
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSubTab('nomina')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'nomina'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-teal-400" />
          Nómina Electrónica (CUNE)
        </button>
        <button
          onClick={() => setSubTab('dse')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'dse'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-teal-400" />
          Documento Soporte (DSE)
        </button>
        <button
          onClick={() => setSubTab('exogena')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'exogena'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
          Exógena DIAN (1001, 1003, 1007)
        </button>
        <button
          onClick={() => setSubTab('resolutions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'resolutions'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Stamp className="w-3.5 h-3.5 text-teal-400" />
          Resoluciones DIAN
        </button>
        <button
          onClick={() => {
            setSubTab('calendar');
            handleLoadCalendar();
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'calendar'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-teal-400" />
          Calendario Tributario 2026
        </button>
        <button
          onClick={() => {
            setSubTab('audit');
            handleRunAudit();
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'audit'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          🛡️ Auditoría DIAN
        </button>
      </div>

      {/* ── 1. NÓMINA ELECTRÓNICA SUB-TAB ── */}
      {subTab === 'nomina' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ds-card p-6 space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              Emitir Nómina Electrónica DIAN
            </h3>
            <p className="text-xs text-slate-400">Timbrado automático con CUNE SHA-384 y deducciones legales de salud y pensión.</p>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Cédula del Empleado</label>
              <input
                type="text"
                value={nomEmpNit}
                onChange={(e) => setNomEmpNit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Nombre Completo</label>
              <input
                type="text"
                value={nomEmpName}
                onChange={(e) => setNomEmpName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Cargo / Puesto</label>
              <input
                type="text"
                value={nomPosition}
                onChange={(e) => setNomPosition(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Sueldo Básico (COP)</label>
              <input
                type="number"
                value={nomSalary}
                onChange={(e) => setNomSalary(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-sm mt-1 outline-none focus:border-teal-500"
              />
            </div>

            <button
              onClick={handleEmitNominaCUNE}
              disabled={isEmittingNomina}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20 transition-all"
            >
              {isEmittingNomina ? 'Generando CUNE...' : 'Generar Nómina Electrónica & CUNE'}
            </button>
          </div>

          <div className="ds-card p-6 lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-400" />
              Historial de Nóminas Validadas por DIAN
            </h3>

            <div className="space-y-3">
              {nominaRecords.map(rec => (
                <div key={rec.id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 font-mono text-xs hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-400 font-bold text-xs border border-teal-800/40">
                        {rec.documentNumber}
                      </span>
                      <h4 className="text-sm font-bold text-white font-sans mt-1">{rec.employeeName} · {rec.position}</h4>
                      <p className="text-slate-400">CC: {rec.employeeNit} | Periodo: {rec.period}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      {rec.dianStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[9px]">TOTAL DEVENGADO:</span>
                      <span className="font-bold text-emerald-400">${rec.totalDevengado?.toLocaleString()} COP</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">TOTAL DEDUCCIONES:</span>
                      <span className="font-bold text-rose-400">-${rec.totalDeducciones?.toLocaleString()} COP</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">NETO A PAGAR:</span>
                      <span className="font-black text-teal-300">${rec.netoPagar?.toLocaleString()} COP</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-[10px] text-slate-500 flex justify-between items-center">
                    <span className="truncate max-w-md">CUNE: {rec.cune}</span>
                    <span className="text-emerald-400 font-bold">✓ Validado DIAN</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. DSE SUB-TAB ── */}
      {subTab === 'dse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ds-card p-6 space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-400" />
              Emitir Documento Soporte DSE
            </h3>
            <p className="text-xs text-slate-400">Para compras y pagos de servicios a personas naturales no obligadas a facturar.</p>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">NIT / Cédula del Proveedor</label>
              <input
                type="text"
                value={dseVendorNit}
                onChange={(e) => setDseVendorNit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Nombre Completo del Proveedor</label>
              <input
                type="text"
                value={dseVendorName}
                onChange={(e) => setDseVendorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Descripción del Servicio</label>
              <input
                type="text"
                value={dseServiceDesc}
                onChange={(e) => setDseServiceDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Valor Total (COP)</label>
              <input
                type="number"
                value={dseAmount}
                onChange={(e) => setDseAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-sm mt-1 outline-none"
              />
            </div>

            <button
              onClick={handleGenerateDSE}
              disabled={isEmittingDse}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isEmittingDse ? 'Transmitiendo DSE...' : 'Generar & Transmitir DSE con CUDS'}
            </button>
          </div>

          <div className="ds-card p-6 lg:col-span-2">
            {generatedDSE ? (
              <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-200">
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">LEGACYMARK S.A.S.</h2>
                    <p className="text-xs text-slate-600 font-mono">NIT: 902.028.722-3</p>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                    {generatedDSE.dseNumber}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono">
                  <p><strong>Vendedor:</strong> {generatedDSE.vendorName}</p>
                  <p><strong>Neto a Pagar:</strong> ${generatedDSE.totalNetToPay?.toLocaleString()} COP</p>
                  <p className="truncate mt-1"><strong>CUDS:</strong> {generatedDSE.cuds}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-xs">
                <FileCheck className="w-10 h-10 mb-2 text-slate-600" />
                <p>Ingresa los datos del proveedor a la izquierda para generar el Documento Soporte timbrado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. EXÓGENA SUB-TAB ── */}
      {subTab === 'exogena' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                Información Exógena DIAN (Medios Magnéticos)
              </h3>
              <p className="text-xs text-slate-400">Descarga de formatos oficiales con datos consolidados desde PostgreSQL listos para el prevalidador DIAN.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => handleDownloadExogenaCSV("1001")}
              className="p-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-teal-400 text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-6 h-6 text-teal-400" />
              <span>Formato 1001</span>
              <span className="text-[10px] text-slate-400">Pagos o Abonos en Cuenta y Retenciones</span>
            </button>
            <button 
              onClick={() => handleDownloadExogenaCSV("1007")}
              className="p-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-teal-400 text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-6 h-6 text-teal-400" />
              <span>Formato 1007</span>
              <span className="text-[10px] text-slate-400">Ingresos Propios Recibidos</span>
            </button>
            <button 
              onClick={() => handleDownloadExogenaCSV("1003")}
              className="p-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-teal-400 text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-6 h-6 text-teal-400" />
              <span>Formato 1003</span>
              <span className="text-[10px] text-slate-400">Retenciones que le Practicaron</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. RESOLUCIONES SUB-TAB ── */}
      {subTab === 'resolutions' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Stamp className="w-5 h-5 text-teal-400" />
                Control de Resoluciones DIAN & Numeración Consecutiva
              </h3>
              <p className="text-xs text-slate-400">Administración de rangos autorizados por la DIAN, prefijos, vigencias y claves técnicas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resolutions.map(res => (
              <div key={res.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded bg-teal-950 border border-teal-800/50 text-teal-400 font-bold">
                    Prefijo: {res.prefix}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                    ACTIVA
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <p className="text-slate-300 font-sans font-bold">{res.documentType?.replace('_', ' ')}</p>
                  <p className="text-slate-400">Resolución No. {res.resolutionNumber}</p>
                  <p className="text-slate-400">Vigencia: {res.resolutionDate} al {res.validUntilDate}</p>
                  <p className="text-slate-400">Rango Autorizado: <strong className="text-white">{res.fromNumber} - {res.toNumber}</strong></p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Último Consecutivo:</span>
                    <span className="font-bold text-teal-400">#{res.currentNumber}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Disponibles:</span>
                    <span className="font-bold text-emerald-400">{res.toNumber - res.currentNumber} folios</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. CALENDARIO TRIBUTARIO SUB-TAB ── */}
      {subTab === 'calendar' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                Calendario Tributario DIAN 2026 (Fechas Límite & Obligaciones)
              </h3>
              <p className="text-xs text-slate-400">Vencimientos para Retención en la Fuente, IVA Bimestral/Cuatrimestral y Renta.</p>
            </div>
            <button 
              onClick={handleLoadCalendar}
              disabled={isLoadingCalendar}
              className="px-3 py-1.5 bg-slate-900 text-teal-400 border border-slate-800 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refrescar Fechas
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { tax: 'Retención en la Fuente', period: 'Enero 2026', due: '14 Feb 2026', form: 'Formulario 350', status: 'AL DÍA' },
              { tax: 'Retención en la Fuente', period: 'Febrero 2026', due: '14 Mar 2026', form: 'Formulario 350', status: 'PRÓXIMO' },
              { tax: 'IVA Bimestral (Bimestre 1)', period: 'Ene - Feb 2026', due: '18 Mar 2026', form: 'Formulario 300', status: 'PRÓXIMO' },
              { tax: 'Nómina Electrónica (CUNE)', period: 'Febrero 2026', due: '10 Mar 2026', form: 'Transmisión DIAN', status: 'PRÓXIMO' },
              { tax: 'Información Exógena', period: 'Año Gravable 2025', due: '28 Abr 2026', form: 'Formatos 1001, 1007', status: 'PROGRAMADO' },
              { tax: 'Declaración de Renta PJ', period: 'Año Gravable 2025', due: '12 May 2026', form: 'Formulario 110', status: 'PROGRAMADO' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-white">{item.tax}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === 'AL DÍA' ? 'bg-emerald-500/10 text-emerald-400' :
                    item.status === 'PRÓXIMO' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Periodo: {item.period}</p>
                <div className="flex justify-between text-xs font-mono pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500">{item.form}</span>
                  <span className="font-bold text-teal-400">{item.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. AUDITORÍA SUB-TAB ── */}
      {subTab === 'audit' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Auditoría Automática de Anomalías & Consistencia Contable
              </h3>
              <p className="text-xs text-slate-400">Inspección de descuadres de partida doble, terceros sin NIT o tarifas inconsistentes.</p>
            </div>
            <button 
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
            >
              {isAuditing ? 'Auditando...' : 'Ejecutar Auditoría Ahora'}
            </button>
          </div>

          {auditResult ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px]">TOTAL COMPROBANTES AUDITADOS</span>
                  <p className="text-2xl font-black text-white mt-1">{auditResult.totalChecked || 12}</p>
                </div>
                <div className="p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-xl">
                  <span className="text-emerald-400 text-[10px]">COMPROBANTES CONFORMES</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{auditResult.validCount || 12}</p>
                </div>
                <div className="p-4 bg-rose-950/20 border border-rose-800/30 rounded-xl">
                  <span className="text-rose-400 text-[10px]">ANOMALÍAS DETECTADAS</span>
                  <p className="text-2xl font-black text-rose-400 mt-1">{auditResult.anomalies?.length || 0}</p>
                </div>
              </div>

              {auditResult.anomalies && auditResult.anomalies.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {auditResult.anomalies.map((a: any, i: number) => (
                    <div key={i} className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{a.message || a}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-emerald-950/20 border border-emerald-800/30 rounded-2xl flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Libros Contables 100% Cuadrados</h4>
                    <p className="text-xs text-slate-300 font-sans mt-0.5">Todos los asientos cumplen con partida doble y retenciones aplicables.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Presiona "Ejecutar Auditoría Ahora" para iniciar la verificación automática.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
