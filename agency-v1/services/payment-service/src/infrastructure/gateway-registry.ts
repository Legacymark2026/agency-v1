import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { prisma } from "@agency/database";
import { KmsService } from "../services/kms.service";

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

  async getCredentialsForProvider(companyId: string, provider: string) {
    const config = await (prisma as any).paymentGatewayConfig.findUnique({
      where: { companyId_provider: { companyId, provider } }
    });

    if (!config) return null;

    let decryptedSecretKey = null;
    let decryptedEventsKey = null;

    if (config.encryptedSecretKey && config.iv && config.authTag) {
      decryptedSecretKey = KmsService.decrypt(config.encryptedSecretKey, config.iv, config.authTag);
    }

    if (config.encryptedEventsKey && config.iv && config.authTag) {
      decryptedEventsKey = KmsService.decrypt(config.encryptedEventsKey, config.iv, config.authTag);
    }

    return {
      publicKey: config.publicKey,
      secretKey: decryptedSecretKey,
      eventsKey: decryptedEventsKey,
      isActive: config.isActive,
      isTestMode: config.isTestMode,
    };
  }
}

export const gatewayRegistry = new PaymentGatewayRegistry();
