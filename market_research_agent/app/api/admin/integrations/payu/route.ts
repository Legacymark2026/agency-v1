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
                    provider: 'payu'
                }
            }
        });

        if (!config || !config.config) {
             return NextResponse.json({ isConfigured: false });
        }

        const data = config.config as any;
        return NextResponse.json({ 
            isConfigured: true,
            hasApiKey: !!data.apiKey,
            hasMerchantId: !!data.merchantId,
            hasAccountId: !!data.accountId,
            isTest: data.isTest ?? false
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

        const { apiKey, merchantId, accountId, isTest, isEnabled } = await req.json();

        if (!apiKey || !merchantId || !accountId) {
            return new NextResponse("Missing required keys", { status: 400 });
        }

        const integration = await prisma.integrationConfig.upsert({
            where: {
                companyId_provider: {
                    companyId: session.user.companyId,
                    provider: 'payu'
                }
            },
            update: {
                config: { apiKey, merchantId, accountId, isTest: !!isTest },
                isEnabled: isEnabled ?? true
            },
            create: {
                companyId: session.user.companyId,
                provider: 'payu',
                config: { apiKey, merchantId, accountId, isTest: !!isTest },
                isEnabled: isEnabled ?? true
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[PAYU_CONFIG_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
