/**
 * Finance Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IFinanceUseCases,
  IFinancePersistencePort,
  IFinanceEventPublisherPort,
  CreateVoucherDTO,
  CreateInvoiceDTO,
  InvoiceDomainResult,
} from "../ports/finance.ports";
import {
  VoucherDomain,
  calculateInvoiceTotals,
  verifyVoucherIntegrity,
  GENESIS_ACCOUNTING_HASH,
} from "../domain/finance.domain";

export class FinanceUseCases implements IFinanceUseCases {
  constructor(
    private readonly repoPort: IFinancePersistencePort,
    private readonly eventPublisher: IFinanceEventPublisherPort
  ) {}

  public async createJournalVoucher(dto: CreateVoucherDTO): Promise<VoucherDomain> {
    const lastVoucher = await this.repoPort.findLastVoucher(dto.companyId);
    const previousHash = lastVoucher?.hashSeal || GENESIS_ACCOUNTING_HASH;
    const nextSeq = lastVoucher
      ? parseInt(lastVoucher.voucherNumber.replace(/\D/g, "") || "0", 10) + 1
      : 1;
    const voucherNumber = `CC-${String(nextSeq).padStart(6, "0")}`;

    const voucher = VoucherDomain.create({
      companyId: dto.companyId,
      voucherNumber,
      documentType: dto.documentType,
      date: dto.date,
      concept: dto.concept,
      previousHash,
      lines: dto.lines,
    });

    const saved = await this.repoPort.saveVoucher(voucher);

    await this.eventPublisher.publishAccountingEvent("accounting.voucher.created", {
      voucherId: saved.id,
      companyId: saved.companyId,
      voucherNumber: saved.voucherNumber,
      hashSeal: saved.hashSeal,
      total: saved.totalDebit,
    });

    return saved;
  }

  public async createInvoice(dto: CreateInvoiceDTO): Promise<InvoiceDomainResult> {
    const totals = calculateInvoiceTotals(dto.items, dto.taxRate ?? 0.19, dto.discountPercent ?? 0);
    const invoice: InvoiceDomainResult = {
      id: "inv_" + Math.random().toString(36).substring(2, 9),
      companyId: dto.companyId,
      clientName: dto.clientName,
      clientEmail: dto.clientEmail,
      status: "DRAFT",
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      items: dto.items,
      createdAt: new Date(),
    };

    const saved = await this.repoPort.saveInvoice(invoice);

    await this.eventPublisher.publishAccountingEvent("finance.invoice.created", {
      invoiceId: saved.id,
      companyId: saved.companyId,
      total: saved.total,
    });

    return saved;
  }

  public async verifyLedgerIntegrity(companyId: string): Promise<{ valid: boolean; checkedCount: number; brokenAt?: string }> {
    const vouchers = await this.repoPort.findVouchersByCompany(companyId);
    let expectedPreviousHash = GENESIS_ACCOUNTING_HASH;

    for (let i = 0; i < vouchers.length; i++) {
      const v = vouchers[i];
      if (v.previousHash !== expectedPreviousHash) {
        return { valid: false, checkedCount: i, brokenAt: v.voucherNumber };
      }

      const isValidSeal = verifyVoucherIntegrity({
        previousHash: v.previousHash,
        companyId: v.companyId,
        voucherNumber: v.voucherNumber,
        date: v.date,
        totalDebit: v.totalDebit,
        totalCredit: v.totalCredit,
        lines: v.lines,
        hashSeal: v.hashSeal,
      });

      if (!isValidSeal) {
        return { valid: false, checkedCount: i, brokenAt: v.voucherNumber };
      }

      expectedPreviousHash = v.hashSeal;
    }

    return { valid: true, checkedCount: vouchers.length };
  }
}
