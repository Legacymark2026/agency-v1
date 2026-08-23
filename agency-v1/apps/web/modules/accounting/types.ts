/**
 * Colombian Accounting Module Types (PUC / NIIF / Tax Withholdings / Exógena DIAN)
 */

export interface PUCAccount {
  code: string;
  name: string;
  category: "ACTIVO" | "PASIVO" | "PATRIMONIO" | "INGRESOS" | "GASTOS" | "COSTOS";
  nature: "DEBITO" | "CREDITO";
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
}
