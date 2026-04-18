import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        if (!slug) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const link = await prisma.shortLink.findUnique({
            where: { slug }
        });

        if (!link || !link.isActive) {
            return new NextResponse("Link not found or inactive", { status: 404 });
        }

        // Update analytics asynchronously (don't await to avoid blocking redirect)
        prisma.shortLink.update({
            where: { id: link.id },
            data: { 
                clicks: { increment: 1 },
                lastClick: new Date()
            }
        }).catch(console.error);

        return NextResponse.redirect(new URL(link.destinationUrl));
    } catch (error) {
        console.error("ShortLink error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
