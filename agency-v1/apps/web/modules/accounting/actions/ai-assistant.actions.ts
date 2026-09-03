"use server";

import type { JournalEntryLineInput } from "../types";
import { validateDoubleEntrySimple } from "../services/accounting-engine.service";

/**
 * AI-Powered Colombian Accounting Assistant
 * ─────────────────────────────────────────────────────────────────────────────
 * Interprets natural language instructions into Colombian PUC double-entry vouchers.
 * Uses Gemini 2.0 Flash with a structured schema prompt, with regex fallback.
 */

const SYSTEM_PROMPT = `Eres un contador público experto en contabilidad colombiana bajo NIIF y PUC (Decreto 2650).
El usuario te dará una transacción financiera en lenguaje natural.
Tu tarea es convertirla en un comprobante contable con partida doble estricta (Débitos = Créditos).

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura (sin markdown, sin bloques de código):
{
  "concept": "Descripción formal del comprobante",
  "lines": [
    {
      "accountCode": "código PUC de 6 dígitos ej: 512010",
      "accountName": "nombre de la cuenta ej: Arrendamientos de Oficinas",
      "thirdPartyNit": "NIT del tercero o 902028722-3",
      "thirdPartyName": "Nombre del tercero",
      "costCenterCode": "01",
      "description": "Detalle del movimiento",
      "debit": 0,
      "credit": 0
    }
  ]
}

Reglas obligatorias:
1. La suma de todos los "debit" debe ser EXACTAMENTE IGUAL a la suma de todos los "credit".
2. Si la transacción amerita retención en la fuente (honorarios 10%, servicios 4%, compras 2.5%), calcula las líneas correspondientes (cuenta 2365xx) y el saldo neto a bancos/caja (111005 / 110505).
3. Si la transacción incluye IVA, regístralo según corresponda (135517 o 240801).
4. No agregues texto explicativo, solo el JSON.`;

export async function parseNaturalLanguageJournalEntryAction(prompt: string): Promise<{
  success: boolean;
  concept: string;
  lines: JournalEntryLineInput[];
  source?: "AI_GEMINI" | "HEURISTIC";
}> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  // ── Strategy 1: Google Gemini 2.0 Flash AI ──────────────────────────────────
  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${SYSTEM_PROMPT}\n\nTransacción: "${prompt}"` }] }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.ok) {
        const jsonRes = await response.json();
        const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(clean);

          if (parsed.concept && Array.isArray(parsed.lines) && parsed.lines.length >= 2) {
            const lines: JournalEntryLineInput[] = parsed.lines.map((l: any) => ({
              accountCode: String(l.accountCode || "513535"),
              accountName: String(l.accountName || "Servicios Generales"),
              thirdPartyNit: String(l.thirdPartyNit || "900.876.543-1"),
              thirdPartyName: l.thirdPartyName ? String(l.thirdPartyName) : undefined,
              costCenterCode: l.costCenterCode ? String(l.costCenterCode) : "01",
              description: l.description ? String(l.description) : parsed.concept,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
            }));

            // Validate double-entry
            const validation = validateDoubleEntrySimple(lines);
            if (validation.isBalanced) {
              return {
                success: true,
                concept: parsed.concept,
                lines,
                source: "AI_GEMINI",
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn("[parseNaturalLanguageJournalEntryAction] Gemini API fallback:", err);
    }
  }

  // ── Strategy 2: Heuristic Regex Fallback ────────────────────────────────────
  const numbersMatch = prompt.match(/\$?\s*([\d.,]+)/);
  let amount = 3500000;
  if (numbersMatch) {
    const parsed = Number(numbersMatch[1].replace(/[,.]/g, ""));
    if (parsed > 0) amount = parsed;
  }

  let debitCode = "513535";
  let debitName = "Servicios de Computación y Nube (AWS/Hetzner)";
  let creditCode = "111005";
  let creditName = "Bancos Nacionales (Bancolombia Ppal)";
  let concept = prompt;

  const lower = prompt.toLowerCase();
  if (lower.includes("arriendo") || lower.includes("alquiler")) {
    debitCode = "512010";
    debitName = "Arrendamientos de Oficinas y Locales";
    concept = "Causación y Pago de Arrendamiento de Oficinas";
  } else if (lower.includes("publicidad") || lower.includes("meta") || lower.includes("google")) {
    debitCode = "520506";
    debitName = "Publicidad y Propaganda Digital";
    concept = "Pago de Pauta Digital y Campañas de Mercadeo";
  } else if (lower.includes("nómina") || lower.includes("salario") || lower.includes("sueldo")) {
    debitCode = "510506";
    debitName = "Sueldos y Prestaciones de Personal";
    concept = "Liquidación y Pago de Nómina de Empleados";
  } else if (lower.includes("cliente") || lower.includes("factura") || lower.includes("venta")) {
    debitCode = "111005";
    debitName = "Bancos Nacionales (Bancolombia Ppal)";
    creditCode = "130505";
    creditName = "Clientes Nacionales (Recaudo de Cartera)";
    concept = "Recaudo de Factura de Venta de Cliente";
  }

  const lines: JournalEntryLineInput[] = [
    { accountCode: debitCode, accountName: debitName, debit: amount, credit: 0, thirdPartyNit: "900.876.543-1", costCenterCode: "01" },
    { accountCode: creditCode, accountName: creditName, debit: 0, credit: amount, thirdPartyNit: "902.028.722-3", costCenterCode: "01" },
  ];

  return { success: true, concept, lines, source: "HEURISTIC" };
}
