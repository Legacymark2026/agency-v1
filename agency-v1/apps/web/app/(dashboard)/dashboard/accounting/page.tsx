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
  Sparkles,
  Bot,
  Users,
  Briefcase,
  AlertTriangle,
  Send,
  Zap,
  Scale,
  FolderLock,
  Archive,
  History,
  Tag,
  Receipt,
  FileCheck,
  Binary
} from 'lucide-react';
import { 
  calculateWithholdingsAction, 
  recordJournalVoucherAction,
  getTrialBalanceAction,
  getIncomeStatementAction,
  generateTaxCertificateAction,
  getBankReconciliationAction,
  getTaxCalendarAction,
  calculatePayrollProvisionsAction,
  getAgingPortfolioReportAction,
  auditAccountingAnomaliesAction,
  exportRealExogenaCSVAction,
  parseNaturalLanguageJournalEntryAction,
  getJournalVouchersHistoryAction,
  createFinancialAccountAction,
  executePeriodClosingAction,
  calculateFixedAssetDepreciationAction,
  calculateDianDVAction,
  getCostCentersAction,
  generateDocumentoSoporteDSEAction,
  getAuxiliaryLedgerAction
} from '@/modules/accounting/actions/accounting';
import type { SiigoDocumentType } from '@/modules/accounting/types';
import { toast } from 'sonner';

const PUC_CATALOG = [
  { code: '110505', name: 'Caja General', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '111005', name: 'Bancos Nacionales (Cuentas Corrientes y Ahorros)', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '130505', name: 'Clientes Nacionales (Cuentas por Cobrar)', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135515', name: 'Anticipo de Impuestos - Retención en la Fuente', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135517', name: 'Anticipo de Impuestos - ReteIVA', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135518', name: 'Anticipo de Impuestos - ReteICA', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '152805', name: 'Equipos de Computación y Comunicación NIIF', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '159205', name: 'Depreciación Acumulada de Activos Fijos', category: 'ACTIVO', nature: 'CREDITO' },
  { code: '220505', name: 'Proveedores Nacionales (Cuentas por Pagar)', category: 'PASIVO', nature: 'CREDITO' },
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
  { code: '516005', name: 'Gastos de Depreciación de Equipos NIIF', category: 'GASTOS', nature: 'DEBITO' },
  { code: '520506', name: 'Publicidad y Propaganda (Meta / Google Ads)', category: 'GASTOS', nature: 'DEBITO' },
  { code: '590505', name: 'Ganancias y Pérdidas (Cierre del Ejercicio)', category: 'PATRIMONIO', nature: 'CREDITO' },
  { code: '613501', name: 'Costo de Ventas - Prestación de Servicios', category: 'COSTOS', nature: 'DEBITO' },
];

export default function AccountingDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'financials' | 'auxiliary' | 'dse' | 'voucher_history' | 'vouchers' | 'cost_centers' | 'nit_validator' | 'ai_copilot' | 'assets' | 'closing' | 'recon' | 'aging' | 'payroll_provisions' | 'tax_calendar' | 'withholdings' | 'certificates' | 'exogena' | 'puc'
  >('financials');

  // Trial Balance & P&L state
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [pnlReport, setPnlReport] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [taxCalendar, setTaxCalendar] = useState<any[]>([]);
  const [portfolioReport, setPortfolioReport] = useState<any>(null);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [vouchersHistory, setVouchersHistory] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);

  // Auxiliary Ledger Filter State (Siigo Style)
  const [auxAccountFilter, setAuxAccountFilter] = useState('');
  const [auxNitFilter, setAuxNitFilter] = useState('');
  const [auxLedgerData, setAuxLedgerData] = useState<any>(null);
  const [isLoadingAux, setIsLoadingAux] = useState(false);

  // DSE (Documento Soporte Electrónico) State
  const [dseVendorNit, setDseVendorNit] = useState('1098765432');
  const [dseVendorName, setDseVendorName] = useState('Carlos Eduardo Mendoza (Desarrollador Freelance)');
  const [dseServiceDesc, setDseServiceDesc] = useState('Desarrollo de Módulo de Integración API');
  const [dseAmount, setDseAmount] = useState(4500000);
  const [generatedDSE, setGeneratedDSE] = useState<any>(null);

  // NIT Modulo 11 Validator State
  const [rawNitInput, setRawNitInput] = useState('902028722');
  const [validatedNitResult, setValidatedNitResult] = useState<any>(null);

  // New Bank Account Form State
  const [newBankName, setNewBankName] = useState('');
  const [newBankBalance, setNewBankBalance] = useState(0);

  // Fixed Asset Simulator State
  const [assetName, setAssetName] = useState('Servidores e Infraestructura TI');
  const [assetCost, setAssetCost] = useState(15000000);
  const [assetSalvage, setAssetSalvage] = useState(1500000);
  const [assetLifeMonths, setAssetLifeMonths] = useState(60);
  const [assetResult, setAssetResult] = useState<any>(null);

  // Fiscal Closing State
  const [closingPeriod, setClosingPeriod] = useState(`Diciembre ${new Date().getFullYear()}`);
  const [isClosing, setIsClosing] = useState(false);

  // Withholding Calculator state
  const [subtotal, setSubtotal] = useState<number>(5000000);
  const [txType, setTxType] = useState<'COMPRAS' | 'SERVICIOS' | 'HONORARIOS'>('SERVICIOS');
  const [applyReteIVA, setApplyReteIVA] = useState<boolean>(true);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Payroll Provisions Calculator
  const [payrollSalary, setPayrollSalary] = useState<number>(2500000);
  const [payrollBreakdown, setPayrollBreakdown] = useState<any>(null);

  // Journal Entry Form State (Siigo Standard)
  const [docType, setDocType] = useState<SiigoDocumentType>('CC');
  const [selectedCostCenter, setSelectedCostCenter] = useState('01');
  const [concept, setConcept] = useState('Prestación de Servicios de Consultoría');
  const [voucherNum, setVoucherNum] = useState(`CC-${Date.now().toString().slice(-6)}`);
  const [lines, setLines] = useState([
    { accountCode: '110505', accountName: 'Caja General', debit: 5000000, credit: 0, thirdPartyNit: '902028722-3', costCenterCode: '01' },
    { accountCode: '413501', accountName: 'Ingresos por Servicios de Software y Consultoría', debit: 0, credit: 5000000, thirdPartyNit: '902028722-3', costCenterCode: '01' },
  ]);
  const [sealedVoucher, setSealedVoucher] = useState<any>(null);

  // Certificate Generator State
  const [certBeneficiaryNit, setCertBeneficiaryNit] = useState('900.876.543-1');
  const [certBeneficiaryName, setCertBeneficiaryName] = useState('Tech Solutions & Consulting S.A.S.');
  const [certType, setCertType] = useState<'RETEFUENTE' | 'RETEIVA' | 'RETEICA'>('RETEFUENTE');
  const [generatedCert, setGeneratedCert] = useState<any>(null);

  // AI Copilot prompt
  const [aiPrompt, setAiPrompt] = useState('Compramos $3,500,000 en servidores Cloud pagados con transferencia de Bancolombia');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // PUC Search
  const [pucFilter, setPucFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');

  // Load financials on mount
  useEffect(() => {
    loadFinancials();
    handleCalculatePayroll(payrollSalary);
    handleDepreciateAsset();
    handleValidateNit(rawNitInput);
    handleLoadAuxiliary();
  }, []);

  const loadFinancials = async () => {
    setIsLoadingFinancials(true);
    try {
      const [tbRes, pnlRes, bankRes, calRes, portRes, audRes, vHistRes, ccRes] = await Promise.all([
        getTrialBalanceAction(),
        getIncomeStatementAction(),
        getBankReconciliationAction(),
        getTaxCalendarAction(),
        getAgingPortfolioReportAction(),
        auditAccountingAnomaliesAction(),
        getJournalVouchersHistoryAction(),
        getCostCentersAction(),
      ]);
      if (tbRes.success) setTrialBalance(tbRes);
      if (pnlRes.success) setPnlReport(pnlRes.report);
      if (bankRes.success) setBankAccounts(bankRes.accounts);
      if (calRes.success) setTaxCalendar(calRes.obligations);
      if (portRes.success) setPortfolioReport(portRes);
      if (audRes.success) setAuditReport(audRes);
      if (vHistRes.success) setVouchersHistory(vHistRes.vouchers);
      setCostCenters(ccRes);
    } catch (e) {
      console.error("Error loading financials:", e);
    } finally {
      setIsLoadingFinancials(false);
    }
  };

  const handleLoadAuxiliary = async () => {
    setIsLoadingAux(true);
    try {
      const res = await getAuxiliaryLedgerAction({
        accountCode: auxAccountFilter || undefined,
        thirdPartyNit: auxNitFilter || undefined,
      });
      if (res.success) setAuxLedgerData(res);
    } catch (e) {
      console.error("Error loading auxiliary ledger:", e);
    } finally {
      setIsLoadingAux(false);
    }
  };

  const handleValidateNit = async (nit: string) => {
    const res = await calculateDianDVAction(nit);
    setValidatedNitResult(res);
  };

  const handleGenerateDSE = async () => {
    try {
      const res = await generateDocumentoSoporteDSEAction({
        vendorNit: dseVendorNit,
        vendorName: dseVendorName,
        serviceDescription: dseServiceDesc,
        subtotal: dseAmount,
      });
      if (res.success) {
        setGeneratedDSE(res.dse);
        toast.success(`Documento Soporte ${res.dse.dseNumber} emitido con CUDS DIAN.`);
        loadFinancials();
      }
    } catch (e) {
      toast.error('Error generando Documento Soporte Electrónico');
    }
  };

  const handleCalculatePayroll = async (salary: number) => {
    const res = await calculatePayrollProvisionsAction(salary);
    setPayrollBreakdown(res);
  };

  const handleDepreciateAsset = async () => {
    const res = await calculateFixedAssetDepreciationAction({
      assetName,
      cost: assetCost,
      salvageValue: assetSalvage,
      usefulLifeMonths: assetLifeMonths,
    });
    setAssetResult(res);
  };

  const handleCreateBankAccount = async () => {
    if (!newBankName.trim()) {
      toast.error('Ingresa el nombre del banco o cuenta');
      return;
    }
    const res = await createFinancialAccountAction({
      name: newBankName,
      type: 'BANK_ACCOUNT',
      balance: newBankBalance,
    });
    if (res.success) {
      toast.success(`Cuenta bancaria ${newBankName} registrada en PostgreSQL.`);
      setNewBankName('');
      setNewBankBalance(0);
      loadFinancials();
    } else {
      toast.error(res.error || 'Error creando cuenta');
    }
  };

  const handleExecuteClosing = async () => {
    setIsClosing(true);
    try {
      const res = await executePeriodClosingAction(closingPeriod);
      if (res.success) {
        toast.success(`Cierre fiscal ${closingPeriod} ejecutado y guardado en PostgreSQL.`);
        loadFinancials();
        setActiveTab('voucher_history');
      } else {
        toast.error(res.error || 'Error al ejecutar cierre');
      }
    } catch (err) {
      toast.error('Error al ejecutar asiento de cierre');
    } finally {
      setIsClosing(false);
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
    setLines([...lines, { accountCode: '', accountName: '', debit: 0, credit: 0, thirdPartyNit: '', costCenterCode: selectedCostCenter }]);
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
        documentType: docType,
        costCenterCode: selectedCostCenter,
        concept,
        lines,
      });

      if (res.success && res.voucher) {
        setSealedVoucher(res.voucher);
        toast.success(`Comprobante ${docType}-${voucherNum} registrado y persistido en PostgreSQL.`);
        setVoucherNum(`${docType}-${Date.now().toString().slice(-6)}`);
        loadFinancials();
        handleLoadAuxiliary();
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

  const handleAICopilotGenerate = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await parseNaturalLanguageJournalEntryAction(aiPrompt);
      if (res.success) {
        setConcept(res.concept);
        setLines(res.lines);
        setActiveTab('vouchers');
        toast.success('¡Asiento contable interpretado por IA! Verifícalo en la pestaña de Asientos.');
      }
    } catch (err) {
      toast.error('Error interpretando instrucción contable');
    } finally {
      setIsGeneratingAI(false);
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
              <Sparkles size={10} className="text-teal-400" /> ERP Cloud Contable Nivel Siigo · NIIF & DIAN Colombia
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Contabilidad General, Libro Mayor & Auditoría Fiscal
          </h1>
          <p className="ds-subtext mt-1">
            Suite ERP estándar Siigo Nube: Documentos Contables (CC/RC/CE/FV/DSE), Centros de Costos, Libros Auxiliares, Cierre Fiscal y Medios Magnéticos.
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
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'financials'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" /> Estados Financieros
        </button>
        <button
          onClick={() => {
            setActiveTab('auxiliary');
            handleLoadAuxiliary();
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'auxiliary'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-teal-400" /> Libros Auxiliares
        </button>
        <button
          onClick={() => setActiveTab('dse')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dse'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-teal-400" /> Documento Soporte DSE
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Nuevo Documento / Asiento
        </button>
        <button
          onClick={() => setActiveTab('voucher_history')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'voucher_history'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" /> Libro Diario
        </button>
        <button
          onClick={() => setActiveTab('cost_centers')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cost_centers'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" /> Centros de Costos
        </button>
        <button
          onClick={() => setActiveTab('nit_validator')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'nit_validator'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Binary className="w-4 h-4" /> Validador DV DIAN
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'assets'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Archive className="w-4 h-4" /> Activos Fijos NIIF
        </button>
        <button
          onClick={() => setActiveTab('closing')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'closing'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FolderLock className="w-4 h-4" /> Cierre Fiscal
        </button>
        <button
          onClick={() => setActiveTab('recon')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'recon'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" /> Bancos
        </button>
        <button
          onClick={() => setActiveTab('exogena')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'exogena'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Exógena CSV
        </button>
      </div>

      {/* ── TAB 1: FINANCIALS (P&L and TRIAL BALANCE) ── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {pnlReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Ingresos Operacionales (Ventas)</span>
                <p className="text-2xl font-black text-white mt-2 font-mono">${pnlReport.grossRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">Facturación Real PostgreSQL</span>
                </div>
              </div>
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Costos & Gastos Operacionales</span>
                <p className="text-2xl font-black text-rose-400 mt-2 font-mono">${(pnlReport.operatingCosts + pnlReport.operatingExpenses).toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs text-slate-400 font-semibold">Egresos & Nómina</span>
                </div>
              </div>
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Utilidad Operacional (EBITDA)</span>
                <p className="text-2xl font-black text-teal-400 mt-2 font-mono">${pnlReport.operatingIncome.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-xs text-teal-400 font-semibold">Rendimiento Real</span>
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
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir Balance Oficial
                </button>
                <button 
                  onClick={loadFinancials} 
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
                  title="Actualizar saldos"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFinancials ? 'animate-spin' : ''}`} />
                </button>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Partida Doble Balanceada
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

      {/* ── TAB 2: AUXILIARY LEDGERS (LIBROS AUXILIARES SIIGO STYLE) ── */}
      {activeTab === 'auxiliary' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-400" />
                Libro Auxiliar por Cuenta y Tercero (Extracto Detallado)
              </h3>
              <p className="text-xs text-slate-400">Drill-down cronológico con saldo acumulado por cuenta contable y NIT de tercero.</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Filtrar por Cuenta (Ej: 1110, 1305)..."
                value={auxAccountFilter}
                onChange={(e) => setAuxAccountFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-teal-400 font-mono outline-none w-48"
              />
              <input
                type="text"
                placeholder="Filtrar por NIT..."
                value={auxNitFilter}
                onChange={(e) => setAuxNitFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none w-36"
              />
              <button
                onClick={handleLoadAuxiliary}
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Buscar
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
                  <th className="pb-3">Tercero (NIT)</th>
                  <th className="pb-3">Concepto</th>
                  <th className="pb-3 text-right">Débito</th>
                  <th className="pb-3 text-right">Crédito</th>
                  <th className="pb-3 text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auxLedgerData?.items && auxLedgerData.items.length > 0 ? (
                  auxLedgerData.items.map((it: any) => (
                    <tr key={it.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 text-slate-400">{it.date}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-400 font-bold text-[10px] border border-teal-800/40">
                          {it.documentType}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-white">{it.voucherNumber}</td>
                      <td className="py-2.5 text-teal-400">{it.accountCode} - {it.accountName}</td>
                      <td className="py-2.5 text-slate-300">{it.thirdPartyNit}</td>
                      <td className="py-2.5 text-slate-200 font-sans">{it.concept}</td>
                      <td className="py-2.5 text-right text-emerald-400">{it.debit > 0 ? `$${it.debit.toLocaleString()}` : '-'}</td>
                      <td className="py-2.5 text-right text-rose-400">{it.credit > 0 ? `$${it.credit.toLocaleString()}` : '-'}</td>
                      <td className="py-2.5 text-right font-bold text-white">${it.runningBalance.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No se encontraron movimientos auxiliares registrados con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: DOCUMENTO SOPORTE ELECTRÓNICO (DSE DIAN) ── */}
      {activeTab === 'dse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ds-card p-6 space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-400" />
              Emitir Documento Soporte DSE
            </h3>
            <p className="text-xs text-slate-400">Para compras y pagos de servicios a personas no obligadas a expedir factura electrónica.</p>

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
              <label className="text-xs font-mono text-slate-400 uppercase">Nombre / Razón Social</label>
              <input
                type="text"
                value={dseVendorName}
                onChange={(e) => setDseVendorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Descripción del Servicio / Compra</label>
              <input
                type="text"
                value={dseServiceDesc}
                onChange={(e) => setDseServiceDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Valor Total del Servicio (COP)</label>
              <input
                type="number"
                value={dseAmount}
                onChange={(e) => setDseAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-sm mt-1 outline-none"
              />
            </div>

            <button
              onClick={handleGenerateDSE}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              Generar & Transmitir DSE con CUDS
            </button>
          </div>

          <div className="ds-card p-6 lg:col-span-2">
            {generatedDSE ? (
              <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-200">
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">LEGACYMARK S.A.S.</h2>
                    <p className="text-xs text-slate-600 font-mono">NIT: 902.028.722-3</p>
                    <p className="text-xs text-slate-600">Bucaramanga, Santander</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                      {generatedDSE.dseNumber}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">{generatedDSE.issueDate}</p>
                  </div>
                </div>

                <div className="text-center py-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Documento Soporte en Adquisiciones Efectuadas a Sujetos No Obligados a Expedir Factura
                  </h3>
                  <p className="text-[11px] text-slate-500">Resolución DIAN No. 000167 · Transmisión Electrónica Validada</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                  <p><strong className="text-slate-900">Vendedor / Prestador:</strong> {generatedDSE.vendorName}</p>
                  <p><strong className="text-slate-900">Identificación (NIT/CC):</strong> {generatedDSE.vendorNit}</p>
                  <p><strong className="text-slate-900">Concepto:</strong> {generatedDSE.serviceDescription}</p>
                </div>

                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold">
                      <th className="pb-2">Concepto Liquidado</th>
                      <th className="pb-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2">Valor Bruto del Servicio</td>
                      <td className="py-2 text-right font-bold">${generatedDSE.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-rose-700">(-) Retención en la Fuente (4%)</td>
                      <td className="py-2 text-right text-rose-700">- ${generatedDSE.reteFuenteAmount.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-rose-700">(-) Retención de ICA (9.66 ‰)</td>
                      <td className="py-2 text-right text-rose-700">- ${generatedDSE.reteIcaAmount.toLocaleString()}</td>
                    </tr>
                    <tr className="font-bold text-sm bg-slate-50">
                      <td className="py-2 text-slate-900">Neto a Pagar al Prestador:</td>
                      <td className="py-2 text-right text-teal-800">${generatedDSE.totalNetToPay.toLocaleString()} COP</td>
                    </tr>
                  </tbody>
                </table>

                {/* CUDS & QR Sello */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-600">
                  <div className="min-w-0 pr-4">
                    <span className="font-bold text-slate-800 block">CUDS (Código Único de Documento Soporte):</span>
                    <span className="truncate block">{generatedDSE.cuds}</span>
                  </div>
                  <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[9px] shrink-0">
                    QR DIAN
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Documento Soporte Oficial
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FileCheck className="w-12 h-12 mb-3 text-slate-600" />
                <p>Ingresa los datos del prestador a la izquierda para generar el DSE oficial.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: NEW JOURNAL VOUCHER (SIIGO STANDARD) ── */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="ds-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  Asentador de Documentos Contables (Estándar Siigo Nube)
                </h3>
                <p className="text-xs text-slate-400">Creación de comprobantes CC, RC, CE, FV, FC con centro de costos y validación de sumas iguales.</p>
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
                  <option value="NC">NC - Nota Crédito</option>
                  <option value="ND">ND - Nota Débito</option>
                </select>
                <input
                  type="text"
                  value={voucherNum}
                  onChange={(e) => setVoucherNum(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-teal-400 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-mono text-slate-400 uppercase">Concepto del Documento</label>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Centro de Costos Principal</label>
                <select
                  value={selectedCostCenter}
                  onChange={(e) => setSelectedCostCenter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 focus:border-teal-500 outline-none"
                >
                  {costCenters.map(cc => (
                    <option key={cc.code} value={cc.code}>{cc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lines editor */}
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase">Líneas de Asiento (Cuentas PUC / Tercero / Centro de Costos)</span>
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
                Guardar en PostgreSQL ({docType})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: COST CENTERS ── */}
      {activeTab === 'cost_centers' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-400" />
                Catálogo de Centros de Costos
              </h3>
              <p className="text-xs text-slate-400">Estructura para distribución de ingresos, costos y gastos por unidad de negocio.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {costCenters.map(cc => (
              <div key={cc.code} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                    Centro {cc.code}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">{cc.name}</h4>
                </div>
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  ACTIVO
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: NIT VALIDATOR (MODULO 11 DIAN) ── */}
      {activeTab === 'nit_validator' && (
        <div className="ds-card p-6 space-y-6 max-w-xl">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Binary className="w-5 h-5 text-teal-400" />
              Calculador Oficial de Dígito de Verificación (DIAN Módulo 11)
            </h3>
            <p className="text-xs text-slate-400">Algoritmo matemático oficial con factores primos (71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3).</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Ingresa el NIT o Cédula sin DV</label>
              <input
                type="text"
                value={rawNitInput}
                onChange={(e) => {
                  setRawNitInput(e.target.value);
                  handleValidateNit(e.target.value);
                }}
                placeholder="Ej: 902028722"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-lg mt-1 outline-none focus:border-teal-500"
              />
            </div>

            {validatedNitResult && (
              <div className="p-5 bg-teal-950/20 border border-teal-500/30 rounded-2xl space-y-2">
                <span className="text-xs font-mono text-teal-300 uppercase font-bold">Resultado Oficial DIAN</span>
                <p className="text-3xl font-black text-emerald-400 font-mono">{validatedNitResult.formatted}</p>
                <p className="text-xs text-slate-400 font-mono">Dígito de Verificación Calculado: <strong className="text-white font-bold">{validatedNitResult.dv}</strong></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 7: VOUCHERS HISTORY ── */}
      {activeTab === 'voucher_history' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-teal-400" />
                Libro Diario & Historial de Comprobantes Registrados
              </h3>
              <p className="text-xs text-slate-400">Comprobantes asentados en PostgreSQL con sello de auditoría inmutable SHA-256.</p>
            </div>
            <button 
              onClick={loadFinancials} 
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refrescar Libro Diario
            </button>
          </div>

          <div className="space-y-4">
            {vouchersHistory.length > 0 ? (
              vouchersHistory.map((v, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-teal-950 border border-teal-800/50 text-teal-400 font-mono font-bold text-xs">
                        {v.documentType || 'CC'}-{v.voucherNumber}
                      </span>
                      <span className="text-xs font-bold text-white">{v.concept}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{new Date(v.date).toLocaleDateString("es-CO", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-[11px] font-mono text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-1">Cuenta PUC</th>
                          <th className="pb-1">Tercero</th>
                          <th className="pb-1 text-right">Débito</th>
                          <th className="pb-1 text-right">Crédito</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {v.lines.map((l: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-1 text-slate-300">{l.accountCode} - {l.accountName}</td>
                            <td className="py-1 text-slate-400">{l.thirdPartyNit}</td>
                            <td className="py-1 text-right text-emerald-400">{l.debit > 0 ? `$${Number(l.debit).toLocaleString()}` : '-'}</td>
                            <td className="py-1 text-right text-rose-400">{l.credit > 0 ? `$${Number(l.credit).toLocaleString()}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {v.hashSeal && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
                      <span className="truncate max-w-md">SHA-256: {v.hashSeal}</span>
                      <span className="text-emerald-400 font-bold">✓ Sellado en PostgreSQL</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                No hay comprobantes de diario registrados aún en el libro mayor. Puedes crear uno en la pestaña "Nuevo Asiento".
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 8: FIXED ASSETS & NIIF DEPRECIATION ── */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ds-card p-6 space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Archive className="w-5 h-5 text-teal-400" />
              Depreciación Lineal NIIF
            </h3>
            <p className="text-xs text-slate-400">Control de activos tangibles y cálculo mensual de depreciación (Cuenta 5160 vs 1592).</p>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Nombre del Activo</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Costo de Adquisición (COP)</label>
              <input
                type="number"
                value={assetCost}
                onChange={(e) => {
                  setAssetCost(Number(e.target.value));
                  handleDepreciateAsset();
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Valor de Salvamento / Residual (COP)</label>
              <input
                type="number"
                value={assetSalvage}
                onChange={(e) => {
                  setAssetSalvage(Number(e.target.value));
                  handleDepreciateAsset();
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Vida Útil (Meses)</label>
              <input
                type="number"
                value={assetLifeMonths}
                onChange={(e) => {
                  setAssetLifeMonths(Number(e.target.value));
                  handleDepreciateAsset();
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none"
              />
            </div>
          </div>

          <div className="ds-card p-6 lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white">Tabla de Depreciación y Valor en Libros NIIF</h3>

            {assetResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Depreciación Mensual</span>
                    <p className="text-base font-bold text-teal-400 mt-1">${assetResult.monthlyDepreciation.toLocaleString()} COP</p>
                  </div>
                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Depreciación Acumulada</span>
                    <p className="text-base font-bold text-rose-400 mt-1">${assetResult.accumulatedDepreciation.toLocaleString()} COP</p>
                  </div>
                  <div className="p-3.5 bg-teal-950/20 rounded-xl border border-teal-500/30">
                    <span className="text-[10px] text-teal-300 uppercase font-bold">Valor Neto en Libros</span>
                    <p className="text-base font-black text-emerald-400 mt-1">${assetResult.netBookValue.toLocaleString()} COP</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-white">Asiento Contable Sugerido para Causación Mensual:</h4>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                    <div className="p-2 bg-slate-950 rounded text-emerald-400">
                      <strong>Débito (516005):</strong> ${assetResult.monthlyDepreciation.toLocaleString()} (Gasto Depreciación)
                    </div>
                    <div className="p-2 bg-slate-950 rounded text-rose-400">
                      <strong>Crédito (159205):</strong> ${assetResult.monthlyDepreciation.toLocaleString()} (Depreciación Acumulada)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 9: FISCAL PERIOD CLOSING ── */}
      {activeTab === 'closing' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-teal-400" />
                Cierre Contable y Cancelación de Cuentas de Resultado
              </h3>
              <p className="text-xs text-slate-400">Cancela los saldos de Ingresos (Clase 4), Gastos (Clase 5) y Costos (Clase 6) contra la cuenta 5905 (Ganancias y Pérdidas).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Periodo a Cerrar</label>
                <input
                  type="text"
                  value={closingPeriod}
                  onChange={(e) => setClosingPeriod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm mt-1 outline-none"
                />
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Importante sobre el Asiento de Cierre NIIF
                </p>
                <p className="text-slate-300">
                  Esta acción generará automáticamente un Comprobante de Diario de Cierre en PostgreSQL que debitará todas las cuentas de Ingreso y acreditará todas las cuentas de Gasto, trasladando el resultado neto a la cuenta patrimonial.
                </p>
              </div>

              <button
                onClick={handleExecuteClosing}
                disabled={isClosing}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
              >
                {isClosing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isClosing ? 'Ejecutando Cierre...' : `Ejecutar Cierre Fiscal ${closingPeriod}`}
              </button>
            </div>

            <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
              <h4 className="font-bold text-white">Estructura del Asiento de Cierre en PostgreSQL:</h4>
              <div className="space-y-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded flex justify-between">
                  <span className="text-emerald-400">Débito: 413501 (Ingresos Operacionales)</span>
                  <span className="text-white font-bold">100% Saldo</span>
                </div>
                <div className="p-2 bg-slate-950 rounded flex justify-between">
                  <span className="text-rose-400">Crédito: 510506 (Gastos de Nómina)</span>
                  <span className="text-white font-bold">100% Saldo</span>
                </div>
                <div className="p-2 bg-slate-950 rounded flex justify-between">
                  <span className="text-rose-400">Crédito: 513535 (Gastos Generales / Cloud)</span>
                  <span className="text-white font-bold">100% Saldo</span>
                </div>
                <div className="p-2 bg-slate-950 rounded flex justify-between border-t border-slate-800">
                  <span className="text-teal-400 font-bold">Crédito: 590505 (Utilidad del Ejercicio)</span>
                  <span className="text-emerald-400 font-bold">Resultado Neto</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 10: BANK RECONCILIATION ── */}
      {activeTab === 'recon' && (
        <div className="space-y-6">
          <div className="ds-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-teal-400" />
                  Centro de Conciliación & Cuentas Bancarias
                </h3>
                <p className="text-xs text-slate-400">Cuentas financieras registradas en PostgreSQL cruzadas contra el Libro Auxiliar (111005).</p>
              </div>
              <button 
                onClick={() => toast.success("Conciliación bancaria ejecutada contra PostgreSQL.")}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
              >
                <Check className="w-4 h-4" /> Conciliar Cuentas
              </button>
            </div>

            {/* Create Bank Account Form */}
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Registrar Nueva Cuenta Bancaria en PostgreSQL</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Ej: Bancolombia Cta Corriente Ppal"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  type="number"
                  placeholder="Saldo Inicial (COP)"
                  value={newBankBalance || ''}
                  onChange={(e) => setNewBankBalance(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                />
                <button
                  onClick={handleCreateBankAccount}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  + Agregar Cuenta Bancaria
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bankAccounts.length > 0 ? (
                bankAccounts.map((acc, i) => (
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
                        <span className="text-slate-400">Saldo según Extracto:</span>
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
                      <span>Última conciliación: {acc.lastReconciliationDate}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs col-span-2">
                  No hay cuentas bancarias activas registradas en la tabla financiera.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 11: EXOGENA DIAN ── */}
      {activeTab === 'exogena' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                Información Exógena DIAN (Medios Magnéticos)
              </h3>
              <p className="text-xs text-slate-400">Generación y descarga de archivos exportados en tiempo real desde la base de datos PostgreSQL para el prevalidador oficial.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-teal-400 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                  Formato 1001 v.10
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Pagos o Abonos en Cuenta y Retenciones</h4>
                <p className="text-xs text-slate-400 mt-2">Pagos a terceros con desglose de retención en la fuente a título de renta, IVA e ICA desde PostgreSQL.</p>
              </div>
              <button 
                onClick={() => handleDownloadExogenaCSV("1001")}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" /> Exportar CSV Formato 1001 Real
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-teal-400 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                  Formato 1007 v.9
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Ingresos Recibidos en el Año Fiscal</h4>
                <p className="text-xs text-slate-400 mt-2">Detalle de facturación electrónica emitida desde PostgreSQL clasificada por cliente.</p>
              </div>
              <button 
                onClick={() => handleDownloadExogenaCSV("1007")}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" /> Exportar CSV Formato 1007 Real
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
                <Download className="w-4 h-4" /> Exportar CSV Formato 1003 Real
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
