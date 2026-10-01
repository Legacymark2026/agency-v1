import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentProvider, PaymentStatus } from "../core/domain/payment.domain";

export class KushkiAdapter implements IPaymentGatewayStrategy {
  providerName: PaymentProvider = "KUSHKI" as PaymentProvider;
  
  isAvailable(): boolean {
    return Boolean(process.env.KUSHKI_PUBLIC_KEY);
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string) {
    // TODO: Implement Kushki SDK integration
    return { url: `https://kushkipagos.com/mock?ref=${txReference}`, externalId: txReference };
  }

  verifyWebhook(payload: any, signature: string) {
    // TODO: Implement Kushki signature validation
    return { isValid: true, eventType: "UNKNOWN" as any, transactionId: payload.ticketNumber || "" };
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    return "PENDING" as PaymentStatus;
  }
}
