"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.SERVICE_JWT_SECRET || "legacymark-tracking-secret";
class TrackingService {
    /**
     * Generar token firmado de seguimiento
     */
    static generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "90d" });
    }
    /**
     * Verificar y decodificar token de seguimiento
     */
    static verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    /**
     * Inyectar píxel de seguimiento 1x1 y reescribir enlaces HTML para medir clics
     */
    static injectTracking(htmlBody, payload, baseUrl) {
        const token = this.generateToken(payload);
        const trackingPixelUrl = `${baseUrl}/api/v1/email-blast/track/open?token=${token}`;
        const clickBaseUrl = `${baseUrl}/api/v1/email-blast/track/click?token=${token}`;
        // Rewriting href links for click tracking
        const rewrittenHtml = htmlBody.replace(/href=["'](https?:\/\/[^"']+)["']/g, (_match, originalUrl) => {
            // Skip tracking for unsubscribe links
            if (originalUrl.includes("/unsubscribe"))
                return `href="${originalUrl}"`;
            const trackedUrl = `${clickBaseUrl}&target=${encodeURIComponent(originalUrl)}`;
            return `href="${trackedUrl}"`;
        });
        // Inyectar píxel transparente 1x1 antes de </body> o al final del HTML
        const trackingPixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" border="0" alt="" style="display:none;width:1px;height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;" />`;
        if (rewrittenHtml.includes("</body>")) {
            return rewrittenHtml.replace("</body>", `${trackingPixelTag}</body>`);
        }
        return `${rewrittenHtml}${trackingPixelTag}`;
    }
    /**
     * Generar cabeceras RFC 8058 (List-Unsubscribe & List-Unsubscribe-Post)
     */
    static getUnsubscribeHeaders(payload, baseUrl) {
        const token = this.generateToken(payload);
        const unsubscribeUrl = `${baseUrl}/api/v1/email-blast/unsubscribe?token=${token}`;
        const mailtoAddress = `unsubscribe@legacymarksas.com`;
        return {
            "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:${mailtoAddress}?subject=unsubscribe>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        };
    }
}
exports.TrackingService = TrackingService;
//# sourceMappingURL=tracking.service.js.map