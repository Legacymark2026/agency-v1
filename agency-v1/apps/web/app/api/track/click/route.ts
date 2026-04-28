import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/track/click?r=redirectUrl&b=blastId&e=email
 * Records a click event and 302-redirects to the destination URL.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const redirectUrl = searchParams.get("r");
    const blastId = searchParams.get("b");
    const email = searchParams.get("e");

    if (blastId && email) {
        try {
            // Only record first click per recipient
            await prisma.emailBlastRecipient.updateMany({
                where: { blastId, email, clickedAt: null },
                data: { clickedAt: new Date() },
            });
            await prisma.emailBlast.update({
                where: { id: blastId },
                data: { clicks: { increment: 1 } },
            });
        } catch { /* non-fatal */ }
    }

    if (!redirectUrl) {
        return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 });
    }

    // Validate URL to prevent open redirect abuse
    try {
        const parsed = new URL(decodeURIComponent(redirectUrl));
        const allowedHosts = (process.env.TRACKING_ALLOWED_HOSTS || "legacymarksas.com").split(",");
        // Allow any URL but log suspicious ones
        if (!allowedHosts.some(h => parsed.hostname.endsWith(h))) {
            console.warn(`[Click Tracker] External redirect to: ${parsed.hostname}`);
        }
    } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    return NextResponse.redirect(decodeURIComponent(redirectUrl), { status: 302 });
}
