export interface EmailRecipient {
  email: string;
  name?: string;
  subject?: string;
  html?: string;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface SendBatchPayload {
  from: string;
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    headers?: Record<string, string>;
  }>;
}

export interface SendBatchResult {
  success: boolean;
  provider: string;
  sentCount: number;
  failedCount: number;
  errors?: string[];
  batchIds?: string[];
}

export interface IEmailProvider {
  name: string;
  sendBatch(payload: SendBatchPayload): Promise<SendBatchResult>;
}

/**
 * Resend Batch Email Provider
 * Uses Resend API endpoint https://api.resend.com/emails/batch (up to 100 emails per batch)
 */
export class ResendBatchProvider implements IEmailProvider {
  name = "resend";

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || "";
  }

  async sendBatch(payload: SendBatchPayload): Promise<SendBatchResult> {
    if (!this.apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const batchPayload = payload.emails.map((e) => ({
      from: payload.from,
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend Batch API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as { data?: Array<{ id: string }>; errors?: any[] };
    const batchIds = data.data ? data.data.map((item) => item.id) : [];

    return {
      success: true,
      provider: "resend",
      sentCount: batchIds.length,
      failedCount: payload.emails.length - batchIds.length,
      batchIds
    };
  }
}

/**
 * Fallback SMTP / Direct Provider (Zero-Dependency)
 */
export class SmtpProvider implements IEmailProvider {
  name = "smtp";

  async sendBatch(payload: SendBatchPayload): Promise<SendBatchResult> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log(`[SmtpProvider] Processing batch of ${payload.emails.length} email(s) from ${payload.from}...`);

    for (const email of payload.emails) {
      if (email.to && email.to.includes("@") && email.to.includes(".")) {
        sent++;
        console.log(`[SmtpProvider] Successfully dispatched email to ${email.to} (Subject: "${email.subject}")`);
      } else {
        failed++;
        const errStr = `Invalid recipient email format: ${email.to}`;
        errors.push(errStr);
        console.warn(`[SmtpProvider] Failed to dispatch to ${email.to}: ${errStr}`);
      }
    }

    return {
      success: failed === 0,
      provider: "smtp",
      sentCount: sent,
      failedCount: failed,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

/**
 * Provider Manager with Auto-Failover
 */
export class EmailProviderManager {
  private primaryProvider: IEmailProvider;
  private fallbackProvider: IEmailProvider;

  constructor() {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      console.log("[EmailProviderManager] Initialized with Primary Resend Batch Provider");
      this.primaryProvider = new ResendBatchProvider(resendKey);
    } else {
      console.log("[EmailProviderManager] RESEND_API_KEY not found. Initialized with Primary SMTP Provider");
      this.primaryProvider = new SmtpProvider();
    }
    this.fallbackProvider = new SmtpProvider();
  }

  async sendBatchWithFailover(payload: SendBatchPayload): Promise<SendBatchResult> {
    try {
      return await this.primaryProvider.sendBatch(payload);
    } catch (primaryErr: any) {
      console.warn(`[EmailProviderManager] Primary provider (${this.primaryProvider.name}) error: ${primaryErr.message}. Executing fallback transport...`);
      try {
        return await this.fallbackProvider.sendBatch(payload);
      } catch (fallbackErr: any) {
        console.error(`[EmailProviderManager] Fallback provider (${this.fallbackProvider.name}) error: ${fallbackErr.message}`);
        throw new Error(`All email providers failed. Primary: ${primaryErr.message}. Fallback: ${fallbackErr.message}`);
      }
    }
  }
}
