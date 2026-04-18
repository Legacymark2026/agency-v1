import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * POST /api/crm/import-deals
 * Body: FormData con campo "file" (CSV) y "companyId"
 * 
 * Columnas esperadas del CSV (en orden o por header):
 * title, value, stage, contactName, contactEmail, contactPhone, source, priority, notes, expectedClose
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const companyId = formData.get("companyId") as string | null;

        if (!file || !companyId) {
            return NextResponse.json({ error: "Faltan campos requeridos: file y companyId" }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.trim().split("\n");
        if (lines.length < 2) {
            return NextResponse.json({ error: "El CSV debe tener al menos una fila de datos además del encabezado" }, { status: 400 });
        }

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/['"]/g, ""));
        const rows = lines.slice(1);

        // Validar encabezados mínimos
        if (!headers.includes("title")) {
            return NextResponse.json({ error: "El CSV debe tener una columna 'title'" }, { status: 400 });
        }

        const VALID_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
        const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

        const dealsToCreate: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
            const get = (col: string) => row[headers.indexOf(col)] ?? "";

            const title = get("title");
            if (!title) {
                errors.push(`Fila ${i + 2}: título vacío, omitida`);
                continue;
            }

            const stage = VALID_STAGES.includes(get("stage").toUpperCase()) ? get("stage").toUpperCase() : "NEW";
            const priority = VALID_PRIORITIES.includes(get("priority").toUpperCase()) ? get("priority").toUpperCase() : "MEDIUM";
            const value = parseFloat(get("value")) || 0;
            const expectedClose = get("expected_close") || get("expectedclose");

            dealsToCreate.push({
                title,
                value,
                stage,
                priority,
                contactName: get("contact_name") || get("contactname") || null,
                contactEmail: get("contact_email") || get("contactemail") || null,
                source: get("source") || "CSV_IMPORT",
                notes: get("notes") || null,
                companyId,
                expectedClose: expectedClose ? new Date(expectedClose) : null,
                lastActivity: new Date(),
                currency: get("currency") || "USD",
            });
        }

        if (dealsToCreate.length === 0) {
            return NextResponse.json({ error: "No se encontraron deals válidos en el CSV", warnings: errors }, { status: 400 });
        }

        const created = await prisma.deal.createMany({ data: dealsToCreate, skipDuplicates: true });

        return NextResponse.json({
            success: true,
            imported: created.count,
            total: dealsToCreate.length,
            warnings: errors,
            message: `${created.count} deals importados exitosamente`,
        });

    } catch (error) {
        console.error("[CSV IMPORT] Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
