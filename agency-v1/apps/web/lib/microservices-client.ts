/**
 * Unified Microservices Communication & Router Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized, strongly-typed HTTP client connecting the Next.js Frontend to
 * all 22 Backend microservices via API Gateway or internal routing.
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
}

export interface MicroserviceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId: string;
  statusCode: number;
}

export async function dispatchMicroserviceRequest<T = any>(
  options: MicroserviceRequestOptions
): Promise<MicroserviceResponse<T>> {
  const method = options.method || "GET";
  const retries = options.retries ?? 2;
  const correlationId = `corr_fe_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

  // Determine target URL: use public API gateway or direct microservice port in dev
  const baseUrl =
    typeof window !== "undefined"
      ? "" // Proxy via Next.js API routes in browser
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

      if (!response.ok && response.status >= 500 && attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
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
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }

      return {
        success: false,
        error: err instanceof Error ? err.message : "Error de red al conectar con microservicio",
        correlationId,
        statusCode: 503,
      };
    }
  }

  return {
    success: false,
    error: "Máximo de reintentos alcanzado",
    correlationId,
    statusCode: 504,
  };
}
