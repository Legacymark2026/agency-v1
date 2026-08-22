/**
 * Centralized Form Validation Schemas & Input Sanitizer
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates and sanitizes client-side form inputs before dispatching requests
 * to backend microservices.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateInvoiceForm(data: {
  clientName?: string;
  clientNit?: string;
  totalAmount?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.clientName || data.clientName.trim().length < 3) {
    errors.clientName = "El nombre del cliente debe tener al menos 3 caracteres.";
  }

  if (!data.clientNit || !/^[\d.-]{7,15}$/.test(data.clientNit.trim())) {
    errors.clientNit = "NIT o documento de identidad inválido.";
  }

  if (typeof data.totalAmount !== "number" || data.totalAmount <= 0) {
    errors.totalAmount = "El monto total debe ser un valor positivo.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLeadForm(data: {
  name?: string;
  email?: string;
  phone?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = "El nombre del contacto es obligatorio.";
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Correo electrónico inválido.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
