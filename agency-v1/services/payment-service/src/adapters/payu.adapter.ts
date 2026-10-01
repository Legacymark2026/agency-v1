import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentProvider, PaymentStatus } from "../core/domain/payment.domain";

export class PayUAdapter implements IPaymentGatewayStrategy {
  providerName: PaymentProvider = "PAYU" as PaymentProvider;
  
  isAvailable(): boolean {
    return Boolean(process.env.PAYU_API_KEY);
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string) {
    // TODO: Implement PayU SDK integration
    return { url: `https://checkout.payulatam.com/mock?ref=${txReference}`, externalId: txReference };
  }

  verifyWebhook(payload: any, signature: string) {
    // TODO: Implement PayU signature validation
    return { isValid: true, eventType: "UNKNOWN" as any, transactionId: payload.reference_sale || "" };
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    return "PENDING" as PaymentStatus;
  }
}
