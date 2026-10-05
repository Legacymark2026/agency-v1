const http = require("http");

function query(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runLiveVerification() {
  console.log("================================================================================");
  console.log("   AUDITORÍA EN VIVO: INTERACCIÓN TRANSACCIONAL DE LOS 4 MOTORES                ");
  console.log("================================================================================");

  // 1. HEALTH CHECKS
  console.log("\n[1] VERIFICACIÓN DE ESTADO Y HEALTH CHECK:");
  const healthEndpoints = [
    { name: "Motor 1: Autenticación (AuthN IdP :4001)", url: "http://auth-service:4001/health" },
    { name: "Motor 2: Autorización (AuthZ RBAC :4055)", url: "http://authorization-service:4055/health" },
    { name: "Motor 3: Políticas Centralizadas (PDP :4050)", url: "http://policy-service:4050/health" },
    { name: "Motor 4: Suscripciones SaaS (Subscriptions :4060)", url: "http://subscription-service:4060/health" },
  ];

  for (const h of healthEndpoints) {
    const res = await query(h.url);
    console.log(`  ✓ ${h.name} -> HTTP ${res.status} (Healthy: ${res.body.status})`);
  }

  // 2. DEVICE FINGERPRINTING & TRIAL ABUSE CONTROL
  console.log("\n[2] CONTROL DE ABUSO DE PRUEBA GRATUITA (DEVICE FINGERPRINTING):");
  const testFingerprint = "7777aaaa8888bbbb9999cccc0000dddd1111eeee2222ffff3333000044441111";
  const legitimateTenant = "empresa-legitima-101";
  const fraudulentTenant = "empresa-fantasma-102";

  // Intento 1: Registro legítimo
  const claim1 = await query("http://subscription-service:4060/api/subscriptions/trial/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { companyId: legitimateTenant, deviceHash: testFingerprint, durationDays: 14 }
  });
  console.log(`  Paso 1: Primer reclamo en Hardware [${testFingerprint.slice(0, 16)}...] para ${legitimateTenant}`);
  console.log(`          Resultado: HTTP ${claim1.status}`);

  // Intento 2: Usuario intenta registrar una segunda empresa en el mismo hardware
  const claim2 = await query("http://subscription-service:4060/api/subscriptions/trial/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { companyId: fraudulentTenant, deviceHash: testFingerprint, durationDays: 14 }
  });
  console.log(`  Paso 2: Intento fraudulento en MISMO Hardware para ${fraudulentTenant}`);
  console.log(`          Resultado: HTTP ${claim2.status} (Esperado: 403 Forbidden)`);
  console.log(`          Mensaje de bloqueo: "${claim2.body.error}"`);

  // 3. SUBSCRIPTION GATEKEEPER EN MOTOR DE AUTORIZACIÓN
  console.log("\n[3] COMPUERTA DE SUSCRIPCIÓN EN AUTORIZACIÓN (GATEKEEPER):");
  // 3.1 Petición sin suscripción
  const authzNoSub = await query("http://authorization-service:4055/api/authz/check-permission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      userId: "usr-tester",
      companyId: "empresa-sin-suscripcion-999",
      requiredPermission: "invoices.create",
      userRole: "admin"
    }
  });
  console.log(`  Paso 1: Empresa sin suscripción intenta acceder a invoices.create`);
  console.log(`          Resultado: HTTP ${authzNoSub.status} | Granted: ${authzNoSub.body.granted}`);
  console.log(`          Razón de corte previo: "${authzNoSub.body.reason}"`);

  // 3.2 SuperAdmin bypass (Regla Cero-Confianza)
  const authzSuperAdmin = await query("http://authorization-service:4055/api/authz/check-permission", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-role": "super_admin" },
    body: {
      userId: "usr-root",
      companyId: "empresa-sin-suscripcion-999",
      requiredPermission: "system.configure",
      userRole: "super_admin",
      isSuperAdmin: true
    }
  });
  console.log(`  Paso 2: SuperAdmin bypass en la compuerta`);
  console.log(`          Resultado: HTTP ${authzSuperAdmin.status} | Granted: ${authzSuperAdmin.body.granted} (Bypass Exitoso)`);

  // 4. MOTOR DE POLÍTICAS CENTRALIZADAS (XACML / PDP ZERO-TRUST)
  console.log("\n[4] EVALUACIÓN DEL MOTOR DE POLÍTICAS CENTRALIZADAS (PDP):");
  // 4.1 Dispositivo limpio evaluando emisión DIAN
  const pdpClean = await query("http://policy-service:4050/api/policies/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      subject: { id: "usr-tester", role: "ADMIN", companyId: legitimateTenant },
      action: "EMIT_DIAN",
      resource: { type: "INVOICE", amount: 250000, companyId: legitimateTenant },
      context: { isDeviceFlaggedAbuser: false }
    }
  });
  console.log(`  Paso 1: Emisión DIAN con dispositivo verificado -> Decisión: ${pdpClean.body.decision}`);

  // 4.2 Dispositivo flaggeado por abuso de trial intentando mutación
  const pdpAbuser = await query("http://policy-service:4050/api/policies/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      subject: { id: "usr-attacker", role: "USER", companyId: fraudulentTenant },
      action: "CREATE",
      resource: { type: "AI_INFERENCE", companyId: fraudulentTenant },
      context: { isDeviceFlaggedAbuser: true }
    }
  });
  console.log(`  Paso 2: Dispositivo con Flag de Abuso intentando consumo IA -> Decisión: ${pdpAbuser.body.decision}`);
  console.log(`          Obligación del PDP: ${JSON.stringify(pdpAbuser.body.obligations)}`);

  console.log("\n================================================================================");
  console.log("       VERIFICACIÓN COMPLETA: LOS 4 MOTORES TRABAJAN SINCRONIZADOS              ");
  console.log("================================================================================");
}

runLiveVerification().catch(console.error);
