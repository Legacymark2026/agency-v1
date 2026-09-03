/**
 * Accounting Domain Events (Event Sourcing Architecture)
 * ─────────────────────────────────────────────────────────────────────────────
 * Immutable facts that have occurred in the accounting domain.
 * Every state change in the general ledger is represented by a domain event.
 */

export interface DomainEvent<T = any> {
  eventId: string;
  streamId: string;
  eventType: string;
  version: number;
  timestamp: string;
  companyId: string;
  payload: T;
  previousHash: string;
  eventHash: string;
}

export interface VoucherCreatedPayload {
  voucherId: string;
  voucherNumber: string;
  documentType: string;
  date: string;
  concept: string;
  totalDebit: number;
  totalCredit: number;
  lines: Array<{
    accountCode: string;
    accountName: string;
    thirdPartyNit?: string;
    thirdPartyName?: string;
    debit: number;
    credit: number;
    costCenterCode?: string;
    description?: string;
  }>;
  dianCufe?: string;
}

export interface VoucherReversedPayload {
  originalVoucherId: string;
  reversalVoucherId: string;
  reversalVoucherNumber: string;
  reason: string;
  timestamp: string;
}

export interface PeriodClosedPayload {
  periodId: string;
  year: number;
  month: number;
  closedAt: string;
  closedByUserId: string;
  closingVoucherId?: string;
}
