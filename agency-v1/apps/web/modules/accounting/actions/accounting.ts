"use server";

import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  JournalEntryLineInput,
  JournalVoucherRecord,
  WithholdingCalculationInput,
  WithholdingCalculationResult,
} from "../types";

export async function calculateWithholdingsAction(
  input: WithholdingCalculationInput
): Promise<WithholdingCalculationResult> {
  const subtotal = input.subtotal || 0;
  const vatRate = input.vatRate ?? 0.19;
  const vatAmount = Math.round(subtotal * vatRate);

  let reteFuenteRate = 0.025; // 2.5% for general purchases
  if (input.transactionType === "SERVICIOS") reteFuenteRate = 0.04; // 4%
  if (input.transactionType === "HONORARIOS") reteFuenteRate = 0.10; // 10%

  const reteFuenteAmount = Math.round(subtotal * reteFuenteRate);
  const reteIvaRate = input.applyReteIVA ? 0.15 : 0;
  const reteIvaAmount = input.applyReteIVA ? Math.round(vatAmount * 0.15) : 0;
  const reteIcaRate = (input.reteIcaRatePerMil ?? 9.66) / 1000;
  const reteIcaAmount = Math.round(subtotal * reteIcaRate);

  const totalWithholdings = reteFuenteAmount + reteIvaAmount + reteIcaAmount;
  const netPayable = subtotal + vatAmount - totalWithholdings;

  return {
    subtotal,
    vatAmount,
    reteFuenteRate,
    reteFuenteAmount,
    reteIvaRate,
    reteIvaAmount,
    reteIcaRate,
    reteIcaAmount,
    totalWithholdings,
    netPayable,
  };
}

export async function recordJournalVoucherAction(params: {
  voucherNumber: string;
  concept: string;
  lines: JournalEntryLineInput[];
}): Promise<{ success: boolean; voucher?: JournalVoucherRecord; error?: string }> {
  let userId = "system";
  try {
    const session = await auth();
    if (session?.user?.id) userId = session.user.id;
  } catch (_) {
    // Request scope fallback
  }

  const totalDebit = params.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = params.lines.reduce((s, l) => s + (l.credit || 0), 0);

  if (totalDebit !== totalCredit) {
    return {
      success: false,
      error: `Asiento desbalanceado. Débitos: $${totalDebit.toLocaleString()} != Créditos: $${totalCredit.toLocaleString()}`,
    };
  }

  const voucher: JournalVoucherRecord = {
    voucherNumber: params.voucherNumber,
    date: new Date().toISOString(),
    concept: params.concept,
    lines: params.lines,
    totalDebit,
    totalCredit,
    isBalanced: true,
    companyId: "legacymark_sas",
  };

  // Real audit log write to PostgreSQL
  await audit({
    action: "invoice.create",
    outcome: "success",
    details: {
      action: "ACCOUNTING_VOUCHER_RECORDED",
      voucherNumber: params.voucherNumber,
      totalAmount: totalDebit,
      userId,
    },
  });

  return {
    success: true,
    voucher,
  };
}
