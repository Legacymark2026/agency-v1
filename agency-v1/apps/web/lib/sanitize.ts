/**
 * lib/sanitize.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanitización de inputs para prevenir XSS e inyecciones.
 * 
 * USO:
 *   import { sanitizeHtml, sanitizeInput, LeadSchema } from "@/lib/sanitize";
 *   
 *   const cleaned = sanitizeInput(userInput);
 *   const validated = LeadSchema.parse(data);
 */

import { z } from "zod";

const FORBIDDEN_TAGS = /<\/?(script|iframe|object|embed|form|button|input|select|textarea|label|fieldset|legend|svg|math|style|link|meta|base|canvas)/i;
const FORBIDDEN_ATTRS = /(on\w+|javascript:|data:|vbscript:|expression)/i;
const PROTOCOLS = /^(https?:|mailto:|tel:|ftp:|SMS:?)/i;

export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  
  let clean = dirty
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
  
  if (FORBIDDEN_TAGS.test(clean) || FORBIDDEN_ATTRS.test(clean)) {
    console.warn("[Sanitize] Blocked potentially dangerous HTML");
    return "";
  }
  
  return clean;
}

export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return "";
  
  const cleaned = String(input)
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  
  if (cleaned.length > 10000) {
    return cleaned.slice(0, 10000);
  }
  
  return cleaned;
}

export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  
  const cleaned = email.trim().toLowerCase();
  if (!z.string().email().safeParse(cleaned).success) {
    return null;
  }
  
  return cleaned;
}

export function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/[^\d+\-() ]/g, "");
  
  const validPhone = z.string().regex(/^\+?[\d\s\-()]{7,20}$/).safeParse(cleaned);
  if (!validPhone.success) {
    return null;
  }
  
  return cleaned;
}

export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    if (!PROTOCOLS.test(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

export function sanitizeNumber<T extends number>(num: T, min?: number, max?: number): T | null {
  const valid = z.number().min(min ?? -Infinity).max(max ?? Infinity).safeParse(num);
  return valid.success ? num : null;
}

export const StringInputSchema = z.string()
  .max(500)
  .transform(sanitizeInput)
  .refine(val => val.length > 0, { message: "No puede estar vacío" });

export const EmailInputSchema = z.string()
  .email()
  .max(254)
  .transform(val => val?.toLowerCase().trim())
  .nullable()
  .transform(val => val || null);

export const PhoneInputSchema = z.string()
  .regex(/^\+?[\d\s\-()]{7,20}$/, "Teléfono inválido")
  .max(20)
  .nullable()
  .transform(val => val?.replace(/[\s\-()]/g, "") || null);

export const UrlInputSchema = z.string()
  .url()
  .max(2048)
  .nullable()
  .transform(val => val || null);

export const SafeHtmlSchema = z.string()
  .max(5000)
  .transform(sanitizeHtml);

export const LeadSchema = z.object({
  name: StringInputSchema,
  email: EmailInputSchema,
  phone: PhoneInputSchema.optional(),
  company: StringInputSchema.optional(),
  notes: SafeHtmlSchema.optional(),
});

export const DealSchema = z.object({
  title: StringInputSchema,
  value: z.number().min(0).max(999999999),
  stage: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]),
  contactId: z.string().uuid(),
  notes: SafeHtmlSchema.optional(),
});

export const TaskSchema = z.object({
  title: StringInputSchema,
  description: SafeHtmlSchema.optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const CompanySchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  email: EmailInputSchema,
  phone: PhoneInputSchema.optional(),
  website: UrlInputSchema.optional(),
});

export function sanitizeObject<T extends z.ZodType>(
  obj: unknown,
  schema: T
): z.infer<T> | null {
  const result = schema.safeParse(obj);
  if (!result.success) {
    console.warn("[Sanitize] Validation failed:", result.error.flatten().fieldErrors);
    return null;
  }
  return result.data;
}