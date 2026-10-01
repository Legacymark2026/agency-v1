"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatewayRegistry = exports.PaymentGatewayRegistry = void 0;
const database_1 = require("@agency/database");
const kms_service_1 = require("../services/kms.service");
class PaymentGatewayRegistry {
    gateways = new Map();
    register(gateway) {
        this.gateways.set(gateway.providerName, gateway);
    }
    get(provider) {
        const gw = this.gateways.get(provider);
        if (!gw)
            throw new Error(`Payment gateway ${provider} is not registered or supported.`);
        if (!gw.isAvailable())
            throw new Error(`Payment gateway ${provider} is not configured (missing API keys).`);
        return gw;
    }
    getAvailableProviders() {
        return Array.from(this.gateways.values()).filter(gw => gw.isAvailable()).map(gw => gw.providerName);
    }
    async getCredentialsForProvider(companyId, provider) {
        const config = await database_1.prisma.paymentGatewayConfig.findUnique({
            where: { companyId_provider: { companyId, provider } }
        });
        if (!config)
            return null;
        let decryptedSecretKey = null;
        let decryptedEventsKey = null;
        if (config.encryptedSecretKey && config.iv && config.authTag) {
            decryptedSecretKey = kms_service_1.KmsService.decrypt(config.encryptedSecretKey, config.iv, config.authTag);
        }
        if (config.encryptedEventsKey && config.iv && config.authTag) {
            decryptedEventsKey = kms_service_1.KmsService.decrypt(config.encryptedEventsKey, config.iv, config.authTag);
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
exports.PaymentGatewayRegistry = PaymentGatewayRegistry;
exports.gatewayRegistry = new PaymentGatewayRegistry();
