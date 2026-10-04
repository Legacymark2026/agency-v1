import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runDunning() {
    console.log("🚀 Iniciando Motor Automático de Cobranza (Dunning)...");
    
    try {
        const today = new Date();
        
        // Find invoices that are DRAFT_AWAITING_PAYMENT and past due
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: "DRAFT_AWAITING_PAYMENT",
                dueDate: {
                    lt: today
                },
                clientEmail: {
                    not: null
                }
            },
            include: {
                company: true
            }
        });

        if (overdueInvoices.length === 0) {
            console.log("✅ No hay facturas vencidas pendientes de notificación.");
            return;
        }

        console.log(`⚠️ Encontradas ${overdueInvoices.length} facturas vencidas. Procesando envíos...`);

        for (const invoice of overdueInvoices) {
            if (!invoice.clientEmail) continue;

            const daysOverdue = Math.floor((today.getTime() - invoice.dueDate!.getTime()) / (1000 * 3600 * 24));
            
            // In a real app, you would use Resend/AWS SES here
            console.log(`📧 [EMAIL MOCK] Enviando alerta a ${invoice.clientEmail} | Factura: ${invoice.id.split('-')[0]} | Días vencido: ${daysOverdue} | Total: $${invoice.finalAmount}`);
            
            // Log the communication in the DB (NotificationDeliveryLog or CRMActivity)
            // This is mocked for demonstration
        }

        console.log("✅ Motor de cobranza finalizado correctamente.");
    } catch (error) {
        console.error("❌ Error en Dunning Job:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runDunning();
