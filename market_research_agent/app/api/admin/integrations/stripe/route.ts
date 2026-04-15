import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 });
        
        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
             return new NextResponse("Forbidden", { status: 403 });
        }

        const config = await prisma.integrationConfig.findUnique({
            where: {
                companyId_provider: {
                    companyId: session.user.companyId,
                    provider: 'stripe'
                }
            }
        });

        // Retornamos sin exponer las llaves completas (solo enmascaradas o booleano de si existe)
        if (!config || !config.config) {
             return NextResponse.json({ isConfigured: false });
        }

        const data = config.config as any;
        return NextResponse.json({ 
            isConfigured: true,
            hasSecretKey: !!data.secretKey,
            hasWebhookSecret: !!data.webhookSecret
        });

    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 });
        
        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
             return new NextResponse("Forbidden", { status: 403 });
        }

        const { secretKey, webhookSecret, isEnabled } = await req.json();

        if (!secretKey || !webhookSecret) {
            return new NextResponse("Missing required keys", { status: 400 });
        }

        const integration = await prisma.integrationConfig.upsert({
            where: {
                companyId_provider: {
                    companyId: session.user.companyId,
                    provider: 'stripe'
                }
            },
            update: {
                config: { secretKey, webhookSecret },
                isEnabled: isEnabled ?? true
            },
            create: {
                companyId: session.user.companyId,
                provider: 'stripe',
                config: { secretKey, webhookSecret },
                isEnabled: isEnabled ?? true
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[STRIPE_CONFIG_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
