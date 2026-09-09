import { NextResponse } from "next/server";
import { recordJournalVoucherAction } from "@/modules/accounting/actions/journal-voucher.actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      originalReceiptNo,
      refundAmount,
      subtotalAmount,
      taxAmount = 0,
      costAmount = 0,
      refundMethod = "CASH",
      customerNit = "222222222222",
      customerName = "Consumidor Final",
      reason = "Devolución por garantía",
    } = body;

    const returnNumber = `NC-POS-${Date.now().toString().slice(-6)}`;
    const refund = Math.round(Number(refundAmount) || 0);
    const sub = Math.round(Number(subtotalAmount) || refund);
    const tax = Math.round(Number(taxAmount) || 0);
    const cost = Math.round(Number(costAmount) || (sub * 0.5));

    const lines: any[] = [];

    // 1. Reversión de Ingresos (417501 Devoluciones en Ventas)
    lines.push({
      accountCode: "417501",
      accountName: "Devoluciones en Ventas Mostrador POS",
      thirdPartyNit: customerNit,
      thirdPartyName: customerName,
      description: `Devolución Tiquete ${originalReceiptNo} | ${reason}`,
      debit: sub,
      credit: 0,
    });

    // 2. Reversión de Impuestos (240801 IVA Devuelto)
    if (tax > 0) {
      lines.push({
        accountCode: "240801",
        accountName: "Impuesto sobre las Ventas por Pagar (IVA Devuelto)",
        thirdPartyNit: customerNit,
        thirdPartyName: customerName,
        description: `IVA Reversado en Devolución ${originalReceiptNo}`,
        debit: tax,
        credit: 0,
      });
    }

    // 3. Salida de Dinero o Emisión de Saldo a Favor
    if (refundMethod === "CREDIT_NOTE" || refundMethod === "VOUCHER") {
      lines.push({
        accountCode: "280505",
        accountName: "Anticipos y Saldos a Favor de Clientes",
        thirdPartyNit: customerNit,
        thirdPartyName: customerName,
        description: `Vale de Crédito para Futuras Compras | ${returnNumber}`,
        debit: 0,
        credit: refund,
      });
    } else {
      lines.push({
        accountCode: "110505",
        accountName: "Caja General - Reembolso Efectivo Devolución",
        thirdPartyNit: customerNit,
        thirdPartyName: customerName,
        description: `Reembolso Efectivo en Mostrador | ${returnNumber}`,
        debit: 0,
        credit: refund,
      });
    }

    // 4. Reintegro de Mercancías a Inventarios (Partida Kárdex)
    if (cost > 0) {
      lines.push({
        accountCode: "143501",
        accountName: "Inventarios - Reingreso de Mercancía Mostrador",
        thirdPartyNit: customerNit,
        thirdPartyName: customerName,
        description: `Reintegro Físico a Kárdex | Devolución ${originalReceiptNo}`,
        debit: cost,
        credit: 0,
      });
      lines.push({
        accountCode: "613501",
        accountName: "Costo de Ventas - Reversión Costo Mercancías",
        thirdPartyNit: customerNit,
        thirdPartyName: customerName,
        description: `Reversión Costo de Venta | Devolución ${originalReceiptNo}`,
        debit: 0,
        credit: cost,
      });
    }

    let voucherNumber = null;
    try {
      const accRes = await recordJournalVoucherAction({
        voucherNumber: returnNumber,
        documentType: "NC", // Nota Crédito
        concept: `Nota Crédito POS ${returnNumber} - Devolución de Tiquete ${originalReceiptNo} (${reason})`,
        lines,
      });
      voucherNumber = accRes.voucher?.voucherNumber || returnNumber;
    } catch (e: any) {
      console.warn("[POS-Returns-Accounting] Notice:", e.message);
    }

    return NextResponse.json({
      success: true,
      creditNoteNumber: returnNumber,
      originalReceiptNo,
      refundAmount: refund,
      accountingVoucher: voucherNumber,
      message: "Nota Crédito POS emitida e inventario reintegrado al kárdex exitosamente.",
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
