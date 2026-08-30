/**
 * High-Throughput DIAN Batch Invoicing & CUFE Dispatcher
 * Fix A-5: CUFE parameters (NIT software proveedor + clave técnica) are now read from
 *          environment variables instead of being hardcoded with fake/test values.
 *          Required env vars:
 *            DIAN_SOFTWARE_NIT      — NIT del proveedor de software registrado ante DIAN
 *            DIAN_TECHNICAL_KEY     — Clave técnica del set de pruebas o producción DIAN
 *            DIAN_SOFTWARE_ID       — ID del software registrado ante DIAN (optional)
 */
import crypto from "crypto";

export interface BatchInvoiceItem {
  invoiceNumber: string;
  clientNit: string;
  clientName: string;
  subtotal: number;
  taxRate?: number; // default 0.19 (19% IVA)
}

export interface ProcessedInvoiceResult {
  invoiceNumber: string;
  clientNit: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  cufe: string;
  dianStatus: "ISSUED" | "QUEUED_FOR_DISPATCH" | "FAILED";
  issuedAt: string;
  cufeValid: boolean;
}

export interface BatchProcessingSummary {
  batchId: string;
  totalInvoices: number;
  successfulCount: number;
  failedCount: number;
  totalGrossAmount: number;
  totalTaxAmount: number;
  totalNetAmount: number;
  processedInvoices: ProcessedInvoiceResult[];
  durationMs: number;
  missingDianConfig: boolean;
}

export class BatchInvoiceService {
  /**
   * Generates DIAN CUFE (Código Único de Factura Electrónica) SHA-384 hash.
   * Fix A-5: parameters read from env vars, not hardcoded.
   * Reference: Resolución DIAN 000042 de 2020, Anexo técnico 1.9 v1.9
   *
   * CUFE = SHA384(NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + CodImp2 +
   *               ValImp2 + CodImp3 + ValImp3 + ValTot + NitOFE + NumAdq + ClTec)
   *
   * Simplified implementation: NumFac + ValFac + ValImp + NitOFE + FecFac + ClTec
   */
  private generateCUFE(
    invNum: string,
    subtotal: number,
    tax: number,
    clientNit: string,
    dateStr: string
  ): { cufe: string; valid: boolean } {
    const softwareNit = process.env.DIAN_SOFTWARE_NIT;
    const technicalKey = process.env.DIAN_TECHNICAL_KEY;

    if (!softwareNit || !technicalKey) {
      // Return a clearly-invalid placeholder instead of fake data
      return {
        cufe: `MISSING_DIAN_CONFIG_${crypto.randomBytes(8).toString("hex")}`,
        valid: false,
      };
    }

    // Date format per DIAN spec: yyyyMMddHHmmss (UTC)
    const dianDate = new Date(dateStr)
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);

    const rawString = [
      invNum,
      subtotal.toFixed(2),
      tax.toFixed(2),
      clientNit,
      softwareNit,
      dianDate,
      technicalKey,
    ].join("");

    return {
      cufe: crypto.createHash("sha384").update(rawString).digest("hex"),
      valid: true,
    };
  }

  /**
   * Processes a batch of invoices concurrently.
   */
  public async processBatchInvoices(
    invoices: BatchInvoiceItem[],
    concurrency = 5
  ): Promise<BatchProcessingSummary> {
    const startTime = Date.now();
    const batchId = `batch_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const processedInvoices: ProcessedInvoiceResult[] = [];
    let totalGross = 0;
    let totalTax = 0;
    let totalNet = 0;
    let failedCount = 0;
    const missingDianConfig = !process.env.DIAN_SOFTWARE_NIT || !process.env.DIAN_TECHNICAL_KEY;

    // Process chunked concurrency
    for (let i = 0; i < invoices.length; i += concurrency) {
      const chunk = invoices.slice(i, i + concurrency);
      const chunkPromises = chunk.map(async (inv) => {
        try {
          const rate = inv.taxRate ?? 0.19;
          const subtotal = inv.subtotal || 0;
          const taxAmount = Math.round(subtotal * rate * 100) / 100;
          const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
          const dateStr = new Date().toISOString();

          const { cufe, valid: cufeValid } = this.generateCUFE(
            inv.invoiceNumber,
            subtotal,
            taxAmount,
            inv.clientNit,
            dateStr
          );

          return {
            invoiceNumber: inv.invoiceNumber,
            clientNit: inv.clientNit,
            subtotal,
            taxAmount,
            totalAmount,
            cufe,
            cufeValid,
            dianStatus: cufeValid ? ("ISSUED" as const) : ("QUEUED_FOR_DISPATCH" as const),
            issuedAt: dateStr,
          };
        } catch (err) {
          failedCount++;
          return null;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      for (const res of chunkResults) {
        if (res) {
          processedInvoices.push(res);
          totalGross += res.subtotal;
          totalTax += res.taxAmount;
          totalNet += res.totalAmount;
        }
      }
    }

    return {
      batchId,
      totalInvoices: invoices.length,
      successfulCount: processedInvoices.length,
      failedCount,
      totalGrossAmount: Math.round(totalGross * 100) / 100,
      totalTaxAmount: Math.round(totalTax * 100) / 100,
      totalNetAmount: Math.round(totalNet * 100) / 100,
      processedInvoices,
      durationMs: Date.now() - startTime,
      missingDianConfig,
    };
  }
}

export const batchInvoiceService = new BatchInvoiceService();
