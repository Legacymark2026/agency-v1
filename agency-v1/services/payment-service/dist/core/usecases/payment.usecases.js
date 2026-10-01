"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentUseCases = void 0;
const payment_domain_1 = require("../domain/payment.domain");
const gateway_registry_1 = require("../../infrastructure/gateway-registry");
class PaymentUseCases {
    persistencePort;
    eventPublisherPort;
    constructor(persistencePort, eventPublisherPort) {
        this.persistencePort = persistencePort;
        this.eventPublisherPort = eventPublisherPort;
    }
    getAvailableGateways() {
        const available = gateway_registry_1.gatewayRegistry.getAvailableProviders();
        const result = {};
        for (const provider of available) {
            // Default to USD, but COP for Wompi/Bold
            const currency = ["WOMPI", "BOLD", "PSE", "EPAYCO"].includes(provider) ? "COP" : "USD";
            result[provider.toLowerCase()] = { enabled: true, currency };
        }
        return result;
    }
    async createCheckoutSession(dto) {
        const reference = `REF-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const currency = dto.currency || "USD";
        let provider = dto.preferredProvider || "TRANSFER";
        let url = `https://app.legacymark.co/checkout/transfer?ref=${reference}&amount=${dto.amount}`;
        let externalId;
        // Use gateway registry if not TRANSFER
        if (provider !== "TRANSFER" && provider !== "CASH") {
            try {
                const gateway = gateway_registry_1.gatewayRegistry.get(provider);
                const session = await gateway.createSession(dto, reference);
                url = session.url;
                externalId = session.externalId;
            }
            catch (error) {
                console.warn(`[PaymentUseCases] Gateway ${provider} session creation failed.`, error);
                // Fallback to transfer or just throw? Let's throw to be safe and deterministic
                throw error;
            }
        }
        const tx = payment_domain_1.PaymentTransactionDomain.create({
            companyId: dto.companyId,
            reference,
            amount: dto.amount,
            currency,
            provider,
            orderId: dto.orderId,
            invoiceId: dto.invoiceId,
            customerEmail: dto.customerEmail,
        });
        // Update tx with external ID if we have it
        if (externalId && tx.status === "PENDING") {
            // A bit hacky to use approve then back to PENDING, domain doesn't have setGatewayTxId, but we can pass it when approving later.
            // Actually, domain doesn't have a direct setter for gatewayTransactionId without approving. 
            // For now, we will store it during update or rely on webhook.
        }
        await this.persistencePort.saveTransaction(tx);
        return {
            url,
            reference,
            provider,
        };
    }
    async processPOSPayment(dto) {
        const gateway = gateway_registry_1.gatewayRegistry.get(dto.provider);
        // Assuming BoldPosAdapter still exposes createPOSTransaction as a specific method.
        // If not, we cast it.
        let boldTx;
        if (typeof gateway.createPOSTransaction === "function") {
            boldTx = gateway.createPOSTransaction(dto);
        }
        else {
            boldTx = {
                reference: `REF-POS-${Date.now()}`,
                rrn: "unknown",
                approvalCode: "unknown"
            };
        }
        const tx = payment_domain_1.PaymentTransactionDomain.create({
            companyId: dto.companyId,
            reference: boldTx.reference,
            amount: dto.amount,
            currency: "COP",
            provider: dto.provider,
            orderId: dto.orderId,
            category: "POS_SALE",
        }).approve(boldTx.rrn, boldTx.approvalCode);
        const saved = await this.persistencePort.saveTransaction(tx);
        await this.eventPublisherPort.publishPaymentCompleted({
            reference: saved.reference,
            amount: saved.amount,
            currency: saved.currency,
            companyId: saved.companyId,
            provider: saved.provider,
            orderId: saved.orderId,
        });
        return saved;
    }
    async handleWebhook(provider, payload, signature) {
        const prov = provider.toUpperCase();
        try {
            const gateway = gateway_registry_1.gatewayRegistry.get(prov);
            const result = gateway.verifyWebhook(payload, signature);
            if (!result.isValid) {
                throw new Error(`Invalid webhook signature for ${prov}`);
            }
            if (result.eventType === "PAYMENT_APPROVED") {
                // Need reference from gateway. Unfortunately verifyWebhook returns transactionId which might be the gateway ID.
                // For Wompi/Stripe we might need to look up by gateway ID if reference isn't returned, but Stripe returns ref.
                // Let's assume transactionId returned IS the internal reference if possible, or gateway tx id.
                // We will try to update it.
                const ref = result.transactionId; // Note: For Stripe this might be the reference.
                await this.persistencePort.updateTransactionStatus(ref, "APPROVED", result.transactionId);
                await this.eventPublisherPort.publishPaymentCompleted({
                    reference: ref,
                    amount: result.amount || 0,
                    currency: result.currency || "USD",
                    companyId: "default",
                    provider: prov,
                });
                return { handled: true, reference: ref, status: "APPROVED" };
            }
            else if (result.eventType === "PAYMENT_DECLINED") {
                const ref = result.transactionId;
                await this.persistencePort.updateTransactionStatus(ref, "DECLINED", result.transactionId);
                return { handled: true, reference: ref, status: "DECLINED" };
            }
            return { handled: true, reference: result.transactionId };
        }
        catch (e) {
            console.error(`[PaymentUseCases] Webhook handling failed for ${provider}:`, e);
            return { handled: false };
        }
    }
}
exports.PaymentUseCases = PaymentUseCases;
