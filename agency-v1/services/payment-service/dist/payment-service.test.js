"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Payment Service — Hexagonal Unit Tests (Zero DB & Network Dependencies)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const vitest_1 = require("vitest");
const sanitizer_middleware_1 = require("./middlewares/sanitizer.middleware");
const wompi_adapter_1 = require("./adapters/wompi.adapter");
const payment_domain_1 = require("./core/domain/payment.domain");
const payment_usecases_1 = require("./core/usecases/payment.usecases");
(0, vitest_1.describe)("Payment Service — Hexagonal Core Domain & UseCases", () => {
    const mockPersistence = {
        saveTransaction: vitest_1.vi.fn(async (tx) => tx),
        findTransactionByReference: vitest_1.vi.fn(async () => null),
        updateTransactionStatus: vitest_1.vi.fn(async () => null),
    };
    const mockPublisher = {
        publishPaymentCompleted: vitest_1.vi.fn(async () => { }),
        publishPaymentFailed: vitest_1.vi.fn(async () => { }),
    };
    const useCases = new payment_usecases_1.PaymentUseCases(mockPersistence, mockPublisher);
    (0, vitest_1.it)("Domain: creates a valid PaymentTransaction entity", () => {
        const tx = payment_domain_1.PaymentTransactionDomain.create({
            companyId: "comp_123",
            reference: "REF-001",
            amount: 150000,
            currency: "COP",
            provider: "WOMPI",
        });
        (0, vitest_1.expect)(tx.reference).toBe("REF-001");
        (0, vitest_1.expect)(tx.amount).toBe(150000);
        (0, vitest_1.expect)(tx.status).toBe("PENDING");
    });
    (0, vitest_1.it)("Domain: throws if amount is zero or negative", () => {
        (0, vitest_1.expect)(() => {
            payment_domain_1.PaymentTransactionDomain.create({
                companyId: "comp_123",
                reference: "REF-002",
                amount: -50,
                currency: "USD",
                provider: "STRIPE",
            });
        }).toThrow("Payment amount must be greater than 0");
    });
    (0, vitest_1.it)("UseCases: processes a POS payment with automatic approval and event publication", async () => {
        const result = await useCases.processPOSPayment({
            companyId: "comp_123",
            amount: 45000,
            provider: "BOLD",
        });
        (0, vitest_1.expect)(result.status).toBe("APPROVED");
        (0, vitest_1.expect)(result.amount).toBe(45000);
        (0, vitest_1.expect)(mockPersistence.saveTransaction).toHaveBeenCalled();
        (0, vitest_1.expect)(mockPublisher.publishPaymentCompleted).toHaveBeenCalled();
    });
    (0, vitest_1.it)("UseCases: creates a checkout session reference and persists pending transaction", async () => {
        const session = await useCases.createCheckoutSession({
            companyId: "comp_123",
            amount: 250,
            currency: "USD",
            title: "Plan Pro Agency",
        });
        (0, vitest_1.expect)(session.reference).toBeDefined();
        (0, vitest_1.expect)(session.url).toBeDefined();
        (0, vitest_1.expect)(mockPersistence.saveTransaction).toHaveBeenCalled();
    });
});
(0, vitest_1.describe)('PCI-DSS PAN Masker', () => {
    (0, vitest_1.it)('masks a 16-digit card number correctly (BIN + Last 4)', () => {
        const masked = (0, sanitizer_middleware_1.maskPAN)('4111 1111 1111 1111');
        (0, vitest_1.expect)(masked).toBe('411111******1111');
    });
    (0, vitest_1.it)('redacts CVV fields from payload', () => {
        const sanitized = (0, sanitizer_middleware_1.sanitizePayloadRecursively)({ cvv: '123', amount: 100 });
        (0, vitest_1.expect)(sanitized.cvv).toBe('[REDACTED_SAD]');
        (0, vitest_1.expect)(sanitized.amount).toBe(100);
    });
});
(0, vitest_1.describe)('PaymentTransactionDomain Extra', () => {
    (0, vitest_1.it)('throws if amount is zero or negative', () => {
        (0, vitest_1.expect)(() => payment_domain_1.PaymentTransactionDomain.create({
            companyId: 'co1', reference: 'REF-1', amount: 0,
            currency: 'COP', provider: 'BOLD',
        })).toThrow('Payment amount must be greater than 0');
    });
    (0, vitest_1.it)('transitions to APPROVED state correctly', () => {
        const tx = payment_domain_1.PaymentTransactionDomain.create({
            companyId: 'co1', reference: 'REF-2', amount: 50000,
            currency: 'COP', provider: 'WOMPI',
        });
        const approved = tx.approve('gw-tx-123', 'APPR-001');
        (0, vitest_1.expect)(approved.status).toBe('APPROVED');
    });
});
(0, vitest_1.describe)('Wompi Webhook Security', () => {
    (0, vitest_1.it)('rejects payloads with invalid checksum', () => {
        process.env.WOMPI_EVENTS_SECRET = 'test-secret';
        const result = wompi_adapter_1.WompiAdapter.verifyWebhook({
            data: { transaction: { id: 'txn_1', status: 'APPROVED', amount_in_cents: 100000 } },
            timestamp: 1700000000,
            signature: { checksum: 'deadbeef00000000000000000000000000000000000000000000000000000000' },
        }, '');
        (0, vitest_1.expect)(result.isValid).toBe(false);
    });
});
