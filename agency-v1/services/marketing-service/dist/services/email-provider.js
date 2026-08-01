"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProviderManager = exports.SmtpProvider = exports.ResendBatchProvider = void 0;
const database_1 = require("@agency/database");
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Resend Batch Email Provider
 * Uses Resend API endpoint https://api.resend.com/emails/batch (up to 100 emails per batch)
 */
class ResendBatchProvider {
    name = "resend";
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.RESEND_API_KEY || "";
    }
    async sendBatch(payload) {
        if (!this.apiKey) {
            throw new Error("RESEND_API_KEY no está configurada en el servidor o empresa.");
        }
        let fromAddress = payload.from;
        const executeResendCall = async (sender) => {
            const batchPayload = payload.emails.map((e) => ({
                from: sender,
                to: [e.to],
                subject: e.subject,
                html: e.html,
                headers: e.headers
            }));
            const response = await fetch("https://api.resend.com/emails/batch", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(batchPayload)
            });
            return { response, sender };
        };
        let { response, sender } = await executeResendCall(fromAddress);
        // Si Resend rechaza por dominio no verificado (403/422), reintentar automáticamente con onboarding@resend.dev
        if (!response.ok) {
            const errorText = await response.text();
            if ((response.status === 403 || response.status === 422) &&
                (errorText.toLowerCase().includes("domain") || errorText.toLowerCase().includes("verified") || errorText.toLowerCase().includes("onboarding"))) {
                console.warn(`[ResendBatchProvider] Sender "${fromAddress}" no está verificado en Resend. Reintentando con onboarding@resend.dev...`);
                const displayName = fromAddress.includes("<") ? fromAddress.split("<")[0].trim() : "LegacyMark";
                const fallbackSender = `${displayName} <onboarding@resend.dev>`;
                const retryResult = await executeResendCall(fallbackSender);
                if (retryResult.response.ok) {
                    response = retryResult.response;
                    sender = fallbackSender;
                }
                else {
                    const retryErrorText = await retryResult.response.text();
                    throw new Error(`Resend API Error (${retryResult.response.status}): ${retryErrorText}`);
                }
            }
            else {
                throw new Error(`Resend API Error (${response.status}): ${errorText}`);
            }
        }
        const data = (await response.json());
        const batchIds = data.data ? data.data.map((item) => item?.id).filter(Boolean) : [];
        const itemResults = payload.emails.map((e, index) => {
            const id = batchIds[index];
            if (id) {
                return { to: e.to, status: "SENT", id };
            }
            const err = data.errors?.[index]?.message || "Error al entregar a través de Resend API";
            return { to: e.to, status: "FAILED", error: err };
        });
        const sentCount = itemResults.filter((r) => r.status === "SENT").length;
        const failedCount = itemResults.length - sentCount;
        return {
            success: failedCount === 0,
            provider: "resend",
            sentCount,
            failedCount,
            batchIds,
            results: itemResults
        };
    }
}
exports.ResendBatchProvider = ResendBatchProvider;
/**
 * Real Nodemailer SMTP Provider
 */
class SmtpProvider {
    name = "smtp";
    config;
    constructor(config) {
        this.config = config;
    }
    async sendBatch(payload) {
        const host = this.config?.host || process.env.SMTP_HOST;
        const port = this.config?.port || Number(process.env.SMTP_PORT) || 587;
        const user = this.config?.user || process.env.SMTP_USER;
        const pass = this.config?.pass || process.env.SMTP_PASS;
        if (!host || !user || !pass) {
            throw new Error("No hay servidor SMTP ni credenciales de correo configuradas en la plataforma.");
        }
        const transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });
        const results = [];
        let sentCount = 0;
        let failedCount = 0;
        for (const email of payload.emails) {
            try {
                const info = await transporter.sendMail({
                    from: payload.from,
                    to: email.to,
                    subject: email.subject,
                    html: email.html,
                    headers: email.headers
                });
                sentCount++;
                results.push({ to: email.to, status: "SENT", id: info.messageId });
            }
            catch (err) {
                failedCount++;
                results.push({ to: email.to, status: "FAILED", error: err.message || "Error al enviar correo por SMTP" });
            }
        }
        return {
            success: failedCount === 0,
            provider: "smtp",
            sentCount,
            failedCount,
            results
        };
    }
}
exports.SmtpProvider = SmtpProvider;
/**
 * Provider Manager with Auto-Failover & Per-Company Integration Lookup
 */
class EmailProviderManager {
    async getProviderForCompany(companyId) {
        if (companyId) {
            try {
                const integration = await database_1.prisma.integrationConfig.findFirst({
                    where: {
                        companyId,
                        provider: { in: ["email", "resend", "smtp", "RESEND", "SMTP", "EMAIL"] },
                        isEnabled: true
                    }
                });
                if (integration?.config) {
                    const cfg = typeof integration.config === "string" ? JSON.parse(integration.config) : integration.config;
                    if (cfg.apiKey) {
                        console.log(`[EmailProviderManager] Cargadas credenciales Resend API de empresa ${companyId}`);
                        return new ResendBatchProvider(cfg.apiKey);
                    }
                    else if (cfg.host && cfg.user) {
                        console.log(`[EmailProviderManager] Cargadas credenciales SMTP de empresa ${companyId}`);
                        return new SmtpProvider({
                            host: cfg.host,
                            port: cfg.port || 587,
                            user: cfg.user,
                            pass: cfg.pass
                        });
                    }
                }
            }
            catch (err) {
                console.warn(`[EmailProviderManager] Error buscando credenciales de empresa ${companyId}:`, err);
            }
        }
        // Fallback global de variables de entorno
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            return new ResendBatchProvider(resendKey);
        }
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            return new SmtpProvider();
        }
        // Default provider que informará falta de configuración
        return new SmtpProvider();
    }
    async sendBatchWithFailover(payload, companyId) {
        const provider = await this.getProviderForCompany(companyId);
        try {
            return await provider.sendBatch(payload);
        }
        catch (primaryErr) {
            console.warn(`[EmailProviderManager] Proveedor (${provider.name}) falló: ${primaryErr.message}. Ejecutando transporte alternativo...`);
            // Intentar SMTP como fallback si el primario fue Resend y falló
            if (provider.name === "resend" && process.env.SMTP_HOST) {
                try {
                    const fallback = new SmtpProvider();
                    return await fallback.sendBatch(payload);
                }
                catch (fallbackErr) {
                    throw new Error(`Todos los proveedores fallaron. Resend: ${primaryErr.message}. SMTP Fallback: ${fallbackErr.message}`);
                }
            }
            throw new Error(`Error en proveedor de correo (${provider.name}): ${primaryErr.message}`);
        }
    }
}
exports.EmailProviderManager = EmailProviderManager;
//# sourceMappingURL=email-provider.js.map