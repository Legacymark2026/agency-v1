import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching the first user in the database to send test notifications...");
    const cu = await prisma.companyUser.findFirst({});

    if (!cu) {
        console.error("No valid CompanyUser found!");
        return;
    }

    const companyId = cu.companyId;
    const userId = cu.userId;

    console.log(`Sending test notifications to User ID: ${userId} in Company: ${companyId}`);

    const notifications = [
        {
            companyId,
            userId,
            type: "CRM",
            title: "Nuevo Lead Generado",
            message: "Se ha registrado un nuevo lead desde la campaña de Meta",
            link: "/dashboard/crm",
            isRead: false,
        },
        {
            companyId,
            userId,
            type: "PAYROLL",
            title: "Nómina Procesada",
            message: "La nómina de Abril ha sido generada exitosamente",
            link: "/dashboard/admin/payroll",
            isRead: false,
        },
        {
            companyId,
            userId,
            type: "TREASURY",
            title: "Gasto Operativo Aprobado",
            message: "El gasto 'Licencias Software' ($450,000) ha sido aprobado.",
            link: "/dashboard/admin/treasury/transactions",
            isRead: false,
        },
        {
            companyId,
            userId,
            type: "MARKETING",
            title: "Campaña en Riesgo",
            message: "La campaña 'Spring Sale' ha excedido su presupuesto en Meta Ads.",
            link: "/dashboard/marketing/campaigns",
            isRead: false,
        },
        {
            companyId,
            userId,
            type: "CREATIVE",
            title: "Asset Aprobado",
            message: "El kit de diseño de 'Launch V2' ha sido aprobado por el cliente.",
            link: "/dashboard/marketing/creative-studio",
            isRead: false,
        }
    ];

    for (const notif of notifications) {
        await prisma.notification.create({ data: notif });
    }

    console.log("¡5 Notificaciones de prueba creadas exitosamente!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
