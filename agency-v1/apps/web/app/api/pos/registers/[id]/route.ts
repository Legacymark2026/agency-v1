import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();

        try {
            const res = await fetch(`${POS_SERVICE_URL}/api/pos/registers/${params.id}`, {
                method: "PUT",
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
        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.location !== undefined) updateData.location = body.location;
        if (body.initialFloat !== undefined) updateData.initialFloat = Number(body.initialFloat);
        if (body.status !== undefined) updateData.status = body.status;
        if (body.config !== undefined) updateData.config = body.config;

        const updated = await prisma.posRegister.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            register: {
                id: updated.id,
                name: updated.name,
                location: updated.location,
                initialFloat: Number(updated.initialFloat || 0),
                currentBalance: Number(updated.currentBalance || 0),
                status: updated.status,
                config: updated.config,
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        try {
            const res = await fetch(`${POS_SERVICE_URL}/api/pos/registers/${params.id}/status`, {
                method: "PATCH",
                signal: AbortSignal.timeout(1500),
            });
            if (res.ok) {
                const data = await res.json();
                return NextResponse.json(data, { status: res.status });
            }
        } catch (_) {}

        // Fallback Prisma: Toggle status
        const current = await prisma.posRegister.findUnique({ where: { id: params.id } });
        if (!current) {
            return NextResponse.json({ success: false, error: "Caja registradora no encontrada" }, { status: 404 });
        }

        const newStatus = current.status === "OPEN" ? "CLOSED" : "OPEN";
        const updated = await prisma.posRegister.update({
            where: { id: params.id },
            data: { status: newStatus }
        });

        return NextResponse.json({
            success: true,
            register: {
                id: updated.id,
                name: updated.name,
                location: updated.location,
                initialFloat: Number(updated.initialFloat || 0),
                currentBalance: Number(updated.currentBalance || 0),
                status: updated.status,
                config: updated.config,
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        try {
            const res = await fetch(`${POS_SERVICE_URL}/api/pos/registers/${params.id}`, {
                method: "DELETE",
                signal: AbortSignal.timeout(1500),
            });
            if (res.ok) {
                const data = await res.json();
                return NextResponse.json(data, { status: res.status });
            }
        } catch (_) {}

        // Fallback Prisma
        await prisma.posRegister.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true, message: "Caja eliminada" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
