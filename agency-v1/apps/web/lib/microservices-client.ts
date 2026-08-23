/**
 * Unified Microservices Communication & Resilient Router Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized, strongly-typed HTTP client connecting the Next.js Frontend to
 * all 22 Backend microservices via API Gateway or internal routing.
 * Features:
 *  - Exponential backoff retry with jitter on 500, 502, 503, 504 and network drops
 *  - Circuit-Breaker state tracking per microservice (Fail-Fast protection)
 *  - End-to-end correlation ID propagation
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
};

export const MICROSERVICES_PORTS = MICROSERVICE_PORT_MAP;

export interface MicroserviceRequestOptions {
  service: keyof typeof MICROSERVICE_PORT_MAP;
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  token?: string;
  companyId?: string;
  retries?: number;
  timeoutMs?: number;
}

export interface MicroserviceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId: string;
  statusCode: number;
}

// ─── Circuit Breaker State ───────────────────────────────────────────────────
interface CircuitState {
  failures: number;
  lastFailureTime: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

const CIRCUIT_STATES: Map<string, CircuitState> = new Map();
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 10_000; // 10s cooldown

function getCircuitState(service: string): CircuitState {
  if (!CIRCUIT_STATES.has(service)) {
    CIRCUIT_STATES.set(service, { failures: 0, lastFailureTime: 0, state: "CLOSED" });
  }
  const state = CIRCUIT_STATES.get(service)!;

  // Check if OPEN cooldown has elapsed -> transition to HALF_OPEN
  if (state.state === "OPEN" && Date.now() - state.lastFailureTime > CIRCUIT_COOLDOWN_MS) {
    state.state = "HALF_OPEN";
  }

  return state;
}

function recordSuccess(service: string) {
  const state = getCircuitState(service);
  state.failures = 0;
  state.state = "CLOSED";
}

function recordFailure(service: string) {
  const state = getCircuitState(service);
  state.failures++;
  state.lastFailureTime = Date.now();
  if (state.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    state.state = "OPEN";
    console.warn(`[CircuitBreaker] Circuit OPEN for ${service} (${state.failures} consecutive failures)`);
  }
}

export async function dispatchMicroserviceRequest<T = any>(
  options: MicroserviceRequestOptions
): Promise<MicroserviceResponse<T>> {
  const method = options.method || "GET";
  const retries = options.retries ?? 2;
  const correlationId = `corr_fe_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
  const serviceKey = String(options.service);

  // 1. Check Circuit Breaker
  const circuit = getCircuitState(serviceKey);
  if (circuit.state === "OPEN") {
    return {
      success: false,
      error: `Circuit breaker OPEN para ${serviceKey}. Servicio temporalmente en enfriamiento.`,
      correlationId,
      statusCode: 503,
    };
  }

  // Determine target URL
  const baseUrl =
    typeof window !== "undefined"
      ? "" // Client-side proxy
      : process.env.NEXT_PUBLIC_GATEWAY_URL || `http://127.0.0.1:${MICROSERVICE_PORT_MAP[options.service] || 8080}`;

  const targetPath = options.path.startsWith("/") ? options.path : `/${options.path}`;
  const requestUrl = `${baseUrl}/api/v1/${options.service}${targetPath}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-correlation-id": correlationId,
    ...(options.companyId && { "x-tenant-id": options.companyId }),
    ...(options.token && { Authorization: `Bearer ${options.token}` }),
    ...(options.headers || {}),
  };

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await fetch(requestUrl, {
        method,
        headers: requestHeaders,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      // Transient server or gateway timeout errors (500, 502, 503, 504) -> Exponential Backoff
      if (!response.ok && [500, 502, 503, 504].includes(response.status) && attempt < retries) {
        attempt++;
        const backoffMs = Math.min(300 * Math.pow(2, attempt) + Math.random() * 100, 3000);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      if (response.ok) {
        recordSuccess(serviceKey);
      } else if (response.status >= 500) {
        recordFailure(serviceKey);
      }

      const json = await response.json().catch(() => ({}));
      return {
        success: response.ok,
        data: json,
        error: !response.ok ? json.error || json.message || "Error en microservicio" : undefined,
        correlationId,
        statusCode: response.status,
      };
    } catch (err: any) {
      if (attempt < retries) {
        attempt++;
        const backoffMs = Math.min(300 * Math.pow(2, attempt) + Math.random() * 100, 3000);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      recordFailure(serviceKey);

      return {
        success: false,
        error: err instanceof Error ? err.message : "Error de red al conectar con microservicio",
        correlationId,
        statusCode: 504,
      };
    }
  }

  return {
    success: false,
    error: "Máximo de reintentos alcanzado (504 Gateway Timeout)",
    correlationId,
    statusCode: 504,
  };
}
