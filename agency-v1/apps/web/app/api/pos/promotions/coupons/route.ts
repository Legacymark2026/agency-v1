import { NextResponse } from "next/server";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function GET() {
    try {
        const res = await fetch(`${POS_SERVICE_URL}/api/pos/promotions/coupons`, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
        }
        return NextResponse.json({ success: true, coupons: [] });
    } catch (e) {
        return NextResponse.json({ success: true, coupons: [] });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const res = await fetch(`${POS_SERVICE_URL}/api/pos/promotions/coupons`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
