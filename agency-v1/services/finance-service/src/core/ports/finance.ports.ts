/**
 * Finance Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  VoucherDomain,
  VoucherLineInput,
  InvoiceItem,
  InvoiceStatus,
} from "../domain/finance.domain";

export interface CreateVoucherDTO {
  companyId: string;
  documentType: string;
  date: string;
  concept: string;
  lines: VoucherLineInput[];
  costCenterCode?: string;
}

export interface CreateInvoiceDTO {
  companyId: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  taxRate?: number;
  discountPercent?: number;
}

export interface InvoiceDomainResult {
  id: string;
  companyId: string;
  clientName: string;
  clientEmail: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  total: number;
  items: InvoiceItem[];
  createdAt: Date;
}

// Inbound Port (Driven by Controllers, gRPC or CLI)
export interface IFinanceUseCases {
  createJournalVoucher(dto: CreateVoucherDTO): Promise<VoucherDomain>;
  createInvoice(dto: CreateInvoiceDTO): Promise<InvoiceDomainResult>;
  verifyLedgerIntegrity(companyId: string): Promise<{ valid: boolean; checkedCount: number; brokenAt?: string }>;
}

// Outbound Port: Database Persistence
export interface IFinancePersistencePort {
  findLastVoucher(companyId: string): Promise<{ hashSeal: string; voucherNumber: string } | null>;
  saveVoucher(voucher: VoucherDomain): Promise<VoucherDomain>;
  findVouchersByCompany(companyId: string): Promise<VoucherDomain[]>;
  saveInvoice(invoice: InvoiceDomainResult): Promise<InvoiceDomainResult>;
}

// Outbound Port: Event Publisher
export interface IFinanceEventPublisherPort {
  publishAccountingEvent(topic: string, event: Record<string, any>): Promise<void>;
}
