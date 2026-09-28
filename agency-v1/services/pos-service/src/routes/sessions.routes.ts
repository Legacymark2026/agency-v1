import { Router } from "express";

export const activeSessionsMap = new Map<string, any>();

export function createSessionsRouter(eventBus: any, resolveValidCompanyId: (id?: string) => Promise<string>) {
    const router = Router();

    router.get("/", async (req, res) => {
        try {
            const { companyId } = req.query;
            const cid = await resolveValidCompanyId(companyId ? String(companyId) : undefined);
            const activeSession = activeSessionsMap.get(cid) || null;

            res.json({ success: true, companyId: cid, activeSession });
        } catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });

    router.post("/open", async (req, res) => {
        try {
            const { companyId, registerName = "Caja Principal", openedById, openingBalance = 0 } = req.body;
            const cid = await resolveValidCompanyId(companyId ? String(companyId) : undefined);

            const newSession = {
                id: `pos_session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                companyId: cid,
                registerName,
                openedById: openedById || "cajero_main",
                openingBalance: Number(openingBalance) || 0,
                status: "OPEN",
                openedAt: new Date().toISOString(),
                cashSales: 0,
                cardSales: 0,
                transferSales: 0,
                creditSales: 0,
                totalSales: 0,
                orderCount: 0,
                cashMovements: [],
            };

            activeSessionsMap.set(cid, newSession);

            await eventBus.publish("pos.session.opened", {
                sessionId: newSession.id,
                companyId: cid,
                openingBalance: newSession.openingBalance,
            });

            res.status(201).json({ success: true, session: newSession });
        } catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });

    router.post("/close", async (req, res) => {
        try {
            const { companyId, closingBalance = 0, notes } = req.body;
            const cid = await resolveValidCompanyId(companyId ? String(companyId) : undefined);
            const currentSession = activeSessionsMap.get(cid);
            if (!currentSession) return res.status(400).json({ error: "No hay sesión abierta" });

            const expectedCash = currentSession.openingBalance + currentSession.cashSales;
            const actualCash = Number(closingBalance) || 0;
            const difference = actualCash - expectedCash;

            const closedSession = {
                ...currentSession,
                status: "CLOSED",
                closedAt: new Date().toISOString(),
                closingBalance: actualCash,
                expectedCash,
                difference,
                notes: notes || null,
            };

            activeSessionsMap.delete(cid);

            await eventBus.publish("pos.session.closed", {
                sessionId: closedSession.id,
                companyId: cid,
                totalSales: closedSession.totalSales,
                difference,
            });

            res.json({ success: true, summary: closedSession });
        } catch (err) {
            res.status(500).json({ error: String(err) });
        }
    });

    return router;
}
