import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentProvider, PaymentStatus } from "../core/domain/payment.domain";

export class PaddleAdapter implements IPaymentGatewayStrategy {
  providerName: PaymentProvider = "PADDLE" as PaymentProvider;
  
  isAvailable(): boolean {
    return Boolean(process.env.PADDLE_API_KEY);
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string) {
    // TODO: Implement Paddle SDK integration
    return { url: `https://checkout.paddle.com/mock?ref=${txReference}`, externalId: txReference };
  }

  verifyWebhook(payload: any, signature: string) {
    // TODO: Implement Paddle signature validation
    return { isValid: true, eventType: "UNKNOWN" as any, transactionId: payload.p_order_id || "" };
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    return "PENDING" as PaymentStatus;
  }
}
