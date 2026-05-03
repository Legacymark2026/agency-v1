/**
 * app/api/automation/resume/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint para que QStash reanude ejecuciones en estado WAITING.
 * También sirve como webhook de alerta automática cuando una ejecución falla.
 *
 * POST /api/automation/resume
 * Body: { executionId: string, fromNodeId?: string }
 * Auth: Upstash-Signature header (HMAC-SHA256) — validado con Web Crypto API
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeWorkflow } from "@/actions/automation";

// ── FIX #2: Validación HMAC real de QStash usando Web Crypto API ─────────────
// El header `upstash-signature` contiene un JWT firmado con QSTASH_CURRENT_SIGNING_KEY.
// Soporta rotación de claves (QSTASH_NEXT_SIGNING_KEY) sin downtime.
async function verifyQStashSignature(req: NextRequest, rawBody: string): Promise<boolean> {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) return true; // Bypass en desarrollo local

    const signature = req.headers.get("upstash-signature");
    if (!signature) {
        console.error("[QStash] Header upstash-signature ausente");
        return false;
    }

    const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (!signingKey) {
        console.error("[QStash] QSTASH_CURRENT_SIGNING_KEY no configurada — rechazando request");
        return false;
    }

    // Intentar verificar con la clave actual, luego con la siguiente (rotación)
    const keysToTry = [signingKey, nextSigningKey].filter(Boolean) as string[];

    for (const key of keysToTry) {
        try {
            // El token es un JWT: header.payload.signature (base64url)
            const parts = signature.split(".");
            if (parts.length !== 3) continue;

            const [headerB64, payloadB64] = parts;
            const signingInput = `${headerB64}.${payloadB64}`;

            const encoder = new TextEncoder();
            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                encoder.encode(key),
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["verify"]
            );

            // Decodificar la firma del JWT (base64url → ArrayBuffer)
            const sigB64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
            const padding = "=".repeat((4 - (sigB64.length % 4)) % 4);
            const sigBuffer = Uint8Array.from(atob(sigB64 + padding), c => c.charCodeAt(0));

            const isValid = await crypto.subtle.verify(
                "HMAC",
                cryptoKey,
                sigBuffer,
                encoder.encode(signingInput)
            );

            if (isValid) {
                // Verificar claims del payload JWT: exp (expiración)
                const payloadDecoded = atob(
                    payloadB64.replace(/-/g, "+").replace(/_/g, "/") +
                    "=".repeat((4 - (payloadB64.length % 4)) % 4)
                );
                const payloadJson = JSON.parse(payloadDecoded);
                const now = Math.floor(Date.now() / 1000);

                if (payloadJson.exp && payloadJson.exp < now) {
                    console.warn("[QStash] Token expirado — intentando siguiente clave");
                    continue;
                }
                return true; // ✅ Firma válida
            }
        } catch (e) {
            console.error("[QStash] Error verificando firma:", e);
        }
    }

    return false; // ❌ Ninguna clave pudo verificar la firma
}

export async function POST(req: NextRequest) {
    try {
        // Leer el cuerpo como texto primero (necesario para validar HMAC)
        const rawBody = await req.text();

        // ── Verificación de firma QStash ──────────────────────────────────────
        const isValidSignature = await verifyQStashSignature(req, rawBody);
        if (!isValidSignature) {
            console.error("[QStash Resume] Firma inválida — request rechazado");
            return NextResponse.json({ error: "Invalid QStash signature" }, { status: 401 });
        }

        const body = JSON.parse(rawBody) as { executionId: string; fromNodeId?: string };
        const { executionId, fromNodeId } = body;

        if (!executionId) {
            return NextResponse.json({ error: "executionId is required" }, { status: 400 });
        }

        // ── Retrieve execution ───────────────────────────────────────────────
        const execution = await prisma.workflowExecution.findUnique({
            where: { id: executionId },
            include: { workflow: { select: { id: true, name: true, companyId: true } } }
        });

        if (!execution) {
            return NextResponse.json({ error: "Execution not found" }, { status: 404 });
        }

        if (execution.status !== "WAITING") {
            return NextResponse.json({
                message: `Execution is in state ${execution.status} — no action needed.`
            });
        }

        // ── Resume ────────────────────────────────────────────────────────────
        // NOTA: executeWorkflow detecta automáticamente el execution WAITING
        // y lo reusa en vez de crear uno nuevo (FIX #1 en automation.ts)
        executeWorkflow(execution.workflowId, {}, fromNodeId).catch(async (err) => {
            console.error(`[QStash Resume] Execution ${executionId} failed on resume:`, err);
            await notifyAdminsOnFailure(execution.workflow.companyId, execution.workflow.name, err.message);
        });

        return NextResponse.json({ success: true, message: `Execution ${executionId} resumed.` });

    } catch (err: any) {
        console.error("[AutomationResume] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── Helper: notificar a todos los admins cuando un workflow falla ─────────────
async function notifyAdminsOnFailure(companyId: string, workflowName: string, errorMsg: string) {
    try {
        const admins = await prisma.companyUser.findMany({
            where: {
                companyId,
                OR: [{ roleName: "admin" }, { roleName: "owner" }]
            },
            select: { userId: true }
        });

        if (admins.length === 0) return;

        await prisma.notification.createMany({
            data: admins.map(a => ({
                userId: a.userId,
                companyId,
                title: `⚠️ Workflow Fallido: ${workflowName}`,
                message: `Error: ${errorMsg.substring(0, 200)}. Ve a Automatización → Ejecuciones para revisar los logs.`,
                type: "WORKFLOW",
                isRead: false,
            }))
        });

        console.log(`[AutoAlert] Notified ${admins.length} admin(s) about failed workflow: ${workflowName}`);
    } catch (e) {
        console.error("[AutoAlert] Failed to notify admins:", e);
    }
}
