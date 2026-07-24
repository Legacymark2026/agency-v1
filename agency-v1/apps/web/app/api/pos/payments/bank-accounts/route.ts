import { NextResponse } from "next/server";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function GET() {
    try {
        const res = await fetch(`${POS_SERVICE_URL}/api/pos/payments/bank-accounts`, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
        }
        return NextResponse.json({ success: true, accounts: [] });
    } catch (e) {
        return NextResponse.json({ success: true, accounts: [] });
    }
}
