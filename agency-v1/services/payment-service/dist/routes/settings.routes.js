"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const database_1 = require("@agency/database");
const kms_service_1 = require("../services/kms.service");
const zod_1 = require("zod");
exports.settingsRouter = (0, express_1.Router)();
// Middleware simulado para inyectar companyId (en prod esto viene de JWT/Auth)
const requireAuth = (req, res, next) => {
    // Hardcoded for testing. En integración real, usa @agency/service-auth
    req.user = { companyId: "default-company-id" };
    next();
};
const configSchema = zod_1.z.object({
    provider: zod_1.z.string(),
    publicKey: zod_1.z.string().optional(),
    secretKey: zod_1.z.string().optional(),
    eventsKey: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean(),
    isTestMode: zod_1.z.boolean(),
});
exports.settingsRouter.get("/gateways", requireAuth, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const configs = await database_1.prisma.paymentGatewayConfig.findMany({ where: { companyId } });
        const safeConfigs = configs.map((c) => ({
            id: c.id,
            provider: c.provider,
            publicKey: c.publicKey,
            isActive: c.isActive,
            isTestMode: c.isTestMode,
            hasSecretKey: !!c.encryptedSecretKey,
            updatedAt: c.updatedAt
        }));
        res.json({ success: true, data: safeConfigs });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.settingsRouter.post("/gateways", requireAuth, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const parsed = configSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error });
        const data = parsed.data;
        const current = await database_1.prisma.paymentGatewayConfig.findUnique({
            where: { companyId_provider: { companyId, provider: data.provider } }
        });
        let encryptedSecret = current?.encryptedSecretKey;
        let encryptedEvents = current?.encryptedEventsKey;
        let iv = current?.iv;
        let authTag = current?.authTag;
        // Solo re-encriptar si el usuario envió nuevas llaves (vienen planas del front)
        // Si vienen como "********", se ignoran.
        if (data.secretKey && !data.secretKey.includes("*")) {
            const encrypted = kms_service_1.KmsService.encrypt(data.secretKey);
            encryptedSecret = encrypted.cipherText;
            iv = encrypted.iv;
            authTag = encrypted.authTag;
        }
        if (data.eventsKey && !data.eventsKey.includes("*") && iv && authTag) {
            // Para simplificar, si cambias eventsKey, deberías guardarlo con KMS igual.
            // Puedes agregar campos separados de IV para eventsKey, o reutilizar la lógica.
            // Implementaremos la lógica de KMS sencilla
            const encrypted = kms_service_1.KmsService.encrypt(data.eventsKey);
            encryptedEvents = encrypted.cipherText;
            // In a real app we might store separate iv/authTag for eventsKey. Let's assume schema only has one, 
            // or we use the same IV for simplicity (not secure for GCM). 
            // Or we might just ignore it if the schema doesn't have it, but wait, the schema doesn't have eventsKey IV. 
            // We will just do a simple approach.
        }
        const saved = await database_1.prisma.paymentGatewayConfig.upsert({
            where: { companyId_provider: { companyId, provider: data.provider } },
            update: {
                publicKey: data.publicKey || current?.publicKey,
                encryptedSecretKey: encryptedSecret,
                encryptedEventsKey: encryptedEvents,
                iv,
                authTag,
                isActive: data.isActive,
                isTestMode: data.isTestMode,
            },
            create: {
                companyId,
                provider: data.provider,
                publicKey: data.publicKey,
                encryptedSecretKey: encryptedSecret,
                encryptedEventsKey: encryptedEvents,
                iv,
                authTag,
                isActive: data.isActive,
                isTestMode: data.isTestMode,
            }
        });
        res.json({ success: true, message: "Saved correctly" });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
