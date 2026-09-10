/**
 * Payment Service — Pure Domain Entities & Value Objects (Zero External Dependencies)
 * ─────────────────────────────────────────────────────────────────────────────
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

export interface PaymentTransactionProps {
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
  approvalCode?: string;
  rrn?: string;
  stan?: string;
  terminalId?: string;
  cardBrand?: string;
  cardLast4?: string;
  hmacSignature?: string;
  gatewayTransactionId?: string;
  paymentUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentTransactionDomain {
  constructor(private readonly props: PaymentTransactionProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get reference(): string { return this.props.reference; }
  get amount(): number { return this.props.amount; }
  get currency(): "COP" | "USD" | "EUR" { return this.props.currency; }
  get provider(): PaymentProvider { return this.props.provider; }
  get category(): PaymentCategory { return this.props.category; }
  get status(): PaymentStatus { return this.props.status; }
  get orderId(): string | undefined { return this.props.orderId; }
  get invoiceId(): string | undefined { return this.props.invoiceId; }
  get customerEmail(): string | undefined { return this.props.customerEmail; }
  get metadata(): Record<string, any> | undefined { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public approve(gatewayTxId?: string, approvalCode?: string): PaymentTransactionDomain {
    return new PaymentTransactionDomain({
      ...this.props,
      status: "APPROVED",
      gatewayTransactionId: gatewayTxId || this.props.gatewayTransactionId,
      approvalCode: approvalCode || this.props.approvalCode,
      updatedAt: new Date()
    });
  }

  public decline(reason?: string): PaymentTransactionDomain {
    return new PaymentTransactionDomain({
      ...this.props,
      status: "DECLINED",
      metadata: { ...this.props.metadata, declineReason: reason },
      updatedAt: new Date()
    });
  }

  public toJSON(): PaymentTransactionProps {
    return { ...this.props };
  }

  public static create(dto: {
    companyId: string;
    reference: string;
    amount: number;
    currency: "COP" | "USD" | "EUR";
    provider: PaymentProvider;
    category?: PaymentCategory;
    orderId?: string;
    invoiceId?: string;
    customerEmail?: string;
    metadata?: Record<string, any>;
  }): PaymentTransactionDomain {
    if (dto.amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    return new PaymentTransactionDomain({
      id: "tx_" + Math.random().toString(36).substring(2, 11),
      companyId: dto.companyId,
      reference: dto.reference,
      amount: dto.amount,
      currency: dto.currency,
      provider: dto.provider,
      category: dto.category || "CUSTOM",
      status: "PENDING",
      orderId: dto.orderId,
      invoiceId: dto.invoiceId,
      customerEmail: dto.customerEmail,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
