/**
 * Supplier Zod Validation Schemas
 */
import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(2, "El nombre comercial debe tener al menos 2 caracteres"),
  legalName: z.string().optional().nullable(),
  taxId: z.string().min(3, "La identificación fiscal (NIT/Tax ID) es requerida"),
  taxType: z.string().default("NIT"),
  category: z.enum(["RAW_MATERIALS", "SERVICES", "LOGISTICS", "TECHNOLOGY", "GENERAL"]).default("GENERAL"),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email("Formato de correo electrónico inválido").optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default("Colombia"),
  paymentTermsDays: z.number().int().min(0, "El plazo de pago debe ser positivo").default(30),
  creditLimit: z.number().min(0, "El cupo de crédito debe ser positivo").default(0),
  currency: z.string().default("COP"),
  bankName: z.string().optional().nullable(),
  bankAccountType: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankAccountHolder: z.string().optional().nullable(),
  discountRatePct: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
  customFields: z.record(z.any()).optional().default({}),
});

export const updateSupplierSchema = z.object({
  legal: z.object({
    name: z.string().min(2).optional(),
    legalName: z.string().optional().nullable(),
    taxId: z.string().min(3).optional(),
    taxType: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
  }).optional(),
  contact: z.object({
    contactName: z.string().optional().nullable(),
    contactEmail: z.string().email().optional().nullable(),
    contactPhone: z.string().optional().nullable(),
  }).optional(),
  commercial: z.object({
    paymentTermsDays: z.number().int().min(0).optional(),
    creditLimit: z.number().min(0).optional(),
    currency: z.string().optional(),
    discountRatePct: z.number().min(0).max(100).optional(),
    bankName: z.string().optional().nullable(),
    bankAccountType: z.string().optional().nullable(),
    bankAccountNumber: z.string().optional().nullable(),
    bankAccountHolder: z.string().optional().nullable(),
  }).optional(),
  category: z.enum(["RAW_MATERIALS", "SERVICES", "LOGISTICS", "TECHNOLOGY", "GENERAL"]).optional(),
  notes: z.string().optional().nullable(),
});

export const updateSupplierStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "UNDER_REVIEW"]),
  reason: z.string().optional(),
});

export const attachDocumentSchema = z.object({
  documentType: z.enum([
    "RUT",
    "CAMARA_COMERCIO",
    "CERTIFICACION_BANCARIA",
    "ISO_9001",
    "SARLAFT",
    "ACUERDO_CONFIDENCIALIDAD",
    "OTRO"
  ]),
  title: z.string().min(2, "El título del documento es obligatorio"),
  fileUrl: z.string().url("La URL del archivo debe ser válida"),
  fileKey: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  issueDate: z.string().datetime().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const verifyDocumentSchema = z.object({
  isVerified: z.boolean(),
  notes: z.string().optional(),
});
