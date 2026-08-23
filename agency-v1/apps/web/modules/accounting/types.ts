/**
 * Colombian Accounting Module Types (PUC / NIIF / Tax Withholdings / Exógena DIAN / Bank Recon / Payroll Provisions / Fixed Assets / Fiscal Closing)
 */

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
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalVoucherRecord {
  voucherNumber: string;
  date: string;
  concept: string;
  lines: JournalEntryLineInput[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  companyId: string;
  hashSeal?: string;
  status?: "ACTIVO" | "ANULADO";
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
