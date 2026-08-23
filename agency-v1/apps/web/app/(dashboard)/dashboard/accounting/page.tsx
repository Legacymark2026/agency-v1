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
  Binary,
  Activity,
  LineChart,
  Wallet,
  Gauge,
  Boxes,
  UploadCloud,
  FileCode,
  Stamp,
  CreditCard
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
  getAuxiliaryLedgerAction,
  getFinancialRatiosAction,
  getBudgetVarianceAction,
  getCashFlowForecastAction,
  getInventoryKardexAction,
  registerKardexMovementAction,
  generateNominaElectronicaCUNEAction,
  getNominaElectronicaHistoryAction,
  getDianResolutionsAction,
  importBulkThirdPartiesAction,
  importBulkOpeningBalanceAction,
  parseBankStatementAndReconcileAction
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
  { code: '143501', name: 'Inventario de Mercancías & Licencias NIIF', category: 'ACTIVO', nature: 'DEBITO' },
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
  { code: '613501', name: 'Costo de Ventas - Prestación de Servicios & Licencias', category: 'COSTOS', nature: 'DEBITO' },
];

export default function AccountingDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'ratios' | 'financials' | 'kardex' | 'nomina_electronica' | 'resolutions' | 'bulk_import' | 'bank_statement' | 'auxiliary' | 'dse' | 'voucher_history' | 'vouchers' | 'cost_centers' | 'nit_validator' | 'assets' | 'closing' | 'recon' | 'exogena'
  >('ratios');

  // Enterprise Reports State
  const [financialRatios, setFinancialRatios] = useState<any>(null);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [pnlReport, setPnlReport] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [vouchersHistory, setVouchersHistory] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);

  // Kardex & Inventory State
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [kardexMovements, setKardexMovements] = useState<any[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<number>(0);

  // Nómina Electrónica DIAN State
  const [nominaRecords, setNominaRecords] = useState<any[]>([]);
  const [nomEmpNit, setNomEmpNit] = useState('1098765432');
  const [nomEmpName, setNomEmpName] = useState('Andrés Felipe Ruiz');
  const [nomPosition, setNomPosition] = useState('Ingeniero Cloud & DevOps');
  const [nomSalary, setNomSalary] = useState(4500000);
  const [generatedNomina, setGeneratedNomina] = useState<any>(null);

  // Resoluciones DIAN State
  const [resolutions, setResolutions] = useState<any[]>([]);

  // Importador Masivo State
  const [csvImportText, setCsvImportText] = useState("900123456,Tecnología Andina S.A.S.\n901876543,Comunicaciones del Oriente S.A.\n1098765432,Carlos Eduardo Mendoza");
  const [importResult, setImportResult] = useState<any>(null);

  // Extractos Bancarios Conciliación Automática State
  const [bankStatementData, setBankStatementData] = useState<any>(null);

  // Auxiliary Ledger Filter State (Siigo Style)
  const [auxAccountFilter, setAuxAccountFilter] = useState('');
  const [auxNitFilter, setAuxNitFilter] = useState('');
  const [auxLedgerData, setAuxLedgerData] = useState<any>(null);

  // DSE (Documento Soporte Electrónico) State
  const [dseVendorNit, setDseVendorNit] = useState('1098765432');
  const [dseVendorName, setDseVendorName] = useState('Carlos Eduardo Mendoza (Desarrollador Freelance)');
  const [dseServiceDesc, setDseServiceDesc] = useState('Desarrollo de Módulo de Integración API');
  const [dseAmount, setDseAmount] = useState(4500000);
  const [generatedDSE, setGeneratedDSE] = useState<any>(null);

  // NIT Modulo 11 Validator State
  const [rawNitInput, setRawNitInput] = useState('902028722');
  const [validatedNitResult, setValidatedNitResult] = useState<any>(null);

  // Fixed Asset Simulator State
  const [assetName, setAssetName] = useState('Servidores e Infraestructura TI');
  const [assetCost, setAssetCost] = useState(15000000);
  const [assetSalvage, setAssetSalvage] = useState(1500000);
  const [assetLifeMonths, setAssetLifeMonths] = useState(60);
  const [assetResult, setAssetResult] = useState<any>(null);

  // Fiscal Closing State
  const [closingPeriod, setClosingPeriod] = useState(`Diciembre ${new Date().getFullYear()}`);
  const [isClosing, setIsClosing] = useState(false);

  // Journal Entry Form State (Siigo Standard)
  const [docType, setDocType] = useState<SiigoDocumentType>('CC');
  const [selectedCostCenter, setSelectedCostCenter] = useState('01');
  const [concept, setConcept] = useState('Prestación de Servicios de Consultoría');
  const [voucherNum, setVoucherNum] = useState(`CC-${Date.now().toString().slice(-6)}`);
  const [lines, setLines] = useState([
    { accountCode: '110505', accountName: 'Caja General', debit: 5000000, credit: 0, thirdPartyNit: '902028722-3', costCenterCode: '01' },
    { accountCode: '413501', accountName: 'Ingresos por Servicios de Software y Consultoría', debit: 0, credit: 5000000, thirdPartyNit: '902028722-3', costCenterCode: '01' },
  ]);

  // Load financials on mount
  useEffect(() => {
    loadFinancials();
    handleDepreciateAsset();
    handleValidateNit(rawNitInput);
    handleLoadAuxiliary();
  }, []);

  const loadFinancials = async () => {
    setIsLoadingFinancials(true);
    try {
      const [tbRes, pnlRes, bankRes, vHistRes, ccRes, ratRes, invRes, nomRes, resRes, bnkStmtRes] = await Promise.all([
        getTrialBalanceAction(),
        getIncomeStatementAction(),
        getBankReconciliationAction(),
        getJournalVouchersHistoryAction(),
        getCostCentersAction(),
        getFinancialRatiosAction(),
        getInventoryKardexAction(),
        getNominaElectronicaHistoryAction(),
        getDianResolutionsAction(),
        parseBankStatementAndReconcileAction(""),
      ]);
      if (tbRes.success) setTrialBalance(tbRes);
      if (pnlRes.success) setPnlReport(pnlRes.report);
      if (bankRes.success) setBankAccounts(bankRes.accounts);
      if (vHistRes.success) setVouchersHistory(vHistRes.vouchers);
      if (ratRes.success) setFinancialRatios(ratRes.ratios);
      if (invRes.success) {
        setInventoryItems(invRes.items);
        setKardexMovements(invRes.movements);
        setInventoryValuation(invRes.totalValuation);
      }
      if (nomRes.success) setNominaRecords(nomRes.records);
      if (resRes.success) setResolutions(resRes.resolutions);
      if (bnkStmtRes.success) setBankStatementData(bnkStmtRes);
      setCostCenters(ccRes);
    } catch (e) {
      console.error("Error loading financials:", e);
    } finally {
      setIsLoadingFinancials(false);
    }
  };

  const handleEmitNominaCUNE = async () => {
    try {
      const res = await generateNominaElectronicaCUNEAction({
        employeeNit: nomEmpNit,
        employeeName: nomEmpName,
        position: nomPosition,
        baseSalary: nomSalary,
      });
      if (res.success) {
        setGeneratedNomina(res.record);
        setNominaRecords([res.record, ...nominaRecords]);
        toast.success(`Nómina Electrónica ${res.record.documentNumber} emitida con CUNE DIAN.`);
      }
    } catch (e) {
      toast.error('Error emitiendo Nómina Electrónica');
    }
  };

  const handleImportThirdParties = async () => {
    try {
      const res = await importBulkThirdPartiesAction(csvImportText);
      setImportResult(res);
      if (res.success) {
        toast.success(`¡${res.importedCount} terceros importados exitosamente!`);
      }
    } catch (e) {
      toast.error('Error importando terceros');
    }
  };

  const handleLoadAuxiliary = async () => {
    try {
      const res = await getAuxiliaryLedgerAction({
        accountCode: auxAccountFilter || undefined,
        thirdPartyNit: auxNitFilter || undefined,
      });
      if (res.success) setAuxLedgerData(res);
    } catch (e) {
      console.error("Error loading auxiliary ledger:", e);
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

  const handleDepreciateAsset = async () => {
    const res = await calculateFixedAssetDepreciationAction({
      assetName,
      cost: assetCost,
      salvageValue: assetSalvage,
      usefulLifeMonths: assetLifeMonths,
    });
    setAssetResult(res);
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
              <Sparkles size={10} className="text-teal-400" /> Siigo-Grade Full Enterprise ERP Contable & DIAN Direct
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Contabilidad General, Libro Mayor & Nómina DIAN
          </h1>
          <p className="ds-subtext mt-1">
            Plataforma ERP Completa Nivel Siigo: Kardex NIIF, Nómina Electrónica (CUNE), Resoluciones DIAN, Extractos Bancarios, Importador Masivo y Exógena.
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
          onClick={() => setActiveTab('ratios')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ratios'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Gauge className="w-4 h-4 text-teal-400" /> Ratios
        </button>
        <button
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'financials'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" /> Estados NIIF
        </button>
        <button
          onClick={() => setActiveTab('kardex')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'kardex'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4 text-teal-400" /> Kardex NIIF
        </button>
        <button
          onClick={() => setActiveTab('nomina_electronica')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'nomina_electronica'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-teal-400" /> Nómina CUNE
        </button>
        <button
          onClick={() => setActiveTab('resolutions')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'resolutions'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Stamp className="w-4 h-4 text-teal-400" /> Resoluciones DIAN
        </button>
        <button
          onClick={() => setActiveTab('bulk_import')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bulk_import'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-teal-400" /> Importador Excel
        </button>
        <button
          onClick={() => setActiveTab('bank_statement')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bank_statement'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-teal-400" /> Extractos Bancarios
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
          <Receipt className="w-4 h-4" /> Auxiliares
        </button>
        <button
          onClick={() => setActiveTab('dse')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dse'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" /> DSE
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Nuevo Asiento
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

      {/* ── TAB 1: FINANCIAL RATIOS ── */}
      {activeTab === 'ratios' && (
        <div className="space-y-6">
          {financialRatios && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="ds-card p-5 border-teal-500/30 bg-teal-950/15">
                  <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold">Razón Corriente (Liquidez)</span>
                  <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{financialRatios.razonCorriente}x</p>
                  <p className="text-xs text-slate-400 mt-1">Por cada $1.00 de deuda a corto plazo, la empresa tiene ${financialRatios.razonCorriente} de respaldo.</p>
                </div>
                <div className="ds-card p-5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Prueba Ácida (Quick Ratio)</span>
                  <p className="text-3xl font-black text-white mt-2 font-mono">{financialRatios.pruebaAcida}x</p>
                  <p className="text-xs text-slate-400 mt-1">Capacidad de pago inmediata sin depender de inventarios.</p>
                </div>
                <div className="ds-card p-5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Nivel de Endeudamiento</span>
                  <p className="text-3xl font-black text-amber-400 mt-2 font-mono">{financialRatios.nivelEndeudamiento}%</p>
                  <p className="text-xs text-slate-400 mt-1">Proporción de los activos totales financiada por terceros.</p>
                </div>
                <div className="ds-card p-5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Capital de Trabajo (KTNO)</span>
                  <p className="text-2xl font-black text-teal-400 mt-2 font-mono">${financialRatios.ktno.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">Recursos netos requeridos para la operación comercial.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="ds-card p-5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Margen Operativo (EBITDA)</span>
                  <p className="text-3xl font-black text-teal-400 mt-2 font-mono">{financialRatios.margenOperativo}%</p>
                </div>
                <div className="ds-card p-5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Margen Neto NIIF</span>
                  <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{financialRatios.margenNeto}%</p>
                </div>
                <div className="ds-card p-5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ROE (Retorno sobre Patrimonio)</span>
                  <p className="text-3xl font-black text-purple-400 mt-2 font-mono">{financialRatios.roe}%</p>
                </div>
                <div className="ds-card p-5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ROA (Retorno sobre Activos)</span>
                  <p className="text-3xl font-black text-blue-400 mt-2 font-mono">{financialRatios.roa}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: FINANCIALS ── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {pnlReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Ingresos Operacionales (Ventas)</span>
                <p className="text-2xl font-black text-white mt-2 font-mono">${pnlReport.grossRevenue.toLocaleString()}</p>
              </div>
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Costos & Gastos Operacionales</span>
                <p className="text-2xl font-black text-rose-400 mt-2 font-mono">${(pnlReport.operatingCosts + pnlReport.operatingExpenses).toLocaleString()}</p>
              </div>
              <div className="ds-card p-5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Utilidad Operacional (EBITDA)</span>
                <p className="text-2xl font-black text-teal-400 mt-2 font-mono">${pnlReport.operatingIncome.toLocaleString()}</p>
              </div>
              <div className="ds-card p-5 border-teal-500/40 bg-teal-950/20">
                <span className="text-xs font-mono text-teal-300 uppercase tracking-wider font-bold">Utilidad Neta del Ejercicio</span>
                <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">${pnlReport.netIncome.toLocaleString()}</p>
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
                  <Printer className="w-3.5 h-3.5" /> Imprimir Balance
                </button>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Balanceado
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
                    <th className="pb-3 text-right">Débitos</th>
                    <th className="pb-3 text-right">Créditos</th>
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
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: INVENTARIOS & KARDEX PERMANENTE NIIF ── */}
      {activeTab === 'kardex' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="ds-card p-5 border-teal-500/30 bg-teal-950/20">
              <span className="text-[10px] text-teal-300 uppercase font-bold">Valuación Total de Inventario NIIF (Cuenta 1435)</span>
              <p className="text-2xl font-black text-emerald-400 mt-2">${inventoryValuation.toLocaleString()} COP</p>
              <span className="text-xs text-slate-400">Método: Promedio Ponderado</span>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Ítems en Catálogo</span>
              <p className="text-2xl font-black text-white mt-2">{inventoryItems.length} SKUs</p>
              <span className="text-xs text-slate-400">Control permanente de existencias</span>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Movimientos de Kardex Registrados</span>
              <p className="text-2xl font-black text-teal-400 mt-2">{kardexMovements.length} Entradas / Salidas</p>
              <span className="text-xs text-slate-400">Costo de Ventas (6135) sincronizado</span>
            </div>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-teal-400" />
              Catálogo de Productos & Valuación de Stock
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Nombre del Producto / Servicio</th>
                    <th className="pb-3">Categoría</th>
                    <th className="pb-3 text-right">Existencias</th>
                    <th className="pb-3 text-right">Costo Promedio</th>
                    <th className="pb-3 text-right">Precio Venta</th>
                    <th className="pb-3 text-right">Valor Total Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {inventoryItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 font-bold text-teal-400">{item.sku}</td>
                      <td className="py-3 text-white font-sans">{item.name}</td>
                      <td className="py-3 text-slate-400">{item.category}</td>
                      <td className="py-3 text-right font-bold text-emerald-400">{item.stock} {item.unit}</td>
                      <td className="py-3 text-right text-slate-300">${item.averageCost.toLocaleString()}</td>
                      <td className="py-3 text-right text-white font-bold">${item.salePrice.toLocaleString()}</td>
                      <td className="py-3 text-right font-black text-teal-300">${item.totalValuation.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: NÓMINA ELECTRÓNICA DIAN (CUNE) ── */}
      {activeTab === 'nomina_electronica' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ds-card p-6 space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              Emitir Nómina Electrónica DIAN
            </h3>
            <p className="text-xs text-slate-400">Generación y timbrado de Documento Soporte de Pago de Nómina con CUNE SHA-384.</p>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Cédula del Empleado</label>
              <input
                type="text"
                value={nomEmpNit}
                onChange={(e) => setNomEmpNit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Nombre Completo</label>
              <input
                type="text"
                value={nomEmpName}
                onChange={(e) => setNomEmpName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Cargo / Puesto</label>
              <input
                type="text"
                value={nomPosition}
                onChange={(e) => setNomPosition(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Sueldo Básico (COP)</label>
              <input
                type="number"
                value={nomSalary}
                onChange={(e) => setNomSalary(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-sm mt-1 outline-none"
              />
            </div>

            <button
              onClick={handleEmitNominaCUNE}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              Generar Nómina Electrónica & CUNE
            </button>
          </div>

          <div className="ds-card p-6 lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-400" />
              Historial de Nóminas Electrónicas Validadas por DIAN
            </h3>

            <div className="space-y-4">
              {nominaRecords.map(rec => (
                <div key={rec.id} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 font-mono text-xs">
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
                      <span className="font-bold text-emerald-400">${rec.totalDevengado.toLocaleString()} COP</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">TOTAL DEDUCCIONES:</span>
                      <span className="font-bold text-rose-400">-${rec.totalDeducciones.toLocaleString()} COP</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">NETO A PAGAR:</span>
                      <span className="font-black text-teal-300">${rec.netoPagar.toLocaleString()} COP</span>
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

      {/* ── TAB 5: RESOLUCIONES DIAN ── */}
      {activeTab === 'resolutions' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Stamp className="w-5 h-5 text-teal-400" />
                Control de Resoluciones DIAN & Numeración Electrónica
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
                  <p className="text-slate-300 font-sans font-bold">{res.documentType.replace('_', ' ')}</p>
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
                    <span className="font-bold text-emerald-400">{res.toNumber - res.currentNumber} facturas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: IMPORTADOR MASIVO EXCEL ── */}
      {activeTab === 'bulk_import' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-teal-400" />
              Migración Masiva de Terceros (Clientes / Proveedores)
            </h3>
            <p className="text-xs text-slate-400">Pega filas CSV con formato <code className="text-teal-400">NIT,Razón Social</code> para importar cientos de terceros en un clic.</p>

            <textarea
              rows={8}
              value={csvImportText}
              onChange={(e) => setCsvImportText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-teal-500"
            />

            <button
              onClick={handleImportThirdParties}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              Procesar & Cargar a PostgreSQL
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
                  {importResult.details.map((d: string, idx: number) => (
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

      {/* ── TAB 7: EXTRACTOS BANCARIOS CONCILIACIÓN AUTOMÁTICA ── */}
      {activeTab === 'bank_statement' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-400" />
                Conciliación Automática de Extractos Bancarios (OFX / CSV)
              </h3>
              <p className="text-xs text-slate-400">Detección inteligente de movimientos bancarios y cruce automático con Recibos de Caja (RC) y Comprobantes de Egreso (CE).</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Referencia Transacción</th>
                  <th className="pb-3">Descripción / Concepto</th>
                  <th className="pb-3">Doc Sugerido</th>
                  <th className="pb-3">Cuenta Contable</th>
                  <th className="pb-3 text-right">Valor</th>
                  <th className="pb-3 text-center">Estado Conciliación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bankStatementData?.transactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 text-slate-400">{tx.date}</td>
                    <td className="py-3 font-bold text-white">{tx.reference}</td>
                    <td className="py-3 text-slate-200 font-sans">{tx.description}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-400 font-bold text-[10px] border border-teal-800/40">
                        {tx.suggestedDocumentType}
                      </span>
                    </td>
                    <td className="py-3 text-teal-400">{tx.suggestedAccount}</td>
                    <td className={`py-3 text-right font-bold ${tx.type === 'CREDITO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'CREDITO' ? `+$${tx.amount.toLocaleString()}` : `-$${tx.amount.toLocaleString()}`}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        ✓ AUTO-CONCILIADO
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 8: AUXILIARY LEDGERS ── */}
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
                    <td className="py-2.5 text-right font-bold text-white">${it.runningBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 9: DSE ── */}
      {activeTab === 'dse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ds-card p-6 space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-400" />
              Emitir Documento Soporte DSE
            </h3>
            <p className="text-xs text-slate-400">Para compras y pagos de servicios a personas no obligadas a facturar.</p>

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
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                    {generatedDSE.dseNumber}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono">
                  <p><strong>Vendedor:</strong> {generatedDSE.vendorName}</p>
                  <p><strong>Neto a Pagar:</strong> ${generatedDSE.totalNetToPay.toLocaleString()} COP</p>
                  <p><strong>CUDS:</strong> {generatedDSE.cuds}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
                <FileCheck className="w-10 h-10 mb-2 text-slate-600" />
                <p>Ingresa los datos a la izquierda para generar el Documento Soporte oficial.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 10: NEW VOUCHER ── */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="ds-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  Asentador de Documentos Contables (Estándar Siigo Nube)
                </h3>
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
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-teal-400 font-bold"
                />
              </div>
            </div>

            {/* Lines editor */}
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 items-center">
                  <div className="md:col-span-4">
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
                    <button onClick={() => handleRemoveLine(idx)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddLine}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 text-xs font-bold border border-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar Línea
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800 font-mono text-xs">
              <span className={isBalanced ? 'text-teal-400 font-bold' : 'text-rose-500 font-bold'}>
                {isBalanced ? `✓ Balanceado: $${totalDebit.toLocaleString()}` : `⚠ Descuadre: Débito $${totalDebit.toLocaleString()} ≠ Crédito $${totalCredit.toLocaleString()}`}
              </span>
              <button
                onClick={handleSaveVoucher}
                disabled={!isBalanced}
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Guardar Asiento en PostgreSQL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 11: VOUCHERS HISTORY ── */}
      {activeTab === 'voucher_history' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-teal-400" />
              Libro Diario & Historial de Comprobantes Registrados
            </h3>
            <button onClick={loadFinancials} className="px-3 py-1.5 bg-slate-900 text-teal-400 border border-slate-800 text-xs font-bold rounded-lg cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Refrescar
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {vouchersHistory.map((v, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-teal-400">{v.documentType || 'CC'}-{v.voucherNumber}</span>
                  <p className="text-slate-200 font-sans mt-0.5">{v.concept}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400">${v.totalDebit.toLocaleString()} COP</span>
                  <span className="text-slate-500 block text-[10px]">{new Date(v.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 12: EXOGENA CSV ── */}
      {activeTab === 'exogena' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                Información Exógena DIAN (Medios Magnéticos)
              </h3>
              <p className="text-xs text-slate-400">Descarga de formatos oficiales con datos reales desde PostgreSQL.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => handleDownloadExogenaCSV("1001")}
              className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-teal-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exportar Formato 1001 (Pagos & Retenciones)
            </button>
            <button 
              onClick={() => handleDownloadExogenaCSV("1007")}
              className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-teal-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exportar Formato 1007 (Ingresos Brutos)
            </button>
            <button 
              onClick={() => handleDownloadExogenaCSV("1003")}
              className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-teal-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exportar Formato 1003 (Retenciones Recibidas)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
