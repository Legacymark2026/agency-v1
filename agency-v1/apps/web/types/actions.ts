/**
 * types/actions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tipo unificado para todas las Server Actions del sistema.
 *
 * ANTES (3 formatos inconsistentes):
 *   { error: string }
 *   { success: false, error: string }
 *   { success: true, data: T }
 *
 * AHORA (1 contrato único):
 *   ActionResult<T>
 *
 * @example
 *   export async function createDeal(data: unknown): Promise<ActionResult<Deal>> {
 *     const parsed = CreateDealSchema.safeParse(data);
 *     if (!parsed.success) return fail("Datos inválidos", 422);
 *     const deal = await prisma.deal.create({ data: parsed.data });
 *     return ok(deal);
 *   }
 */

// ── Core Type ──────────────────────────────────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      error: string;
      status?: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;
      fields?: Record<string, string[]>;
    };

// ── HTTP Status Codes ──────────────────────────────────────────────────────────
export type ActionStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

// ── Factory Helpers ────────────────────────────────────────────────────────────

/**
 * Crea un resultado exitoso.
 * @example return ok(deal);
 * @example return ok(undefined); // cuando no hay dato que retornar
 */
export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, ...(message ? { message } : {}) };
}

/**
 * Crea un resultado de error.
 * @example return fail("No tienes permisos", 403);
 * @example return fail("Datos inválidos", 422, { email: ["Email requerido"] });
 */
export function fail(
  error: string,
  status: ActionStatus = 500,
  fields?: Record<string, string[]>
): ActionResult<never> {
  return { success: false, error, status, ...(fields ? { fields } : {}) };
}

// ── Guard de tipo en cliente ───────────────────────────────────────────────────

/**
 * Type guard para verificar si el resultado fue exitoso.
 * Útil en componentes cliente para discriminar el tipo.
 *
 * @example
 *   const result = await createDeal(data);
 *   if (isSuccess(result)) {
 *     console.log(result.data.id); // ← TypeScript sabe que data existe
 *   }
 */
export function isSuccess<T>(result: ActionResult<T>): result is Extract<ActionResult<T>, { success: true }> {
  return result.success === true;
}

/**
 * Type guard para verificar si el resultado fue un error.
 */
export function isError<T>(result: ActionResult<T>): result is Extract<ActionResult<T>, { success: false }> {
  return result.success === false;
}
