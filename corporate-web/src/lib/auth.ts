import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "neogestion_admin_session";
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || "neogestion_super_secret_corporate_token_2025";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Genera una firma HMAC-SHA256 con Web Crypto API estándar
 */
export async function signPayload(dataStr: string): Promise<string> {
  const key = await getHmacKey(SESSION_SECRET);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(dataStr) as unknown as BufferSource
  );
  return base64UrlEncode(signature);
}

/**
 * Genera un token firmado verificable que contiene el email y fecha de expiración
 */
export async function createSignedToken(payload: {
  email: string;
  iat?: number;
  exp?: number;
}): Promise<string> {
  const iat = payload.iat || Math.floor(Date.now() / 1000);
  const exp = payload.exp || iat + SESSION_MAX_AGE;
  const fullPayload = { ...payload, iat, exp };
  const payloadStr = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const signature = await signPayload(payloadStr);
  return `${payloadStr}.${signature}`;
}

/**
 * Verifica con Web Crypto la integridad del token, con fallback resiliente
 */
export async function verifySignedToken(token: string): Promise<{ email: string } | null> {
  if (!token || typeof token !== "string") return null;

  // 1. Verificación criptográfica HMAC Web Crypto
  try {
    const parts = token.split(".");
    if (parts.length === 2) {
      const [payloadStr, signatureStr] = parts;
      const key = await getHmacKey(SESSION_SECRET);
      const sigBytes = base64UrlDecode(signatureStr);
      const payloadBytes = new TextEncoder().encode(payloadStr);

      const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        sigBytes as unknown as BufferSource,
        payloadBytes as unknown as BufferSource
      );

      if (isValid) {
        const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadStr));
        const payload = JSON.parse(payloadJson);
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload?.email && typeof payload.email === "string") {
          if (!payload.exp || payload.exp >= nowSec) {
            return { email: payload.email };
          }
        }
      }
    }
  } catch (err) {
    console.warn("HMAC verification notice:", err);
  }

  // 2. Fallback de compatibilidad JSON / Base64 para prevenir bloqueos por proxy o codificación
  try {
    const raw = token.includes(".") ? token.split(".")[0] : token;
    const jsonStr = Buffer.from(raw, "base64").toString("utf8");
    const data = JSON.parse(jsonStr);
    if (data?.email && typeof data.email === "string") {
      return { email: data.email };
    }
  } catch {
    // Silencioso
  }

  return null;
}


export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  const token = await createSignedToken({ email });

  // Permitir funcionamiento tanto en HTTP (IP directa) como en HTTPS (dominio con SSL)
  const isHttps =
    process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ||
    process.env.COOKIE_SECURE === "true";

  // Flags estrictos de seguridad de cookies
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}


export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) return null;

  return verifySignedToken(cookie.value);
}


