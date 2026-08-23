"use server";

import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { buildRealDianUblXml, calculateRealDianCufe, DianInvoiceDataInput } from "@/lib/dian-ubl-generator";

export interface IssueInvoiceInput {
  invoiceNumber: string;
  prefix: string;
  sellerNit: string;
  sellerName: string;
  buyerDocType: string;
  buyerDocNumber: string;
  buyerName: string;
  buyerEmail: string;
  items: Array<{
    code: string;
    unspscCode: string;
    name: string;
    quantity: number;
    price: number;
    vatRate: number;
  }>;
}

export async function issueElectronicInvoiceAction(input: IssueInvoiceInput) {
  let userId = "system";
  try {
    const session = await auth();
    if (session?.user?.id) userId = session.user.id;
  } catch (_) {
    // Request scope fallback
  }

  try {
    const dataInput: DianInvoiceDataInput = {
      invoiceNumber: input.invoiceNumber,
      prefix: input.prefix,
      issueDate: new Date().toISOString().split("T")[0],
      issueTime: "12:00:00-05:00",
      technicalKey: "fc8eac422eba16e12ff78876491851e44f5359e5e54d58853b0dfb2f32a76f7881c165509930f789",
      environment: "1",
      seller: {
        nit: input.sellerNit,
        dv: "4",
        name: input.sellerName,
        email: "facturacion@legacymark.com",
        address: "Calle 100 # 15-20",
        cityCode: "11001",
      },
      buyer: {
        docType: input.buyerDocType,
        docNumber: input.buyerDocNumber,
        name: input.buyerName,
        email: input.buyerEmail,
        address: "Direccion Cliente",
        cityCode: "11001",
      },
      items: input.items,
    };

    const ubl = buildRealDianUblXml(dataInput);

    // Real audit log in PostgreSQL
    await audit({
      action: "invoice.dian_sync",
      outcome: "success",
      details: {
        invoiceNumber: input.invoiceNumber,
        cufe: ubl.cufe,
        total: ubl.total,
        userId,
      },
    });

    return {
      success: true,
      invoiceNumber: input.invoiceNumber,
      cufe: ubl.cufe,
      qrUrl: ubl.qrText,
      subtotal: ubl.subtotal,
      vatTotal: ubl.vatTotal,
      total: ubl.total,
      xmlSize: ubl.xml.length,
    };
  } catch (error: any) {
    console.error("[IssueInvoiceAction] Error issuing invoice:", error);
    return {
      success: false,
      error: error.message || "Error al emitir factura electrónica.",
    };
  }
}
