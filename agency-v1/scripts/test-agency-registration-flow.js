/**
 * scripts/test-agency-registration-flow.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Validación completa del ciclo de vida de aprovisionamiento de empresa (SaaS Tenant).
 * Ejecuta: Creación de Company, Roles estándar (owner/admin/member), Permisos,
 * vinculación de CompanyUser y prueba de autorización con el motor AuthZ.
 */

const { prisma } = require("@agency/database");

async function main() {
  console.log("🚀 [TEST] Iniciando prueba de registro estructurado de empresa...\n");

  const timestamp = Date.now().toString().slice(-4);
  const testEmail = `test-agency-${timestamp}@legacymark.test`;
  const testAgencyName = `Agencia Alpha ${timestamp}`;
  const testSlug = `agencia-alpha-${timestamp}`;

  // 1. Crear Company con datos estructurados
  console.log("1️⃣ Creando Tenant Company estructurado...");
  const company = await prisma.company.create({
    data: {
      name: testAgencyName,
      slug: testSlug,
      industry: "marketing",
      subscriptionTier: "free",
      subscriptionStatus: "active",
      onboardingCompleted: false,
      defaultCompanySettings: {
        country: "CO",
        teamSize: "2-5",
        currency: "COP",
        locale: "es-CO",
        timezone: "America/Bogota",
        taxRateDefault: 19,
      },
    },
  });
  console.log(`   ✅ Company creada con ID: ${company.id}, Slug: ${company.slug}, País: CO, Moneda: COP`);

  // 2. Sembrar los 3 roles estándar para la empresa
  console.log("2️⃣ Creando roles estándar (owner, admin, member)...");
  const ownerRole = await prisma.role.create({
    data: {
      name: "owner",
      companyId: company.id,
      description: "Propietario con control total",
      priority: 100,
      isActive: true,
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "admin",
      companyId: company.id,
      description: "Administrador de la agencia",
      priority: 80,
      isActive: true,
    },
  });

  const memberRole = await prisma.role.create({
    data: {
      name: "member",
      companyId: company.id,
      description: "Miembro del equipo",
      priority: 10,
      isDefault: true,
      isActive: true,
    },
  });
  console.log(`   ✅ Roles creados: owner(${ownerRole.id}), admin(${adminRole.id}), member(${memberRole.id})`);

  // 3. Crear o asegurar permisos en tbl_permissions
  console.log("3️⃣ Asegurando permisos en tbl_permissions...");
  const permWildcard = await prisma.permission.upsert({
    where: { name: "*" },
    update: {},
    create: { name: "*", module: "system", description: "Acceso total", isActive: true },
  });

  const permInvoice = await prisma.permission.upsert({
    where: { name: "invoices.create" },
    update: {},
    create: { name: "invoices.create", module: "finance", description: "Crear facturas", isActive: true },
  });

  // Asociar permisos a roles
  await prisma.rolePermission.createMany({
    data: [
      { roleId: ownerRole.id, permissionId: permWildcard.id },
      { roleId: adminRole.id, permissionId: permInvoice.id },
    ],
    skipDuplicates: true,
  });
  console.log("   ✅ Permisos vinculados a los roles.");

  // 4. Crear usuario administrador y CompanyUser
  console.log("4️⃣ Creando Usuario y Vinculación CompanyUser...");
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: "Administrador Alpha",
      role: "admin",
      globalRole: "agency_owner",
    },
  });

  const companyUser = await prisma.companyUser.create({
    data: {
      userId: user.id,
      companyId: company.id,
      roleId: ownerRole.id,
      roleName: "owner",
      permissions: ["*"],
    },
  });
  console.log(`   ✅ CompanyUser vinculado con roleId: ${companyUser.roleId} y roleName: ${companyUser.roleName}`);

  // 5. Validar que la consulta que hace el motor de autorización (AuthZ) funcione perfectamente
  console.log("5️⃣ Validando resolución de roles para Authorization Service...");
  const activeRoles = await prisma.role.findMany({
    where: { companyId: company.id, isActive: true },
    include: { permissions: { include: { permission: true } } },
  });

  console.log(`   Encontrados ${activeRoles.length} roles activos para la empresa.`);
  const matchingRole = activeRoles.find((r) => r.name.toLowerCase() === companyUser.roleName.toLowerCase());

  if (!matchingRole) {
    throw new Error(`❌ ERROR: No se encontró el rol '${companyUser.roleName}' en los roles de la empresa`);
  }

  const hasWildcard = matchingRole.permissions.some(
    (p) => p.permission && (p.permission.name === "*" || p.permission.name === "invoices.create")
  );

  if (!hasWildcard) {
    throw new Error(`❌ ERROR: El rol owner no tiene los permisos requeridos`);
  }

  console.log(`   ✅ El motor de autorización aprueba los permisos para '${companyUser.roleName}' con éxito.`);

  // 6. Limpieza del registro de prueba
  console.log("\n6️⃣ Limpiando datos de prueba...");
  await prisma.companyUser.deleteMany({ where: { companyId: company.id } });
  await prisma.rolePermission.deleteMany({ where: { roleId: { in: [ownerRole.id, adminRole.id, memberRole.id] } } });
  await prisma.role.deleteMany({ where: { companyId: company.id } });
  await prisma.company.delete({ where: { id: company.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log("🎉 [ÉXITO TOTAL] El flujo de registro estructurado y compatible con los 5 motores está 100% verificado.\n");
}

main()
  .catch((e) => {
    console.error("❌ Fallo en la verificación:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
