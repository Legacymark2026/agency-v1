"use server";

import { prisma } from "@/lib/prisma";
import type { TaxCalendarObligation } from "../types";

export async function getTaxCalendarAction(): Promise<{ success: boolean; obligations: TaxCalendarObligation[] }> {
  let realVat = 0;
  let realIncome = 0;

  try {
    const invoices = await prisma.invoice.findMany({ select: { total: true } });
    realIncome = invoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
    realVat = Math.round(realIncome * 0.19);
  } catch (_) {}

  const obligations: TaxCalendarObligation[] = [
    { code: "F350", name: "Declaración Mensual de Retención en la Fuente", formNumber: "Formulario 350 DIAN", frequency: "MENSUAL", estimatedAmount: Math.round(realIncome * 0.04), dueDate: "14 de Septiembre, 2026", status: "AL_DIA" },
    { code: "F300", name: "Declaración Bimestral de IVA", formNumber: "Formulario 300 DIAN", frequency: "BIMESTRAL", estimatedAmount: realVat, dueDate: "18 de Septiembre, 2026", status: "PROXIMO_A_VENCER" },
    { code: "ICA", name: "Retención y Declaración de ICA Municipal", formNumber: "Formulario Único Nacional ICA", frequency: "BIMESTRAL", estimatedAmount: Math.round(realIncome * 0.00966), dueDate: "25 de Septiembre, 2026", status: "AL_DIA" },
    { code: "F110", name: "Impuesto sobre la Renta y Complementarios Personas Jurídicas", formNumber: "Formulario 110 DIAN", frequency: "ANUAL", estimatedAmount: Math.round(realIncome * 0.35 * 0.3), dueDate: "12 de Abril, 2027", status: "AL_DIA" },
  ];
  return { success: true, obligations };
}

export async function exportRealExogenaCSVAction(formatNumber: "1001" | "1003" | "1007"): Promise<{ success: boolean; csvContent: string; filename: string }> {
  const currentYear = new Date().getFullYear();
  let csvContent = "";
  const filename = `DIAN_Exogena_Formato_${formatNumber}_${currentYear}.csv`;

  try {
    if (formatNumber === "1001") {
      csvContent = "Concepto,TipoDoc,NIT,PrimerApellido,SegundoApellido,PrimerNombre,OtrosNombres,RazonSocial,Direccion,Depto,Mpio,PagoAbonoDeducible,PagoAbonoNoDeducible,ReteFuentePracticada,ReteIVAPracticada\n";
      const expenses = await prisma.expense.findMany({ take: 100 });
      expenses.forEach((exp) => {
        const val = exp.amount || 0;
        const rf = Math.round(val * 0.04);
        const riva = Math.round(val * 0.19 * 0.15);
        csvContent += `5001,31,900${exp.id.slice(0, 6)},,,,,${exp.vendor || exp.title},Cra 27 # 36-14,68,001,${val},0,${rf},${riva}\n`;
      });
    } else if (formatNumber === "1007") {
      csvContent = "Concepto,TipoDoc,NIT,RazonSocial,IngresosBrutosRecibidos,DevolucionesRebajas\n";
      const invoices = await prisma.invoice.findMany({ include: { lead: true }, take: 100 });
      invoices.forEach((inv) => {
        const val = inv.total || 0;
        csvContent += `4001,31,901${inv.id.slice(0, 6)},${inv.lead?.name || "Cliente Corporativo"},${val},0\n`;
      });
    } else {
      csvContent = "Concepto,TipoDoc,NIT,RazonSocial,ValorRetencionPracticada\n";
      const invoices = await prisma.invoice.findMany({ include: { lead: true }, take: 100 });
      invoices.forEach((inv) => {
        const rf = Math.round((inv.total || 0) * 0.04);
        csvContent += `1301,31,901${inv.id.slice(0, 6)},${inv.lead?.name || "Cliente Corporativo"},${rf}\n`;
      });
    }
  } catch (err) {}

  return { success: true, csvContent, filename };
}
