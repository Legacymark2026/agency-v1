"use server";

import { prisma } from "@/lib/prisma";
import type { CostCenter, DianResolutionConfig, DocumentoSoporteDSE } from "../types";
import { generateCUDSHash } from "../services/dian-hash.service";

export async function getCostCentersAction(): Promise<CostCenter[]> {
  return [
    { code: "01", name: "01 - Administración & Dirección General", isActive: true },
    { code: "02", name: "02 - Ventas, Mercadeo & Pauta Digital", isActive: true },
    { code: "03", name: "03 - Operaciones & Infraestructura Cloud (TI)", isActive: true },
    { code: "04", name: "04 - Consultoría & Desarrollo de Software", isActive: true },
  ];
}

export async function getDianResolutionsAction(): Promise<{ success: boolean; resolutions: DianResolutionConfig[] }> {
  return {
    success: true,
    resolutions: [
      { id: "RES-FEV", documentType: "FACTURA_ELECTRONICA", prefix: "FEV", resolutionNumber: "18764000001234", resolutionDate: "2026-01-15", validUntilDate: "2028-01-15", fromNumber: 1, toNumber: 5000, currentNumber: 142, technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c", isActive: true },
      { id: "RES-DSE", documentType: "DOCUMENTO_SOPORTE", prefix: "DSE", resolutionNumber: "18764000005678", resolutionDate: "2026-02-01", validUntilDate: "2028-02-01", fromNumber: 1, toNumber: 2000, currentNumber: 28, technicalKey: "9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c", isActive: true },
      { id: "RES-NE", documentType: "NOMINA_ELECTRONICA", prefix: "NIE", resolutionNumber: "18764000009999", resolutionDate: "2026-01-01", validUntilDate: "2028-01-01", fromNumber: 1, toNumber: 10000, currentNumber: 15, technicalKey: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", isActive: true },
    ],
  };
}

export async function generateDocumentoSoporteDSEAction(params: {
  vendorNit: string;
  vendorName: string;
  vendorCity?: string;
  serviceDescription: string;
  subtotal: number;
}): Promise<{ success: boolean; dse: DocumentoSoporteDSE }> {
  const subtotal = Number(params.subtotal) || 0;
  const reteFuente = Math.round(subtotal * 0.04);
  const reteIca = Math.round(subtotal * 0.00966);
  const totalNet = subtotal - reteFuente - reteIca;

  const dseNumber = `DSE-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toISOString();

  const cuds = generateCUDSHash(dseNumber, dateStr, subtotal, reteFuente, params.vendorNit);

  const dse: DocumentoSoporteDSE = {
    dseNumber,
    cuds,
    issueDate: new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }),
    vendorNit: params.vendorNit,
    vendorName: params.vendorName,
    vendorCity: params.vendorCity || "Bucaramanga, Santander",
    serviceDescription: params.serviceDescription,
    subtotal,
    reteFuenteAmount: reteFuente,
    reteIcaAmount: reteIca,
    totalNetToPay: totalNet,
    qrCodeData: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cuds}`,
    dianStatus: "EMITIDO_Y_VALIDADO",
  };

  try {
    await prisma.userActivityLog.create({
      data: {
        userId: "system",
        action: "ACCOUNTING_VOUCHER_SEALED",
        details: JSON.stringify({
          voucherNumber: dseNumber,
          concept: `Documento Soporte Electrónico DSE - ${params.serviceDescription}`,
          totalAmount: subtotal,
          hashSeal: cuds,
          documentType: "DSE",
          timestamp: dateStr,
        }),
      },
    });
  } catch (_) {}

  return { success: true, dse };
}
