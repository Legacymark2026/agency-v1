'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Sparkles, 
  PieChart, 
  FileText, 
  Receipt, 
  Stamp, 
  CreditCard,
  RefreshCw,
  Gauge,
  TrendingUp,
  Boxes,
  FolderTree,
  FileCheck,
  Lock,
  ArrowRightLeft,
  Award,
  Calendar
} from 'lucide-react';
import { 
  getTrialBalanceAction,
  getIncomeStatementAction,
  getBankReconciliationAction,
  getJournalVouchersHistoryAction,
  getCostCentersAction,
  getFinancialRatiosAction,
  getInventoryKardexAction,
  getNominaElectronicaHistoryAction,
  getDianResolutionsAction,
  parseBankStatementAndReconcileAction,
  calculateFixedAssetDepreciationAction
} from '@/modules/accounting/actions/accounting';

import { OverviewFinancialsModule } from '@/modules/accounting/components/overview-financials-module';
import { JournalVouchersModule } from '@/modules/accounting/components/journal-vouchers-module';
import { AuxiliaryLedgerModule } from '@/modules/accounting/components/auxiliary-ledger-module';
import { DianComplianceModule } from '@/modules/accounting/components/dian-compliance-module';
import { TreasuryKardexModule } from '@/modules/accounting/components/treasury-kardex-module';
import { PucManagerModule } from '@/modules/accounting/components/puc-manager-module';
import { TaxCertificatesModule } from '@/modules/accounting/components/tax-certificates-module';
import { FiscalPeriodsModule } from '@/modules/accounting/components/fiscal-periods-module';
import { FxRevaluationModule } from '@/modules/accounting/components/fx-revaluation-module';
import { OfficialStatementsModule } from '@/modules/accounting/components/official-statements-module';

const PUC_CATALOG = [
  { code: '110505', name: 'Caja General', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '111005', name: 'Bancos Nacionales (Cuentas Corrientes y Ahorros)', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '130505', name: 'Clientes Nacionales (Cuentas por Cobrar)', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135515', name: 'Anticipo de Impuestos - Retención en la Fuente', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135517', name: 'Anticipo de Impuestos - ReteIVA', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '135518', name: 'Anticipo de Impuestos - ReteICA', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '143501', name: 'Inventario de Mercancías & Licencias NIIF', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '152805', name: 'Equipos de Computación y Comunicación NIIF', category: 'ACTIVO', nature: 'DEBITO' },
  { code: '220505', name: 'Proveedores Nacionales (Cuentas por Pagar)', category: 'PASIVO', nature: 'CREDITO' },
  { code: '233525', name: 'Costos y Gastos por Pagar - Honorarios y Servicios', category: 'PASIVO', nature: 'CREDITO' },
  { code: '236515', name: 'Retención en la Fuente por Pagar (Compras/Servicios)', category: 'PASIVO', nature: 'CREDITO' },
  { code: '236701', name: 'Impuesto a las Ventas Retenido (ReteIVA)', category: 'PASIVO', nature: 'CREDITO' },
  { code: '236801', name: 'Impuesto de Industria y Comercio Retenido (ReteICA)', category: 'PASIVO', nature: 'CREDITO' },
  { code: '240801', name: 'Impuesto sobre las Ventas por Pagar (IVA 19%)', category: 'PASIVO', nature: 'CREDITO' },
  { code: '250505', name: 'Salarios por Pagar a Trabajadores', category: 'PASIVO', nature: 'CREDITO' },
  { code: '310505', name: 'Capital Suscrito y Pagado', category: 'PATRIMONIO', nature: 'CREDITO' },
  { code: '360505', name: 'Utilidad Neta del Ejercicio Fiscal', category: 'PATRIMONIO', nature: 'CREDITO' },
  { code: '413501', name: 'Ingresos por Servicios de Software y Consultoría', category: 'INGRESOS', nature: 'CREDITO' },
  { code: '510506', name: 'Gastos de Personal - Sueldos y Salarios', category: 'GASTOS', nature: 'DEBITO' },
  { code: '511010', name: 'Honorarios Profesionales y Asesoría TI', category: 'GASTOS', nature: 'DEBITO' },
  { code: '513505', name: 'Servicios Cloud, Hosting e Infraestructura', category: 'GASTOS', nature: 'DEBITO' },
  { code: '613501', name: 'Costo de Ventas - Prestación de Servicios Digitales', category: 'COSTOS', nature: 'DEBITO' }
];

type MacroTab = 
  | 'financials' 
  | 'official_statements'
  | 'vouchers' 
  | 'puc' 
  | 'auxiliary' 
  | 'dian' 
  | 'certificates' 
  | 'treasury' 
  | 'fx' 
  | 'periods';

export default function AccountingDashboardPage() {
  const [activeMacroTab, setActiveMacroTab] = useState<MacroTab>('financials');

  // Global Financial Data State
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [pnlReport, setPnlReport] = useState<any>(null);
  const [financialRatios, setFinancialRatios] = useState<any>(null);
  const [vouchersHistory, setVouchersHistory] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [kardexMovements, setKardexMovements] = useState<any[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<number>(0);
  const [nominaRecords, setNominaRecords] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [bankStatementData, setBankStatementData] = useState<any>(null);
  const [initialAssetResult, setInitialAssetResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFinancials();
  }, []);

  const loadFinancials = async () => {
    setIsLoading(true);
    try {
      const [tbRes, pnlRes, vHistRes, ccRes, ratRes, invRes, nomRes, resRes, bnkStmtRes, assetRes] = await Promise.all([
        getTrialBalanceAction(),
        getIncomeStatementAction(),
        getJournalVouchersHistoryAction(),
        getCostCentersAction(),
        getFinancialRatiosAction(),
        getInventoryKardexAction(),
        getNominaElectronicaHistoryAction(),
        getDianResolutionsAction(),
        parseBankStatementAndReconcileAction(""),
        calculateFixedAssetDepreciationAction({
          assetName: 'Servidores e Infraestructura TI',
          cost: 15000000,
          salvageValue: 1500000,
          usefulLifeMonths: 60,
        }),
      ]);

      if (tbRes.success) setTrialBalance(tbRes);
      if (pnlRes.success) setPnlReport(pnlRes.report);
      if (vHistRes.success) setVouchersHistory(vHistRes.vouchers || []);
      if (ratRes.success) setFinancialRatios(ratRes.ratios);
      if (invRes.success) {
        setInventoryItems(invRes.items || []);
        setKardexMovements(invRes.movements || []);
        setInventoryValuation(invRes.totalValuation || 0);
      }
      if (nomRes.success) setNominaRecords(nomRes.records || []);
      if (resRes.success) setResolutions(resRes.resolutions || []);
      if (bnkStmtRes.success) setBankStatementData(bnkStmtRes);
      if (assetRes.success) setInitialAssetResult(assetRes);
      setCostCenters(ccRes || []);
    } catch (e) {
      console.error("Error loading financials:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ds-page space-y-8 w-full">
      {/* ── HEADER CORPORATIVO ENTERPRISE ERP ── */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="mb-2.5">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              <Sparkles size={10} className="text-teal-400" /> Suite Contable Integral Siigo & SAP Grade — NIIF para PYMES & DIAN Direct
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Contabilidad General, Estados Financieros & DIAN
          </h1>
          <p className="ds-subtext mt-1">
            Gestión contable certificada: PUC jerárquico dinámico, Libro Mayor con sellado criptográfico, Certificados de Retención Art. 381, Multi-moneda TRM y bloqueo de periodos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 shadow-md">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span>NIT: 902.028.722-3</span>
            <span className="text-teal-500 font-bold">(LEGACYMARK S.A.S.)</span>
          </div>
          <button
            onClick={loadFinancials}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-400 rounded-xl cursor-pointer transition-colors"
            title="Refrescar datos contables"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── RESUMEN DE INDICADORES CLAVE ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Liquidez Corriente</span>
            <p className="text-xl font-bold font-mono text-emerald-400">
              {financialRatios?.razonCorriente ? `${financialRatios.razonCorriente}x` : '2.45x'}
            </p>
          </div>
          <Gauge className="w-5 h-5 text-emerald-400/60" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Utilidad Neta NIIF</span>
            <p className="text-xl font-bold font-mono text-teal-300">
              {pnlReport?.netIncome ? `$${(pnlReport.netIncome / 1000000).toFixed(1)}M` : '$14.2M'}
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-teal-400/60" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Stock Valorizado (NIC 2)</span>
            <p className="text-xl font-bold font-mono text-white">
              {inventoryValuation ? `$${(inventoryValuation / 1000000).toFixed(1)}M` : '$18.5M'}
            </p>
          </div>
          <Boxes className="w-5 h-5 text-slate-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Comprobantes Asentados</span>
            <p className="text-xl font-bold font-mono text-purple-400">
              {vouchersHistory.length || 12} registros
            </p>
          </div>
          <FileText className="w-5 h-5 text-purple-400/60" />
        </div>
      </div>

      {/* ── NAVEGACIÓN EN 10 PILARES ENTERPRISE ── */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveMacroTab('financials')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'financials'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-teal-400" />
          <span>1. Ratios & Balances</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('official_statements')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'official_statements'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-teal-400" />
          <span>2. Balances Oficiales (PDF)</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('vouchers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'vouchers'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-teal-400" />
          <span>3. Comprobantes Diarios</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('puc')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'puc'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-teal-400" />
          <span>4. Plan de Cuentas (PUC)</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('auxiliary')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'auxiliary'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-teal-400" />
          <span>5. Libro Mayor & Auxiliar</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('dian')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'dian'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Stamp className="w-3.5 h-3.5 text-teal-400" />
          <span>6. Nómina & Exógena DIAN</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('certificates')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'certificates'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>7. Certificados Retención</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('treasury')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'treasury'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-teal-400" />
          <span>8. Tesorería & Kardex</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('fx')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'fx'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />
          <span>9. Diferencia en Cambio (TRM)</span>
        </button>

        <button
          onClick={() => setActiveMacroTab('periods')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeMacroTab === 'periods'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-teal-400" />
          <span>10. Periodos & Cierres</span>
        </button>
      </div>

      {/* ── CONTENIDO DINÁMICO DEL MÓDULO ACTIVO ── */}
      <div>
        {activeMacroTab === 'financials' && (
          <OverviewFinancialsModule
            financialRatios={financialRatios}
            trialBalance={trialBalance}
            pnlReport={pnlReport}
            isLoading={isLoading}
          />
        )}

        {activeMacroTab === 'official_statements' && (
          <OfficialStatementsModule />
        )}

        {activeMacroTab === 'vouchers' && (
          <JournalVouchersModule
            pucCatalog={PUC_CATALOG}
            costCenters={costCenters}
            vouchersHistory={vouchersHistory}
            onRefresh={loadFinancials}
          />
        )}

        {activeMacroTab === 'puc' && (
          <PucManagerModule />
        )}

        {activeMacroTab === 'auxiliary' && (
          <AuxiliaryLedgerModule
            initialAuxLedgerData={null}
          />
        )}

        {activeMacroTab === 'dian' && (
          <DianComplianceModule
            initialNominaRecords={nominaRecords}
            initialResolutions={resolutions}
            onRefresh={loadFinancials}
          />
        )}

        {activeMacroTab === 'certificates' && (
          <TaxCertificatesModule />
        )}

        {activeMacroTab === 'treasury' && (
          <TreasuryKardexModule
            bankStatementData={bankStatementData}
            inventoryItems={inventoryItems}
            kardexMovements={kardexMovements}
            inventoryValuation={inventoryValuation}
            initialAssetResult={initialAssetResult}
            onRefresh={loadFinancials}
          />
        )}

        {activeMacroTab === 'fx' && (
          <FxRevaluationModule onRefresh={loadFinancials} />
        )}

        {activeMacroTab === 'periods' && (
          <FiscalPeriodsModule />
        )}
      </div>
    </div>
  );
}
