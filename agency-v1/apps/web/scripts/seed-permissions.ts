/**
 * scripts/seed-permissions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Permission Synchronization Script
 *
 * Ensures every permission defined in MASTER_PERMISSIONS exists
 * in the Permission table. Never deletes or modifies existing permissions.
 *
 * RUN:  npx tsx scripts/seed-permissions.ts
 * SAFE: Idempotent — can be run multiple times without side effects.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MASTER_PERMISSIONS = [
    { module: "dashboard", name: "dashboard.view", description: "Ver el dashboard principal" },
    { module: "iam", name: "iam.view_users", description: "Ver lista de usuarios" },
    { module: "iam", name: "iam.manage_users", description: "Gestionar usuarios (invitar, desactivar)" },
    { module: "iam", name: "iam.manage_roles", description: "Gestionar roles y permisos" },
    { module: "iam", name: "iam.view_security", description: "Ver configuración de seguridad" },
    { module: "iam", name: "manage_settings", description: "Gestionar configuración general" },
    { module: "calendar", name: "calendar.view", description: "Ver eventos del calendario" },
    { module: "calendar", name: "calendar.create", description: "Crear eventos" },
    { module: "calendar", name: "calendar.delete", description: "Eliminar eventos" },
    { module: "crm", name: "crm.view_own", description: "Ver leads propios" },
    { module: "crm", name: "crm.view_all", description: "Ver todos los leads" },
    { module: "crm", name: "crm.edit", description: "Editar leads y deals" },
    { module: "crm", name: "crm.delete", description: "Eliminar leads" },
    { module: "crm", name: "crm.export", description: "Exportar datos del CRM" },
    { module: "crm", name: "crm.pipeline", description: "Gestionar pipeline de ventas" },
    { module: "crm", name: "crm.tasks", description: "Gestionar tareas del CRM" },
    { module: "crm", name: "crm.reports", description: "Ver reportes del CRM" },
    { module: "crm", name: "crm.templates", description: "Gestionar plantillas del CRM" },
    { module: "crm", name: "crm.scoring", description: "Configurar Lead Scoring" },
    { module: "crm", name: "crm.commissions", description: "Ver y gestionar comisiones" },
    { module: "crm", name: "crm.sequences", description: "Gestionar secuencias de email" },
    { module: "crm", name: "crm.automation", description: "Configurar reglas de automatización CRM" },
    { module: "marketing", name: "mkt.view", description: "Ver módulo de marketing" },
    { module: "marketing", name: "mkt.campaigns", description: "Gestionar campañas" },
    { module: "marketing", name: "mkt.spend", description: "Ver presupuesto publicitario" },
    { module: "marketing", name: "mkt.links", description: "Gestionar links de tracking" },
    { module: "marketing", name: "mkt.edit", description: "Editar contenido de marketing" },
    { module: "marketing", name: "mkt.send", description: "Enviar campañas" },
    { module: "marketing", name: "mkt.integrations", description: "Configurar integraciones de marketing" },
    { module: "marketing", name: "mkt.creative", description: "Acceder al Creative Studio" },
    { module: "marketing", name: "mkt.ab_testing", description: "Gestionar A/B testing" },
    { module: "automation", name: "automation.view", description: "Ver workflows" },
    { module: "automation", name: "automation.manage", description: "Crear y editar workflows" },
    { module: "inbox", name: "inbox.view", description: "Ver conversaciones del inbox" },
    { module: "inbox", name: "inbox.send", description: "Enviar mensajes" },
    { module: "inbox", name: "inbox.manage", description: "Gestionar conversaciones y asignaciones" },
    { module: "content", name: "content.view", description: "Ver posts y contenido" },
    { module: "content", name: "content.create", description: "Crear contenido" },
    { module: "content", name: "content.publish", description: "Publicar contenido" },
    { module: "content", name: "content.delete", description: "Eliminar contenido" },
    { module: "projects", name: "projects.view", description: "Ver proyectos" },
    { module: "projects", name: "projects.create", description: "Crear proyectos" },
    { module: "projects", name: "projects.manage", description: "Gestionar proyectos" },
    { module: "analytics", name: "analytics.view", description: "Ver analítica" },
    { module: "analytics", name: "analytics.reports", description: "Ver reportes avanzados" },
    { module: "analytics", name: "analytics.export", description: "Exportar datos analíticos" },
    { module: "assets", name: "assets.upload", description: "Subir archivos y medios" },
    { module: "assets", name: "assets.delete", description: "Eliminar archivos y medios" },
    { module: "team", name: "team.view", description: "Ver miembros del equipo" },
    { module: "team", name: "team.invite", description: "Invitar miembros" },
    { module: "team", name: "team.roles", description: "Asignar roles a miembros" },
    { module: "finance", name: "treasury.view", description: "Ver tesorería y facturas" },
    { module: "finance", name: "treasury.manage", description: "Gestionar tesorería" },
    { module: "finance", name: "treasury.export", description: "Exportar datos financieros" },
    { module: "finance", name: "payroll.view", description: "Ver nómina y operaciones" },
    { module: "finance", name: "payroll.manage", description: "Procesar nómina" },
    { module: "finance", name: "payroll.approve", description: "Aprobar pagos de nómina" },
    { module: "proposals", name: "proposals.view", description: "Ver propuestas comerciales" },
    { module: "proposals", name: "proposals.manage", description: "Crear y gestionar propuestas" },
    { module: "agents", name: "agents.view", description: "Ver agentes de IA configurados" },
    { module: "agents", name: "agents.manage", description: "Crear y editar agentes de IA" },
    { module: "agents", name: "agents.deploy", description: "Desplegar agentes en producción" },
    { module: "video", name: "video.view", description: "Ver contenido de video" },
    { module: "video", name: "video.manage", description: "Crear y editar videos" },
    { module: "notifications", name: "notifications.view", description: "Ver configuración de notificaciones" },
    { module: "notifications", name: "notifications.manage", description: "Gestionar preferencias de notificaciones" },
    { module: "hr", name: "hr.view", description: "Ver módulo de RRHH" },
    { module: "hr", name: "hr.manage", description: "Gestionar RRHH y time tracking" },
];

async function main() {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  LegacyMark — Permission Seed Script");
    console.log("═══════════════════════════════════════════════════════════\n");

    const existing = await prisma.permission.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((p) => p.name));

    let created = 0;
    let skipped = 0;

    for (const perm of MASTER_PERMISSIONS) {
        if (existingNames.has(perm.name)) {
            skipped++;
            continue;
        }

        await prisma.permission.create({
            data: { name: perm.name, module: perm.module, description: perm.description, isActive: true },
        });

        console.log(`  ✅ Created: ${perm.module} → ${perm.name}`);
        created++;
    }

    console.log(`\n──────────────────────────────────────────────────────────`);
    console.log(`  Results: ${created} created, ${skipped} already existed`);
    console.log(`  Total permissions in DB: ${existingNames.size + created}`);
    console.log(`══════════════════════════════════════════════════════════\n`);
}

main()
    .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });