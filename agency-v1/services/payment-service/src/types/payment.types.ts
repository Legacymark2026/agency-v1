/**
 * Payment Microservice — Canonical Domain Types
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified types for PCI-DSS, ISO 8583, EMV, and online payment gateways.
 */

export type PaymentProvider =
  | "STRIPE"
  | "WOMPI"
  | "PAYPAL"
  | "MERCADOPAGO"
  | "BOLD"
  | "PSE"
  | "REDEBAN"
  | "CREDIBANCO"
  | "TRANSFER"
  | "CASH";

export type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "REJECTED"
  | "REFUNDED";

export type PaymentCategory =
  | "INVOICE"
  | "SUBSCRIPTION"
  | "POS_SALE"
  | "PREPAID_WALLET"
  | "CUSTOM";

export interface UnifiedPaymentTransaction {
  id: string;
  companyId: string;
  reference: string;
  amount: number;
  currency: "COP" | "USD" | "EUR";
  provider: PaymentProvider;
  category: PaymentCategory;
  status: PaymentStatus;
  orderId?: string;
  invoiceId?: string;
  customerEmail?: string;
  customerName?: string;
  customerNit?: string;
  // ISO 8583 & POS EMV Fields
  approvalCode?: string;
  rrn?: string;
  stan?: string;
  terminalId?: string;
  cardBrand?: string;
  cardLast4?: string;
  hmacSignature?: string;
  // Gateway External Identifiers
  gatewayTransactionId?: string;
  paymentUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckoutSessionDTO {
  companyId: string;
  amount: number;
  currency?: "COP" | "USD" | "EUR";
  title?: string;
  customerEmail?: string;
  invoiceId?: string;
  orderId?: string;
  category?: PaymentCategory;
  preferredProvider?: PaymentProvider;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreatePOSPaymentDTO {
  companyId: string;
  amount: number;
  currency?: "COP";
  orderId?: string;
  provider: "BOLD" | "REDEBAN" | "WOMPI" | "CREDIBANCO";
  cardBrand?: string;
  cardLast4?: string;
  terminalId?: string;
}
