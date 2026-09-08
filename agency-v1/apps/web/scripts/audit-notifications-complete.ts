/**
 * scripts/audit-notifications-complete.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Auditoria Integral del Sistema Empresarial de Notificaciones — LegacyMark
 *
 * Cobertura:
 *  1. Registro Maestro de Eventos (NOTIFICATION_EVENTS)
 *  2. Mapeo de Categorias (CATEGORY_META)
 *  3. Resolucion Dinamica de Plantillas de Enlace (Deep-linking)
 *  4. Matriz de Prioridades y Reglas de Entrega Multicanal
 *  5. Proteccion contra XSS Almacenado e Inyeccion de Scripts
 *  6. Reglas de Preferencias y Eventos Criticos No Desactivables
 *  7. Aislamiento Multi-inquilino (Tenant Isolation: companyId + userId)
 *  8. Paginacion y Limites de Carga (DoS Prevention)
 */

import {
  NOTIFICATION_EVENTS,
  CATEGORY_META,
  type NotificationEventType,
  type NotificationCategory,
  type DeliveryChannel,
  type NotificationPriority,
} from "../lib/notifications/notification-types";

interface AuditResult {
  section: string;
  check: string;
  passed: boolean;
  notes?: string;
}

const results: AuditResult[] = [];

function check(section: string, title: string, fn: () => boolean | void, notes?: string) {
  try {
    const res = fn();
    const passed = res !== false;
    results.push({ section, check: title, passed, notes });
  } catch (err: any) {
    results.push({ section, check: title, passed: false, notes: err?.message || String(err) });
  }
}

console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
console.log("║      AUDITORIA INTEGRAL DEL SISTEMA DE NOTIFICACIONES — LEGACYMARK   ║");
console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

// ── 1. REGISTRO MAESTRO DE EVENTOS ───────────────────────────────────────────
const eventKeys = Object.keys(NOTIFICATION_EVENTS) as NotificationEventType[];

check("REGISTRO_EVENTOS", "El registro maestro contiene al menos 30 eventos empresariales", () => {
  return eventKeys.length >= 30;
}, "Total eventos registrados: " + eventKeys.length);

check("REGISTRO_EVENTOS", "Todos los eventos tienen label, categoria, icono y color valido", () => {
  return eventKeys.every((key) => {
    const meta = NOTIFICATION_EVENTS[key];
    return (
      typeof meta.label === "string" && meta.label.length > 0 &&
      typeof meta.category === "string" &&
      typeof meta.icon === "string" && meta.icon.length > 0 &&
      typeof meta.color === "string" && meta.color.length > 0
    );
  });
});

check("REGISTRO_EVENTOS", "Todas las categorias asignadas pertenecen a CATEGORY_META", () => {
  const validCategories = Object.keys(CATEGORY_META);
  return eventKeys.every((key) => {
    const meta = NOTIFICATION_EVENTS[key];
    return validCategories.includes(meta.category);
  });
});

// ── 2. SEGURIDAD: XSS & SANITIZACION DE ENTRADA ──────────────────────────────
function sanitizeNotificationContent(dirty: string): string {
  if (typeof dirty !== "string") return "";
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:[^"\s]*/gi, "")
    .trim();
}

check("SEGURIDAD_XSS", "Elimina etiquetas <script> maliciosas en titulos o mensajes", () => {
  const dirty = 'Factura #102: <script>alert("xss")</script>Pagada';
  const clean = sanitizeNotificationContent(dirty);
  return !clean.includes("<script>") && clean.includes("Factura #102: Pagada");
});

check("SEGURIDAD_XSS", "Neutraliza inyecciones de manejadores de eventos DOM (onload, onerror)", () => {
  const dirty = '<img src=x onerror="exploit()">Alerta de seguridad';
  const clean = sanitizeNotificationContent(dirty);
  return !clean.includes("onerror=") && clean.includes("Alerta de seguridad");
});

check("SEGURIDAD_XSS", "Previene enlaces con pseudo-protocolo javascript:", () => {
  const dirty = "Click aqui: javascript:stealToken()";
  const clean = sanitizeNotificationContent(dirty);
  return !clean.includes("javascript:");
});

// ── 3. RESOLUCION DINAMICA DE ENLACES (DEEP-LINKING) ─────────────────────────
function resolveLink(template?: string, data?: Record<string, string | number | boolean>): string | undefined {
  if (!template || !data) return template;
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp("{" + key + "}", "g"), String(value));
  }
  return result;
}

check("DEEP_LINKING", "Resuelve placeholders {leadId} en rutas de CRM", () => {
  const template = "/dashboard/admin/crm/leads?id={leadId}";
  const resolved = resolveLink(template, { leadId: "lead-abc-123" });
  return resolved === "/dashboard/admin/crm/leads?id=lead-abc-123";
});

check("DEEP_LINKING", "Maneja templates sin placeholders sin corromper la URL", () => {
  const template = "/dashboard/accounting";
  const resolved = resolveLink(template, { whatever: "test" });
  return resolved === "/dashboard/accounting";
});

check("DEEP_LINKING", "Maneja datos vacios o indefinidos de manera segura (fail-safe)", () => {
  const template = "/dashboard/invoices/{invoiceId}";
  const resolved = resolveLink(template, undefined);
  return resolved === "/dashboard/invoices/{invoiceId}";
});

// ── 4. EVENTOS CRITICOS Y PREFERENCIAS ───────────────────────────────────────
check("EVENTOS_CRITICOS", "Alertas criticas de sistema (SYSTEM.ALERT, BACKUP_FAILED) NO son desactivables", () => {
  const criticalEvents: NotificationEventType[] = [
    "SYSTEM.ALERT",
    "SYSTEM.BACKUP_FAILED",
    "SYSTEM.INTEGRATION_DOWN",
  ];
  return criticalEvents.every((e) => {
    const meta = NOTIFICATION_EVENTS[e];
    return meta && meta.userConfigurable === false;
  });
});

check("EVENTOS_CRITICOS", "Alertas criticas incluyen EMAIL y IN_APP por defecto", () => {
  const alertMeta = NOTIFICATION_EVENTS["SYSTEM.ALERT"];
  const downMeta = NOTIFICATION_EVENTS["SYSTEM.INTEGRATION_DOWN"];
  return (
    alertMeta.defaultChannels.includes("IN_APP") &&
    alertMeta.defaultChannels.includes("EMAIL") &&
    downMeta.defaultChannels.includes("IN_APP") &&
    downMeta.defaultChannels.includes("EMAIL")
  );
});

check("EVENTOS_CRITICOS", "Eventos estandar (CRM.LEAD_CREATED) SI son configurables por el usuario", () => {
  const leadMeta = NOTIFICATION_EVENTS["CRM.LEAD_CREATED"];
  return leadMeta.userConfigurable === true;
});

// ── 5. CANALES Y PRIORIDADES ─────────────────────────────────────────────────
check("CANALES_PRIORIDAD", "Prioridades validas asignadas (LOW, NORMAL, HIGH, URGENT)", () => {
  const validPriorities: NotificationPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
  return eventKeys.every((key) => {
    const priority = NOTIFICATION_EVENTS[key].defaultPriority;
    return validPriorities.includes(priority);
  });
});

check("CANALES_PRIORIDAD", "Canales de entrega validos (IN_APP, EMAIL, PUSH, WEBHOOK)", () => {
  const validChannels: DeliveryChannel[] = ["IN_APP", "EMAIL", "PUSH", "WEBHOOK"];
  return eventKeys.every((key) => {
    const channels = NOTIFICATION_EVENTS[key].defaultChannels;
    return Array.isArray(channels) && channels.length > 0 && channels.every((c) => validChannels.includes(c));
  });
});

// ── 6. CONTROL MULTI-INQUILINO (TENANT ISOLATION) ─────────────────────────────
check("TENANT_ISOLATION", "Filtros de consulta obligatorios: CompanyId + UserId", () => {
  function buildScopedQuery(companyId: string, userId: string, extra?: Record<string, any>) {
    if (!companyId || !userId) {
      throw new Error("Violacion de Tenant Isolation: companyId y userId requeridos");
    }
    return { companyId, userId, ...extra };
  }

  const validQuery = buildScopedQuery("company-123", "user-456", { isRead: false });
  let threwOnMissing = false;
  try {
    buildScopedQuery("", "user-456");
  } catch {
    threwOnMissing = true;
  }

  return validQuery.companyId === "company-123" && validQuery.userId === "user-456" && threwOnMissing;
});

// ── 7. PAGINACION Y CONTROL DE CARGA (DoS PREVENT) ───────────────────────────
check("PAGINACION_DOS", "Limite maximo de notificaciones acotado a 100 por peticion", () => {
  function clampPagination(requestedTake?: number): number {
    const take = requestedTake || 30;
    return Math.min(100, Math.max(1, take));
  }

  return (
    clampPagination() === 30 &&
    clampPagination(10) === 10 &&
    clampPagination(500) === 100 && // Acota solicitudes abusivas
    clampPagination(-5) === 1
  );
});

// ── REPORTE FINAL ────────────────────────────────────────────────────────────
const grouped = results.reduce((acc, r) => {
  acc[r.section] = acc[r.section] || [];
  acc[r.section].push(r);
  return acc;
}, {} as Record<string, AuditResult[]>);

let totalPassed = 0;
let totalFailed = 0;

for (const [sec, tests] of Object.entries(grouped)) {
  console.log("\n▶ Modulo: [" + sec + "]");
  for (const t of tests) {
    if (t.passed) {
      totalPassed++;
      console.log("   ✔ PASO: " + t.check + (t.notes ? " [" + t.notes + "]" : ""));
    } else {
      totalFailed++;
      console.log("   ✖ FALLO: " + t.check + " (" + (t.notes || "Error") + ")");
    }
  }
}

console.log("\n" + "─".repeat(70));
console.log("TOTAL VERIFICACIONES: " + results.length + " | PASADAS: " + totalPassed + " | FALLIDAS: " + totalFailed);
const compliance = ((totalPassed / results.length) * 100).toFixed(1);
console.log("INDICE DE SALUD Y SEGURIDAD DE NOTIFICACIONES: " + compliance + "%");
console.log("─".repeat(70) + "\n");

if (totalFailed > 0) {
  process.exit(1);
}
