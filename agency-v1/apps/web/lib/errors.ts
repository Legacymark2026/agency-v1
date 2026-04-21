/**
 * lib/errors.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Jerarquía de errores tipados para el sistema LegacyMark.
 *
 * REGLAS:
 * - NO usar "use server" aquí — estos son tipos puros importables en cualquier contexto
 * - Cada clase incluye un código HTTP semántico en `status`
 * - Usar en Server Actions, API routes, y servicios de backend
 *
 * @example
 *   import { ForbiddenError, ValidationError } from "@/lib/errors";
 *
 *   if (!hasPermission) throw new ForbiddenError();
 *   if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);
 */

// ── 4xx — Client Errors ────────────────────────────────────────────────────────

/** 400 Bad Request — Input malformado o parámetros inválidos */
export class BadRequestError extends Error {
  readonly status = 400 as const;
  constructor(message = "Solicitud inválida.") {
    super(message);
    this.name = "BadRequestError";
  }
}

/** 401 Unauthorized — No autenticado */
export class UnauthorizedError extends Error {
  readonly status = 401 as const;
  constructor(message = "No autenticado. Por favor inicia sesión.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** 403 Forbidden — Autenticado pero sin permisos */
export class ForbiddenError extends Error {
  readonly status = 403 as const;
  constructor(message = "No tienes permisos para esta acción.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** 404 Not Found — Recurso no existe */
export class NotFoundError extends Error {
  readonly status = 404 as const;
  constructor(message = "Recurso no encontrado.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** 409 Conflict — El recurso ya existe (duplicado) */
export class ConflictError extends Error {
  readonly status = 409 as const;
  constructor(message = "Conflicto: el recurso ya existe.") {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * 422 Unprocessable Entity — Validación de schema fallida.
 * `fields` contiene los errores por campo (compatible con Zod flatten).
 */
export class ValidationError extends Error {
  readonly status = 422 as const;
  readonly fields: Record<string, string[]>;
  constructor(fields: Record<string, string[]>, message = "Error de validación.") {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

/**
 * 429 Too Many Requests — Rate limit excedido.
 * `retryAfterMs` indica cuántos milisegundos esperar antes de reintentar.
 */
export class RateLimitError extends Error {
  readonly status = 429 as const;
  readonly retryAfterMs: number;
  constructor(retryAfterMs = 60_000, message = "Demasiadas solicitudes. Por favor espera.") {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

// ── 5xx — Server Errors ────────────────────────────────────────────────────────

/** 500 Internal Server Error — Error inesperado del servidor */
export class InternalError extends Error {
  readonly status = 500 as const;
  constructor(message = "Error interno del servidor.") {
    super(message);
    this.name = "InternalError";
  }
}

/** 503 Service Unavailable — Servicio temporal no disponible (DB, API ext.) */
export class ServiceUnavailableError extends Error {
  readonly status = 503 as const;
  constructor(message = "Servicio temporalmente no disponible.") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

// ── Type Guard ─────────────────────────────────────────────────────────────────

type AppError =
  | BadRequestError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | ConflictError
  | ValidationError
  | RateLimitError
  | InternalError
  | ServiceUnavailableError;

/**
 * Verifica si un error es una instancia conocida del sistema.
 * Útil para discriminar entre errores de app y errores inesperados.
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof BadRequestError ||
    error instanceof UnauthorizedError ||
    error instanceof ForbiddenError ||
    error instanceof NotFoundError ||
    error instanceof ConflictError ||
    error instanceof ValidationError ||
    error instanceof RateLimitError ||
    error instanceof InternalError ||
    error instanceof ServiceUnavailableError
  );
}

/**
 * Convierte cualquier error en un mensaje seguro para mostrar al usuario.
 * Nunca expone stack traces o detalles internos.
 */
export function toUserMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof Error) return "Ha ocurrido un error inesperado.";
  return "Ha ocurrido un error desconocido.";
}