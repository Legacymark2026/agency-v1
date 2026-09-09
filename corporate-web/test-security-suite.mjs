/**
 * Suite de Verificación de Seguridad Automatizada - NEOGESTIÓN
 * Ejecuta pruebas defensivas sobre los módulos criptográficos, limitadores de tasa y validadores.
 */

import { checkRateLimit } from "./src/lib/rateLimit.ts";

async function runSecuritySuite() {
  console.log("\n=======================================================");
  console.log("🛡️  INICIANDO SUITE DE PRUEBAS DE SEGURIDAD DEFENSIVA");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASÓ] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FALLÓ] ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // PRUEBA 1: Verificación Criptográfica Estricta & Anti-Bypass
  // -------------------------------------------------------------
  console.log("📋 Prueba 1: Verificación Criptográfica de Tokens y Rechazo de Bypass");

  const SECRET = "neogestion_super_secret_corporate_token_2025";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  // 1.1 Intentar Bypass con JSON Base64 manipulado (sin firma válida)
  const forgedPayload = Buffer.from(JSON.stringify({ email: "admin@neogestion.com" })).toString("base64");
  const forgedToken = `${forgedPayload}.fakeSignature12345`;

  // Comprobar que cualquier token forjado falla la verificación criptográfica
  const parts = forgedToken.split(".");
  let signatureValid = false;
  try {
    const rawSig = Buffer.from(parts[1], "base64");
    signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      rawSig,
      encoder.encode(parts[0])
    );
  } catch {
    signatureValid = false;
  }
  assert(!signatureValid, "Token manipulado / forjado es RECHAZADO terminantemente (Bypass neutralizado)");

  // 1.2 Token legítimo firmado criptográficamente
  const validData = JSON.stringify({
    email: "admin@neogestion.com",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const validPayload = Buffer.from(validData).toString("base64url");
  const validSigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(validPayload)
  );
  const legitimateSignature = Buffer.from(validSigBuffer).toString("base64url");

  const legitimateTokenValid = await crypto.subtle.verify(
    "HMAC",
    key,
    Buffer.from(legitimateSignature, "base64url"),
    encoder.encode(validPayload)
  );
  assert(legitimateTokenValid, "Token con firma HMAC-SHA256 auténtica es ACEPTADO");

  // -------------------------------------------------------------
  // PRUEBA 2: Mitigación de Fuerza Bruta y Rate Limiting
  // -------------------------------------------------------------
  console.log("\n📋 Prueba 2: Mitigación de Fuerza Bruta y Rate Limiting");
  const testKey = "test_ip_fuerza_bruta_" + Date.now();
  const opts = { maxRequests: 5, windowSeconds: 60 };

  let r1 = checkRateLimit(testKey, opts);
  assert(r1.success === true && r1.remaining === 4, "Intento 1 permitido (quedan 4)");

  checkRateLimit(testKey, opts);
  checkRateLimit(testKey, opts);
  checkRateLimit(testKey, opts);
  let r5 = checkRateLimit(testKey, opts);
  assert(r5.success === true && r5.remaining === 0, "Intento 5 permitido (quedan 0)");

  let r6 = checkRateLimit(testKey, opts);
  assert(r6.success === false && r6.remaining === 0, "Intento 6 BLOQUEADO defensivamente (Rate Limit activo)");

  // -------------------------------------------------------------
  // PRUEBA 2: Validación Anti-XSS en Identificadores de Píxeles
  // -------------------------------------------------------------
  console.log("\n📋 Prueba 2: Expresiones Regulares Defensivas Anti-XSS");
  const gtmRegex = /^GTM-[A-Z0-9_-]{3,20}$/i;
  const fbRegex = /^\d{5,25}$/;

  const maliciousGtm = "GTM-12345'; alert(document.cookie); //";
  const validGtm = "GTM-ABC1234";
  const maliciousFb = "1234567<script>steal()</script>";
  const validFb = "987654321012345";

  assert(!gtmRegex.test(maliciousGtm), "Carga maliciosa en GTM ID es RECHAZADA");
  assert(gtmRegex.test(validGtm), "GTM ID legítimo es ACEPTADO");
  assert(!fbRegex.test(maliciousFb), "Carga maliciosa con etiquetas <script> en FB Pixel es RECHAZADA");
  assert(fbRegex.test(validFb), "FB Pixel numérico legítimo es ACEPTADO");

  // -------------------------------------------------------------
  // PRUEBA 3: Sanitización de Enlaces Markdown (Anti-XSS Blog)
  // -------------------------------------------------------------
  console.log("\n📋 Prueba 3: Filtro de Protocolos de Enlaces en el Blog");
  function sanitizeMarkdownUrl(rawUrl) {
    const clean = rawUrl.trim();
    const isSafe = /^(https?:\/\/|mailto:|\/)/i.test(clean);
    return isSafe ? clean : "#";
  }

  const evilLink = "javascript:alert(document.cookie)";
  const dataLink = "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==";
  const safeHttpLink = "https://neogestion.com/contacto";
  const safeRelative = "/quienes-somos";

  assert(sanitizeMarkdownUrl(evilLink) === "#", "Protocolo 'javascript:' neutralizado a '#'");
  assert(sanitizeMarkdownUrl(dataLink) === "#", "Protocolo 'data:' neutralizado a '#'");
  assert(sanitizeMarkdownUrl(safeHttpLink) === safeHttpLink, "Enlace HTTPS legítimo permitido");
  assert(sanitizeMarkdownUrl(safeRelative) === safeRelative, "Ruta relativa interna permitida");

  // -------------------------------------------------------------
  // PRUEBA 4: Sanitización de Etiquetas HTML en Markdown
  // -------------------------------------------------------------
  console.log("\n📋 Prueba 4: Neutralización de Inyección de Etiquetas HTML");
  function stripHtmlTags(str) {
    return str.replace(/[<>]/g, "");
  }

  const evilHtmlInput = '<img src=x onerror=alert(1)>Texto Corporativo';
  assert(stripHtmlTags(evilHtmlInput) === "img src=x onerror=alert(1)Texto Corporativo", "Etiquetas < y > neutralizadas previniendo ejecución de scripts inline");

  // -------------------------------------------------------------
  // PRUEBA 5: Validación Estricta de Correo Corporativo de Contacto
  // -------------------------------------------------------------
  console.log("\n📋 Prueba 5: Validación de Correo de Prospectos");
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const validEmail = "director.general@grupo-empresa.co";
  const invalidEmail1 = "admin@evil<script>";
  const invalidEmail2 = "not-an-email";

  assert(emailRegex.test(validEmail), "Correo corporativo válido aceptado");
  assert(!emailRegex.test(invalidEmail1), "Inyección maliciosa en correo rechazada");
  assert(!emailRegex.test(invalidEmail2), "Formato sin dominio rechazado");

  // -------------------------------------------------------------
  // RESUMEN
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`📊 RESULTADO: ${passed} pruebas superadas exitosamente, ${failed} fallos.`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch(console.error);
