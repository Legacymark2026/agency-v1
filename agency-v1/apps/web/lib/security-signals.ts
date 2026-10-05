/**
 * apps/web/lib/security-signals.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Analizador pasivo de seguridad (Zero-Cost / Backend) para detección de fraude,
 * correos desechables, proxies/VPNs/Tor y parametrización de directivas en los motores.
 */

// Lista de dominios de correos temporales / desechables conocidos
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getairmail.com",
  "dispostable.com",
  "throwawaymail.com",
  "fakeinbox.com",
  "mohmal.com",
  "burnermail.io",
  "crazymailing.com",
  "mytemp.email",
]);

export interface EmailReputationResult {
  domain: string;
  isCorporate: boolean;
  isDisposable: boolean;
  riskScore: number; // 0.0 a 1.0 (1.0 = alto riesgo)
  riskCategory: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
}

export function analyzeEmailReputation(email: string): EmailReputationResult {
  const parts = email.toLowerCase().trim().split("@");
  if (parts.length !== 2) {
    return {
      domain: "",
      isCorporate: false,
      isDisposable: true,
      riskScore: 1.0,
      riskCategory: "HIGH",
      reasons: ["MALFORMED_EMAIL_ADDRESS"],
    };
  }

  const domain = parts[1];
  const reasons: string[] = [];
  let score = 0.0;

  // 1. Detección de dominio desechable
  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);
  if (isDisposable) {
    score += 0.9;
    reasons.push("DISPOSABLE_EMAIL_DOMAIN_DETECTED");
  }

  // 2. Clasificación Corporativo vs Gratuito Común
  const COMMON_FREE_PROVIDERS = new Set([
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "live.com",
    "protonmail.com",
    "proton.me",
  ]);

  const isCorporate = !COMMON_FREE_PROVIDERS.has(domain) && !isDisposable;
  if (!isCorporate && !isDisposable) {
    score += 0.15; // Ligero incremento para free providers vs dominio propio empresarial
  }

  const normalizedScore = Math.min(1.0, Number(score.toFixed(2)));
  const riskCategory = normalizedScore >= 0.7 ? "HIGH" : normalizedScore >= 0.3 ? "MEDIUM" : "LOW";

  return {
    domain,
    isCorporate,
    isDisposable,
    riskScore: normalizedScore,
    riskCategory,
    reasons,
  };
}

export interface NetworkRiskResult {
  ip: string;
  country: string;
  isPotentialProxyOrDatacenter: boolean;
  riskScore: number;
  reasons: string[];
}

export function analyzeNetworkSecurity(
  clientIp: string,
  headers: { get: (name: string) => string | null }
): NetworkRiskResult {
  const reasons: string[] = [];
  let score = 0.0;

  const cfCountry = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || "Unknown";
  const userAgent = (headers.get("user-agent") || "").toLowerCase();

  // 1. Detección de encabezados Tor o Proxy anónimo
  if (headers.get("x-tor-exit-node") || headers.get("x-proxy-id")) {
    score += 0.85;
    reasons.push("ANONYMOUS_ROUTER_FLAG");
  }

  // 2. Detección de User-Agent con herramientas de scrapers o servidores cloud (Python, Go-http, Curl)
  if (
    userAgent.includes("python-requests") ||
    userAgent.includes("curl/") ||
    userAgent.includes("aiohttp") ||
    userAgent.includes("postmanruntime")
  ) {
    score += 0.6;
    reasons.push("SCRIPTED_HTTP_CLIENT_USER_AGENT");
  }

  // 3. Verificación de IP local / privada vs pública
  const isPrivateIp =
    clientIp === "127.0.0.1" ||
    clientIp === "::1" ||
    clientIp.startsWith("10.") ||
    clientIp.startsWith("192.168.") ||
    clientIp.startsWith("172.16.");

  const normalizedScore = Math.min(1.0, Number(score.toFixed(2)));

  return {
    ip: clientIp,
    country: cfCountry,
    isPotentialProxyOrDatacenter: normalizedScore >= 0.6,
    riskScore: normalizedScore,
    reasons,
  };
}
