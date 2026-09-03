import { describe, it, expect } from "vitest";
import { WompiAdapter } from "./adapters/wompi.adapter";
import { BoldPosAdapter } from "./adapters/bold.adapter";
import { paymentService } from "./services/payment.service";

describe("Decoupled Payment Microservice Core", () => {
  it("calculates correct Wompi SHA-256 integrity signature", () => {
    const reference = "REF-TEST-001";
    const amountInCents = 5000000; // $50,000 COP
    const currency = "COP";

    const signature = WompiAdapter.computeIntegritySignature(reference, amountInCents, currency);
    expect(signature).toBeDefined();
    expect(signature.length).toBe(64); // SHA-256 hex string
  });

  it("verifies Wompi webhook checksum accurately", () => {
    const tx = { id: "tx_123", status: "APPROVED", amount_in_cents: 100000 };
    const timestamp = 1712000000;

    // Secret fallback is empty string in test environment
    const raw = `${tx.id}${tx.status}${tx.amount_in_cents}${timestamp}`;
    const crypto = require("crypto");
    const expectedChecksum = crypto.createHash("sha256").update(raw).digest("hex");

    const isValid = WompiAdapter.verifyWebhookChecksum(tx, timestamp, expectedChecksum);
    expect(isValid).toBe(true);
  });

  it("creates compliant POS EMV transaction with ISO 8583 fields and HMAC", () => {
    const tx = BoldPosAdapter.createPOSTransaction({
      companyId: "comp_123",
      amount: 150000,
      provider: "BOLD",
      cardBrand: "MASTERCARD",
      cardLast4: "5678",
      terminalId: "TERM-01",
    });

    expect(tx.status).toBe("APPROVED");
    expect(tx.amount).toBe(150000);
    expect(tx.currency).toBe("COP");
    expect(tx.approvalCode).toBeDefined();
    expect(tx.approvalCode?.length).toBe(6);
    expect(tx.rrn).toBeDefined();
    expect(tx.stan).toBeDefined();
    expect(tx.hmacSignature).toBeDefined();
    expect(tx.hmacSignature?.length).toBe(64);
  });

  it("reports active payment gateways based on environment", () => {
    const gateways = paymentService.getAvailableGateways();
    expect(gateways).toBeDefined();
    expect(gateways.bold.enabled).toBe(true);
    expect(gateways.wompi.currency).toBe("COP");
  });

  it("creates checkout session with fallback transfer if no live API keys", async () => {
    const session = await paymentService.createCheckoutSession({
      companyId: "comp_test",
      amount: 250000,
      currency: "COP",
      title: "Factura Test #101",
    });

    expect(session.reference).toContain("REF-PAY-");
    expect(session.url).toBeDefined();
    expect(session.provider).toBeDefined();
  });
});

describe("PCI DSS v4.0 Zero-PAN Sanitization & ISO 27001 Security", () => {
  it("masks 16-digit credit card number keeping only BIN (first 6) and last 4", async () => {
    const { maskPAN } = await import("./middlewares/sanitizer.middleware");
    const masked = maskPAN("4532 0150 1234 5678");
    expect(masked).toBe("453201******5678");
    expect(masked).not.toContain("1234");
  });

  it("redacts sensitive authentication data (CVV, PIN) from nested payloads", async () => {
    const { sanitizePayloadRecursively } = await import("./middlewares/sanitizer.middleware");
    const payload = {
      amount: 150000,
      customer: {
        name: "Carlos Mendoza",
        card: {
          pan: "4111111111111111",
          cvv: "123",
          pin: "9988",
        },
      },
    };

    const sanitized = sanitizePayloadRecursively(payload);
    expect(sanitized.customer.card.pan).toBe("411111******1111");
    expect(sanitized.customer.card.cvv).toBe("[REDACTED_SAD]");
    expect(sanitized.customer.card.pin).toBe("[REDACTED_SAD]");
  });
});

