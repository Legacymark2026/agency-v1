/**
 * PayPal Payment Gateway Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates orders, captures approved payments, and handles access token auth.
 */

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_BASE_URL = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export class PayPalAdapter {
  public static isAvailable(): boolean {
    return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
  }

  public static async getAccessToken(): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("PayPal credentials missing");
    }

    const authHeader = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`PayPal OAuth failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.access_token;
  }

  public static async createOrder(amount: number, currency = "USD", description = "Pago"): Promise<{ orderId: string; approvalUrl: string }> {
    const token = await this.getAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description,
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`PayPal Create Order failed: ${response.statusText}`);
    }

    const order: any = await response.json();
    const approvalUrl = order.links?.find((l: any) => l.rel === "approve")?.href || "";

    return { orderId: order.id, approvalUrl };
  }
}
