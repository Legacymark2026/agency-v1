/**
 * Tier-1 Enterprise Commercial & Sales ERP Types (Salesforce / HubSpot Enterprise Standard)
 */

// 1. Motor CPQ (Configure, Price, Quote)
export interface CPQProductBundle {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  currency: string;
  basePrice: number;
  discountTiers: { minQuantity: number; discountPercentage: number }[];
  includedItems: { sku: string; name: string; quantity: number; unitPrice: number }[];
  isCustomizable: boolean;
}

export interface CPQQuoteItem {
  id: string;
  bundleId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxRate: number;
  subtotal: number;
  total: number;
}

export interface CPQQuoteRecord {
  id: string;
  quoteNumber: string;
  accountId: string;
  accountName: string;
  contactEmail: string;
  salesRepId: string;
  salesRepName: string;
  currency: string;
  items: CPQQuoteItem[];
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SENT_TO_CLIENT" | "ACCEPTED";
  discountRequiresApproval: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  approvalNotes?: string;
  createdAt: string;
  expiresAt: string;
}

// 2. Cuentas B2B & Comité de Compras
export interface B2BAccountRecord {
  id: string;
  companyName: string;
  nit: string;
  industry: string;
  website: string;
  employeesCount: number;
  annualRevenueUsd: number;
  parentAccountId?: string;
  tier: "ENTERPRISE" | "MID_MARKET" | "SMB";
  status: "ACTIVE" | "PROSPECT" | "CHURNED";
  buyingCenter: BuyingCenterMember[];
  openDealsValue: number;
  createdAt: string;
}

export interface BuyingCenterMember {
  id: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  role: "DECISION_MAKER" | "TECHNICAL_EVALUATOR" | "ECONOMIC_BUYER" | "CHAMPION" | "LEGAL_COUNSEL" | "USER_INFLUENCER";
  sentiment: "POSITIVE" | "NEUTRAL" | "SKEPTICAL" | "BLOCKER";
}

// 3. Cuotas de Ventas, Pronóstico Ponderado & Leaderboard
export interface SalesRepQuota {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  period: string; // "2026-Q3"
  targetAmount: number;
  closedWonAmount: number;
  weightedPipelineAmount: number; // Sum of (Deal Value * Probability)
  quotaAttainmentPercentage: number;
  dealsClosedCount: number;
  rank: number;
}

export interface SalesForecastSummary {
  period: string;
  teamTarget: number;
  closedWonTotal: number;
  committedForecast: number; // Probability >= 80%
  bestCaseForecast: number; // Probability >= 50%
  weightedTotal: number;
  pipelineCoverageRatio: number; // Pipeline / Target
}

// 4. Sales Playbooks & Metodología BANT / MEDDIC
export interface SalesPlaybook {
  id: string;
  title: string;
  stageTarget: string; // "PROSPECTING" | "DISCOVERY" | "PROPOSAL" | "NEGOTIATION"
  description: string;
  methodology: "BANT" | "MEDDIC" | "SPIN";
  requiredQuestions: string[];
  objectionBattlecards: { objection: string; recommendedResponse: string; competitorComparison?: string }[];
  exitCriteriaChecklist: string[];
}

// 5. Secuencias de Prospección (Sales Cadences)
export interface SalesCadenceStep {
  dayOffset: number;
  channel: "EMAIL" | "WHATSAPP" | "PHONE_CALL" | "LINKEDIN" | "TASK";
  subject?: string;
  content: string;
  isAutomatic: boolean;
}

export interface SalesCadence {
  id: string;
  name: string;
  targetAudience: string;
  stepsCount: number;
  activeLeadsCount: number;
  conversionRate: number;
  status: "ACTIVE" | "PAUSED";
  steps: SalesCadenceStep[];
}

// 6. Contratos & Renovaciones (CLM / MRR / ARR)
export interface CommercialContractRecord {
  id: string;
  contractNumber: string;
  accountName: string;
  accountNit: string;
  mrrValue: number; // Monthly Recurring Revenue
  arrValue: number; // Annual Recurring Revenue
  currency: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  renewalNoticeDays: number;
  status: "ACTIVE" | "PENDING_RENEWAL" | "EXPIRING_SOON" | "RENEWED" | "CHURNED";
  healthScore: number; // 0 - 100
  serviceTier: string;
}

// 7. Recomendador de Up-Selling & Venta Cruzada por IA
export interface AIUpsellRecommendation {
  id: string;
  accountId: string;
  accountName: string;
  currentServices: string[];
  recommendedBundleName: string;
  recommendedBundleCode: string;
  estimatedAdditionalMRR: number;
  confidenceScore: number; // 0 - 100
  rationale: string;
  suggestedPitch: string;
}
