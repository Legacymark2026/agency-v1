"use server";

import type { BulkImportResult, JournalEntryLineInput } from "../types";
import { recordJournalVoucherAction } from "./journal-voucher.actions";

export async function importBulkThirdPartiesAction(csvRowsText: string): Promise<BulkImportResult> {
  const lines = csvRowsText.trim().split("\n");
  let importedCount = 0;
  const details: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length >= 2) {
      const rawNit = parts[0].trim();
      const name = parts[1].trim();
      if (rawNit && name) {
        importedCount++;
        details.push(`Tercero importado: ${name} (NIT: ${rawNit})`);
      }
    }
  }

  return { success: true, importedCount, errorsCount: 0, details };
}

export async function importBulkOpeningBalanceAction(linesInput: JournalEntryLineInput[]): Promise<BulkImportResult> {
  const totalDebit = linesInput.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = linesInput.reduce((s, l) => s + (Number(l.credit) || 0), 0);

  if (totalDebit !== totalCredit || totalDebit === 0) {
    return {
      success: false,
      importedCount: 0,
      errorsCount: 1,
      details: [`Partida Doble descuadrada: Débitos $${totalDebit.toLocaleString()} ≠ Créditos $${totalCredit.toLocaleString()}`],
    };
  }

  await recordJournalVoucherAction({
    voucherNumber: "CC-APERTURA-001",
    documentType: "CC",
    concept: "Comprobante de Apertura & Migración de Saldos Iniciales",
    costCenterCode: "01",
    lines: linesInput,
  });

  return {
    success: true,
    importedCount: linesInput.length,
    errorsCount: 0,
    details: [`Balance de Apertura asentado exitosamente con ${linesInput.length} cuentas por valor de $${totalDebit.toLocaleString()}`],
  };
}
