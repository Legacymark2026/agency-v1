import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PosTerminalClient from "./pos-client";

export const metadata = {
    title: "Terminal POS | Punto de Venta LegacyMark",
    description: "Sistema de ventas POS en caja registradora, control de inventarios, escáner de código de barras e impresión de tiquetes térmicos y factura electrónica DIAN.",
};

export default async function PosPage() {
    const session = await auth();

    // Default Fallback Real Data structure for Emisor/Vendedor DIAN
    let issuerData = {
        companyName: "GARCIA DURAN NESTOR ELIAN",
        tradeName: "GARCIA DURAN NESTOR ELIAN",
        nit: "1005462317",
        taxpayerType: "Persona Natural",
        taxRegime: "R-99-PN",
        taxResponsibility: "ZZ - No aplica",
        economicActivity: "7310",
        country: "Colombia",
        department: "Santander",
        city: "Bucaramanga",
        address: "CL 12 # 19 - 18 MZ 20 CA 1",
        phone: "3153981340",
        email: session?.user?.email || "nestorgarcia1005462@gmail.com",
    };

    if (session?.user?.id) {
        try {
            const [user, companyUser] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { name: true, email: true }
                }),
                prisma.companyUser.findFirst({
                    where: { userId: session.user.id },
                    select: {
                        company: {
                            select: {
                                name: true,
                                defaultCompanySettings: true,
                            }
                        }
                    }
                })
            ]);

            if (companyUser?.company) {
                const settings = (companyUser.company.defaultCompanySettings as any) || {};
                issuerData = {
                    companyName: companyUser.company.name || user?.name || issuerData.companyName,
                    tradeName: settings.tradeName || companyUser.company.name || issuerData.tradeName,
                    nit: settings.nit || issuerData.nit,
                    taxpayerType: settings.taxpayerType || issuerData.taxpayerType,
                    taxRegime: settings.taxRegime || issuerData.taxRegime,
                    taxResponsibility: settings.taxResponsibility || issuerData.taxResponsibility,
                    economicActivity: settings.economicActivity || issuerData.economicActivity,
                    country: settings.country || issuerData.country,
                    department: settings.department || issuerData.department,
                    city: settings.city || issuerData.city,
                    address: settings.address || issuerData.address,
                    phone: settings.phone || issuerData.phone,
                    email: user?.email || settings.email || issuerData.email,
                };
            } else if (user?.name) {
                issuerData.companyName = user.name;
                issuerData.tradeName = user.name;
                if (user.email) issuerData.email = user.email;
            }
        } catch (error) {
            console.error("Error fetching real issuer data in PosPage:", error);
        }
    }

    return <PosTerminalClient initialIssuer={issuerData} />;
}
