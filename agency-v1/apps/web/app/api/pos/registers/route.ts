import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get("companyId");

        try {
            const res = await fetch(`${POS_SERVICE_URL}/api/pos/registers`, { cache: "no-store", signal: AbortSignal.timeout(1500) });
            if (res.ok) {
                const data = await res.json();
                if (data.registers && data.registers.length > 0) {
                    return NextResponse.json(data);
                }
            }
        } catch (_) {}

        // Fallback robusto con PostgreSQL (Prisma)
        const where: any = {};
        if (companyId && companyId !== "company_default" && companyId !== "company_default_pos") {
            where.companyId = companyId;
        }

        const registers = await prisma.posRegister.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        const formatted = registers.map((r: any) => ({
            id: r.id,
            name: r.name,
            location: r.location || "Sede Bucaramanga - Principal",
            initialFloat: Number(r.initialFloat || 0),
            currentBalance: Number(r.currentBalance || 0),
            status: r.status || "OPEN",
            config: r.config || {},
        }));

        return NextResponse.json({ success: true, registers: formatted });
    } catch (e: any) {
        return NextResponse.json({ success: true, registers: [] });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        try {
            const res = await fetch(`${POS_SERVICE_URL}/api/pos/registers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(1500),
            });
            if (res.ok) {
                const data = await res.json();
                return NextResponse.json(data, { status: res.status });
            }
        } catch (_) {}

        // Fallback Prisma
        let companyId = body.companyId || "company_default_pos";
        if (companyId === "company_default" || companyId === "company_default_pos") {
            const first = await prisma.company.findFirst({ select: { id: true } });
            if (first) companyId = first.id;
        }

        const regId = body.id || `caja_${Date.now()}`;
        const newRegister = await prisma.posRegister.create({
            data: {
                id: regId,
                companyId,
                name: body.name || "Nueva Caja Registradora",
                location: body.location || "Sede Bucaramanga - Principal",
                initialFloat: Number(body.initialFloat) || 0,
                currentBalance: Number(body.initialFloat) || 0,
                status: body.status || "CLOSED",
                config: body.config || {},
            }
        });

        return NextResponse.json({
            success: true,
            register: {
                id: newRegister.id,
                name: newRegister.name,
                location: newRegister.location,
                initialFloat: Number(newRegister.initialFloat || 0),
                currentBalance: Number(newRegister.currentBalance || 0),
                status: newRegister.status,
                config: newRegister.config,
            }
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
