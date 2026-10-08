import { Router } from "express";
import { prisma } from "@agency/database";
import crypto from "crypto";

export const activeSessionsMap = new Map<string, any>();

export function createSessionsRouter(eventBus: any, resolveValidCompanyId: (id?: string) => Promise<string>) {
    const router = Router();

    /**
     * GET /api/pos/sessions
     * Retorna el turno activo para un registro de caja específico o para el usuario/cajero actual.
     */
    router.get("/", async (req, res) => {
        try {
            const { companyId, registerId, cashierId } = req.query;
            const cid = await resolveValidCompanyId(companyId ? String(companyId) : undefined);

            const where: any = {
                companyId: cid,
                status: { in: ["OPEN", "PENDING_SUPERVISION"] },
            };

            if (registerId) where.registerId = String(registerId);
            if (cashierId) where.cashierId = String(cashierId);

            const activeShift = await prisma.posShift.findFirst({
                where,
                include: {
                    register: true,
                    movements: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                },
                orderBy: { openedAt: "desc" },
            });

            res.json({
                success: true,
                companyId: cid,
                activeShift: activeShift ? {
                    ...activeShift,
                    id: activeShift.id,
                    registerName: activeShift.register?.name || "Caja Principal",
                    openingBalance: Number(activeShift.openingFloat),
                    cashSales: Number(activeShift.cashSalesTotal),
                    cardSales: Number(activeShift.cardSalesTotal),
                    transferSales: Number(activeShift.transferSalesTotal),
                    creditSales: Number(activeShift.creditSalesTotal),
                    totalSales: Number(activeShift.totalSales),
                    orderCount: activeShift.orderCount,
                } : null,
                activeSession: activeShift ? {
                    id: activeShift.id,
                    registerId: activeShift.registerId,
                    registerName: activeShift.register?.name || "Caja Principal",
                    openedById: activeShift.cashierId,
                    cashierName: activeShift.cashierName,
                    openingBalance: Number(activeShift.openingFloat),
                    status: activeShift.status,
                    openedAt: activeShift.openedAt.toISOString(),
                    cashSales: Number(activeShift.cashSalesTotal),
                    cardSales: Number(activeShift.cardSalesTotal),
                    transferSales: Number(activeShift.transferSalesTotal),
                    creditSales: Number(activeShift.creditSalesTotal),
                    totalSales: Number(activeShift.totalSales),
                    orderCount: activeShift.orderCount,
                } : null,
            });
        } catch (err) {
            console.error("[POS-Shifts] Error al consultar turnos:", err);
            res.status(500).json({ error: String(err) });
        }
    });

    /**
     * POST /api/pos/sessions/open
     * Apertura formal de turno en una caja registradora específica para un cajero específico.
     * Garantiza exclusión mutua: si la caja ya tiene un turno abierto, rechaza.
     */
    router.post("/open", async (req, res) => {
        try {
            const {
                companyId,
                registerId: inputRegisterId,
                registerName = "Caja Principal",
                cashierId: inputCashierId,
                cashierName = "Cajero Principal",
                openingBalance = 0,
            } = req.body;

            const cid = await resolveValidCompanyId(companyId ? String(companyId) : undefined);
            const cashierId = inputCashierId || "cashier_default";

            // 1. Asegurar o resolver la caja registradora en la base de datos
            let register = inputRegisterId
                ? await prisma.posRegister.findUnique({ where: { id: inputRegisterId } })
                : null;

            if (!register) {
                register = await prisma.posRegister.findFirst({
                    where: { companyId: cid, name: registerName },
                });
            }

            if (!register) {
                register = await prisma.posRegister.create({
                    data: {
                        id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        companyId: cid,
                        name: registerName,
                        initialFloat: Number(openingBalance) || 0,
                        currentBalance: Number(openingBalance) || 0,
                        status: "OPEN",
                    },
                });
            }

            // 2. Verificar que no haya ya un turno abierto en esta caja física
            const existingActiveShift = await prisma.posShift.findFirst({
                where: {
                    registerId: register.id,
                    status: { in: ["OPEN", "PENDING_SUPERVISION"] },
                },
            });

            if (existingActiveShift) {
                if (existingActiveShift.cashierId !== cashierId) {
                    return res.status(409).json({
                        success: false,
                        error: `La caja "${register.name}" actualmente se encuentra ocupada con un turno activo del cajero ${existingActiveShift.cashierName || existingActiveShift.cashierId}. Debe completarse el cierre y arqueo previo antes de iniciar un nuevo turno.`,
                        activeShift: existingActiveShift,
                    });
                } else {
                    // El mismo cajero reconecta con su turno existente
                    return res.status(200).json({
                        success: true,
                        session: existingActiveShift,
                        message: "Turno existente recuperado exitosamente.",
                    });
                }
            }

            // 3. Crear el nuevo turno inmutable con código secuencial
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const randomCode = Math.floor(100 + Math.random() * 900);
            const shiftCode = `TURNO-${dateStr}-${randomCode}`;

            const newShift = await prisma.posShift.create({
                data: {
                    shiftCode,
                    companyId: cid,
                    registerId: register.id,
                    cashierId,
                    cashierName,
                    openingFloat: Number(openingBalance) || 0,
                    expectedCash: Number(openingBalance) || 0,
                    status: "OPEN",
                },
                include: { register: true },
            });

            await eventBus.publish("pos.shift.opened", {
                shiftId: newShift.id,
                shiftCode: newShift.shiftCode,
                companyId: cid,
                registerId: register.id,
                cashierId,
                openingFloat: newShift.openingFloat,
            });

            const sessionResponse = {
                id: newShift.id,
                shiftCode: newShift.shiftCode,
                companyId: cid,
                registerId: register.id,
                registerName: register.name,
                openedById: cashierId,
                cashierName,
                openingBalance: Number(newShift.openingFloat),
                status: newShift.status,
                openedAt: newShift.openedAt.toISOString(),
                cashSales: 0,
                cardSales: 0,
                transferSales: 0,
                creditSales: 0,
                totalSales: 0,
                orderCount: 0,
            };

            res.status(201).json({ success: true, session: sessionResponse, shift: newShift });
        } catch (err) {
            console.error("[POS-Shifts] Error al abrir turno:", err);
            res.status(500).json({ error: String(err) });
        }
    });

    /**
     * POST /api/pos/sessions/declare-close
     * Fase 1 del Cierre: El cajero declara su conteo físico (Arqueo Ciego) y entrega de caja.
     * El turno pasa a PENDING_SUPERVISION, bloqueando nuevas ventas.
     */
    router.post("/declare-close", async (req, res) => {
        try {
            const {
                shiftId,
                sessionId,
                declaredCash = 0,
                denominationsCount,
                cashierNotes,
            } = req.body;

            const targetId = shiftId || sessionId;
            if (!targetId) {
                return res.status(400).json({ error: "shiftId o sessionId es requerido" });
            }

            const currentShift = await prisma.posShift.findUnique({
                where: { id: targetId },
            });

            if (!currentShift) {
                return res.status(404).json({ error: "Turno no encontrado en base de datos" });
            }

            if (currentShift.status !== "OPEN") {
                return res.status(400).json({
                    error: `El turno ya no está abierto (Estado actual: ${currentShift.status}).`,
                });
            }

            // Calcular ingresos y egresos de efectivo
            const opening = Number(currentShift.openingFloat);
            const cashSales = Number(currentShift.cashSalesTotal);
            const expectedCash = opening + cashSales;
            const actualCash = Number(declaredCash) || 0;
            const difference = actualCash - expectedCash;

            const updatedShift = await prisma.posShift.update({
                where: { id: targetId },
                data: {
                    status: "PENDING_SUPERVISION",
                    declaredClosedAt: new Date(),
                    declaredCash: actualCash,
                    expectedCash,
                    difference,
                    denominationsCount: denominationsCount || null,
                    cashierNotes: cashierNotes || null,
                },
                include: { register: true },
            });

            await eventBus.publish("pos.shift.declared_close", {
                shiftId: updatedShift.id,
                companyId: updatedShift.companyId,
                declaredCash: actualCash,
                expectedCash,
                difference,
            });

            res.json({
                success: true,
                message: "Conteo de efectivo declarado correctamente. En espera de auditoría y aprobación por Supervisor.",
                shift: updatedShift,
            });
        } catch (err) {
            console.error("[POS-Shifts] Error al declarar arqueo:", err);
            res.status(500).json({ error: String(err) });
        }
    });

    /**
     * POST /api/pos/sessions/approve-close
     * Fase 2 del Cierre: Un supervisor con permisos audita el conteo, verifica la diferencia y aprueba el cierre definitivo.
     */
    router.post("/approve-close", async (req, res) => {
        try {
            const {
                shiftId,
                supervisorId = "supervisor_admin",
                supervisorName = "Supervisor de Turno",
                supervisorNotes,
            } = req.body;

            if (!shiftId) {
                return res.status(400).json({ error: "shiftId es requerido" });
            }

            const currentShift = await prisma.posShift.findUnique({
                where: { id: shiftId },
            });

            if (!currentShift) {
                return res.status(404).json({ error: "Turno no encontrado" });
            }

            if (currentShift.status !== "PENDING_SUPERVISION" && currentShift.status !== "OPEN") {
                return res.status(400).json({
                    error: `El turno no puede ser aprobado en su estado actual (${currentShift.status}).`,
                });
            }

            const diff = Number(currentShift.difference || 0);
            const finalStatus = diff === 0 ? "CLOSED_BALANCED" : "CLOSED_DISCREPANCY";

            const finalizedShift = await prisma.posShift.update({
                where: { id: shiftId },
                data: {
                    status: finalStatus,
                    supervisorId,
                    supervisorName,
                    verifiedClosedAt: new Date(),
                    supervisorNotes: supervisorNotes || null,
                },
                include: { register: true },
            });

            await eventBus.publish("pos.shift.closed", {
                shiftId: finalizedShift.id,
                companyId: finalizedShift.companyId,
                status: finalStatus,
                difference: diff,
                totalSales: Number(finalizedShift.totalSales),
            });

            res.json({
                success: true,
                message: `Turno cerrado y verificado exitosamente (${finalStatus}). La caja ha quedado liberada.`,
                shift: finalizedShift,
            });
        } catch (err) {
            console.error("[POS-Shifts] Error al supervisar cierre:", err);
            res.status(500).json({ error: String(err) });
        }
    });

    /**
     * POST /api/pos/sessions/close
     * Retrocompatibilidad unificada: Si viene cierre directo, ejecuta el flujo completo.
     */
    router.post("/close", async (req, res) => {
        try {
            const {
                companyId,
                sessionId,
                shiftId,
                closingBalance = 0,
                notes,
                supervisorId,
                supervisorName,
                supervisorNotes,
            } = req.body;

            const targetId = shiftId || sessionId;
            const cid = await resolveValidCompanyId(companyId ? String(companyId) : undefined);

            let currentShift = targetId
                ? await prisma.posShift.findUnique({ where: { id: targetId }, include: { register: true } })
                : await prisma.posShift.findFirst({
                    where: { companyId: cid, status: { in: ["OPEN", "PENDING_SUPERVISION"] } },
                    include: { register: true },
                    orderBy: { openedAt: "desc" },
                });

            if (!currentShift) {
                return res.status(400).json({ error: "No hay turno activo para cerrar" });
            }

            const opening = Number(currentShift.openingFloat);
            const cashSales = Number(currentShift.cashSalesTotal);
            const expectedCash = opening + cashSales;
            const actualCash = Number(closingBalance) || 0;
            const difference = actualCash - expectedCash;
            const finalStatus = difference === 0 ? "CLOSED_BALANCED" : "CLOSED_DISCREPANCY";

            const closedShift = await prisma.posShift.update({
                where: { id: currentShift.id },
                data: {
                    status: finalStatus,
                    declaredClosedAt: new Date(),
                    verifiedClosedAt: new Date(),
                    declaredCash: actualCash,
                    expectedCash,
                    difference,
                    cashierNotes: notes || null,
                    supervisorId: supervisorId || currentShift.supervisorId || "supervisor_system",
                    supervisorName: supervisorName || currentShift.supervisorName || "Supervisor POS",
                    supervisorNotes: supervisorNotes || null,
                },
                include: { register: true },
            });

            await eventBus.publish("pos.shift.closed", {
                shiftId: closedShift.id,
                companyId: cid,
                totalSales: Number(closedShift.totalSales),
                difference,
            });

            res.json({
                success: true,
                summary: {
                    id: closedShift.id,
                    companyId: cid,
                    registerName: closedShift.register?.name || "Caja Principal",
                    cashierName: closedShift.cashierName || "Cajero Principal",
                    status: closedShift.status,
                    closedAt: closedShift.verifiedClosedAt?.toISOString() || new Date().toISOString(),
                    openingBalance: Number(closedShift.openingFloat),
                    closingBalance: actualCash,
                    expectedCash,
                    difference,
                    totalSales: Number(closedShift.totalSales),
                    cashSales: Number(closedShift.cashSalesTotal),
                    cardSales: Number(closedShift.cardSalesTotal),
                    transferSales: Number(closedShift.transferSalesTotal),
                    creditSales: Number(closedShift.creditSalesTotal),
                    orderCount: closedShift.orderCount,
                    notes: notes || null,
                    supervisorNotes: supervisorNotes || null,
                },
                shift: closedShift,
            });
        } catch (err) {
            console.error("[POS-Shifts] Error en cierre retrocompatible:", err);
            res.status(500).json({ error: String(err) });
        }
    });

    return router;
}
