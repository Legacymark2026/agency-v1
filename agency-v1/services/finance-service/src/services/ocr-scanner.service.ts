/**
 * Intelligent OCR Invoice Scanner — Gemini Vision + Regex Fallback
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracts financial data from Colombian invoice images and PDFs using
 * Google Gemini 2.0 Flash multimodal capabilities.
 *
 * Falls back to regex-based extraction if Gemini is unavailable.
 *
 * Extracted fields:
 *  - Vendor NIT, name, address
 *  - Invoice number, date
 *  - Line items (description, quantity, unit price)
 *  - Subtotal, IVA, ReteFuente, ReteIVA, ReteICA, Total
 */

import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OCRExtractedInvoice {
  vendorNit: string;
  vendorName: string;
  vendorAddress?: string;
  vendorCity?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  reteFuenteAmount: number;
  reteIvaAmount: number;
  reteIcaAmount: number;
  totalAmount: number;
  currency: string;
}

export interface OCRScanResult {
  expenseId: string;
  vendorName: string;
  vendorNit: string;
  invoiceNumber?: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  category: string;
  confidenceScore: number;
  extractionMethod: "GEMINI_VISION" | "REGEX_FALLBACK";
  rawExtraction?: OCRExtractedInvoice;
}

// ── Gemini Vision Extraction ─────────────────────────────────────────────────

const GEMINI_OCR_PROMPT = `Eres un experto en facturación electrónica colombiana (DIAN).
Analiza esta imagen de factura o documento soporte y extrae los datos en formato JSON estricto.

Responde SOLO con un objeto JSON válido (sin markdown ni explicaciones):
{
  "vendorNit": "string — NIT/RUT del proveedor con dígito de verificación",
  "vendorName": "string — Razón social del proveedor",
  "vendorAddress": "string o null",
  "vendorCity": "string o null",
  "invoiceNumber": "string — Número de la factura (ej: FEV-001234)",
  "invoiceDate": "string — Fecha en formato YYYY-MM-DD",
  "items": [
    {
      "description": "string",
      "quantity": 0,
      "unitPrice": 0,
      "totalPrice": 0
    }
  ],
  "subtotal": 0,
  "ivaRate": 0.19,
  "ivaAmount": 0,
  "reteFuenteAmount": 0,
  "reteIvaAmount": 0,
  "reteIcaAmount": 0,
  "totalAmount": 0,
  "currency": "COP"
}

Si no puedes identificar un campo, usa null o 0 según corresponda.
Los montos deben ser numéricos sin formato (sin puntos de miles).`;

/**
 * Extracts invoice data from an image using Google Gemini Vision.
 */
async function extractWithGeminiVision(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{ data: OCRExtractedInvoice | null; confidence: number }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.warn("[OCR] GEMINI_API_KEY not configured — falling back to regex.");
    return { data: null, confidence: 0 };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
                { text: GEMINI_OCR_PROMPT },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`[OCR] Gemini API error: ${response.status} ${response.statusText}`);
      return { data: null, confidence: 0 };
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return { data: null, confidence: 0 };
    }

    // Parse JSON response — handle potential markdown wrapper
    const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed: OCRExtractedInvoice = JSON.parse(cleanJson);

    // Calculate confidence based on field completeness
    let filledFields = 0;
    const totalFields = 7;
    if (parsed.vendorNit && parsed.vendorNit !== "null") filledFields++;
    if (parsed.vendorName && parsed.vendorName !== "null") filledFields++;
    if (parsed.invoiceNumber) filledFields++;
    if (parsed.subtotal > 0) filledFields++;
    if (parsed.ivaAmount >= 0) filledFields++;
    if (parsed.totalAmount > 0) filledFields++;
    if (parsed.items?.length > 0) filledFields++;

    const confidence = Math.round((filledFields / totalFields) * 100) / 100;

    return { data: parsed, confidence };
  } catch (err) {
    console.error("[OCR] Gemini Vision extraction error:", err);
    return { data: null, confidence: 0 };
  }
}

// ── Regex Fallback Extraction ────────────────────────────────────────────────

/**
 * Falls back to regex-based extraction when Gemini is unavailable.
 */
function extractWithRegex(rawText: string): { data: OCRExtractedInvoice; confidence: number } {
  const text = rawText.toUpperCase();

  // NIT / RUT pattern
  const nitMatch = text.match(/(?:NIT|RUT|RFC)\s*[:#.]?\s*([\d.-]{8,15})/i);
  const vendorNit = nitMatch ? nitMatch[1].trim() : "000.000.000-0";

  // Total amount
  const totalMatch = text.match(
    /(?:TOTAL\s*A\s*PAGAR|VALOR\s*TOTAL|GRAN\s*TOTAL|TOTAL)\s*[:$]?\s*([\d.,\s]+)/i
  );
  let totalAmount = 0;
  if (totalMatch) {
    const rawVal = totalMatch[1].replace(/[^\d]/g, "");
    if (rawVal) totalAmount = parseFloat(rawVal);
  }

  // IVA / Tax
  const taxMatch = text.match(/(?:IVA|IMPUESTO|TAX)\s*[:$]?\s*([\d.,\s]+)/i);
  let ivaAmount = Math.round(totalAmount * 0.19 / 1.19); // Estimate if not found
  if (taxMatch) {
    const rawTax = taxMatch[1].replace(/[^\d]/g, "");
    if (rawTax) ivaAmount = parseFloat(rawTax);
  }

  const subtotal = totalAmount - ivaAmount;

  // Vendor name — usually first meaningful line
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const vendorName = lines[0] || "PROVEEDOR NO IDENTIFICADO";

  // Invoice number
  const invMatch = text.match(/(?:FACTURA|FAC|FEV|INVOICE)\s*(?:N[O°]?\.?)?\s*[:.]?\s*([A-Z0-9-]+)/i);
  const invoiceNumber = invMatch ? invMatch[1].trim() : undefined;

  const data: OCRExtractedInvoice = {
    vendorNit,
    vendorName,
    invoiceNumber,
    items: [],
    subtotal,
    ivaRate: 0.19,
    ivaAmount,
    reteFuenteAmount: 0,
    reteIvaAmount: 0,
    reteIcaAmount: 0,
    totalAmount,
    currency: "COP",
  };

  // Confidence is lower for regex extraction
  let confidence = 0.3;
  if (nitMatch) confidence += 0.15;
  if (totalMatch) confidence += 0.2;
  if (taxMatch) confidence += 0.1;
  if (invMatch) confidence += 0.1;

  return { data, confidence: Math.round(confidence * 100) / 100 };
}

// ── Main Processor ───────────────────────────────────────────────────────────

/**
 * Processes an invoice image or text for OCR extraction.
 * Uses Gemini Vision if available, regex fallback otherwise.
 */
export async function processInvoiceOCR(params: {
  companyId: string;
  /** Base64-encoded image data (for Gemini Vision) */
  imageBase64?: string;
  /** MIME type of the image */
  mimeType?: string;
  /** Raw text content (for regex fallback or plain-text invoices) */
  rawTextContent?: string;
  /** URL of the uploaded file for reference */
  fileUrl?: string;
}): Promise<OCRScanResult> {
  let extractionMethod: "GEMINI_VISION" | "REGEX_FALLBACK" = "REGEX_FALLBACK";
  let extractedData: OCRExtractedInvoice | null = null;
  let confidence = 0;

  // Strategy 1: Gemini Vision (preferred)
  if (params.imageBase64) {
    const geminiResult = await extractWithGeminiVision(
      params.imageBase64,
      params.mimeType || "image/jpeg"
    );
    if (geminiResult.data && geminiResult.confidence > 0.4) {
      extractedData = geminiResult.data;
      confidence = geminiResult.confidence;
      extractionMethod = "GEMINI_VISION";
    }
  }

  // Strategy 2: Regex fallback
  if (!extractedData && params.rawTextContent) {
    const regexResult = extractWithRegex(params.rawTextContent);
    extractedData = regexResult.data;
    confidence = regexResult.confidence;
    extractionMethod = "REGEX_FALLBACK";
  }

  // Default if nothing worked
  if (!extractedData) {
    extractedData = {
      vendorNit: "000.000.000-0",
      vendorName: "PROVEEDOR NO IDENTIFICADO",
      items: [],
      subtotal: 0,
      ivaRate: 0.19,
      ivaAmount: 0,
      reteFuenteAmount: 0,
      reteIvaAmount: 0,
      reteIcaAmount: 0,
      totalAmount: 0,
      currency: "COP",
    };
    confidence = 0;
  }

  // Persist as expense in database
  let expenseId = `exp_ocr_${Date.now()}`;
  try {
    const company = await prisma.company.findFirst({
      where: { id: params.companyId },
      select: { id: true },
    });

    if (company) {
      // Find or use a default user for the created_by_id requirement
      const systemUser = await prisma.user.findFirst({
        where: { role: "admin" },
        select: { id: true },
      });

      if (systemUser) {
        const expense = await prisma.expense.create({
          data: {
            title: `Factura OCR: ${extractedData.vendorName}`,
            description: [
              `Procesada por ${extractionMethod}.`,
              `NIT: ${extractedData.vendorNit}`,
              extractedData.invoiceNumber ? `Factura: ${extractedData.invoiceNumber}` : null,
              `Confianza: ${Math.round(confidence * 100)}%`,
            ]
              .filter(Boolean)
              .join(" | "),
            amount: extractedData.totalAmount,
            category: "OPERACIONAL",
            date: new Date(),
            vendor: extractedData.vendorName,
            companyId: params.companyId,
            createdById: systemUser.id,
            receiptUrl: params.fileUrl,
          },
        });
        expenseId = expense.id;
      }
    }
  } catch (err) {
    console.error("[OCR] Failed to persist expense:", err);
  }

  return {
    expenseId,
    vendorName: extractedData.vendorName,
    vendorNit: extractedData.vendorNit,
    invoiceNumber: extractedData.invoiceNumber,
    subtotalAmount: extractedData.subtotal,
    taxAmount: extractedData.ivaAmount,
    totalAmount: extractedData.totalAmount,
    category: "OPERACIONAL",
    confidenceScore: confidence,
    extractionMethod,
    rawExtraction: extractedData,
  };
}
