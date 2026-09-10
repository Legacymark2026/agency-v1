/**
 * Payment Service — Pure Use Cases Implementation
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IPaymentUseCases,
  IPaymentPersistencePort,
  IPaymentEventPublisherPort,
  CreateCheckoutSessionDTO,
  CreatePOSPaymentDTO,
  CheckoutSessionResult,
} from "../ports/payment.ports";
import {
  PaymentTransactionDomain,
  PaymentProvider,
  PaymentStatus,
} from "../domain/payment.domain";
import { StripeAdapter } from "../../adapters/stripe.adapter";
import { WompiAdapter } from "../../adapters/wompi.adapter";
import { PayPalAdapter } from "../../adapters/paypal.adapter";
import { BoldPosAdapter } from "../../adapters/bold.adapter";

export class PaymentUseCases implements IPaymentUseCases {
  constructor(
    private readonly persistencePort: IPaymentPersistencePort,
    private readonly eventPublisherPort: IPaymentEventPublisherPort
  ) {}

  public getAvailableGateways(): Record<string, { enabled: boolean; currency: string }> {
    return {
      stripe: { enabled: StripeAdapter.isAvailable(), currency: "USD" },
      wompi: { enabled: WompiAdapter.isAvailable(), currency: "COP" },
      paypal: { enabled: PayPalAdapter.isAvailable(), currency: "USD" },
      bold: { enabled: true, currency: "COP" },
    };
  }

  public async createCheckoutSession(dto: CreateCheckoutSessionDTO): Promise<CheckoutSessionResult> {
    const reference = `REF-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currency = dto.currency || "USD";

    let provider: PaymentProvider = "TRANSFER";
    let url = `https://app.legacymark.co/checkout/transfer?ref=${reference}&amount=${dto.amount}`;

    const isUSD = currency.toUpperCase() === "USD";
    if ((dto.preferredProvider === "STRIPE" || isUSD) && StripeAdapter.isAvailable()) {
      const session = await StripeAdapter.createCheckoutSession(dto as any);
      provider = "STRIPE";
      url = session.url;
    } else if (currency === "COP" && WompiAdapter.isAvailable()) {
      const amountInCents = Math.round(dto.amount * 100);
      const signature = WompiAdapter.computeIntegritySignature(reference, amountInCents, "COP");
      const publicKey = process.env.WOMPI_PUBLIC_KEY || "";
      provider = "WOMPI";
      url = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&signature:integrity=${signature}`;
    } else if (dto.preferredProvider === "PAYPAL" && PayPalAdapter.isAvailable()) {
      const order = await PayPalAdapter.createOrder(dto.amount, currency, dto.title || "Cobro");
      provider = "PAYPAL";
      url = order.approvalUrl;
    }

    const tx = PaymentTransactionDomain.create({
      companyId: dto.companyId,
      reference,
      amount: dto.amount,
      currency,
      provider,
      orderId: dto.orderId,
      invoiceId: dto.invoiceId,
      customerEmail: dto.customerEmail,
    });

    await this.persistencePort.saveTransaction(tx);

    return {
      url,
      reference,
      provider,
    };
  }

  public async processPOSPayment(dto: CreatePOSPaymentDTO): Promise<PaymentTransactionDomain> {
    const boldTx = BoldPosAdapter.createPOSTransaction(dto);

    const tx = PaymentTransactionDomain.create({
      companyId: dto.companyId,
      reference: boldTx.reference,
      amount: dto.amount,
      currency: "COP",
      provider: dto.provider,
      orderId: dto.orderId,
      category: "POS_SALE",
    }).approve(boldTx.rrn, boldTx.approvalCode);

    const saved = await this.persistencePort.saveTransaction(tx);

    await this.eventPublisherPort.publishPaymentCompleted({
      reference: saved.reference,
      amount: saved.amount,
      currency: saved.currency,
      companyId: saved.companyId,
      provider: saved.provider,
      orderId: saved.orderId,
    });

    return saved;
  }

  public async handleWebhook(
    provider: string,
    payload: any,
    signature: string
  ): Promise<{ handled: boolean; reference?: string; status?: PaymentStatus }> {
    const prov = provider.toUpperCase();

    if (prov === "STRIPE") {
      const event = StripeAdapter.constructWebhookEvent(payload, signature);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const ref = session.client_reference_id || session.id;
        await this.persistencePort.updateTransactionStatus(ref, "APPROVED", session.id);
        await this.eventPublisherPort.publishPaymentCompleted({
          reference: ref,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || "usd").toUpperCase(),
          companyId: session.metadata?.companyId || "default",
          provider: "STRIPE",
        });
        return { handled: true, reference: ref, status: "APPROVED" };
      }
    }

    if (prov === "WOMPI") {
      const event = payload?.data?.transaction;
      if (event && payload?.event === "transaction.updated") {
        const ref = event.reference;
        const status: PaymentStatus = event.status === "APPROVED" ? "APPROVED" : "DECLINED";
        await this.persistencePort.updateTransactionStatus(ref, status, event.id);
        if (status === "APPROVED") {
          await this.eventPublisherPort.publishPaymentCompleted({
            reference: ref,
            amount: event.amount_in_cents / 100,
            currency: event.currency,
            companyId: "default",
            provider: "WOMPI",
          });
        }
        return { handled: true, reference: ref, status };
      }
    }

    return { handled: false };
  }
}
