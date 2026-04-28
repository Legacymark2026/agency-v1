import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/track/open?b=blastId&e=email
 * Records an email open event and returns a transparent 1x1 pixel.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const blastId = searchParams.get("b");
    const email = searchParams.get("e");

    if (blastId && email) {
        try {
            // Update recipient atomically — only record first open
            await prisma.emailBlastRecipient.updateMany({
                where: { blastId, email, openedAt: null },
                data: { openedAt: new Date() },
            });
            // Increment blast open counter
            await prisma.emailBlast.update({
                where: { id: blastId },
                data: { opens: { increment: 1 } },
            });
        } catch { /* non-fatal: tracking should never break email delivery */ }
    }

    // Return transparent 1×1 GIF
    const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
    );

    return new Response(pixel, {
        headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
        },
    });
}
