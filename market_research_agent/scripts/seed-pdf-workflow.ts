import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando inyección de flujo PDF...");
    const company = await prisma.company.findFirst();
    
    if (!company) {
        console.error("No se encontró ninguna empresa (Company) en la base de datos.");
        process.exit(1);
    }

    const triggerId = `start`;
    const actionId = `email_pdf_${Date.now()}`;

    const newWorkflow = await prisma.workflow.create({
        data: {
            name: "Enviar Correo con PDF Profesional",
            description: "Flujo simple para capturar un evento y enviar un correo electrónico con un PDF adjunto. Solo tienes que configurar el PDF.",
            triggerType: "FORM_SUBMISSION",
            isActive: false,
            triggerConfig: {},
            companyId: company.id,
            steps: [
                {
                    id: triggerId,
                    type: "triggerNode",
                    position: { x: 400, y: 50 },
                    data: {
                        label: "Inicio del Flujo (Form/Webhook)",
                        triggerType: "FORM_SUBMISSION"
                    }
                },
                {
                    id: actionId,
                    type: "actionNode",
                    position: { x: 400, y: 250 },
                    data: {
                        label: "Enviar Correo con PDF",
                        subject: "Aquí tienes tu documento solicitado",
                        body: "Hola,\n\nAdjunto encontrarás el documento PDF que solicitaste. Esperamos que sea de mucha utilidad.\n\nSaludos,\nEl equipo",
                        templateId: "welcome",
                        pdfAttachmentUrl: ""
                    }
                }
            ]
        }
    });

    console.log(`¡Flujo inyectado exitosamente! ID: ${newWorkflow.id}`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
