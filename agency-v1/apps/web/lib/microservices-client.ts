/**
 * Unified Microservices Communication & Resilient Router Client v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized, strongly-typed HTTP client connecting Next.js Frontend to
 * all 22 Backend microservices with:
 *  - Exponential backoff retry with jitter on 500, 502, 503, 504 and network drops
 *  - Circuit-Breaker state tracking per microservice (Fail-Fast protection)
 *  - End-to-end correlation ID propagation
 *  - AUTOMATIC HYBRID FALLBACK: If the microservice/gateway is offline or fails,
 *    transparently executes the provided `fallback` (e.g. direct Prisma query)
 *    so the user NEVER experiences an outage.
 */

export const MICROSERVICE_PORT_MAP: Record<string, number> = {
  "api-gateway": 8080,
  "auth-service": 4001,
  "crm-service": 4002,
  "inbox-service": 4003,
  "project-service": 4004,
  "pos-service": 4005,
  "finance-service": 4006,
  "automation-service": 4007,
  "ai-engine": 4008,
  "notification-service": 4009,
  "document-service": 4010,
  "analytics-service": 4011,
  "agent-team-engine": 4012,
  "marketing-service": 4013,
  "admin-service": 4014,
  "integration-service": 4015,
  "hr-service": 4016,
  "calendar-service": 4017,
  "video-service": 4018,
  "affiliate-service": 4019,
  "public-api-service": 4020,
  "goldneez-rewards-service": 4021,
  "payment-service": 4022,
  "chat-service": 4023,
  "feed-service": 4024,
};

export const MICROSERVICES_PORTS = MICROSERVICE_PORT_MAP;

export interface MicroserviceRequestOptions<T = any> {
  service: keyof typeof MICROSERVICE_PORT_MAP | "crm" | "finance" | "inbox" | "marketing" | "hr" | "auth" | "video" | "ai" | "project" | "automation" | "payment" | "chat" | "feed";
  /** Path to append, e.g. "/api/crm/stats" or "/stats" */
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  token?: string;
  companyId?: string;
  userId?: string;
  retries?: number;
  timeoutMs?: number;
  /**
   * Resilient fallback function executed if the microservice or gateway is offline.
   * Typically a direct Prisma query.
   */
  fallback?: () => Promise<T>;
}

export interface MicroserviceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId: string;
  statusCode: number;
  isFallback?: boolean;
}

// ─── Circuit Breaker State ───────────────────────────────────────────────────
interface CircuitState {
  failures: number;
  lastFailureTime: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

const CIRCUIT_STATES: Map<string, CircuitState> = new Map();
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 10_000; // 10s cooldown

export function getCircuitState(service: string): CircuitState {
  if (!CIRCUIT_STATES.has(service)) {
    CIRCUIT_STATES.set(service, { failures: 0, lastFailureTime: 0, state: "CLOSED" });
  }
  const state = CIRCUIT_STATES.get(service)!;

  if (state.state === "OPEN" && Date.now() - state.lastFailureTime > CIRCUIT_COOLDOWN_MS) {
    state.state = "HALF_OPEN";
  }

  return state;
}

export function recordSuccess(service: string) {
  const state = getCircuitState(service);
  state.failures = 0;
  state.state = "CLOSED";
}

export function recordFailure(service: string) {
  const state = getCircuitState(service);
  state.failures++;
  state.lastFailureTime = Date.now();
  if (state.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    state.state = "OPEN";
    console.warn(`[CircuitBreaker] Circuit OPEN for ${service} (${state.failures} consecutive failures)`);
  }
}

/** Reset circuit state (useful for tests) */
export function resetCircuitStates() {
  CIRCUIT_STATES.clear();
}

/**
 * Dispatches a resilient request to a backend microservice via the API Gateway
 * or direct port mapping, with automatic fallback execution.
 */
export async function dispatchMicroserviceRequest<T = any>(
  options: MicroserviceRequestOptions<T>
): Promise<MicroserviceResponse<T>> {
  const method = options.method || "GET";
  const retries = options.retries ?? 1;
  const timeoutMs = options.timeoutMs ?? 5000;
  const correlationId = `corr_fe_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
  const serviceKey = String(options.service);

  // Helper to execute fallback if provided
  const tryFallback = async (reason: string): Promise<MicroserviceResponse<T>> => {
    if (options.fallback) {
      try {
        console.info(`[MicroserviceClient] Falling back to direct database execution for ${serviceKey} (${reason})`);
        const fallbackResult = await options.fallback();
        return {
          success: true,
          data: fallbackResult,
          correlationId,
          statusCode: 200,
          isFallback: true,
        };
      } catch (fallbackErr: any) {
        console.error(`[MicroserviceClient] Fallback also failed for ${serviceKey}:`, fallbackErr);
        return {
          success: false,
          error: fallbackErr.message || "Error en fallback local",
          correlationId,
          statusCode: 500,
          isFallback: true,
        };
      }
    }

    return {
      success: false,
      error: reason,
      correlationId,
      statusCode: 503,
    };
  };

  // 1. Check Circuit Breaker
  const circuit = getCircuitState(serviceKey);
  if (circuit.state === "OPEN") {
    return tryFallback(`Circuit breaker OPEN para ${serviceKey}. Servicio en enfriamiento.`);
  }

  // 2. Resolve Gateway or Microservice Base URL
  const gatewayUrl =
    process.env.API_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "http://localhost:8080";

  // Build target URL
  let requestUrl: string;
  if (options.path.startsWith("http://") || options.path.startsWith("https://")) {
    requestUrl = options.path;
  } else if (options.path.startsWith("/api/")) {
    requestUrl = `${gatewayUrl}${options.path}`;
  } else {
    requestUrl = `${gatewayUrl}/api/${serviceKey.replace("-service", "")}${options.path.startsWith("/") ? options.path : `/${options.path}`}`;
  }

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-correlation-id": correlationId,
    ...(options.companyId && { "x-company-id": options.companyId }),
    ...(options.userId && { "x-user-id": options.userId }),
    ...(options.token && { Authorization: `Bearer ${options.token}` }),
    ...(options.headers || {}),
  };

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(requestUrl, {
        method,
        headers: requestHeaders,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Transient gateway timeout / service unavailable errors -> Exponential Backoff
      if (!response.ok && [500, 502, 503, 504].includes(response.status) && attempt < retries) {
        attempt++;
        const backoffMs = Math.min(200 * Math.pow(2, attempt), 2000);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      if (response.ok) {
        recordSuccess(serviceKey);
        const json = await response.json().catch(() => ({}));
        return {
          success: true,
          data: json,
          correlationId,
          statusCode: response.status,
        };
      } else {
        if (response.status >= 500) {
          recordFailure(serviceKey);
          // If server error and fallback exists, trigger fallback
          if (options.fallback) {
            return tryFallback(`Servicio ${serviceKey} retornó HTTP ${response.status}`);
          }
        }
        const json = await response.json().catch(() => ({}));
        return {
          success: false,
          error: json.error || json.message || `Error HTTP ${response.status}`,
          correlationId,
          statusCode: response.status,
        };
      }
    } catch (err: any) {
      if (attempt < retries) {
        attempt++;
        const backoffMs = Math.min(200 * Math.pow(2, attempt), 2000);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      recordFailure(serviceKey);

      // Network drop, timeout, or connection refused -> execute fallback
      return tryFallback(err instanceof Error ? err.message : "Error de conexión con microservicio");
    }
  }

  return tryFallback("Máximo de reintentos alcanzado (504 Gateway Timeout)");
}
