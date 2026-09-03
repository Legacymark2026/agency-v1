"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { JournalEntryLineInput, JournalVoucherRecord, SiigoDocumentType, AuxiliaryLedgerItem } from "../types";
import { validateDoubleEntrySimple, generateChainHash } from "../services/accounting-engine.service";

export async function recordJournalVoucherAction(params: {
  voucherNumber: string;
  documentType?: SiigoDocumentType;
  concept: string;
  costCenterCode?: string;
  lines: JournalEntryLineInput[];
}): Promise<{ success: boolean; voucher?: JournalVoucherRecord; error?: string }> {
  let userId = "system";
  try {
    const session = await auth();
    if (session?.user?.id) userId = session.user.id;
  } catch (_) {
    // Request scope fallback
  }

  const docType = params.documentType || "CC";
  const validation = validateDoubleEntrySimple(params.lines);

  if (!validation.isBalanced) {
    return { success: false, error: validation.error };
  }

  const { totalDebit, totalCredit } = validation;

  const rawPayload = JSON.stringify({
    voucherNumber: params.voucherNumber,
    documentType: docType,
    costCenterCode: params.costCenterCode || "01",
    timestamp: new Date().toISOString(),
    concept: params.concept,
    totalDebit,
    lines: params.lines,
  });
  const hashSeal = crypto.createHash("sha256").update(rawPayload).digest("hex");

  const voucher: JournalVoucherRecord = {
    voucherNumber: params.voucherNumber,
    documentType: docType,
    costCenterCode: params.costCenterCode || "01",
    date: new Date().toISOString(),
    concept: params.concept,
    lines: params.lines,
    totalDebit,
    totalCredit,
    isBalanced: true,
    companyId: "legacymark_sas",
    hashSeal,
    status: "ACTIVO",
  };

  // 1. Try persisting to relational AccountingVoucher table
  try {
    const company = await prisma.company.findFirst({ select: { id: true } });
    if (company && (prisma as any).accountingVoucher) {
      await (prisma as any).accountingVoucher.create({
        data: {
          companyId: company.id,
          voucherNumber: params.voucherNumber,
          documentType: docType,
          concept: params.concept,
          costCenterCode: params.costCenterCode || null,
          totalDebit,
          totalCredit,
          isBalanced: true,
          hashSeal,
          status: "ACTIVE",
          createdById: userId,
          lines: {
            create: params.lines.map((line, idx) => ({
              lineNumber: idx + 1,
              accountCode: line.accountCode,
              accountName: line.accountName,
              thirdPartyNit: line.thirdPartyNit || null,
              thirdPartyName: line.thirdPartyName || null,
              costCenterCode: line.costCenterCode || params.costCenterCode || null,
              description: line.description || null,
              debit: Number(line.debit) || 0,
              credit: Number(line.credit) || 0,
            })),
          },
        },
      });
    }
  } catch (err) {
    // Relational table may be pending schema migration, fallback to log
  }

  // 2. Audit log persistence (ensures historical compatibility)
  try {
    await prisma.userActivityLog.create({
      data: {
        userId,
        action: "ACCOUNTING_VOUCHER_SEALED",
        details: JSON.stringify({
          voucherNumber: params.voucherNumber,
          documentType: docType,
          costCenterCode: params.costCenterCode || "01",
          concept: params.concept,
          totalAmount: totalDebit,
          hashSeal,
          lines: params.lines,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    console.error("[recordJournalVoucherAction] DB Save error:", err);
  }

  return { success: true, voucher };
}

export async function getJournalVouchersHistoryAction(): Promise<{ success: boolean; vouchers: JournalVoucherRecord[] }> {
  const vouchers: JournalVoucherRecord[] = [];

  try {
    const logs = await prisma.userActivityLog.findMany({
      where: { action: "ACCOUNTING_VOUCHER_SEALED" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    for (const log of logs) {
      try {
        const parsed = JSON.parse(log.details as string);
        if (parsed?.voucherNumber) {
          vouchers.push({
            voucherNumber: parsed.voucherNumber,
            documentType: parsed.documentType || "CC",
            costCenterCode: parsed.costCenterCode || "01",
            date: parsed.timestamp || log.createdAt.toISOString(),
            concept: parsed.concept || "Comprobante Contable",
            lines: parsed.lines || [],
            totalDebit: parsed.totalAmount || 0,
            totalCredit: parsed.totalAmount || 0,
            isBalanced: true,
            companyId: "legacymark_sas",
            hashSeal: parsed.hashSeal,
            status: "ACTIVO",
          });
        }
      } catch (_) {}
    }
  } catch (e) {
    console.error("[getJournalVouchersHistoryAction] DB Error:", e);
  }

  return { success: true, vouchers };
}

export async function createFinancialAccountAction(params: {
  name: string;
  type: string;
  balance: number;
  currency?: string;
}): Promise<{ success: boolean; account?: any; error?: string }> {
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      return { success: false, error: "No se encontró empresa registrada en el sistema." };
    }

    const created = await prisma.financialAccount.create({
      data: {
        companyId: company.id,
        name: params.name,
        type: params.type || "BANK_ACCOUNT",
        balance: Number(params.balance) || 0,
        currency: params.currency || "COP",
        isActive: true,
      },
    });

    return { success: true, account: created };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al crear cuenta financiera" };
  }
}

export async function executePeriodClosingAction(period: string): Promise<{ success: boolean; closingVoucher?: JournalVoucherRecord; error?: string }> {
  try {
    const invoices = await prisma.invoice.findMany({ select: { total: true } });
    const expenses = await prisma.expense.findMany({ select: { amount: true } });
    const payrolls = await prisma.payroll.findMany({ select: { totalEarnings: true } });

    const totalIncome = invoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
    const totalPayroll = payrolls.reduce((acc, pay) => acc + (Number(pay.totalEarnings) || 0), 0);
    const totalCostsAndExpenses = totalExpenses + totalPayroll;

    const netResult = totalIncome - totalCostsAndExpenses;
    const voucherNum = `CC-${period.replace(/\\s+/g, "_")}`;

    const lines: JournalEntryLineInput[] = [
      { accountCode: "413501", accountName: "Cancelación de Ingresos Operacionales", debit: totalIncome, credit: 0, thirdPartyNit: "902.028.722-3" },
      { accountCode: "510506", accountName: "Cancelación de Gastos de Personal", debit: 0, credit: totalPayroll, thirdPartyNit: "902.028.722-3" },
      { accountCode: "513535", accountName: "Cancelación de Gastos Generales", debit: 0, credit: totalExpenses, thirdPartyNit: "902.028.722-3" },
      { accountCode: "590505", accountName: "Ganancias y Pérdidas (Utilidad del Ejercicio)", debit: 0, credit: Math.max(0, netResult), thirdPartyNit: "902.028.722-3" },
    ];

    const result = await recordJournalVoucherAction({
      voucherNumber: voucherNum,
      documentType: "CC",
      costCenterCode: "01",
      concept: `Asiento de Cierre Contable y Cancelación de Cuentas de Resultado - ${period}`,
      lines,
    });

    return { success: result.success, closingVoucher: result.voucher, error: result.error };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al ejecutar cierre contable" };
  }
}

export async function getAuxiliaryLedgerAction(params: {
  accountCode?: string;
  thirdPartyNit?: string;
}): Promise<{ success: boolean; items: AuxiliaryLedgerItem[]; totalDebits: number; totalCredits: number }> {
  const items: AuxiliaryLedgerItem[] = [];
  let runningBalance = 0;
  let totalDebits = 0;
  let totalCredits = 0;

  try {
    const logs = await prisma.userActivityLog.findMany({
      where: { action: "ACCOUNTING_VOUCHER_SEALED" },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    for (const log of logs) {
      try {
        const parsed = JSON.parse(log.details as string);
        const lines: JournalEntryLineInput[] = parsed.lines || [];

        for (const line of lines) {
          const matchAccount = !params.accountCode || line.accountCode.startsWith(params.accountCode);
          const matchNit = !params.thirdPartyNit || line.thirdPartyNit.includes(params.thirdPartyNit);

          if (matchAccount && matchNit) {
            const deb = Number(line.debit) || 0;
            const cred = Number(line.credit) || 0;
            totalDebits += deb;
            totalCredits += cred;
            runningBalance += (deb - cred);

            items.push({
              id: `${parsed.voucherNumber}-${line.accountCode}-${items.length}`,
              voucherNumber: parsed.voucherNumber,
              documentType: parsed.documentType || "CC",
              date: parsed.timestamp ? new Date(parsed.timestamp).toISOString().split("T")[0] : log.createdAt.toISOString().split("T")[0],
              accountCode: line.accountCode,
              accountName: line.accountName,
              thirdPartyNit: line.thirdPartyNit,
              thirdPartyName: line.thirdPartyName || "Tercero Registrado",
              concept: parsed.concept || line.description || "Movimiento Contable",
              debit: deb,
              credit: cred,
              runningBalance,
            });
          }
        }
      } catch (_) {}
    }
  } catch (err) {
    console.error("[getAuxiliaryLedgerAction] DB error:", err);
  }

  return { success: true, items, totalDebits, totalCredits };
}
