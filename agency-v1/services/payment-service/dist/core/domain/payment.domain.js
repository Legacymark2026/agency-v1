"use strict";
/**
 * Payment Service — Pure Domain Entities & Value Objects (Zero External Dependencies)
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransactionDomain = void 0;
class PaymentTransactionDomain {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() { return this.props.id; }
    get companyId() { return this.props.companyId; }
    get reference() { return this.props.reference; }
    get amount() { return this.props.amount; }
    get currency() { return this.props.currency; }
    get provider() { return this.props.provider; }
    get category() { return this.props.category; }
    get status() { return this.props.status; }
    get orderId() { return this.props.orderId; }
    get invoiceId() { return this.props.invoiceId; }
    get customerEmail() { return this.props.customerEmail; }
    get metadata() { return this.props.metadata; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
    approve(gatewayTxId, approvalCode) {
        if (this.props.status === "APPROVED")
            return this; // Idempotent
        if (this.props.status !== "PENDING") {
            throw new Error(`Invalid state transition: Cannot approve transaction in ${this.props.status} state.`);
        }
        return new PaymentTransactionDomain({
            ...this.props,
            status: "APPROVED",
            gatewayTransactionId: gatewayTxId || this.props.gatewayTransactionId,
            approvalCode: approvalCode || this.props.approvalCode,
            updatedAt: new Date()
        });
    }
    decline(reason) {
        if (this.props.status === "DECLINED")
            return this;
        if (this.props.status !== "PENDING") {
            throw new Error(`Invalid state transition: Cannot decline transaction in ${this.props.status} state.`);
        }
        return new PaymentTransactionDomain({
            ...this.props,
            status: "DECLINED",
            metadata: { ...this.props.metadata, declineReason: reason },
            updatedAt: new Date()
        });
    }
    toJSON() {
        return { ...this.props };
    }
    static create(dto) {
        if (dto.amount <= 0) {
            throw new Error("Payment amount must be greater than 0");
        }
        return new PaymentTransactionDomain({
            id: "tx_" + Math.random().toString(36).substring(2, 11),
            companyId: dto.companyId,
            reference: dto.reference,
            amount: dto.amount,
            currency: dto.currency,
            provider: dto.provider,
            category: dto.category || "CUSTOM",
            status: "PENDING",
            orderId: dto.orderId,
            invoiceId: dto.invoiceId,
            customerEmail: dto.customerEmail,
            metadata: dto.metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
}
exports.PaymentTransactionDomain = PaymentTransactionDomain;
