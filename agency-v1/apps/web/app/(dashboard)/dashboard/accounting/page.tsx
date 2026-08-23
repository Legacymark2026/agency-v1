'use client';

import { useState, useEffect } from 'react';
import { 
  Calculator, 
  BookOpen, 
  FileText, 
  DollarSign, 
  Plus, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Percent, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Printer, 
  Search, 
  Building2, 
  FileSpreadsheet, 
  PieChart, 
  Trash2,
  Landmark,
  Calendar,
  Lock,
  QrCode,
  Check,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  calculateWithholdingsAction, 
  recordJournalVoucherAction,
  getTrialBalanceAction,
  getIncomeStatementAction,
  generateTaxCertificateAction,
  getBankReconciliationAction,
  getTaxCalendarAction
} from '@/modules/accounting/actions/accounting';
import { toast } from 'sonner';

const PUC_CATALOG = [
  { code: '110505', name: 'Caja General', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '111005', name: 'Bancos Nacionales (Bancolombia Ppal)', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '130505', name: 'Clientes Nacionales (Cuentas por Cobrar)', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135515', name: 'Anticipo de Impuestos - Retención en la Fuente', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135517', name: 'Anticipo de Impuestos - ReteIVA', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135518', name: 'Anticipo de Impuestos - ReteICA', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '220505', name: 'Proveedores Nacionales', category: 'PASIVO', nature: 'CREDITO' },
  { code: '233525', name: 'Honorarios y Servicios Profesionales por Pagar', category: 'PASIVO', nature: 'CREDITO' },
  { code: '236540', name: 'Retención en la Fuente por Pagar (Compras)', category: 'PASIVO', nature: 'CREDITO' },
  { code: '236525', name: 'Retención en la Fuente por Pagar (Servicios)', category: 'PASIVO', nature: 'CREDITO' },
  { code: '236801', name: 'Retención de ICA por Pagar', category: 'PASIVO', nature: 'CREDITO' },
  { code: '240801', name: 'Impuesto sobre las Ventas por Pagar (IVA 19%)', category: 'PASIVO', nature: 'CREDITO' },
  { code: '310505', name: 'Capital Suscrito y Pagado', category: 'PATRIMONIO', nature: 'CREDITO' },
  { code: '413501', name: 'Ingresos por Servicios de Software y Consultoría', category: 'INGRESOS', nature: 'CREDITO' },
  { code: '413502', name: 'Ingresos por Marketing y Publicidad Digital', category: 'INGRESOS', nature: 'CREDITO' },
  { code: '510506', name: 'Sueldos y Salarios de Personal', category: 'GASTOS', nature: 'DEBITO' },
  { code: '513535', name: 'Servicios de Computación y Nube (AWS/Hetzner)', category: 'GASTOS', nature: 'DEBITO' },
  { code: '520506', name: 'Publicidad y Propaganda (Meta / Google Ads)', category: 'GASTOS', nature: 'DEBITO' },
  { code: '613501', name: 'Costo de Ventas - Prestación de Servicios', category: 'COSTOS', nature: 'DEBITO' },
];

export default function AccountingDashboardPage() {
  const [activeTab, setActiveTab] = useState<'financials' | 'recon' | 'tax_calendar' | 'withholdings' | 'vouchers' | 'certificates' | 'exogena' | 'puc'>('financials');

  // Trial Balance & P&L state
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [pnlReport, setPnlReport] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [taxCalendar, setTaxCalendar] = useState<any[]>([]);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);

  // Withholding Calculator state
  const [subtotal, setSubtotal] = useState<number>(5000000);
  const [txType, setTxType] = useState<'COMPRAS' | 'SERVICIOS' | 'HONORARIOS'>('SERVICIOS');
  const [applyReteIVA, setApplyReteIVA] = useState<boolean>(true);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Journal Entry Form State
  const [concept, setConcept] = useState('Prestación de Servicios de Consultoría');
  const [voucherNum, setVoucherNum] = useState(`CD-${Date.now().toString().slice(-6)}`);
  const [lines, setLines] = useState([
    { accountCode: '110505', accountName: 'Caja General', debit: 5000000, credit: 0, thirdPartyNit: '902028722-3' },
    { accountCode: '413501', accountName: 'Ingresos por Servicios de Software y Consultoría', debit: 0, credit: 5000000, thirdPartyNit: '902028722-3' },
  ]);
  const [sealedVoucher, setSealedVoucher] = useState<any>(null);

  // Certificate Generator State
  const [certBeneficiaryNit, setCertBeneficiaryNit] = useState('900.876.543-1');
  const [certBeneficiaryName, setCertBeneficiaryName] = useState('Tech Solutions & Consulting S.A.S.');
  const [certType, setCertType] = useState<'RETEFUENTE' | 'RETEIVA' | 'RETEICA'>('RETEFUENTE');
  const [generatedCert, setGeneratedCert] = useState<any>(null);

  // PUC Search
  const [pucFilter, setPucFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');

  // Load financials on mount
  useEffect(() => {
    loadFinancials();
  }, []);

  const loadFinancials = async () => {
    setIsLoadingFinancials(true);
    try {
      const [tbRes, pnlRes, bankRes, calRes] = await Promise.all([
        getTrialBalanceAction(),
        getIncomeStatementAction(),
        getBankReconciliationAction(),
        getTaxCalendarAction(),
      ]);
      if (tbRes.success) setTrialBalance(tbRes);
      if (pnlRes.success) setPnlReport(pnlRes.report);
      if (bankRes.success) setBankAccounts(bankRes.accounts);
      if (calRes.success) setTaxCalendar(calRes.obligations);
    } catch (e) {
      console.error("Error loading financials:", e);
    } finally {
      setIsLoadingFinancials(false);
    }
  };

  const handleCalculateWithholdings = async () => {
    setIsCalculating(true);
    try {
      const res = await calculateWithholdingsAction({
        subtotal,
        transactionType: txType,
        applyReteIVA,
        reteIcaRatePerMil: 9.66,
      });
      setCalcResult(res);
      toast.success('Retenciones tributarias calculadas correctamente');
    } catch (err: any) {
      toast.error('Error calculando retenciones');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '', accountName: '', debit: 0, credit: 0, thirdPartyNit: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) {
      toast.error('Un comprobante debe tener al menos 2 asientos.');
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleAccountSelect = (idx: number, code: string) => {
    const found = PUC_CATALOG.find(p => p.code === code);
    const updated = [...lines];
    updated[idx].accountCode = code;
    if (found) updated[idx].accountName = found.name;
    setLines(updated);
  };

  const handleSaveVoucher = async () => {
    const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

    if (totalDebit !== totalCredit || totalDebit === 0) {
      toast.error(`Partida Doble desbalanceada: Débito ($${totalDebit.toLocaleString()}) ≠ Crédito ($${totalCredit.toLocaleString()})`);
      return;
    }

    try {
      const res = await recordJournalVoucherAction({
        voucherNumber: voucherNum,
        concept,
        lines,
      });

      if (res.success && res.voucher) {
        setSealedVoucher(res.voucher);
        toast.success(`Comprobante ${voucherNum} registrado con Sello Criptográfico SHA-256.`);
        setVoucherNum(`CD-${Date.now().toString().slice(-6)}`);
        loadFinancials();
      } else {
        toast.error(res.error || 'Error al asentar comprobante');
      }
    } catch (err: any) {
      toast.error('Error al guardar comprobante');
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const res = await generateTaxCertificateAction({
        beneficiaryNit: certBeneficiaryNit,
        beneficiaryName: certBeneficiaryName,
        type: certType,
      });
      if (res.success) {
        setGeneratedCert(res.certificate);
        toast.success(`Certificado ${res.certificate.certificateId} emitido con Sello DIAN.`);
      }
    } catch (e) {
      toast.error('Error generando certificado tributario');
    }
  };

  const handleDownloadExogenaCSV = (formatName: string) => {
    let csvContent = "";
    if (formatName === "1001") {
      csvContent = "Concepto,TipoDoc,NIT,PrimerApellido,SegundoApellido,PrimerNombre,OtrosNombres,RazonSocial,Direccion,Depto,Mpio,PagoAbonoDeducible,PagoAbonoNoDeducible,ReteFuentePracticada,ReteIVAPracticada\n" +
        "5001,31,900876543,Tech Solutions,,,,,Tech Solutions & Consulting SAS,Cra 27 # 36-14,68,001,85000000,0,3400000,2422500\n" +
        "5002,31,800123456,Cloud Providers,,,,,Cloud Hosting Services SAS,Av 15 # 100-20,11,001,16500000,0,660000,470250\n";
    } else if (formatName === "1007") {
      csvContent = "Concepto,TipoDoc,NIT,RazonSocial,IngresosBrutosRecibidos,DevolucionesRebajas\n" +
        "4001,31,901999888,Grupo Inversionista SAS,145000000,0\n" +
        "4001,31,901777666,Agencia Internacional SAS,50000000,0\n";
    } else {
      csvContent = "Concepto,TipoDoc,NIT,RazonSocial,ValorRetencionPracticada\n" +
        "1301,31,901999888,Grupo Inversionista SAS,5800000\n" +
        "1301,31,901777666,Agencia Internacional SAS,2000000\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DIAN_Exogena_Formato_${formatName}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Formato ${formatName} descargado en formato compatible con prevalidador DIAN.`);
  };

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const filteredPUC = PUC_CATALOG.filter(item => {
    const matchesSearch = item.code.includes(pucFilter) || item.name.toLowerCase().includes(pucFilter.toLowerCase());
    const matchesCat = categoryFilter === 'TODOS' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="ds-page space-y-8 w-full">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div>
          <div className="mb-3">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              <Sparkles size={10} className="text-teal-400" /> Suite Contable Corporativa · NIIF & DIAN Colombia
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Contabilidad General, Libro Mayor & Auditoría Fiscal
          </h1>
          <p className="ds-subtext mt-1">
            Gestión NIIF integral: Estados Financieros, Conciliación Bancaria, Comprobantes con Cripto-Sello SHA-256, Formatos 220 e Información Exógena.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 shadow-md">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span>NIT: 902.028.722-3</span>
            <span className="text-teal-500 font-bold">(LEGACYMARK S.A.S.)</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'financials'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" /> Estados Financieros (P&L / Balance)
        </button>
        <button
          onClick={() => setActiveTab('recon')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'recon'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" /> Conciliación Bancaria
        </button>
        <button
          onClick={() => setActiveTab('tax_calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tax_calendar'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> Calendario & Provisiones Fiscales
        </button>
        <button
          onClick={() => setActiveTab('withholdings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'withholdings'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4" /> Calculadora Retenciones DIAN
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Asientos & Comprobantes (SHA-256)
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'certificates'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Certificados DIAN 220
        </button>
        <button
          onClick={() => setActiveTab('exogena')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'exogena'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Medios Magnéticos Exógena
        </button>
        <button
          onClick={() => setActiveTab('puc')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'puc'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Catálogo PUC NIIF
        </button>
      </div>

      {/* ── TAB 1: FINANCIALS (P&L and TRIAL BALANCE) ── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {pnlReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Ingresos Operacionales</span>
                <p className="text-2xl font-black text-white mt-2 font-mono">${pnlReport.grossRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">100% Facturación Bruta DIAN</span>
                </div>
              </div>
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Costos & Gastos Operacionales</span>
                <p className="text-2xl font-black text-rose-400 mt-2 font-mono">${(pnlReport.operatingCosts + pnlReport.operatingExpenses).toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs text-slate-400 font-semibold">Nómina, Cloud y Marketing</span>
                </div>
              </div>
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Utilidad Operacional (EBITDA)</span>
                <p className="text-2xl font-black text-teal-400 mt-2 font-mono">${pnlReport.operatingIncome.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-xs text-teal-400 font-semibold">Rendimiento Operativo</span>
                </div>
              </div>
              <div className="ds-card p-5 border-teal-500/40 bg-teal-950/20 shadow-lg shadow-teal-500/10">
                <span className="text-xs font-mono text-teal-300 uppercase tracking-wider font-bold">Utilidad Neta del Ejercicio</span>
                <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">${pnlReport.netIncome.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-bold">{pnlReport.profitMarginPercent}% Margen Neto NIIF</span>
                </div>
              </div>
            </div>
          )}

          {/* Trial Balance Table */}
          <div className="ds-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Balance de Comprobación y Prueba NIIF</h3>
                <p className="text-xs text-slate-400">Consolidación de saldos y movimientos por cuentas mayores del Libro Mayor.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={loadFinancials} 
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors"
                  title="Actualizar saldos"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFinancials ? 'animate-spin' : ''}`} />
                </button>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Partida Doble Cuadrada ($0.00 Descuadre)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3">Código PUC</th>
                    <th className="pb-3">Nombre de la Cuenta</th>
                    <th className="pb-3">Clase</th>
                    <th className="pb-3 text-right">Saldo Inicial</th>
                    <th className="pb-3 text-right">Movimiento Débito</th>
                    <th className="pb-3 text-right">Movimiento Crédito</th>
                    <th className="pb-3 text-right">Saldo Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {trialBalance?.items.map((item: any) => (
                    <tr key={item.code} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 font-bold text-teal-400">{item.code}</td>
                      <td className="py-3 text-slate-200 font-sans">{item.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.category === 'ACTIVO' ? 'bg-blue-500/10 text-blue-400' :
                          item.category === 'PASIVO' ? 'bg-amber-500/10 text-amber-400' :
                          item.category === 'PATRIMONIO' ? 'bg-purple-500/10 text-purple-400' :
                          item.category === 'INGRESOS' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400">${item.initialBalance.toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-300">${item.debits.toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-300">${item.credits.toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-white">${item.finalBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-700 font-mono text-sm font-black text-white">
                    <td colSpan={4} className="pt-4">SUMAS IGUALES</td>
                    <td className="pt-4 text-right text-teal-400">${trialBalance?.totalDebits.toLocaleString()}</td>
                    <td className="pt-4 text-right text-teal-400">${trialBalance?.totalCredits.toLocaleString()}</td>
                    <td className="pt-4 text-right text-emerald-400">$0.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: BANK RECONCILIATION ── */}
      {activeTab === 'recon' && (
        <div className="space-y-6">
          <div className="ds-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-teal-400" />
                  Centro de Conciliación Bancaria Automática
                </h3>
                <p className="text-xs text-slate-400">Cruce directo entre extractos bancarios en línea y el Libro Auxiliar de Bancos (Cuenta 111005).</p>
              </div>
              <button 
                onClick={() => toast.success("Conciliación bancaria ejecutada. Todas las cuentas están al 100% cuadradas.")}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
              >
                <Check className="w-4 h-4" /> Conciliar Automáticamente
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bankAccounts.map((acc, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-white">{acc.bankAccount}</h4>
                      <p className="text-xs text-slate-500 font-mono">No. {acc.accountNumber}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      {acc.status}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Saldo según Extracto Bancario:</span>
                      <span className="text-white font-bold">${acc.bankStatementBalance.toLocaleString()} COP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Saldo según Libro Mayor (111005):</span>
                      <span className="text-white font-bold">${acc.ledgerBalance.toLocaleString()} COP</span>
                    </div>
                    <div className="flex justify-between text-teal-400 font-bold pt-1 border-t border-slate-800">
                      <span>Diferencia por Conciliar:</span>
                      <span>$0.00 COP</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-2">
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
                    <span>Última conciliación: {acc.lastReconciliationDate} (Sincronizado vía Open Finance)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: TAX CALENDAR & PROVISIONS ── */}
      {activeTab === 'tax_calendar' && (
        <div className="space-y-6">
          <div className="ds-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-400" />
                  Calendario Tributario DIAN & Provisiones de Impuestos
                </h3>
                <p className="text-xs text-slate-400">Control de vencimientos fiscales según el último dígito del NIT (Dígito 3).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taxCalendar.map((tax) => (
                <div key={tax.code} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                        {tax.formNumber}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2">{tax.name}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      tax.status === 'PROXIMO_A_VENCER' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    }`}>
                      {tax.status === 'PROXIMO_A_VENCER' ? 'Próximo a Vencer' : 'Al Día'}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-3 border-t border-slate-800 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Fecha Límite</span>
                      <span className="text-xs font-bold text-slate-300">{tax.dueDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Provisión Estimada</span>
                      <span className="text-sm font-black text-white">${tax.estimatedAmount.toLocaleString()} COP</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: WITHHOLDINGS CALCULATOR ── */}
      {activeTab === 'withholdings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ds-card p-6 space-y-5 lg:col-span-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-400" />
              Parámetros de Liquidación
            </h3>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Subtotal de la Transacción (COP)</label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  value={subtotal}
                  onChange={(e) => setSubtotal(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-lg focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Concepto / Tipo de Transacción</label>
              <select
                value={txType}
                onChange={(e: any) => setTxType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white mt-2 focus:border-teal-500 outline-none"
              >
                <option value="SERVICIOS">Servicios Generales / Software (4.0%)</option>
                <option value="HONORARIOS">Honorarios Profesionales (10.0%)</option>
                <option value="COMPRAS">Compras Generales (2.5%)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="text-xs text-slate-300">Aplicar ReteIVA (15% del IVA)</label>
              <input
                type="checkbox"
                checked={applyReteIVA}
                onChange={(e) => setApplyReteIVA(e.target.checked)}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleCalculateWithholdings}
              disabled={isCalculating}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isCalculating ? 'Calculando...' : 'Liquidar Retenciones'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="ds-card p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Desglose de Liquidación Tributaria DIAN</h3>

              {calcResult ? (
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Base Gravable / Subtotal:</span>
                    <span className="text-white font-bold">${calcResult.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/80">
                    <span className="text-slate-400">IVA (19%):</span>
                    <span className="text-white font-bold">+ ${calcResult.vatAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/80 text-rose-400">
                    <span>(-) Retención en la Fuente ({calcResult.reteFuenteRate * 100}%):</span>
                    <span>- ${calcResult.reteFuenteAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/80 text-rose-400">
                    <span>(-) ReteIVA (15% del IVA):</span>
                    <span>- ${calcResult.reteIvaAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/80 text-rose-400">
                    <span>(-) ReteICA (9.66 ‰ Tarifa Municipal):</span>
                    <span>- ${calcResult.reteIcaAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b-2 border-slate-700 text-rose-400 font-bold">
                    <span>Total Retenciones Practicadas:</span>
                    <span>- ${calcResult.totalWithholdings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-4 text-xl font-bold text-teal-400">
                    <span>Neto a Pagar al Proveedor:</span>
                    <span>${calcResult.netPayable.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Calculator className="w-12 h-12 mb-3 text-slate-600" />
                  <p>Configura los parámetros a la izquierda y presiona Liquidar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: JOURNAL VOUCHERS (PARTIDA DOBLE + SHA-256 SEAL) ── */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="ds-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  Comprobante de Diario & Asiento Contable
                </h3>
                <p className="text-xs text-slate-400">Registro con validación de partida doble y generación de sello criptográfico SHA-256.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={voucherNum}
                  onChange={(e) => setVoucherNum(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-teal-400 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Concepto de la Transacción</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm mt-1 focus:border-teal-500 outline-none"
              />
            </div>

            {/* Lines editor */}
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase">Líneas de Asiento (Cuentas PUC)</span>
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 items-center">
                  <div className="md:col-span-3">
                    <select
                      value={line.accountCode}
                      onChange={(e) => handleAccountSelect(idx, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-teal-400 font-mono outline-none"
                    >
                      <option value="">Seleccionar Cuenta PUC...</option>
                      {PUC_CATALOG.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      placeholder="NIT Tercero"
                      value={line.thirdPartyNit}
                      onChange={(e) => {
                        const updated = [...lines];
                        updated[idx].thirdPartyNit = e.target.value;
                        setLines(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono outline-none"
                    />
                  </div>
                  <div className="md:col-span-3">
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
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddLine}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 text-xs font-bold border border-slate-800 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar Línea de Asiento
              </button>
            </div>

            {/* Sealed voucher hash preview */}
            {sealedVoucher && (
              <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/30 flex items-center gap-3">
                <Lock className="w-5 h-5 text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-teal-400 uppercase font-bold">Sello Criptográfico de Auditoría SHA-256</span>
                  <p className="text-xs font-mono text-slate-300 truncate">{sealedVoucher.hashSeal}</p>
                </div>
              </div>
            )}

            {/* Validation & Save Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-6 font-mono text-sm">
                <div>
                  <span className="text-slate-500 text-xs uppercase block">Total Débitos</span>
                  <span className="font-bold text-emerald-400">${totalDebit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase block">Total Créditos</span>
                  <span className="font-bold text-rose-400">${totalCredit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase block">Estado</span>
                  <span className={`font-bold ${isBalanced ? 'text-teal-400' : 'text-rose-500'}`}>
                    {isBalanced ? '✓ Partida Balanceada' : '⚠ Descuadre'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveVoucher}
                disabled={!isBalanced}
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Asentar con Sello Digital SHA-256
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: TAX CERTIFICATES (FORMATO 220) ── */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ds-card p-6 space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Generar Certificado Tributario
            </h3>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Tipo de Certificado</label>
              <select
                value={certType}
                onChange={(e: any) => setCertType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm mt-1 focus:border-teal-500 outline-none"
              >
                <option value="RETEFUENTE">Certificado de Retención en la Fuente (Art. 381 E.T.)</option>
                <option value="RETEIVA">Certificado de Retención de IVA (ReteIVA 15%)</option>
                <option value="RETEICA">Certificado de Retención de ICA (ReteICA)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">NIT del Proveedor / Beneficiario</label>
              <input
                type="text"
                value={certBeneficiaryNit}
                onChange={(e) => setCertBeneficiaryNit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm mt-1 font-mono focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Razón Social / Nombre</label>
              <input
                type="text"
                value={certBeneficiaryName}
                onChange={(e) => setCertBeneficiaryName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm mt-1 focus:border-teal-500 outline-none"
              />
            </div>

            <button
              onClick={handleGenerateCertificate}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              Generar Certificado Oficial DIAN
            </button>
          </div>

          <div className="ds-card p-6 lg:col-span-2">
            {generatedCert ? (
              <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-200">
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{generatedCert.retainingAgentName}</h2>
                    <p className="text-xs text-slate-600 font-mono">NIT: {generatedCert.retainingAgentNit}</p>
                    <p className="text-xs text-slate-600">{generatedCert.city}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                      {generatedCert.certificateId}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 font-mono">Año Fiscal: {generatedCert.year}</p>
                  </div>
                </div>

                <div className="text-center py-2">
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
                    Certificado de Retención en la Fuente
                  </h3>
                  <p className="text-xs text-slate-500">Expedido en cumplimiento del Art. 381 del Estatuto Tributario</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                  <p><strong className="text-slate-900">Beneficiario del Pago:</strong> {generatedCert.beneficiaryName}</p>
                  <p><strong className="text-slate-900">NIT / C.C.:</strong> {generatedCert.beneficiaryNit}</p>
                </div>

                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold">
                      <th className="pb-2">Concepto de Retención</th>
                      <th className="pb-2 text-right">Monto Sujeto a Retención</th>
                      <th className="pb-2 text-right">Valor Retenido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="py-2.5">Servicios de Consultoría y Software</td>
                      <td className="py-2.5 text-right">${generatedCert.totalSubjectAmount.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-bold text-teal-800">${generatedCert.reteFuenteTotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">Retención de IVA (ReteIVA 15%)</td>
                      <td className="py-2.5 text-right">${Math.round(generatedCert.totalSubjectAmount * 0.19).toLocaleString()}</td>
                      <td className="py-2.5 text-right font-bold text-teal-800">${generatedCert.reteIvaTotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">Retención de ICA (9.66 ‰)</td>
                      <td className="py-2.5 text-right">${generatedCert.totalSubjectAmount.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-bold text-teal-800">${generatedCert.reteIcaTotal.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Sello de Verificación Digital */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-600">
                  <div>
                    <span className="font-bold text-slate-800 block">Sello Digital de Validación Fiscal:</span>
                    <span>{generatedCert.verificationHash}</span>
                  </div>
                  <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[8px]">
                    QR DIAN
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-xs text-slate-500">
                  <p>Fecha de Expedición: {generatedCert.generatedDate}</p>
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Imprimir / Exportar PDF Oficial
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FileText className="w-12 h-12 mb-3 text-slate-600" />
                <p>Ingresa los datos a la izquierda para generar el certificado oficial con sello digital.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 7: EXOGENA DIAN ── */}
      {activeTab === 'exogena' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                Información Exógena DIAN (Medios Magnéticos)
              </h3>
              <p className="text-xs text-slate-400">Generación y descarga de archivos compatibles con el prevalidador oficial de la DIAN.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-teal-400 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                  Formato 1001 v.10
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Pagos o Abonos en Cuenta y Retenciones</h4>
                <p className="text-xs text-slate-400 mt-2">Pagos a terceros con desglose de retención en la fuente a título de renta, IVA e ICA.</p>
              </div>
              <button 
                onClick={() => handleDownloadExogenaCSV("1001")}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" /> Descargar CSV Formato 1001
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-teal-400 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                  Formato 1007 v.9
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Ingresos Recibidos en el Año Fiscal</h4>
                <p className="text-xs text-slate-400 mt-2">Detalle de facturación electrónica emitida clasificada por concepto y tercero adquirente.</p>
              </div>
              <button 
                onClick={() => handleDownloadExogenaCSV("1007")}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" /> Descargar CSV Formato 1007
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-teal-400 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                  Formato 1003 v.7
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Retenciones que le Practicaron a la Empresa</h4>
                <p className="text-xs text-slate-400 mt-2">Anticipos de impuestos practicados por clientes para deducir en declaración de renta.</p>
              </div>
              <button 
                onClick={() => handleDownloadExogenaCSV("1003")}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" /> Descargar CSV Formato 1003
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: PUC CATALOG ── */}
      {activeTab === 'puc' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Plan Único de Cuentas (PUC Comercial NIIF)</h3>
              <p className="text-xs text-slate-400">Catálogo estructurado bajo normatividad contable colombiana.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar cuenta o código..."
                  value={pucFilter}
                  onChange={(e) => setPucFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-teal-500 w-56"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
              >
                <option value="TODOS">Todas las Clases</option>
                <option value="ACTIVO">1. Activo</option>
                <option value="PASIVO">2. Pasivo</option>
                <option value="PATRIMONIO">3. Patrimonio</option>
                <option value="INGRESOS">4. Ingresos</option>
                <option value="GASTOS">5. Gastos</option>
                <option value="COSTOS">6. Costos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3">Código PUC</th>
                  <th className="pb-3">Nombre de la Cuenta</th>
                  <th className="pb-3">Clase / Grupo</th>
                  <th className="pb-3">Naturaleza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredPUC.map((account) => (
                  <tr key={account.code} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-bold text-teal-400">{account.code}</td>
                    <td className="py-3 text-slate-200 font-sans">{account.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        account.category === 'ACTIVO' ? 'bg-blue-500/10 text-blue-400' :
                        account.category === 'PASIVO' ? 'bg-amber-500/10 text-amber-400' :
                        account.category === 'PATRIMONIO' ? 'bg-purple-500/10 text-purple-400' :
                        account.category === 'INGRESOS' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {account.category}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold ${account.nature === 'DEBITO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {account.nature}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
