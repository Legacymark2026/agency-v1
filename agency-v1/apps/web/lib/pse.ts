interface PSEBank {
  code: string;
  name: string;
}

interface PSEPurchaseRequest {
  amount: number;
  currency: string;
  documentType: string;
  document: string;
  firstName: string;
  lastName: string;
  email: string;
  bankCode: string;
  merchantInteractionId: string;
}

interface PSEPurchaseResponse {
  metadataOut?: {
    transactionId: string;
    interactionId: string;
  };
  action?: {
    reason: string;
    type: string;
    url: string;
  };
  statusCode?: string;
  statusMessage?: string;
}

interface PSEStatusResponse {
  statusCode: string;
  statusMessage: string;
  metadataOut?: {
    transactionId: string;
    interactionId: string;
  };
  authorizationCode?: string;
}

const PSE_API = process.env.PSE_API_BASE || "https://pse.stage.bamboopayment.com";
const PSE_PROVIDER = process.env.PSE_PROVIDER || "bamboo";

function getPSECredentials(): { merchantId: string; merchantKey: string } {
  const merchantId = process.env.PSE_MERCHANT_ID || "";
  const merchantKey = process.env.PSE_MERCHANT_KEY || "";

  if (!merchantId || !merchantKey) {
    throw new Error("PSE credentials not configured");
  }

  return { merchantId, merchantKey };
}

function getAuthHeader(): string {
  const { merchantId, merchantKey } = getPSECredentials();
  return `Basic ${Buffer.from(`${merchantId}:${merchantKey}`).toString("base64")}`;
}

async function createPSEPayment(
  params: PSEPurchaseRequest
): Promise<PSEPurchaseResponse> {
  const { merchantId } = getPSECredentials();

  if (PSE_PROVIDER === "ebanx") {
    return createPSEPaymentEBANX(params);
  }

  return createPSEPaymentBamboo(params);
}

async function createPSEPaymentBamboo(
  params: PSEPurchaseRequest
): Promise<PSEPurchaseResponse> {
  const response = await fetch(`${PSE_API}/api/Purchase`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      MetaDataIn: {
        main: {
          interactionType: "Purchase",
          paymentType: "Immediate",
          country: "CO",
          currency: params.currency,
          amount: params.amount,
          client: {
            documentType: params.documentType,
            document: params.document,
            name: params.firstName,
            lastName: params.lastName,
            email: params.email,
          },
        },
        bank: {
          bankCode: params.bankCode,
        },
      },
      metadataIn: {
        merchantId: process.env.PSE_MERCHANT_ID,
        merchantInteractionId: params.merchantInteractionId,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PSE Bamboo purchase error: ${error}`);
  }

  return response.json();
}

async function createPSEPaymentEBANX(
  params: PSEPurchaseRequest
): Promise<PSEPurchaseResponse> {
  const response = await fetch(`https://sandbox.ebanx.com/ws/direct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      integration_key: process.env.PSE_MERCHANT_KEY,
      operation: "request",
      payment: {
        name: `${params.firstName} ${params.lastName}`,
        email: params.email,
        phone_number: "0000000",
        document_type: params.documentType,
        document: params.document,
        country: "co",
        payment_type_code: "achpse",
        bank_code: params.bankCode,
        merchant_payment_code: params.merchantInteractionId,
        currency_code: params.currency,
        amount_total: params.amount.toString(),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PSE EBANX purchase error: ${error}`);
  }

  const data = await response.json();

  if (data.response?.payment?.redirect_url) {
    return {
      metadataOut: {
        transactionId: data.response.payment.hash,
        interactionId: params.merchantInteractionId,
      },
      action: {
        reason: "REDIRECTION_NEEDED_EXTERNAL_SERVICE",
        type: "REDIRECT",
        url: data.response.payment.redirect_url,
      },
      statusCode: "100",
      statusMessage: "Pending for redirection",
    };
  }

  return {
    metadataOut: {
      transactionId: data.response?.payment?.hash || "",
      interactionId: params.merchantInteractionId,
    },
    statusCode: data.response?.status?.code?.toString() || "0",
    statusMessage: data.response?.status?.message || "",
  };
}

async function getPSEBankList(): Promise<PSEBank[]> {
  if (PSE_PROVIDER === "ebanx") {
    return getPSEBankListEBANX();
  }

  return getPSEBankListBamboo();
}

async function getPSEBankListBamboo(): Promise<PSEBank[]> {
  const response = await fetch(`${PSE_API}/api/Bank/GetBanks`, {
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PSE bank list error: ${error}`);
  }

  const data = await response.json();
  return data.banks || [];
}

async function getPSEBankListEBANX(): Promise<PSEBank[]> {
  const response = await fetch(
    `https://sandbox.ebanx.com/ws/getBankList?country=co`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PSE bank list error: ${error}`);
  }

  const data = await response.json();
  return (data.banks || []).map((bank: { code: string; name: string }) => ({
    code: bank.code,
    name: bank.name,
  }));
}

async function getPSETransactionStatus(
  transactionId: string
): Promise<PSEStatusResponse> {
  if (PSE_PROVIDER === "ebanx") {
    return getPSETransactionStatusEBANX(transactionId);
  }

  return getPSETransactionStatusBamboo(transactionId);
}

async function getPSETransactionStatusBamboo(
  transactionId: string
): Promise<PSEStatusResponse> {
  const response = await fetch(
    `${PSE_API}/api/Transaction/GetTransaction?transactionId=${transactionId}`,
    {
      headers: {
        Authorization: getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PSE status error: ${error}`);
  }

  const data = await response.json();
  return {
    statusCode: data.statusCode?.toString() || "0",
    statusMessage: data.statusMessage || "",
    metadataOut: data.metadataOut,
    authorizationCode: data.authorizationCode,
  };
}

async function getPSETransactionStatusEBANX(
  merchantPaymentCode: string
): Promise<PSEStatusResponse> {
  const response = await fetch(
    `https://sandbox.ebanx.com/ws/query?integration_key=${process.env.PSE_MERCHANT_KEY}&merchant_payment_code=${merchantPaymentCode}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PSE status error: ${error}`);
  }

  const data = await response.json();
  return {
    statusCode: data.response?.status?.code?.toString() || "0",
    statusMessage: data.response?.status?.message || "",
    metadataOut: {
      transactionId: data.response?.payment?.hash,
      interactionId: merchantPaymentCode,
    },
  };
}

async function refundPSEPayment(
  transactionId: string,
  amount: number,
  currency: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  if (PSE_PROVIDER === "bamboo") {
    const response = await fetch(`${PSE_API}/api/Refund`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionId,
        amount,
        currency,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, refundId: data.refundId };
  }

  return { success: false, error: "Refund not supported for EBANX" };
}

export {
  createPSEPayment,
  getPSEBankList,
  getPSETransactionStatus,
  refundPSEPayment,
};

export type { PSEBank, PSEPurchaseResponse, PSEStatusResponse };