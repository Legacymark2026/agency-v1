import { NextResponse } from "next/server";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const res = await fetch(`${POS_SERVICE_URL}/api/pos/promotions/coupons/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const res = await fetch(`${POS_SERVICE_URL}/api/pos/promotions/coupons/${params.id}/toggle`, {
            method: "PATCH",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const res = await fetch(`${POS_SERVICE_URL}/api/pos/promotions/coupons/${params.id}`, {
            method: "DELETE",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
