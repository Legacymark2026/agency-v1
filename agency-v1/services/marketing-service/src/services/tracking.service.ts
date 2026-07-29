import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SERVICE_JWT_SECRET || "legacymark-tracking-secret";

export interface TrackingTokenPayload {
  recipientId: string;
  blastId: string;
  email: string;
  companyId: string;
}

export class TrackingService {
  /**
   * Generar token firmado de seguimiento
   */
  static generateToken(payload: TrackingTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "90d" });
  }

  /**
   * Verificar y decodificar token de seguimiento
   */
  static verifyToken(token: string): TrackingTokenPayload {
    return jwt.verify(token, JWT_SECRET) as TrackingTokenPayload;
  }

  /**
   * Inyectar píxel de seguimiento 1x1 y reescribir enlaces HTML para medir clics
   */
  static injectTracking(
    htmlBody: string,
    payload: TrackingTokenPayload,
    baseUrl: string
  ): string {
    const token = this.generateToken(payload);
    const trackingPixelUrl = `${baseUrl}/api/v1/email-blast/track/open?token=${token}`;
    const clickBaseUrl = `${baseUrl}/api/v1/email-blast/track/click?token=${token}`;

    // Rewriting href links for click tracking
    const rewrittenHtml = htmlBody.replace(
      /href=["'](https?:\/\/[^"']+)["']/g,
      (_match, originalUrl) => {
        // Skip tracking for unsubscribe links
        if (originalUrl.includes("/unsubscribe")) return `href="${originalUrl}"`;
        const trackedUrl = `${clickBaseUrl}&target=${encodeURIComponent(originalUrl)}`;
        return `href="${trackedUrl}"`;
      }
    );

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
  static getUnsubscribeHeaders(
    payload: TrackingTokenPayload,
    baseUrl: string
  ): Record<string, string> {
    const token = this.generateToken(payload);
    const unsubscribeUrl = `${baseUrl}/api/v1/email-blast/unsubscribe?token=${token}`;
    const mailtoAddress = `unsubscribe@legacymarksas.com`;

    return {
      "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:${mailtoAddress}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    };
  }
}
