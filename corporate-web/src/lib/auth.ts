import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "neogestion_admin_session";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

if (!SESSION_SECRET || SESSION_SECRET === "neogestion_super_secret_corporate_token_2025") {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "❌ [FATAL SECURITY ERROR]: ADMIN_SESSION_SECRET no está configurado o usa un valor inseguro por defecto. Configure un secreto aleatorio de 64 caracteres en las variables de entorno."
    );
  } else {
    console.warn(
      "⚠️ [SECURITY WARNING]: ADMIN_SESSION_SECRET usando valor provisional de desarrollo. Configure una clave segura de 64 caracteres en producción."
    );
  }
}

const EFFECTIVE_SECRET = SESSION_SECRET || "neogestion_dev_fallback_secret_only_for_testing";

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
  const key = await getHmacKey(EFFECTIVE_SECRET);
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
 * Verifica criptográficamente con Web Crypto API (HMAC-SHA256) la autenticidad e integridad del token.
 * Rechaza terminantemente cualquier token alterado, no firmado o expirado.
 */
export async function verifySignedToken(token: string): Promise<{ email: string } | null> {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return null;
    }

    const [payloadStr, signatureStr] = parts;
    const key = await getHmacKey(EFFECTIVE_SECRET);
    const sigBytes = base64UrlDecode(signatureStr);
    const payloadBytes = new TextEncoder().encode(payloadStr);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      payloadBytes as unknown as BufferSource
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadStr));
    const payload = JSON.parse(payloadJson);
    const nowSec = Math.floor(Date.now() / 1000);

    // Validar formato del email y expiración estricta
    if (
      payload?.email && 
      typeof payload.email === "string" &&
      payload.exp && 
      typeof payload.exp === "number" &&
      payload.exp >= nowSec
    ) {
      return { email: payload.email };
    }
  } catch (err) {
    console.warn("Security notice: Token cryptographic verification failed:", err);
  }

  return null;
}


export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  const token = await createSignedToken({ email });

  // En producción siempre forzar Secure. En desarrollo, si es HTTPS o se especifica COOKIE_SECURE
  const isHttps =
    process.env.NODE_ENV === "production" ||
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


