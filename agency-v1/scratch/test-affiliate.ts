import fs from "fs";
import path from "path";
import Redis from "ioredis";
import { prisma, Prisma } from "@agency/database";
import { EventBus } from "@agency/events";

// 1. Cargar variables de entorno del monorepo
const rootDir = path.resolve(__dirname, "..");
const envPath = path.resolve(rootDir, ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const index = trimmed.indexOf("=");
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  });
}

console.log("Loaded Database URL:", process.env.CORE_DATABASE_URL || process.env.DATABASE_URL);
console.log("Loaded Redis URL:", process.env.REDIS_URL);

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
const eventBus = new EventBus(redisUrl, "test-suite");

async function runTests() {
  console.log("🏁 Starting Affiliate Service Integration Test...");

  // Importar dinámicamente para garantizar que las variables de entorno ya estén cargadas
  const { startEventConsumers } = await import("../services/affiliate-service/src/events/consumer");
  const { releaseReferrals } = await import("../services/affiliate-service/src/cron/release-referrals");

  // Inicializar los consumidores de eventos en segundo plano
  startEventConsumers();

  const testCode = "TESTER10";
  const testUserId = "affiliate-user-123";
  const testBuyerId = "buyer-user-456";
  const testOrderId = "order-test-999";
  const testSelfOrderId = "order-self-888";

  try {
    // ── Limpieza previa ───────────────────────────────────────────────────────
    console.log("🧹 Cleaning up old test data...");
    await (prisma as any).click.deleteMany({ where: { affiliateCode: testCode } }).catch(() => {});
    await (prisma as any).referral.deleteMany({ where: { orderId: { in: [testOrderId, testSelfOrderId] } } }).catch(() => {});
    await (prisma as any).affiliateProfile.deleteMany({ where: { code: testCode } }).catch(() => {});
    await (prisma as any).commissionPlan.deleteMany({ where: { name: "Test Commission Plan" } }).catch(() => {});

    // ── Crear Plan y Perfil de Afiliado ─────────────────────────────────────────
    console.log("📝 Creating test Commission Plan and Affiliate Profile...");
    const plan = await (prisma as any).commissionPlan.create({
      data: {
        name: "Test Commission Plan",
        type: "PERCENTAGE",
        value: new Prisma.Decimal("10.00"), // 10%
        cookieLifetimeInt: 30
      }
    });

    const affiliate = await (prisma as any).affiliateProfile.create({
      data: {
        userId: testUserId,
        code: testCode,
        status: "ACTIVE",
        commissionPlanId: plan.id
      }
    });

    console.log(`✅ Affiliate Profile created. Code: ${affiliate.code}, Plan ID: ${plan.id}`);

    // ── PRUEBA 1: Registro de Click de Afiliado ──────────────────────────────────
    console.log("🧪 TEST 1: Simulating click event registration...");
    await eventBus.publish("affiliate.click_registered", {
      code: testCode,
      ip: "127.0.0.1",
      userAgent: "TestBrowser",
      referer: "http://test-referer.com"
    });

    console.log("Waiting for event consumer to write click to database...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const clicks = await (prisma as any).click.findMany({
      where: { affiliateCode: testCode }
    });

    if (clicks.length === 1 && clicks[0].ip === "127.0.0.1") {
      console.log("✅ TEST 1 PASSED: Click successfully recorded in DB asynchronously!");
    } else {
      throw new Error(`TEST 1 FAILED: Expected 1 click, found ${clicks.length}`);
    }

    // ── PRUEBA 2: Atribución de Comisión (order.completed) ──────────────────────
    console.log("🧪 TEST 2: Simulating order.completed event with affiliate tracking...");
    await eventBus.publish("order.completed", {
      orderId: testOrderId,
      userId: testBuyerId,
      amount: 150.00,
      affiliateCode: testCode
    });

    console.log("Waiting for event consumer to process commission...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const referral = await (prisma as any).referral.findUnique({
      where: { orderId: testOrderId }
    });

    if (referral && referral.status === "PENDING" && Number(referral.commissionAmount) === 15.00) {
      console.log(`✅ TEST 2 PASSED: Commission attributed correctly! Referral Amount: ${referral.orderAmount}, Commission: ${referral.commissionAmount}`);
    } else {
      throw new Error(`TEST 2 FAILED: Referral not created or amount incorrect. Referral: ${JSON.stringify(referral)}`);
    }

    // ── PRUEBA 3: Prevención de Auto-Afiliación (Self-Referral) ─────────────────
    console.log("🧪 TEST 3: Simulating order.completed where buyer is the affiliate...");
    await eventBus.publish("order.completed", {
      orderId: testSelfOrderId,
      userId: testUserId, // el mismo que el del perfil
      amount: 100.00,
      affiliateCode: testCode
    });

    console.log("Waiting for event consumer to validate self-referral...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const selfReferral = await (prisma as any).referral.findUnique({
      where: { orderId: testSelfOrderId }
    });

    if (selfReferral && selfReferral.status === "REJECTED" && Number(selfReferral.commissionAmount) === 0) {
      console.log("✅ TEST 3 PASSED: Self-referral correctly detected and REJECTED!");
    } else {
      throw new Error(`TEST 3 FAILED: Self-referral commission was not rejected. Referral: ${JSON.stringify(selfReferral)}`);
    }

    // ── PRUEBA 4: Idempotencia (order.completed duplicado) ───────────────────────
    console.log("🧪 TEST 4: Simulating duplicate order.completed event...");
    // Intentamos procesar el mismo orderId con diferente monto
    await eventBus.publish("order.completed", {
      orderId: testOrderId,
      userId: testBuyerId,
      amount: 500.00,
      affiliateCode: testCode
    });

    console.log("Waiting for event consumer...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const referralAfterDup = await (prisma as any).referral.findUnique({
      where: { orderId: testOrderId }
    });

    if (referralAfterDup && Number(referralAfterDup.commissionAmount) === 15.00) {
      console.log("✅ TEST 4 PASSED: Idempotency check works! Duplicate order completed event was ignored.");
    } else {
      throw new Error(`TEST 4 FAILED: Duplicate event mutated the commission amount! Amount: ${referralAfterDup?.commissionAmount}`);
    }

    // ── PRUEBA 5: Reversión por Devolución (order.refunded) ──────────────────────
    console.log("🧪 TEST 5: Simulating order.refunded event...");
    await eventBus.publish("order.refunded", {
      orderId: testOrderId
    });

    console.log("Waiting for event consumer to process refund...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const refundedReferral = await (prisma as any).referral.findUnique({
      where: { orderId: testOrderId }
    });

    if (refundedReferral && refundedReferral.status === "REJECTED") {
      console.log("✅ TEST 5 PASSED: Commission successfully rejected due to order refund!");
    } else {
      throw new Error(`TEST 5 FAILED: Commission was not transitioned to REJECTED. Status: ${refundedReferral?.status}`);
    }

    // ── PRUEBA 6: Liberación de comisiones pasadas por Cron ──────────────────────
    console.log("🧪 TEST 6: Testing release of expired warranties via Cron Job...");
    // Para probarlo, crearemos un referral manual PENDING y cambiaremos su fecha
    const backdatedReferral = await (prisma as any).referral.create({
      data: {
        affiliateId: affiliate.id,
        referredUserId: "other-buyer-777",
        orderId: "backdated-order-000",
        orderAmount: new Prisma.Decimal("200.00"),
        commissionAmount: new Prisma.Decimal("20.00"),
        status: "PENDING",
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // hace 20 días
      }
    });

    // Ejecutar el cron consolidando periodos de garantía mayores a 15 días
    const cronResult = await releaseReferrals(15);

    const checkedReferral = await (prisma as any).referral.findUnique({
      where: { id: backdatedReferral.id }
    });

    if (checkedReferral && checkedReferral.status === "APPROVED" && cronResult.releasedCount >= 1) {
      console.log(`✅ TEST 6 PASSED: Cron job released backdated referral! Released count: ${cronResult.releasedCount}`);
    } else {
      throw new Error(`TEST 6 FAILED: Backdated referral status remains: ${checkedReferral?.status}`);
    }

    // ── Limpieza final de prueba ──────────────────────────────────────────────
    console.log("🧹 Cleaning up test database entries...");
    await (prisma as any).click.deleteMany({ where: { affiliateCode: testCode } }).catch(() => {});
    await (prisma as any).referral.deleteMany({ where: { orderId: { in: [testOrderId, testSelfOrderId, "backdated-order-000"] } } }).catch(() => {});
    await (prisma as any).affiliateProfile.deleteMany({ where: { code: testCode } }).catch(() => {});
    await (prisma as any).commissionPlan.deleteMany({ where: { name: "Test Commission Plan" } }).catch(() => {});

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The Affiliate microservice design and implementation are extremely solid and robust.");

  } catch (error) {
    console.error("\n❌ TEST SUITE RUN ENCOUNTERED AN ERROR:", error);
    process.exit(1);
  } finally {
    // Cerrar conexiones
    await redis.quit();
    await eventBus.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
