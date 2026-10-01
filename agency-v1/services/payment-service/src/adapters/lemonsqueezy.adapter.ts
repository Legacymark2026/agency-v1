import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentProvider, PaymentStatus } from "../core/domain/payment.domain";

export class LemonSqueezyAdapter implements IPaymentGatewayStrategy {
  providerName: PaymentProvider = "LEMON_SQUEEZY" as PaymentProvider;
  
  isAvailable(): boolean {
    return Boolean(process.env.LEMONSQUEEZY_API_KEY);
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string) {
    // TODO: Implement Lemon Squeezy SDK integration
    return { url: `https://app.lemonsqueezy.com/mock?ref=${txReference}`, externalId: txReference };
  }

  verifyWebhook(payload: any, signature: string) {
    // TODO: Implement Lemon Squeezy signature validation
    return { isValid: true, eventType: "UNKNOWN" as any, transactionId: payload.meta?.custom_data?.txReference || "" };
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    return "PENDING" as PaymentStatus;
  }
}
