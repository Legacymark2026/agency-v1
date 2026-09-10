/**
 * Payment Service — Hexagonal Ports (Inbound & Outbound Contracts)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  PaymentTransactionDomain,
  PaymentProvider,
  PaymentStatus,
} from "../domain/payment.domain";

export interface CreateCheckoutSessionDTO {
  companyId: string;
  amount: number;
  currency?: "COP" | "USD" | "EUR";
  title?: string;
  customerEmail?: string;
  invoiceId?: string;
  orderId?: string;
  preferredProvider?: PaymentProvider;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreatePOSPaymentDTO {
  companyId: string;
  amount: number;
  orderId?: string;
  provider: PaymentProvider;
  cardBrand?: string;
  cardLast4?: string;
  terminalId?: string;
}

export interface CheckoutSessionResult {
  url: string;
  reference: string;
  provider: PaymentProvider;
}

// Inbound Ports (Driving / Use Cases)
export interface IPaymentUseCases {
  getAvailableGateways(): Record<string, { enabled: boolean; currency: string }>;
  createCheckoutSession(dto: CreateCheckoutSessionDTO): Promise<CheckoutSessionResult>;
  processPOSPayment(dto: CreatePOSPaymentDTO): Promise<PaymentTransactionDomain>;
  handleWebhook(provider: string, payload: any, signature: string): Promise<{ handled: boolean; reference?: string; status?: PaymentStatus }>;
}

// Outbound Ports (Driven / Infrastructure Dependencies)
export interface IPaymentPersistencePort {
  saveTransaction(tx: PaymentTransactionDomain): Promise<PaymentTransactionDomain>;
  findTransactionByReference(reference: string): Promise<PaymentTransactionDomain | null>;
  updateTransactionStatus(reference: string, status: PaymentStatus, gatewayTxId?: string): Promise<PaymentTransactionDomain | null>;
}

export interface IPaymentEventPublisherPort {
  publishPaymentCompleted(event: {
    reference: string;
    amount: number;
    currency: string;
    companyId: string;
    provider: string;
    orderId?: string;
    invoiceId?: string;
  }): Promise<void>;

  publishPaymentFailed(event: {
    reference: string;
    companyId: string;
    provider: string;
    reason?: string;
  }): Promise<void>;
}
