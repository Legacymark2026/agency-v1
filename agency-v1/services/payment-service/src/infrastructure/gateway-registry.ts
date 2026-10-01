import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";

export class PaymentGatewayRegistry {
  private gateways: Map<string, IPaymentGatewayStrategy> = new Map();

  register(gateway: IPaymentGatewayStrategy) {
    this.gateways.set(gateway.providerName, gateway);
  }

  get(provider: string): IPaymentGatewayStrategy {
    const gw = this.gateways.get(provider);
    if (!gw) throw new Error(`Payment gateway ${provider} is not registered or supported.`);
    if (!gw.isAvailable()) throw new Error(`Payment gateway ${provider} is not configured (missing API keys).`);
    return gw;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.gateways.values()).filter(gw => gw.isAvailable()).map(gw => gw.providerName);
  }
}

export const gatewayRegistry = new PaymentGatewayRegistry();
