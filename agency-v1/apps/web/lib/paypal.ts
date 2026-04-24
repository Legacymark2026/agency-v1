const PAYPAL_API = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalAmount {
  currency_code: string;
  value: string;
}

interface PayPalPurchaseUnit {
  reference_id: string;
  description: string;
  amount: PayPalAmount;
  custom_id?: string;
}

interface PayPalLink {
  rel: string;
  href: string;
  method: string;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  intent: string;
  purchase_units: PayPalPurchaseUnit[];
  create_time: string;
  links: PayPalLink[];
}

interface CaptureResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: PayPalAmount;
      }>;
    };
  }>;
}

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

async function getPayPalAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal token error: ${error}`);
  }

  const data: PayPalAccessToken = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return data.access_token;
}

async function createPayPalOrder(
  amount: number,
  currency: string,
  description: string,
  metadata?: Record<string, string>
): Promise<PayPalOrderResponse> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: "default",
          description,
          amount: {
            currency_code: currency,
            value: (amount / 100).toFixed(2),
          },
          ...(metadata && { custom_id: JSON.stringify(metadata) }),
        },
      ],
      application_context: {
        brand_name: "LegacyMark",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings?paypal_success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings?paypal_canceled=true`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal order error: ${error}`);
  }

  return response.json();
}

async function capturePayPalOrder(orderId: string): Promise<CaptureResponse> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal capture error: ${error}`);
  }

  return response.json();
}

async function getPayPalOrderDetails(orderId: string): Promise<PayPalOrderResponse> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal details error: ${error}`);
  }

  return response.json();
}

async function refundPayPalCapture(
  captureId: string,
  amount?: number,
  currency?: string,
  reason?: string
): Promise<{ id: string; status: string }> {
  const accessToken = await getPayPalAccessToken();

  const body: Record<string, unknown> = {};
  if (amount && currency) {
    body.amount = {
      value: (amount / 100).toFixed(2),
      currency_code: currency,
    };
  }
  if (reason) {
    body.note_to_payer = reason;
  }

  const response = await fetch(
    `${PAYPAL_API}/v2/payments/captures/${captureId}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal refund error: ${error}`);
  }

  return response.json();
}

export {
  getPayPalAccessToken,
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrderDetails,
  refundPayPalCapture,
};

export type { PayPalOrderResponse, CaptureResponse };