import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentProvider, PaymentStatus } from "../core/domain/payment.domain";

export class MercadoPagoAdapter implements IPaymentGatewayStrategy {
  providerName: PaymentProvider = "MERCADOPAGO" as PaymentProvider;
  
  isAvailable(): boolean {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string) {
    // TODO: Implement MercadoPago SDK integration
    return { url: `https://mercadopago.com/mock?ref=${txReference}`, externalId: txReference };
  }

  verifyWebhook(payload: any, signature: string) {
    // TODO: Implement MercadoPago signature validation
    return { isValid: true, eventType: "UNKNOWN" as any, transactionId: payload.id || "" };
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    return "PENDING" as PaymentStatus;
  }
}
