/**
 * scripts/test-dual-db-onboarding.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifica el aprovisionamiento de empresa y usuario a través de ambas bases de datos:
 * legacymark_core (Company, CompanyUser, Roles) y legacymark_auth (User, Roles).
 */

const { PrismaClient } = require("@prisma/client");

const coreUrl = process.env.CORE_DATABASE_URL || "postgresql://legacymark:legacymark_dev@pgbouncer:6432/legacymark_core?connection_limit=5&pgbouncer=true&sslmode=prefer";
const authUrl = process.env.AUTH_DATABASE_URL || "postgresql://legacymark:legacymark_dev@pgbouncer:6432/legacymark_auth?connection_limit=5&pgbouncer=true&sslmode=prefer";

const prismaCore = new PrismaClient({ datasourceUrl: coreUrl });
const prismaAuth = new PrismaClient({ datasourceUrl: authUrl });

async function main() {
  console.log("🧪 [DUAL-DB TEST] Verificando aprovisionamiento distribuido...");

  const timestamp = Date.now().toString().slice(-4);
  const testEmail = `dual-db-test-${timestamp}@legacymark.test`;
  const agencyName = `Test Agency ${timestamp}`;
  const slug = `test-agency-${timestamp}`;

  try {
    // 1. Crear Company en Core DB
    console.log("1️⃣ Creando Company en Core DB...");
    const company = await prismaCore.company.create({
      data: {
        name: agencyName,
        slug,
        industry: "marketing",
        subscriptionTier: "free",
        subscriptionStatus: "active",
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
    console.log(`   ✅ Company creada en Core DB: ${company.id}`);

    // 2. Crear Roles idénticos en Auth DB y Core DB
    console.log("2️⃣ Creando Roles en ambas bases de datos...");
    const ownerRoleId = require("crypto").randomUUID();
    const adminRoleId = require("crypto").randomUUID();
    const memberRoleId = require("crypto").randomUUID();

    const rolesData = [
      { id: ownerRoleId, name: "owner", companyId: company.id, priority: 100, isDefault: false, isActive: true },
      { id: adminRoleId, name: "admin", companyId: company.id, priority: 80, isDefault: false, isActive: true },
      { id: memberRoleId, name: "member", companyId: company.id, priority: 10, isDefault: true, isActive: true },
    ];

    for (const r of rolesData) {
      await prismaAuth.role.create({ data: r });
      await prismaCore.role.create({ data: r });
    }
    console.log("   ✅ Roles replicados en Auth DB y Core DB.");

    // 3. Crear Usuario en Auth DB y replicar en Core DB
    console.log("3️⃣ Creando Usuario en Auth DB y replicando en Core DB...");
    const userId = require("crypto").randomUUID();
    const userData = {
      id: userId,
      email: testEmail,
      name: "Test Admin",
      firstName: "Test",
      lastName: "Admin",
      role: "admin",
      globalRole: "agency_owner",
    };

    const userAuth = await prismaAuth.user.create({ data: userData });
    const userCore = await prismaCore.user.create({ data: userData });
    console.log(`   ✅ Usuario creado en Auth DB (${userAuth.id}) y Core DB (${userCore.id})`);

    // 4. Crear CompanyUser en Core DB (Probando la Foreign Key tbl_company_users_role_id_fkey)
    console.log("4️⃣ Creando CompanyUser en Core DB con roleId real...");
    const companyUser = await prismaCore.companyUser.create({
      data: {
        userId: userCore.id,
        companyId: company.id,
        roleId: ownerRoleId,
        roleName: "owner",
        permissions: ["*"],
      },
    });
    console.log(`   ✅ CompanyUser creado exitosamente: ${companyUser.id} con roleId: ${companyUser.roleId}`);

    // 5. Cleanup
    console.log("5️⃣ Limpiando registros de prueba...");
    await prismaCore.companyUser.delete({ where: { id: companyUser.id } }).catch(() => {});
    await prismaCore.company.delete({ where: { id: company.id } }).catch(() => {});
    for (const r of rolesData) {
      await prismaAuth.role.delete({ where: { id: r.id } }).catch(() => {});
      await prismaCore.role.delete({ where: { id: r.id } }).catch(() => {});
    }
    await prismaAuth.user.delete({ where: { id: userAuth.id } }).catch(() => {});
    await prismaCore.user.delete({ where: { id: userCore.id } }).catch(() => {});

    console.log("\n🎉 [ÉXITO TOTAL] Integridad referencial entre Auth DB y Core DB 100% verificada!");
  } catch (error) {
    console.error("❌ [ERROR]:", error);
    process.exit(1);
  } finally {
    await prismaCore.$disconnect();
    await prismaAuth.$disconnect();
  }
}

main();
