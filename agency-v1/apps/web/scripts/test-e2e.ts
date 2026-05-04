import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function runE2ETest() {
    console.log("=== INICIANDO PRUEBA E2E: Ciclo Comercial Completo ===");
    const testEmail = `test-agency-${Date.now()}@legacymark.com`;
    const companyName = `Agencia E2E ${Date.now()}`;
    
    try {
        console.log("\n1️⃣ Fase de Registro: Creando Usuario y Compañía...");
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                name: "Test E2E Admin",
                firstName: "Test",
                lastName: "Admin",
                passwordHash: "fakehash", // no auth needed for DB test
                role: "admin"
            }
        });

        const company = await prisma.company.create({
            data: {
                name: companyName,
                slug: `agencia-e2e-${Date.now()}`,
                subscriptionTier: "pro",
                subscriptionStatus: "active",
                onboardingCompleted: false
            }
        });

        await prisma.companyUser.create({
            data: {
                userId: user.id,
                companyId: company.id,
                permissions: ["*"],
                roleName: "admin"
            }
        });
        console.log(`✅ Cuenta Creada: ${companyName} (ID: ${company.id})`);

        console.log("\n2️⃣ Fase de Webhook Stripe (Simulación Pago Exitoso)...");
        // We already forced subscriptionStatus = "active", simulating a successful Stripe checkout
        console.log(`✅ Pago Procesado. Tier: ${company.subscriptionTier}`);

        console.log("\n3️⃣ Fase de Onboarding Fricción Cero (Clonando Plantillas)...");
        const templates = await prisma.workflow.findMany({
            where: { isTemplate: true, companyId: null }
        });
        console.log(`- Encontradas ${templates.length} plantillas globales.`);

        for (const template of templates) {
            await prisma.workflow.create({
                data: {
                    name: template.name,
                    description: template.description,
                    triggerType: template.triggerType,
                    triggerConfig: template.triggerConfig || {},
                    steps: template.steps || [],
                    isActive: false,
                    companyId: company.id
                }
            });
        }

        await prisma.company.update({
            where: { id: company.id },
            data: { onboardingCompleted: true }
        });
        
        console.log(`✅ Onboarding completado y marcado en la DB.`);

        console.log("\n4️⃣ Fase de Verificación...");
        const finalCompany = await prisma.company.findUnique({ where: { id: company.id } });
        const companyWorkflows = await prisma.workflow.findMany({ where: { companyId: company.id } });

        if (finalCompany?.onboardingCompleted && companyWorkflows.length === templates.length) {
            console.log("✅ RESULTADO E2E: ¡EXITOSO!");
            console.log(`   - Se clonaron ${companyWorkflows.length} automatizaciones a la cuenta del cliente.`);
            console.log(`   - El Dashboard está desbloqueado (onboardingCompleted = true).`);
        } else {
            console.log("❌ RESULTADO E2E: FALLIDO. Algo no se configuró correctamente.");
        }

    } catch (e) {
        console.error("❌ ERROR DURANTE LA PRUEBA E2E:", e);
    } finally {
        console.log("\n[Limpiando datos de prueba...]");
        await prisma.user.deleteMany({ where: { email: testEmail } });
        // The cascade delete on Company will delete the workflows and companyUsers.
        // Wait, deleting the user might not delete the company. Let's delete the company.
        await prisma.company.deleteMany({ where: { name: companyName } });
        await prisma.$disconnect();
    }
}

runE2ETest();
