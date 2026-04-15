import { PrismaClient } from "@prisma/client";
import { dispatchNotification } from "../lib/notifications";

const prisma = new PrismaClient();

async function run() {
    try {
        console.log("Buscando un usuario administrador para la prueba...");
        
        // Find a valid user in a company
        const companyUser = await prisma.companyUser.findFirst({
            include: {
                user: true
            }
        });

        if (!companyUser) {
            console.log("Error: No se encontró ningún usuario con compañía asignada en la DB.");
            process.exit(1);
        }

        const { companyId, userId } = companyUser;
        const email = companyUser.user.email;

        console.log(`Usuario encontrado: ${email}. Enviando notificación de Test...`);

        // Trigger the Notification Engine
        const result = await dispatchNotification({
            companyId,
            userId,
            type: "SYSTEM_ALERT",
            title: "⚡ Inicialización del Motor Exitosa",
            message: "¡Hola! Esta es una prueba de extremo a extremo (Real). Tu campanita de notificaciones In-App está funcionando perfectamente, al igual que los buses externos.",
            link: "/dashboard/settings",
            // Forcing IN_APP to ensure it reaches the Bell immediately.
            forceChannels: ["IN_APP", "EMAIL"]
        });

        console.log("Despacho In-App y Email iniciado. ID:", result.notificationId);

        // Wait 3 seconds to let external promises settle before exiting the script
        setTimeout(async () => {
            console.log("Revisando el Log de Entrega (Delivery Log)...");
            const logs = await prisma.notificationDeliveryLog.findMany({
                where: { notificationId: result.notificationId }
            });

            console.log("--- RESULTADOS DE ENTREGA ---");
            logs.forEach(log => {
                console.log(`[${log.channel}] Status: ${log.status} | Error: ${log.errorMessage || "Ninguno"}`);
            });
            console.log("-----------------------------");
            
            console.log("Prueba concluida. La campanita en el Dashboard ahora mismo debería tener un '+1'.");
            process.exit(0);
        }, 3000);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
