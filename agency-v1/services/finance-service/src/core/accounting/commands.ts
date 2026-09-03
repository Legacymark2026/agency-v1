/**
 * CQRS Command Handlers — Write Side (Event Sourcing Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 * All state mutations in the ledger pass through these command handlers.
 * Guarantees Partida Doble, inmutabilidad, encadenamiento de hash y Transactional Outbox.
 */
import { prisma } from "@agency/database";
import { computeVoucherHashSeal, GENESIS_ACCOUNTING_HASH } from "./hash-chain";
import { eventBus } from "../../lib/event-bus.singleton";

export interface CreateVoucherDTO {
  companyId: string;
  documentType: string; // INGRESO, EGRESO, FACTURA_VENTA, NOMINA, NOTA_CONTABLE
  date: string;
  concept: string;
  costCenterCode?: string;
  sourceInvoiceId?: string;
  sourceExpenseId?: string;
  lines: Array<{
    accountCode: string;
    accountName: string;
    thirdPartyNit?: string;
    thirdPartyName?: string;
    debit: number;
    credit: number;
    description?: string;
    costCenterCode?: string;
  }>;
}

export class AccountingCommandService {
  /**
   * Creates a journal voucher with strict double-entry validation,
   * hash chaining, and Transactional Outbox atomic persistence.
   */
  public static async createJournalVoucher(dto: CreateVoucherDTO) {
    if (!dto.lines || dto.lines.length < 2) {
      throw new Error("El comprobante contable debe contener al menos dos líneas.");
    }

    // 1. Validar Partida Doble (Invariante NIIF / Decreto 2650)
    const totalDebit = dto.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Desbalance en partida doble: Débitos ($${totalDebit.toFixed(2)}) no coinciden con Créditos ($${totalCredit.toFixed(2)})`
      );
    }

    // 2. Obtener el hash del último comprobante para encadenamiento (Blockchain Trail)
    const lastVoucher = await (prisma as any).accountingVoucher.findFirst({
      where: { companyId: dto.companyId },
      orderBy: { createdAt: "desc" },
      select: { hashSeal: true, voucherNumber: true },
    });

    const previousHash = lastVoucher?.hashSeal || GENESIS_ACCOUNTING_HASH;
    const nextSeq = lastVoucher
      ? parseInt(lastVoucher.voucherNumber.replace(/\D/g, "") || "0", 10) + 1
      : 1;
    const voucherNumber = `CC-${String(nextSeq).padStart(6, "0")}`;

    // 3. Calcular sello criptográfico SHA-256
    const hashSeal = computeVoucherHashSeal({
      previousHash,
      companyId: dto.companyId,
      voucherNumber,
      date: dto.date,
      totalDebit,
      totalCredit,
      lines: dto.lines,
    });

    // 4. Persistencia Atómica con Transactional Outbox Pattern
    const outboxId = `outbox_acc_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const [createdVoucher] = await prisma.$transaction([
      (prisma as any).accountingVoucher.create({
        data: {
          companyId: dto.companyId,
          voucherNumber,
          documentType: dto.documentType,
          date: new Date(dto.date),
          concept: dto.concept,
          totalDebit,
          totalCredit,
          costCenterCode: dto.costCenterCode,
          sourceInvoiceId: dto.sourceInvoiceId,
          sourceExpenseId: dto.sourceExpenseId,
          hashSeal,
          previousHash,
          status: "ASENTADO",
          lines: {
            create: dto.lines.map((l, index) => ({
              lineNumber: index + 1,
              accountCode: l.accountCode,
              accountName: l.accountName,
              thirdPartyNit: l.thirdPartyNit,
              thirdPartyName: l.thirdPartyName,
              costCenterCode: l.costCenterCode || dto.costCenterCode,
              description: l.description || dto.concept,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
            })),
          },
        },
        include: { lines: true },
      }),
      (prisma as any).paymentOutbox.create({
        data: {
          id: outboxId,
          companyId: dto.companyId,
          aggregateType: "ACCOUNTING_VOUCHER",
          aggregateId: voucherNumber,
          eventType: "accounting.voucher.created",
          payload: {
            voucherNumber,
            companyId: dto.companyId,
            totalDebit,
            totalCredit,
            hashSeal,
            previousHash,
            timestamp: new Date().toISOString(),
          },
          status: "PENDING",
        },
      }),
    ]);

    // 5. Despacho optimista al EventBus
    try {
      await eventBus.publish("accounting.voucher.created", {
        voucherNumber,
        companyId: dto.companyId,
        totalDebit,
        totalCredit,
        hashSeal,
      });
      await (prisma as any).paymentOutbox.update({
        where: { id: outboxId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    } catch (err: any) {
      console.warn(`[Outbox] Falló publicación inmediata de comprobante ${voucherNumber}:`, err.message);
    }

    return createdVoucher;
  }

  /**
   * Reverses an existing journal voucher by creating an exact counter-entry.
   * Prohibits destructive deletion to comply with Art. 50 Código de Comercio and NIIF.
   */
  public static async reverseJournalVoucher(voucherId: string, reason: string) {
    const original = await (prisma as any).accountingVoucher.findUnique({
      where: { id: voucherId },
      include: { lines: true },
    });

    if (!original) throw new Error("Comprobante contable no encontrado");
    if (original.status === "ANULADO") throw new Error("El comprobante ya se encuentra anulado");

    // Generar líneas de contrapartida (invirtiendo débitos y créditos)
    const reversedLines = original.lines.map((l: any) => ({
      accountCode: l.accountCode,
      accountName: l.accountName,
      thirdPartyNit: l.thirdPartyNit,
      thirdPartyName: l.thirdPartyName,
      costCenterCode: l.costCenterCode,
      description: `Anulación de ${original.voucherNumber}: ${reason}`,
      debit: Number(l.credit) || 0,
      credit: Number(l.debit) || 0,
    }));

    // Asentar comprobante de anulación
    const reversalVoucher = await this.createJournalVoucher({
      companyId: original.companyId,
      documentType: "ANULACION",
      date: new Date().toISOString().split("T")[0],
      concept: `Anulación comprobante ${original.voucherNumber} - Motivo: ${reason}`,
      lines: reversedLines,
    });

    // Marcar el original como ANULADO
    await (prisma as any).accountingVoucher.update({
      where: { id: original.id },
      data: { status: "ANULADO" },
    });

    return {
      success: true,
      originalVoucherNumber: original.voucherNumber,
      reversalVoucherNumber: reversalVoucher.voucherNumber,
      reversalVoucher,
    };
  }
}
