/**
 * Finance Service — Billing, Payroll & Accounting Microservice
 * Port: 4006 | Low frequency, high data criticality
 */
try { require("@agency/observability/register"); } catch { /* optional */ }
import { setupGracefulShutdown } from "@agency/service-auth";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "crypto";
import Stripe from "stripe";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const app = express();
const PORT = parseInt(process.env.PORT || "4006", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "wompi_dev_integrity_secret";

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => { res.json({ status: "healthy", service: "finance-service" }); });
app.get("/ready", async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: "ready" }); }
  catch (err) { res.status(503).json({ status: "not_ready", error: String(err) }); }
});
import { financeRouter } from "./routes/finance.routes";
import { errorHandler } from "./middlewares/finance.middleware";

app.use("/api/v1", financeRouter);
app.use(errorHandler);

// ── Invoices ─────────────────────────────────────────────────────────────────
app.get("/api/invoices", async (req, res) => {
  try {
    const { companyId, status } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (status) where.status = String(status);
    const invoices = await prisma.invoice.findMany({ 
      where, 
      orderBy: { createdAt: "desc" }, 
      include: { items: true } 
    });
    res.json({ invoices });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/invoices", async (req, res) => {
  try {
    const {
      clientName, clientNit, clientAddress, clientCity, clientPhone,
      subtotalAmount, taxAmount, discountAmount, totalAmount, advanceAmount, finalAmount,
      dueDate, notes, terms, leadId, dealId, companyId, isElectronic, items
    } = req.body;

    const invoice = await prisma.invoice.create({
      data: {
        clientName, clientNit, clientAddress, clientCity, clientPhone,
        subtotalAmount, taxAmount, discountAmount, totalAmount, advanceAmount, finalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes, terms, leadId, dealId, companyId,
        isElectronic: isElectronic ?? true,
        status: "DRAFT_AWAITING_PAYMENT",
        items: {
          create: (items || []).map((item: any) => ({
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            totalAmount: item.totalAmount
          }))
        }
      },
      include: { items: true }
    });

    res.status(201).json({ success: true, invoice });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.patch("/api/invoices/:id", async (req, res) => {
  try {
    const { status, paymentUrl, stripeInvoiceId } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(paymentUrl !== undefined && { paymentUrl }),
        ...(stripeInvoiceId !== undefined && { stripeInvoiceId }),
      }
    });
    res.json({ success: true, invoice });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.patch("/api/invoices/:id/pay", async (req, res) => {
  try {
    const invoice = await prisma.invoice.update({ 
      where: { id: req.params.id }, 
      data: { status: "PAID" } 
    });
    await eventBus.publish("invoice.paid", { 
      invoiceId: invoice.id, 
      companyId: invoice.companyId, 
      dealId: invoice.dealId || undefined, 
      amount: invoice.totalAmount 
    });
    res.json({ invoice });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.delete("/api/invoices/:id", async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/invoices/stats", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const invoices = await prisma.invoice.findMany({
      where: { companyId: String(companyId) },
      select: { totalAmount: true, status: true, dueDate: true }
    });

    const now = new Date();
    let billed = 0;
    let outstanding = 0;
    let overdue = 0;
    let paidCount = 0;
    let totalCount = invoices.length;

    invoices.forEach((inv: any) => {
      if (inv.status === 'PAID') {
        billed += inv.totalAmount;
        paidCount++;
      } else if (inv.status !== 'CANCELLED') {
        outstanding += inv.totalAmount;
        if (inv.dueDate && new Date(inv.dueDate) < now) {
          overdue += inv.totalAmount;
        }
      }
    });

    const successRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

    res.json({
      success: true,
      data: { billed, outstanding, overdue, successRate }
    });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// ── Payroll ──────────────────────────────────────────────────────────────────
app.get("/api/payroll", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const payrolls = await prisma.payroll.findMany({ 
      where: { companyId: String(companyId) }, 
      orderBy: { periodEnd: "desc" }, 
      include: { employee: true } 
    });
    res.json({ payrolls });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// ── Expenses ─────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
    { name: "Software y Suscripciones", code: "SOFT", color: "#6366f1" },
    { name: "Publicidad y Pauta", code: "ADS", color: "#f59e0b" },
    { name: "Viáticos y Transporte", code: "VIA", color: "#10b981" },
    { name: "Servicios Públicos", code: "SERV", color: "#3b82f6" },
    { name: "Equipos y Hardware", code: "EQUIP", color: "#8b5cf6" },
    { name: "Arrendamiento", code: "ARREND", color: "#ec4899" },
    { name: "Personal Externo", code: "EXT", color: "#14b8a6" },
    { name: "Impuestos y Tasas", code: "IMP", color: "#ef4444" },
    { name: "Gastos Bancarios", code: "BANK", color: "#64748b" },
    { name: "Otros", code: "OTR", color: "#a3a3a3" },
];

app.get("/api/expenses/categories", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const cid = String(companyId);
    let categories = await prisma.expenseCategory.findMany({
      where: { companyId: cid, isActive: true },
      orderBy: { name: "asc" }
    });

    if (categories.length === 0) {
      await prisma.expenseCategory.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          companyId: cid,
        })),
        skipDuplicates: true
      });
      categories = await prisma.expenseCategory.findMany({
        where: { companyId: cid, isActive: true },
        orderBy: { name: "asc" }
      });
    }

    res.json({ success: true, data: categories });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/expenses/categories", async (req, res) => {
  try {
    const { name, code, color, companyId } = req.body;
    const category = await prisma.expenseCategory.create({
      data: { name, code, color, companyId }
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const { companyId, status, categoryId, dateFrom, dateTo, search } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: any = { companyId: String(companyId) };
    if (status) where.status = String(status);
    if (categoryId) where.categoryId = String(categoryId);
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(String(dateFrom));
      if (dateTo) where.date.lte = new Date(String(dateTo));
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { vendor: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: { select: { name: true, color: true, code: true } },
        createdBy: { select: { name: true, firstName: true } },
        approvedBy: { select: { name: true, firstName: true } },
      },
      orderBy: { date: "desc" },
      take: 200
    });

    res.json({ success: true, data: expenses });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const {
      companyId, createdById, title, amount, date, categoryId, vendor,
      description, reference, paymentMethod, accountId, notes
    } = req.body;

    const expense = await prisma.expense.create({
      data: {
        companyId, createdById, title, amount,
        date: new Date(date),
        categoryId: categoryId || null,
        vendor: vendor || null,
        description: description || null,
        reference: reference || null,
        paymentMethod: paymentMethod || "TRANSFER",
        accountId: accountId || null,
        notes: notes || null,
        status: "PENDING",
      },
      include: { category: true }
    });

    res.status(201).json({ success: true, data: expense });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.patch("/api/expenses/:id", async (req, res) => {
  try {
    const {
      title, amount, date, categoryId, vendor, description, reference,
      paymentMethod, accountId, notes, status, approvedById, approvedAt, paidAt
    } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(amount !== undefined && { amount }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(vendor !== undefined && { vendor }),
        ...(description !== undefined && { description }),
        ...(reference !== undefined && { reference }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(accountId !== undefined && { accountId }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(approvedById !== undefined && { approvedById }),
        ...(approvedAt !== undefined && { approvedAt: approvedAt ? new Date(approvedAt) : null }),
        ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : null }),
      }
    });

    res.json({ success: true, data: expense });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
    });
    if (!expense) return res.status(404).json({ error: "Gasto no encontrado" });
    if (expense.status === "PAID") return res.status(400).json({ error: "No se puede eliminar un gasto pagado" });

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/expenses/stats", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const cid = String(companyId);
    const now = new Date();
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);

    const [allExpenses, currentMonthExpenses, lastMonthExpenses, byCategory] = await Promise.all([
      prisma.expense.findMany({
        where: { companyId: cid },
        select: { amount: true, status: true, categoryId: true }
      }),
      prisma.expense.aggregate({
        where: { companyId: cid, date: { gte: startOfMonthDate } },
        _sum: { amount: true },
        _count: true
      }),
      prisma.expense.aggregate({
        where: { companyId: cid, date: { gte: startOfLastMonthDate, lte: endOfLastMonthDate } },
        _sum: { amount: true }
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: { companyId: cid },
        _sum: { amount: true },
        _count: true
      })
    ]);

    const categoryIds = byCategory.map((c: any) => c.categoryId).filter(Boolean) as string[];
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } }
    });
    const categoryMap = Object.fromEntries(categories.map((c: any) => [c.id, c]));

    const totalAmount = allExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const pendingAmount = allExpenses.filter((e: any) => e.status === "PENDING").reduce((sum: number, e: any) => sum + e.amount, 0);
    const paidAmount = allExpenses.filter((e: any) => e.status === "PAID").reduce((sum: number, e: any) => sum + e.amount, 0);

    const monthlyChange =
      lastMonthExpenses._sum.amount && lastMonthExpenses._sum.amount > 0
        ? (((currentMonthExpenses._sum.amount || 0) - lastMonthExpenses._sum.amount) /
              lastMonthExpenses._sum.amount) *
          100
        : 0;

    const byCategoryFormatted = byCategory.map((c: any) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryId ? categoryMap[c.categoryId]?.name || "Sin categoría" : "Sin categoría",
      categoryColor: c.categoryId ? categoryMap[c.categoryId]?.color || "#a3a3a3" : "#a3a3a3",
      total: c._sum.amount || 0,
      count: c._count
    }));

    res.json({
      success: true,
      data: {
        totalAmount,
        pendingAmount,
        paidAmount,
        currentMonthTotal: currentMonthExpenses._sum.amount || 0,
        currentMonthCount: currentMonthExpenses._count,
        lastMonthTotal: lastMonthExpenses._sum.amount || 0,
        monthlyChange,
        byCategory: byCategoryFormatted.sort((a: any, b: any) => b.total - a.total)
      }
    });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// ── Payment Gateways & Processing ───────────────────────────────────────────
app.get("/api/payments/gateways", async (_req, res) => {
  res.json({
    success: true,
    gateways: {
      stripe: { enabled: Boolean(stripe), mode: STRIPE_SECRET_KEY.startsWith("sk_live") ? "live" : "test" },
      wompi: { enabled: true, currency: "COP" },
      paypal: { enabled: true, currency: "USD" },
      mercadopago: { enabled: true, currency: "COP" },
    }
  });
});

app.post("/api/payments/checkout-session", async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      currency = "USD",
      customerEmail,
      title = "Invoice Payment",
      successUrl,
      cancelUrl,
      mode = "payment"
    } = req.body;

    let targetInvoice: any = null;
    if (invoiceId) {
      targetInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!targetInvoice) return res.status(404).json({ error: "Invoice not found" });
    }

    const payAmount = targetInvoice ? targetInvoice.totalAmount : amount;
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount for payment session" });
    }

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: mode === "subscription" ? "subscription" : "payment",
        customer_email: customerEmail || targetInvoice?.clientPhone || undefined,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: title,
                description: targetInvoice ? `Invoice #${targetInvoice.id}` : "LegacyMark Service Payment",
              },
              unit_amount: Math.round(payAmount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl || `https://legacymarksas.com/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `https://legacymarksas.com/checkout/cancel`,
        metadata: {
          invoiceId: invoiceId || "",
          companyId: targetInvoice?.companyId || "",
        },
      });

      if (targetInvoice) {
        await prisma.invoice.update({
          where: { id: targetInvoice.id },
          data: {
            paymentUrl: session.url,
            stripeInvoiceId: session.id,
          },
        });
      }

      return res.json({ success: true, url: session.url, sessionId: session.id });
    }

    // Mock payment URL fallback for dev/staging environments without active Stripe key
    const mockPaymentUrl = `https://legacymarksas.com/pay/${invoiceId || "direct"}?amount=${payAmount}&cur=${currency}`;
    if (targetInvoice) {
      await prisma.invoice.update({
        where: { id: targetInvoice.id },
        data: { paymentUrl: mockPaymentUrl },
      });
    }

    res.json({
      success: true,
      url: mockPaymentUrl,
      mock: true,
      message: "Generated fallback payment session (Stripe API key not configured)"
    });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/payments/create-intent", async (req, res) => {
  try {
    const { amount, currency = "usd", invoiceId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Amount required" });

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: { invoiceId: invoiceId || "" },
      });

      return res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    res.json({
      success: true,
      clientSecret: `mock_secret_${Date.now()}`,
      mock: true,
    });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// Wompi Integrity Signature Generator (Colombia COP Payments)
app.post("/api/payments/wompi/signature", async (req, res) => {
  try {
    const { reference, amountInCents, currency = "COP", expirationTime } = req.body;
    if (!reference || !amountInCents) {
      return res.status(400).json({ error: "reference and amountInCents required" });
    }

    const rawString = `${reference}${amountInCents}${currency}${expirationTime || ""}${WOMPI_INTEGRITY_SECRET}`;
    const signature = crypto.createHash("sha256").update(rawString).digest("hex");

    res.json({
      success: true,
      reference,
      amountInCents,
      currency,
      signature,
      publicKey: process.env.WOMPI_PUBLIC_KEY || "pub_prod_wompi_key_stub",
    });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// ── Subscriptions ─────────────────────────────────────────────────────────────
app.get("/api/subscriptions", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: String(companyId),
        notes: { contains: "[SUBSCRIPTION]" }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, subscriptions: invoices });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/subscriptions", async (req, res) => {
  try {
    const { planName, amount, currency = "USD", companyId, clientName, clientNit, interval = "MONTHLY" } = req.body;
    if (!companyId || !amount) return res.status(400).json({ error: "companyId and amount required" });

    const nextDueDate = new Date();
    if (interval === "YEARLY") nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    else nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        clientName: clientName || "Subscriber Client",
        clientNit: clientNit || null,
        subtotalAmount: amount,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: amount,
        advanceAmount: 0,
        finalAmount: amount,
        currency,
        dueDate: nextDueDate,
        notes: `[SUBSCRIPTION] Plan: ${planName || "Standard"} | Interval: ${interval}`,
        status: "DRAFT_AWAITING_PAYMENT",
        items: {
          create: [{
            title: `Plan ${planName || "Suscripción"} (${interval})`,
            description: `Renovación periódica ${interval}`,
            quantity: 1,
            unitPrice: amount,
            taxRate: 0,
            totalAmount: amount
          }]
        }
      },
      include: { items: true }
    });

    res.status(201).json({ success: true, subscription: invoice });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/subscriptions/:id/cancel", async (req, res) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" }
    });
    res.json({ success: true, subscription: invoice });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// ── Webhooks: Stripe, Wompi & PayPal ─────────────────────────────────────────
app.post("/api/webhooks/stripe", async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    let event: any = req.body;

    if (stripe && STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.warn(`[finance-service] Webhook signature verification failed: ${String(err)}`);
        return res.status(400).send(`Webhook Error: ${String(err)}`);
      }
    }

    const eventType = event.type || "checkout.session.completed";
    console.log(`[finance-service] Processing Stripe event: ${eventType}`);

    if (eventType === "checkout.session.completed" || eventType === "payment_intent.succeeded") {
      const session = event.data?.object || {};
      const invoiceId = session.metadata?.invoiceId || session.client_reference_id;

      if (invoiceId) {
        const invoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID" }
        });
        await eventBus.publish("invoice.paid", {
          invoiceId: invoice.id,
          companyId: invoice.companyId,
          amount: invoice.totalAmount,
          gateway: "STRIPE"
        });
      }
    }

    res.json({ received: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/webhooks/wompi", async (req, res) => {
  try {
    const { event, data } = req.body;
    console.log(`[finance-service] Wompi webhook event: ${event}`);

    if (event === "transaction.updated" && data?.transaction) {
      const transaction = data.transaction;
      const invoiceId = transaction.reference;
      const status = transaction.status;

      if (status === "APPROVED" && invoiceId) {
        try {
          const invoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: "PAID" }
          });
          await eventBus.publish("invoice.paid", {
            invoiceId: invoice.id,
            companyId: invoice.companyId,
            amount: invoice.totalAmount,
            gateway: "WOMPI"
          });
        } catch (e) {
          console.error(`[finance-service] Could not find or update invoice for Wompi transaction ${invoiceId}`);
        }
      }
    }

    res.json({ received: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/webhooks/paypal", async (req, res) => {
  try {
    const { event_type, resource } = req.body;
    console.log(`[finance-service] PayPal webhook: ${event_type}`);

    if (event_type === "PAYMENT.CAPTURE.COMPLETED" || event_type === "CHECKOUT.ORDER.APPROVED") {
      const invoiceId = resource?.custom_id || resource?.invoice_id;
      if (invoiceId) {
        const invoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID" }
        });
        await eventBus.publish("invoice.paid", {
          invoiceId: invoice.id,
          companyId: invoice.companyId,
          amount: invoice.totalAmount,
          gateway: "PAYPAL"
        });
      }
    }

    res.json({ received: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// ── Cron: Subscriptions ──────────────────────────────────────────────────────
app.post("/api/cron/subscriptions", async (_req, res) => {
  try {
    console.log("[finance-service] Processing subscription renewals cron");
    const now = new Date();

    const dueSubscriptions = await prisma.invoice.findMany({
      where: {
        notes: { contains: "[SUBSCRIPTION]" },
        dueDate: { lte: now },
        status: "PAID"
      }
    });

    let renewedCount = 0;
    for (const sub of dueSubscriptions) {
      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      await prisma.invoice.create({
        data: {
          companyId: sub.companyId,
          clientName: sub.clientName,
          clientNit: sub.clientNit,
          subtotalAmount: sub.subtotalAmount,
          taxAmount: sub.taxAmount,
          discountAmount: sub.discountAmount,
          totalAmount: sub.totalAmount,
          advanceAmount: 0,
          finalAmount: sub.totalAmount,
          currency: sub.currency,
          dueDate: nextDueDate,
          notes: sub.notes,
          status: "DRAFT_AWAITING_PAYMENT"
        }
      });
      renewedCount++;
    }

    res.json({ success: true, processed: renewedCount });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

const eventBus = new EventBus(REDIS_URL, "finance-service");
const server = app.listen(PORT, "0.0.0.0", () => { console.log(`💰 Finance Service running on port ${PORT}`); });
setupGracefulShutdown(server);
process.on("SIGTERM", async () => { await eventBus.disconnect(); await prisma.$disconnect(); process.exit(0); });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
