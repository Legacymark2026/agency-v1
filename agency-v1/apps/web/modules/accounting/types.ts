/**
 * Ultra-Professional Siigo / Tier-1 Enterprise Accounting ERP Module Types
 * (PUC NIIF, Kardex Inventarios, Nómina Electrónica CUNE, Resoluciones DIAN, Importador Masivo, Conciliador Extractos)
 */

export type SiigoDocumentType = "CC" | "FV" | "FC" | "RC" | "CE" | "NC" | "ND" | "DSE" | "NE";

export interface CostCenter {
  code: string;
  name: string;
  isActive: boolean;
}

export interface PUCAccount {
  code: string;
  name: string;
  category: "ACTIVO" | "PASIVO" | "PATRIMONIO" | "INGRESOS" | "GASTOS" | "COSTOS";
  nature: "DEBITO" | "CREDITO";
  isCustom?: boolean;
}

export interface JournalEntryLineInput {
  accountCode: string;
  accountName: string;
  thirdPartyNit: string;
  thirdPartyName?: string;
  costCenterCode?: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalVoucherRecord {
  voucherNumber: string;
  documentType: SiigoDocumentType;
  date: string;
  concept: string;
  costCenterCode?: string;
  lines: JournalEntryLineInput[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  companyId: string;
  hashSeal?: string;
  status?: "ACTIVO" | "ANULADO";
}

// Inventarios & Kardex Permanente NIIF (NIC 2)
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  averageCost: number; // Costo Promedio Ponderado
  salePrice: number;
  vatRate: number;
  totalValuation: number; // stock * averageCost
  category: string;
}

export interface KardexMovement {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  date: string;
  documentType: string;
  documentNumber: string;
  movementType: "ENTRADA" | "SALIDA" | "AJUSTE";
  quantity: number;
  unitCost: number;
  totalCost: number;
  resultingStock: number;
  resultingAverageCost: number;
}

// Nómina Electrónica DIAN con CUNE
export interface NominaElectronicaRecord {
  id: string;
  documentNumber: string; // NIE-0001
  cune: string; // Código Único de Nómina Electrónica
  employeeNit: string;
  employeeName: string;
  position: string;
  period: string;
  paymentDate: string;
  baseSalary: number;
  transportAllowance: number;
  overtimeAndBonuses: number;
  totalDevengado: number;
  healthDeduction: number;
  pensionDeduction: number;
  totalDeducciones: number;
  netoPagar: number;
  dianStatus: "VALIDADO_PREVIO_DIAN" | "PENDIENTE_TRANSMISION";
  qrCodeData: string;
}

// Resoluciones DIAN & Numeración Consecutiva
export interface DianResolutionConfig {
  id: string;
  documentType: "FACTURA_ELECTRONICA" | "DOCUMENTO_SOPORTE" | "NOMINA_ELECTRONICA" | "NOTA_CREDITO";
  prefix: string;
  resolutionNumber: string;
  resolutionDate: string;
  validUntilDate: string;
  fromNumber: number;
  toNumber: number;
  currentNumber: number;
  technicalKey: string;
  isActive: boolean;
}

// Conciliación Automática de Extractos Bancarios
export interface BankStatementTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  type: "CREDITO" | "DEBITO"; // Crédito = Ingreso, Débito = Egreso
  suggestedDocumentType: "RC" | "CE";
  matchStatus: "CONCILIADO_AUTOMATICO" | "SUGERENCIA_PENDIENTE";
  suggestedAccount: string;
}

// Importador Masivo de Datos (Excel / CSV)
export interface BulkImportResult {
  success: boolean;
  importedCount: number;
  errorsCount: number;
  details: string[];
}

export interface DocumentoSoporteDSE {
  dseNumber: string;
  cuds: string;
  issueDate: string;
  vendorNit: string;
  vendorName: string;
  vendorCity: string;
  serviceDescription: string;
  subtotal: number;
  reteFuenteAmount: number;
  reteIcaAmount: number;
  totalNetToPay: number;
  qrCodeData: string;
  dianStatus: "EMITIDO_Y_VALIDADO" | "PENDIENTE_TRANSMISION";
}

export interface AuxiliaryLedgerItem {
  id: string;
  voucherNumber: string;
  documentType: string;
  date: string;
  accountCode: string;
  accountName: string;
  thirdPartyNit: string;
  thirdPartyName: string;
  concept: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface FinancialRatiosReport {
  razonCorriente: number;
  pruebaAcida: number;
  nivelEndeudamiento: number;
  margenOperativo: number;
  margenNeto: number;
  roe: number;
  roa: number;
  ktno: number;
  liquidityHealth: "EXCELENTE" | "ADECUADA" | "ALERTA";
}

export interface BudgetVarianceItem {
  costCenterCode: string;
  costCenterName: string;
  budgetedAmount: number;
  executedAmount: number;
  varianceAmount: number;
  variancePercent: number;
  status: "DENTRO_DEL_PRESUPUESTO" | "EN_RIESGO" | "SOBREGIRO";
}

export interface CashFlowForecastItem {
  periodLabel: string;
  expectedInflows: number;
  committedOutflows: number;
  netCashFlow: number;
  projectedEndingBalance: number;
}

export interface WithholdingCalculationInput {
  subtotal: number;
  vatRate?: number;
  transactionType: "COMPRAS" | "SERVICIOS" | "HONORARIOS";
  applyReteIVA?: boolean;
  reteIcaRatePerMil?: number;
}

export interface WithholdingCalculationResult {
  subtotal: number;
  vatAmount: number;
  reteFuenteRate: number;
  reteFuenteAmount: number;
  reteIvaRate: number;
  reteIvaAmount: number;
  reteIcaRate: number;
  reteIcaAmount: number;
  totalWithholdings: number;
  netPayable: number;
}

export interface TrialBalanceItem {
  code: string;
  name: string;
  initialBalance: number;
  debits: number;
  credits: number;
  finalBalance: number;
  category: string;
}

export interface IncomeStatementReport {
  grossRevenue: number;
  operatingCosts: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  taxEstimated: number;
  netIncome: number;
  profitMarginPercent: number;
  period: string;
}

export interface TaxCertificate {
  certificateId: string;
  year: number;
  beneficiaryNit: string;
  beneficiaryName: string;
  retainingAgentNit: string;
  retainingAgentName: string;
  city: string;
  totalSubjectAmount: number;
  reteFuenteTotal: number;
  reteIvaTotal: number;
  reteIcaTotal: number;
  generatedDate: string;
  verificationHash: string;
}

export interface BankReconciliationRecord {
  id?: string;
  bankAccount: string;
  accountNumber: string;
  bankStatementBalance: number;
  ledgerBalance: number;
  unreconciledDifference: number;
  pendingDeposits: number;
  outstandingChecks: number;
  status: "CONCILIADO" | "DIFERENCIA_PENDIENTE";
  lastReconciliationDate: string;
}

export interface TaxCalendarObligation {
  code: string;
  name: string;
  formNumber: string;
  frequency: "MENSUAL" | "BIMESTRAL" | "ANUAL";
  estimatedAmount: number;
  dueDate: string;
  status: "AL_DIA" | "PROXIMO_A_VENCER" | "PENDIENTE";
}

export interface PayrollProvisionsBreakdown {
  baseSalary: number;
  transportAllowance: number;
  totalAccrued: number;
  cesantias: number;
  interesesCesantias: number;
  primaServicios: number;
  vacaciones: number;
  pensionEmployer: number;
  healthEmployer: number;
  arlRisk1: number;
  cajaCompensacion: number;
  sena: number;
  icbf: number;
  totalProvisions: number;
  totalCompanyCost: number;
}

export interface AgingPortfolioRecord {
  thirdPartyNit: string;
  thirdPartyName: string;
  totalDue: number;
  current0To30Days: number;
  days31To60: number;
  days61To90: number;
  over90Days: number;
  type: "CARTERA_CLIENTES" | "PROVEEDORES_POR_PAGAR";
}

export interface AccountingAuditAnomaly {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  recommendation: string;
  accountAffected?: string;
}

export interface FixedAssetRecord {
  id: string;
  name: string;
  code: string;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
}

// ─── 1. PUC Jerárquico Avanzado ──────────────────────────────────────────────
export interface PUCTreeAccount {
  id: string;
  code: string;
  name: string;
  category: "ACTIVO" | "PASIVO" | "PATRIMONIO" | "INGRESOS" | "GASTOS" | "COSTOS" | "CUENTAS_DE_ORDEN";
  nature: "DEBITO" | "CREDITO";
  parentCode?: string | null;
  level: number; // 1=Clase, 2=Grupo, 3=Cuenta, 4=Subcuenta, 5-6=Auxiliar
  isActive: boolean;
  description?: string | null;
  children?: PUCTreeAccount[];
}

// ─── 2. Certificados de Retención Tributaria (Art. 381 E.T.) ─────────────────
export interface WithholdingCertificateItem {
  concept: string;
  baseAmount: number;
  rate: number;
  withheldAmount: number;
}

export interface WithholdingCertificate {
  certificateNumber: string;
  fiscalYear: number;
  certificateType: "RETEFUENTE" | "RETEICA" | "RETEIVA";
  issuer: {
    name: string;
    nit: string;
    city: string;
    address?: string;
  };
  recipient: {
    name: string;
    nit: string;
    city?: string;
    email?: string;
  };
  issueDate: string;
  items: WithholdingCertificateItem[];
  totalBase: number;
  totalWithheld: number;
  legalNote: string;
  signerName: string;
  signerRole: string;
}

// ─── 3. Periodos Fiscales Contables ──────────────────────────────────────────
export interface FiscalPeriodRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "OPEN" | "CLOSING" | "CLOSED";
  closedAt?: string | null;
  closedByName?: string | null;
  vouchersCount?: number;
}

// ─── 4. Diferencia en Cambio Multi-Moneda (NIIF 21) ──────────────────────────
export interface FxAccountEvaluation {
  accountId: string;
  accountName: string;
  currency: string;
  foreignBalanceUSD: number;
  bookBalanceCOP: number;
  revaluedBalanceCOP: number;
  differenceCOP: number;
  type: "GAIN" | "LOSS";
}

export interface FxRevaluationReport {
  asOfDate: string;
  currentTrm: number;
  baseCurrency: string;
  accounts: FxAccountEvaluation[];
  totalDifferenceCOP: number;
  gainAccountCode: string;
  lossAccountCode: string;
  suggestedVoucherType: "CC";
}

// ─── 5. Estados Financieros Oficiales con Firmas ────────────────────────────
export interface ClassifiedBalanceItem {
  code: string;
  name: string;
  balance: number;
}

export interface OfficialFinancialStatements {
  company: {
    name: string;
    nit: string;
    city: string;
    address?: string;
  };
  period: string;
  asOfDate: string;
  balanceSheet: {
    currentAssets: ClassifiedBalanceItem[];
    totalCurrentAssets: number;
    nonCurrentAssets: ClassifiedBalanceItem[];
    totalNonCurrentAssets: number;
    totalAssets: number;
    currentLiabilities: ClassifiedBalanceItem[];
    totalCurrentLiabilities: number;
    longTermLiabilities: ClassifiedBalanceItem[];
    totalLongTermLiabilities: number;
    totalLiabilities: number;
    equity: ClassifiedBalanceItem[];
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
  };
  incomeStatement: {
    operatingRevenue: number;
    costOfSales: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    financialExpenses: number;
    incomeBeforeTax: number;
    incomeTax: number;
    netProfit: number;
  };
  signatures: {
    legalRepresentative: {
      name: string;
      idNumber: string;
      title: string;
    };
    accountant: {
      name: string;
      idNumber: string;
      professionalCard: string;
      title: string;
    };
    statutoryAuditor?: {
      name: string;
      idNumber: string;
      professionalCard: string;
      title: string;
    };
  };
}

