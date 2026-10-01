import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentProvider, PaymentStatus } from "../core/domain/payment.domain";

export class EpaycoAdapter implements IPaymentGatewayStrategy {
  providerName: PaymentProvider = "EPAYCO" as PaymentProvider;
  
  isAvailable(): boolean {
    return Boolean(process.env.EPAYCO_PUBLIC_KEY);
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string) {
    // TODO: Implement ePayco SDK integration
    return { url: `https://checkout.epayco.co/mock?ref=${txReference}`, externalId: txReference };
  }

  verifyWebhook(payload: any, signature: string) {
    // TODO: Implement ePayco signature validation (P_CUST_ID_CLIENTE, P_KEY)
    return { isValid: true, eventType: "UNKNOWN" as any, transactionId: payload.x_ref_payco || "" };
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    return "PENDING" as PaymentStatus;
  }
}
