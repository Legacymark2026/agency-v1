import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentProvider, PaymentStatus } from "../core/domain/payment.domain";
import crypto from "crypto";

export class EpaycoAdapter implements IPaymentGatewayStrategy {
  providerName: PaymentProvider = "EPAYCO" as PaymentProvider;
  
  isAvailable(): boolean {
    return Boolean(process.env.EPAYCO_P_CUST_ID_CLIENTE && process.env.EPAYCO_P_KEY);
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string) {
    if (!this.isAvailable()) throw new Error("ePayco not configured");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
    return {
      url: `${baseUrl}/checkout/epayco?ref=${txReference}&amount=${params.amount}`,
      externalId: txReference,
    };
  }

  verifyWebhook(payload: any, signature: string) {
    const p_cust_id_client = process.env.EPAYCO_P_CUST_ID_CLIENTE;
    const p_key = process.env.EPAYCO_P_KEY;
    
    if (!p_cust_id_client || !p_key) {
      return {
        isValid: true,
        eventType: (payload?.x_cod_response === 1 ? "PAYMENT_APPROVED" : "UNKNOWN") as any,
        transactionId: payload?.x_ref_payco || "",
      };
    }

    const { x_cust_id_cliente, x_ref_payco, x_transaction_id, x_amount, x_currency_code, x_signature } = payload || {};
    const signatureString = `${x_cust_id_cliente}^${p_key}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`;
    const hash = crypto.createHash("sha256").update(signatureString).digest("hex");
    
    if (hash === x_signature) {
      return { 
        isValid: true, 
        eventType: (payload?.x_cod_response === 1 ? "PAYMENT_APPROVED" : "DECLINED") as any, 
        transactionId: x_ref_payco || "",
      };
    }

    return { isValid: false, eventType: "UNKNOWN" as any, transactionId: "" };
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    if (!this.isAvailable()) return "PENDING" as PaymentStatus;
    try {
      const res = await fetch(`https://secure.epayco.co/validation/v1/reference/${externalId}`);
      if (!res.ok) return "PENDING";
      const data = await res.json();
      if (data?.data?.x_cod_response === 1) return "APPROVED";
      if (data?.data?.x_cod_response === 2 || data?.data?.x_cod_response === 4) return "DECLINED";
      return "PENDING";
    } catch {
      return "PENDING";
    }
  }
}
