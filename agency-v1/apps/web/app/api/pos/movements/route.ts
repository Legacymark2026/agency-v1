import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const registerId = searchParams.get("registerId");
        const shiftId = searchParams.get("shiftId");

        try {
            const url = registerId ? `${POS_SERVICE_URL}/api/pos/movements?registerId=${registerId}` : `${POS_SERVICE_URL}/api/pos/movements`;
            const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(1500) });
            if (res.ok) {
                const data = await res.json();
                if (data.movements && data.movements.length > 0) {
                    return NextResponse.json(data);
                }
            }
        } catch (_) {}

        // Fallback Prisma
        const where: any = {};
        if (registerId) where.registerId = registerId;
        if (shiftId) where.shiftId = shiftId;

        const movements = await prisma.posMovement.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        const formatted = movements.map((m: any) => ({
            id: m.id,
            registerId: m.registerId,
            shiftId: m.shiftId,
            type: m.type,
            amount: Number(m.amount),
            reason: m.reason,
            user: m.user,
            createdAt: m.createdAt.toISOString(),
        }));

        return NextResponse.json({ success: true, movements: formatted });
    } catch (e: any) {
        return NextResponse.json({ success: true, movements: [] });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { registerId, shiftId, type, amount, reason, user } = body;

        try {
            const res = await fetch(`${POS_SERVICE_URL}/api/pos/movements`, {
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
        const numAmount = Number(amount) || 0;
        const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        const created = await prisma.posMovement.create({
            data: {
                id: movId,
                registerId: registerId || "caja_1",
                shiftId: shiftId || null,
                type: type === "ENTRY" ? "ENTRY" : "EXIT",
                amount: numAmount,
                reason: reason || (type === "ENTRY" ? "Entrada extra de efectivo" : "Gasto menor de caja chica"),
                user: user || "Cajero Principal",
            }
        });

        // Actualizar saldo de la caja si existe
        if (registerId) {
            try {
                const reg = await prisma.posRegister.findUnique({ where: { id: registerId } });
                if (reg) {
                    const currentBal = Number(reg.currentBalance || 0);
                    const newBal = type === "ENTRY" ? (currentBal + numAmount) : (currentBal - numAmount);
                    await prisma.posRegister.update({
                        where: { id: registerId },
                        data: { currentBalance: Math.max(0, newBal) }
                    });
                }
            } catch (_) {}
        }

        return NextResponse.json({
            success: true,
            movement: {
                id: created.id,
                registerId: created.registerId,
                shiftId: created.shiftId,
                type: created.type,
                amount: Number(created.amount),
                reason: created.reason,
                user: created.user,
                createdAt: created.createdAt.toISOString(),
            }
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
