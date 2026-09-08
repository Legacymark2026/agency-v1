/**
 * scripts/audit-rbac-complete.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Auditoria Integral y Exhaustiva del Sistema de Roles y Permisos (RBAC).
 */

import {
  isPublicRoute,
  isStandardRole,
  canAccessRoute,
  canCustomRoleAccess,
  getAccessibleRoutes,
  PUBLIC_ROUTES,
  PUBLIC_PREFIXES,
  ROUTE_PERMISSIONS,
  STANDARD_ROLES,
} from "../lib/rbac";
import { UserRole } from "../types/auth";

interface AuditResult {
  category: string;
  testName: string;
  passed: boolean;
  details?: string;
}

const results: AuditResult[] = [];

function audit(category: string, testName: string, fn: () => boolean | void, details?: string) {
  try {
    const res = fn();
    const passed = res !== false;
    results.push({ category, testName, passed, details });
  } catch (err: any) {
    results.push({ category, testName, passed: false, details: err?.message || String(err) });
  }
}

console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
console.log("║           AUDITORIA INTEGRAL DE SEGURIDAD RBAC — LEGACYMARK          ║");
console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

// ── 1. AUDITORIA DE SUPER_ADMIN ──────────────────────────────────────────────
audit("SUPER_ADMIN", "Acceso total a rutas de maxima seguridad (/dashboard/security)", () => {
  return canAccessRoute("/dashboard/security", UserRole.SUPER_ADMIN) === true;
});
audit("SUPER_ADMIN", "Acceso a administracion de usuarios y roles (/dashboard/users, /dashboard/roles)", () => {
  return canAccessRoute("/dashboard/users", UserRole.SUPER_ADMIN) === true &&
         canAccessRoute("/dashboard/roles", UserRole.SUPER_ADMIN) === true;
});
audit("SUPER_ADMIN", "Acceso a rutas financieras y nomina (/dashboard/accounting, /dashboard/admin/payroll)", () => {
  return canAccessRoute("/dashboard/accounting", UserRole.SUPER_ADMIN) === true &&
         canAccessRoute("/dashboard/admin/payroll", UserRole.SUPER_ADMIN) === true;
});
audit("SUPER_ADMIN", "Acceso a rutas no catalogadas (bypass universal garantizado)", () => {
  return canAccessRoute("/dashboard/future-undocumented-module", UserRole.SUPER_ADMIN) === true;
});

// ── 2. AUDITORIA DE ADMIN (Project Manager) ──────────────────────────────────
audit("ADMIN", "Acceso concedido a gestion de proyectos y tareas", () => {
  return canAccessRoute("/dashboard/projects", UserRole.ADMIN) === true;
});
audit("ADMIN", "Acceso concedido a contabilidad y finanzas operativas", () => {
  return canAccessRoute("/dashboard/accounting", UserRole.ADMIN) === true &&
         canAccessRoute("/dashboard/invoicing", UserRole.ADMIN) === true;
});
audit("ADMIN", "BLOQUEADO de rutas exclusivas de SuperAdmin (/dashboard/security)", () => {
  return canAccessRoute("/dashboard/security", UserRole.ADMIN) === false;
});
audit("ADMIN", "BLOQUEADO del portal exclusivo de clientes (/dashboard/client)", () => {
  return canAccessRoute("/dashboard/client", UserRole.ADMIN) === false;
});

// ── 3. AUDITORIA DE CONTENT_MANAGER (Marketing / SEO) ────────────────────────
audit("CONTENT_MANAGER", "Acceso concedido a analitica, campanas y CMS", () => {
  return canAccessRoute("/dashboard/analytics", UserRole.CONTENT_MANAGER) === true &&
         canAccessRoute("/dashboard/marketing/campaigns", UserRole.CONTENT_MANAGER) === true &&
         canAccessRoute("/dashboard/posts", UserRole.CONTENT_MANAGER) === true;
});
audit("CONTENT_MANAGER", "BLOQUEADO de nomina electronica (/dashboard/admin/payroll)", () => {
  return canAccessRoute("/dashboard/admin/payroll", UserRole.CONTENT_MANAGER) === false;
});
audit("CONTENT_MANAGER", "BLOQUEADO de gestion de usuarios del sistema (/dashboard/users)", () => {
  return canAccessRoute("/dashboard/users", UserRole.CONTENT_MANAGER) === false;
});
audit("CONTENT_MANAGER", "BLOQUEADO de configuracion de seguridad (/dashboard/security)", () => {
  return canAccessRoute("/dashboard/security", UserRole.CONTENT_MANAGER) === false;
});

// ── 4. AUDITORIA DE CLIENT_ADMIN (Ventas / CRM) ──────────────────────────────
audit("CLIENT_ADMIN", "Acceso concedido al Pipeline comercial y Leads", () => {
  return canAccessRoute("/dashboard/admin/crm", UserRole.CLIENT_ADMIN) === true &&
         canAccessRoute("/dashboard/admin/crm/leads", UserRole.CLIENT_ADMIN) === true &&
         canAccessRoute("/dashboard/admin/crm/pipeline", UserRole.CLIENT_ADMIN) === true;
});
audit("CLIENT_ADMIN", "BLOQUEADO de nomina interna (/dashboard/admin/payroll)", () => {
  return canAccessRoute("/dashboard/admin/payroll", UserRole.CLIENT_ADMIN) === false;
});
audit("CLIENT_ADMIN", "BLOQUEADO de seguridad y roles (/dashboard/security, /dashboard/roles)", () => {
  return canAccessRoute("/dashboard/security", UserRole.CLIENT_ADMIN) === false &&
         canAccessRoute("/dashboard/roles", UserRole.CLIENT_ADMIN) === false;
});

// ── 5. AUDITORIA DE CLIENT_USER (Creativo Junior) ────────────────────────────
audit("CLIENT_USER", "Acceso basico concedido a tareas y posts", () => {
  return canAccessRoute("/dashboard/posts", UserRole.CLIENT_USER) === true &&
         canAccessRoute("/dashboard/projects", UserRole.CLIENT_USER) === true;
});
audit("CLIENT_USER", "BLOQUEADO de metricas de gasto de marketing (/dashboard/marketing/spend)", () => {
  return canAccessRoute("/dashboard/marketing/spend", UserRole.CLIENT_USER) === false;
});
audit("CLIENT_USER", "BLOQUEADO de contabilidad y facturacion", () => {
  return canAccessRoute("/dashboard/accounting", UserRole.CLIENT_USER) === false &&
         canAccessRoute("/dashboard/invoicing", UserRole.CLIENT_USER) === false;
});
audit("CLIENT_USER", "BLOQUEADO de administracion y seguridad", () => {
  return canAccessRoute("/dashboard/users", UserRole.CLIENT_USER) === false &&
         canAccessRoute("/dashboard/security", UserRole.CLIENT_USER) === false;
});

// ── 6. AUDITORIA DE EXTERNAL_CLIENT (Portal Cliente) ─────────────────────────
audit("EXTERNAL_CLIENT", "Acceso exclusivo al portal del cliente (/dashboard/client)", () => {
  return canAccessRoute("/dashboard/client", UserRole.EXTERNAL_CLIENT) === true &&
         canAccessRoute("/dashboard/client/projects", UserRole.EXTERNAL_CLIENT) === true;
});
audit("EXTERNAL_CLIENT", "BLOQUEADO de rutas internas de administracion", () => {
  return canAccessRoute("/dashboard/users", UserRole.EXTERNAL_CLIENT) === false &&
         canAccessRoute("/dashboard/security", UserRole.EXTERNAL_CLIENT) === false &&
         canAccessRoute("/dashboard/admin/payroll", UserRole.EXTERNAL_CLIENT) === false &&
         canAccessRoute("/dashboard/admin/crm", UserRole.EXTERNAL_CLIENT) === false;
});

// ── 7. AUDITORIA DE GUEST (Invitado no autenticado) ──────────────────────────
audit("GUEST", "BLOQUEO TOTAL de acceso a cualquier seccion del dashboard", () => {
  const routes = ["/dashboard", "/dashboard/posts", "/dashboard/accounting", "/dashboard/security", "/dashboard/client"];
  return routes.every((r) => canAccessRoute(r, UserRole.GUEST) === false);
});

// ── 8. AUDITORIA DE ROLES PERSONALIZADOS (Custom Roles Sandbox) ──────────────
audit("CUSTOM_ROLES", "Aislamiento estricto: un rol custom sin rutas no accede a nada", () => {
  return canAccessRoute("/dashboard/accounting", "auditor_externo", []) === false &&
         canAccessRoute("/dashboard", "auditor_externo", []) === false;
});
audit("CUSTOM_ROLES", "Acceso granular permitido a las rutas explicitas en allowedRoutes", () => {
  const allowed = ["/dashboard/accounting", "/dashboard/analytics"];
  return canAccessRoute("/dashboard/accounting", "auditor_externo", allowed) === true &&
         canAccessRoute("/dashboard/analytics", "auditor_externo", allowed) === true &&
         canAccessRoute("/dashboard/security", "auditor_externo", allowed) === false;
});
audit("CUSTOM_ROLES", "Anti-Escalamiento: /dashboard NO otorga acceso comodin a subrutas", () => {
  const allowed = ["/dashboard"];
  return canCustomRoleAccess(allowed, "/dashboard") === true &&
         canCustomRoleAccess(allowed, "/dashboard/security") === false &&
         canCustomRoleAccess(allowed, "/dashboard/users") === false;
});

// ── 9. AUDITORIA DE RUTAS PUBLICAS Y WEBHOOKS ────────────────────────────────
audit("PUBLIC_ROUTES", "Rutas publicas accesibles sin token (/auth/login, /terms, etc.)", () => {
  return isPublicRoute("/") === true &&
         isPublicRoute("/auth/login") === true &&
         isPublicRoute("/terms") === true &&
         isPublicRoute("/politica-privacidad") === true;
});
audit("PUBLIC_ROUTES", "Webhooks y endpoints API publicos reconocidos", () => {
  return isPublicRoute("/api/webhooks/whatsapp") === true &&
         isPublicRoute("/api/leads/submit") === true;
});
audit("PUBLIC_ROUTES", "Dashboard y modulos protegidos NUNCA se clasifican como publicos", () => {
  return isPublicRoute("/dashboard") === false &&
         isPublicRoute("/dashboard/accounting") === false &&
         isPublicRoute("/dashboard/security") === false;
});

// ── IMPRESION DEL REPORTE ───────────────────────────────────────────────────
const grouped = results.reduce((acc, r) => {
  acc[r.category] = acc[r.category] || [];
  acc[r.category].push(r);
  return acc;
}, {} as Record<string, AuditResult[]>);

let totalPassed = 0;
let totalFailed = 0;

for (const [cat, tests] of Object.entries(grouped)) {
  console.log("\n▶ Categoria: [" + cat + "]");
  for (const t of tests) {
    if (t.passed) {
      totalPassed++;
      console.log("   ✔ PASO: " + t.testName);
    } else {
      totalFailed++;
      console.log("   ✖ FALLO: " + t.testName + " (" + (t.details || "Discrepancia") + ")");
    }
  }
}

console.log("\n" + "─".repeat(70));
console.log("TOTAL PRUEBAS: " + results.length + " | PASADAS: " + totalPassed + " | FALLIDAS: " + totalFailed);
const complianceRate = ((totalPassed / results.length) * 100).toFixed(1);
console.log("INDICE DE CONFORMIDAD DE SEGURIDAD RBAC: " + complianceRate + "%");
console.log("─".repeat(70) + "\n");

if (totalFailed > 0) {
  process.exit(1);
}
