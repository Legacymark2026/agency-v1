import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { reference, amountInCents, currency = "COP" } = body;

        if (!reference || amountInCents === undefined || amountInCents === null) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || "wompi_prod_integrity_secret_default";
        
        // Formula de firma Wompi: SHA256(reference + amountInCents + currency + integritySecret)
        const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`;
        const signature = crypto.createHash("sha256").update(concatenated).digest("hex");

        return NextResponse.json({
            success: true,
            signature,
            reference,
            amountInCents,
            currency
        });
    } catch (error: any) {
        console.error("🔴 Error generating Wompi signature:", error);
        return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
    }
}
