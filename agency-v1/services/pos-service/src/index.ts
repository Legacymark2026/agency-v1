/**
 * POS Service — Point of Sale & Retail Register Microservice
 * Port: 4020 | High concurrency, real-time checkout & session management
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const app = express();
const PORT = parseInt(process.env.PORT || "4020", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "pos-service" });
});

app.get("/ready", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ready" });
    } catch (err) {
        res.status(503).json({ status: "not_ready", error: String(err) });
    }
});

// ── In-Memory POS Sessions Store (Synchronized with DB FinancialAccount/Notes) ──
const activeSessionsMap = new Map<string, any>();

// ── POS Register Sessions (Apertura y Cierre de Caja / Arqueo Z) ───────────────
app.get("/api/pos/sessions", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: "companyId required" });

        const cid = String(companyId);
        const activeSession = activeSessionsMap.get(cid) || null;

        res.json({
            success: true,
            activeSession,
        });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

app.post("/api/pos/sessions/open", async (req, res) => {
    try {
        const { companyId, registerName = "Caja Principal", openedById, openingBalance = 0 } = req.body;
        if (!companyId) return res.status(400).json({ error: "companyId required" });

        const cid = String(companyId);
        const existingSession = activeSessionsMap.get(cid);
        if (existingSession && existingSession.status === "OPEN") {
            return res.status(400).json({ error: "Ya existe una sesión de caja abierta para esta empresa." });
        }

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

        // Record opening financial transaction for accounting traceability
        try {
            const defaultAccount = await prisma.financialAccount.findFirst({ where: { companyId: cid } });
            if (defaultAccount) {
                await prisma.financialTransaction.create({
                    data: {
                        accountId: defaultAccount.id,
                        type: "POS_OPENING",
                        amount: Number(openingBalance) || 0,
                        category: "CAJA_INICIAL",
                        description: `Apertura de Turno POS (${registerName})`,
                        reference: newSession.id,
                    },
                });
            }
        } catch (e) {
            console.warn("[pos-service] Non-fatal error logging opening transaction:", e);
        }

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

app.post("/api/pos/sessions/close", async (req, res) => {
    try {
        const { companyId, closingBalance = 0, notes } = req.body;
        if (!companyId) return res.status(400).json({ error: "companyId required" });

        const cid = String(companyId);
        const currentSession = activeSessionsMap.get(cid);
        if (!currentSession || currentSession.status !== "OPEN") {
            return res.status(400).json({ error: "No hay una sesión de caja abierta para cerrar." });
        }

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

        res.json({
            success: true,
            summary: closedSession,
            message: difference === 0
                ? "Cierre de caja perfecto sin descuadre."
                : difference > 0
                ? `Cierre con sobrante de $${difference.toLocaleString("es-CO")}`
                : `Cierre con faltante de $${Math.abs(difference).toLocaleString("es-CO")}`,
        });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

app.post("/api/pos/sessions/cash-movement", async (req, res) => {
    try {
        const { companyId, type = "CASH_IN", amount, reason } = req.body;
        if (!companyId || !amount) return res.status(400).json({ error: "companyId and amount required" });

        const cid = String(companyId);
        const currentSession = activeSessionsMap.get(cid);
        if (!currentSession || currentSession.status !== "OPEN") {
            return res.status(400).json({ error: "Se requiere una sesión de caja abierta." });
        }

        const movement = {
            id: `mov_${Date.now()}`,
            type,
            amount: Number(amount),
            reason: reason || "Movimiento manual de caja",
            timestamp: new Date().toISOString(),
        };

        currentSession.cashMovements.push(movement);
        if (type === "CASH_IN") currentSession.cashSales += Number(amount);
        else if (type === "CASH_OUT") currentSession.cashSales -= Number(amount);

        activeSessionsMap.set(cid, currentSession);

        res.json({ success: true, movement, session: currentSession });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

// ── POS Catalog & Barcode Scanner (`/api/pos/products`) ──────────────────────
app.get("/api/pos/products", async (req, res) => {
    try {
        const { companyId, search } = req.query;
        if (!companyId) return res.status(400).json({ error: "companyId required" });

        const cid = String(companyId);
        const servicePrices = await prisma.servicePrice.findMany({
            where: {
                companyId: cid,
                isActive: true,
            },
            take: 100,
        });

        // Map service prices or default catalog into POS items with barcode / SKU
        const products = servicePrices.map((sp: any, idx: number) => ({
            id: sp.id,
            title: sp.title || sp.name || `Producto #${idx + 1}`,
            sku: sp.sku || `SKU-${1000 + idx}`,
            barcode: sp.barcode || `770${100000000 + idx}`,
            category: sp.category || "General",
            unitPrice: sp.amount || sp.price || 0,
            taxRate: sp.taxRate ?? 0.19,
            stock: sp.stock ?? 999,
            imageUrl: sp.imageUrl || null,
        }));

        if (search) {
            const q = String(search).toLowerCase();
            const filtered = products.filter(
                (p: any) =>
                    p.title.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    p.barcode.includes(q)
            );
            return res.json({ success: true, products: filtered });
        }

        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

// ── POS Sales Checkout & Order Processing (`/api/pos/orders`) ────────────────
app.post("/api/pos/orders", async (req, res) => {
    try {
        const {
            companyId,
            customerName = "Consumidor Final",
            customerNit,
            customerPhone,
            paymentMethod = "CASH",
            cashReceived = 0,
            discountAmount = 0,
            items = [],
        } = req.body;

        if (!companyId) return res.status(400).json({ error: "companyId required" });
        if (!items || items.length === 0) return res.status(400).json({ error: "Items required for checkout" });

        const cid = String(companyId);

        // Subtotal & Tax Calculations
        let subtotalAmount = 0;
        let taxAmount = 0;

        const processedItems = items.map((item: any) => {
            const qty = Math.max(1, Number(item.quantity) || 1);
            const price = Number(item.unitPrice) || 0;
            const itemTaxRate = Number(item.taxRate) || 0;

            const lineSubtotal = qty * price;
            const lineTax = lineSubtotal * itemTaxRate;

            subtotalAmount += lineSubtotal;
            taxAmount += lineTax;

            return {
                title: item.title || "Producto POS",
                description: `SKU: ${item.sku || "N/A"}`,
                quantity: qty,
                unitPrice: price,
                taxRate: itemTaxRate,
                totalAmount: lineSubtotal + lineTax,
            };
        });

        const grossTotal = subtotalAmount + taxAmount;
        const totalAmount = Math.max(0, grossTotal - Number(discountAmount));
        const received = Number(cashReceived) || totalAmount;
        const changeAmount = paymentMethod === "CASH" ? Math.max(0, received - totalAmount) : 0;

        // Create Official POS Invoice Record in Prisma Database
        const invoice = await prisma.invoice.create({
            data: {
                companyId: cid,
                clientName: customerName,
                clientNit: customerNit || null,
                clientPhone: customerPhone || null,
                subtotalAmount,
                taxAmount,
                discountAmount: Number(discountAmount),
                totalAmount,
                advanceAmount: paymentMethod === "CASH" ? received : totalAmount,
                finalAmount: totalAmount,
                status: "PAID",
                currency: "COP",
                isElectronic: true,
                notes: `[POS] Venta Directa en Caja | Medio: ${paymentMethod}`,
                items: {
                    create: processedItems,
                },
            },
            include: { items: true },
        });

        // Update active session cash metrics
        const currentSession = activeSessionsMap.get(cid);
        if (currentSession && currentSession.status === "OPEN") {
            currentSession.orderCount += 1;
            currentSession.totalSales += totalAmount;

            if (paymentMethod === "CASH") currentSession.cashSales += totalAmount;
            else if (paymentMethod === "CARD_POS") currentSession.cardSales += totalAmount;
            else if (paymentMethod === "NEQUI_PSE") currentSession.transferSales += totalAmount;
            else if (paymentMethod === "CREDIT") currentSession.creditSales += totalAmount;

            activeSessionsMap.set(cid, currentSession);
        }

        // Publish event to Redis event bus
        await eventBus.publish("pos.order.created", {
            orderId: invoice.id,
            companyId: cid,
            totalAmount,
            paymentMethod,
            customerName,
        });

        // Generate Thermal Ticket Receipt Payload (80mm/58mm Printers)
        const receiptTicket = {
            header: {
                companyName: "LegacyMark S.A.S.",
                nit: "901.456.789-0",
                address: "Calle Principal #10-20, Colombia",
                phone: "+57 300 123 4567",
                receiptNo: `POS-${invoice.id.split("-")[0].toUpperCase()}`,
                date: new Date().toLocaleString("es-CO"),
            },
            customer: {
                name: customerName,
                nit: customerNit || "222222222222 (Consumidor Final)",
            },
            items: invoice.items.map((i: any) => ({
                name: i.title,
                qty: i.quantity,
                unitPrice: i.unitPrice,
                total: i.totalAmount,
            })),
            totals: {
                subtotal: subtotalAmount,
                tax: taxAmount,
                discount: Number(discountAmount),
                total: totalAmount,
                cashReceived: received,
                change: changeAmount,
                paymentMethod,
            },
        };

        res.status(201).json({
            success: true,
            order: invoice,
            changeAmount,
            receiptTicket,
        });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

app.get("/api/pos/orders", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: "companyId required" });

        const orders = await prisma.invoice.findMany({
            where: {
                companyId: String(companyId),
                notes: { contains: "[POS]" },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { items: true },
        });

        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

const eventBus = new EventBus(REDIS_URL, "pos-service");
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🛍️ POS Service running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
    await eventBus.disconnect();
    await prisma.$disconnect();
    process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
