/**
 * HR Service — Human Resources & Payroll Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 4017 (internal)
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import Redis from "ioredis";

const app = express();
const PORT = parseInt(process.env.PORT || "4017", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Health & Readiness ───────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "hr-service", version: "1.0.0", timestamp: new Date().toISOString() });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

import { hrRouter } from "./routes/hr.routes";
import { errorHandler } from "./middlewares/hr.middleware";

app.use("/api", hrRouter);
app.use(errorHandler);

// ── Employees ────────────────────────────────────────────────────────────────

app.get("/api/employees", async (req, res) => {
  try {
    const { companyId, isActive, department, page = "1", limit = "25" } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (department) where.department = String(department);

    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { lastName: "asc" },
        take: parseInt(String(limit)),
        skip,
        include: {
          benefits: { where: { isActive: true } },
          _count: { select: { payrolls: true } }
        }
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({ employees, total, page: parseInt(String(page)), limit: parseInt(String(limit)) });
  } catch (err) {
    console.error("[hr-service] GET /api/employees error:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const employee = await prisma.employee.create({ data: req.body });

    await eventBus.publish("employee.created", {
      employeeId: employee.id,
      companyId: employee.companyId,
      name: `${employee.firstName} ${employee.lastName}`,
    });

    res.status(201).json({ employee });
  } catch (err) {
    console.error("[hr-service] POST /api/employees error:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/employees/:id", async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: { payrolls: { orderBy: { periodEnd: "desc" }, take: 6 }, benefits: true },
    });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json({ employee });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/employees/:id", async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await eventBus.publish("employee.updated", {
      employeeId: employee.id,
      companyId: employee.companyId,
      changes: Object.keys(req.body),
    });

    res.json({ employee });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Payroll ──────────────────────────────────────────────────────────────────

app.get("/api/payroll", async (req, res) => {
  try {
    const { companyId, status, month, year } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (status) where.status = String(status);

    if (month && year) {
      const startDate = new Date(parseInt(String(year)), parseInt(String(month)) - 1, 1);
      const endDate = new Date(parseInt(String(year)), parseInt(String(month)), 0);
      where.periodStart = { gte: startDate };
      where.periodEnd = { lte: endDate };
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: { periodEnd: "desc" },
      include: {
        employee: { select: { firstName: true, lastName: true, documentNumber: true, position: true } },
        items: true,
      },
    });

    const summary = {
      totalEarnings: payrolls.reduce((sum: number, p: typeof payrolls[number]) => sum + Number(p.totalEarnings ?? 0), 0),
      totalNet: payrolls.reduce((sum: number, p: typeof payrolls[number]) => sum + Number(p.netPay ?? 0), 0),
      totalDeductions: payrolls.reduce((sum: number, p: typeof payrolls[number]) => sum + Number(p.totalDeductions ?? 0), 0),
      count: payrolls.length,
    };

    res.json({ payrolls, summary });
  } catch (err) {
    console.error("[hr-service] GET /api/payroll error:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/payroll/generate", async (req, res) => {
  try {
    const { companyId, employeeId, periodStart, periodEnd } = req.body;

    // Fetch employee salary for calculations
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const baseSalary = employee.baseSalary || 0;
    // Colombian labor law calculations
    const healthContribution = baseSalary * 0.04;
    const pensionContribution = baseSalary * 0.04;
    const totalDeductions = healthContribution + pensionContribution;
    const totalEarnings = baseSalary;
    const netPay = totalEarnings - totalDeductions;

    const payroll = await prisma.payroll.create({
      data: {
        companyId,
        employeeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        totalEarnings,
        totalDeductions,
        netPay,
        status: "PENDING",
      },
    });

    // Create payroll line items
    await prisma.payrollItem.createMany({
      data: [
        { payrollId: payroll.id, type: "EARNING", concept: "Salario Base", amount: baseSalary },
        { payrollId: payroll.id, type: "DEDUCTION", concept: "Salud (4%)", amount: healthContribution, baseAmount: baseSalary },
        { payrollId: payroll.id, type: "DEDUCTION", concept: "Pensión (4%)", amount: pensionContribution, baseAmount: baseSalary },
      ],
    });

    await eventBus.publish("payroll.generated", {
      payrollId: payroll.id,
      companyId,
      employeeId,
      netPay,
    });

    res.status(201).json({ payroll });
  } catch (err) {
    console.error("[hr-service] POST /api/payroll/generate error:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/payroll/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { status },
    });

    if (status === "PAID") {
      await eventBus.publish("payroll.paid", {
        payrollId: payroll.id,
        companyId: payroll.companyId,
        employeeId: payroll.employeeId,
        netPay: payroll.netPay,
      });
    }

    res.json({ payroll });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Timesheets ───────────────────────────────────────────────────────────────

app.get("/api/timesheets", async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = String(employeeId);
    if (status) where.status = String(status);

    const timesheets = await prisma.timesheet.findMany({
      where,
      orderBy: { periodEnd: "desc" },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        timeEntries: true,
      },
    });

    res.json({ timesheets, count: timesheets.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/timesheets", async (req, res) => {
  try {
    const timesheet = await prisma.timesheet.create({ data: req.body });
    res.status(201).json({ timesheet });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/timesheets/:id/submit", async (req, res) => {
  try {
    const timesheet = await prisma.timesheet.update({
      where: { id: req.params.id },
      data: { status: "SUBMITTED" },
    });

    await eventBus.publish("timesheet.submitted", {
      timesheetId: timesheet.id,
      employeeId: timesheet.employeeId,
      totalHours: timesheet.totalHours,
    });

    res.json({ timesheet });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── HR Dashboard Stats ───────────────────────────────────────────────────────

app.get("/api/hr/stats", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const cid = String(companyId);
    const [totalEmployees, activeEmployees, pendingPayrolls, monthlyPayrollCost] = await Promise.all([
      prisma.employee.count({ where: { companyId: cid } }),
      prisma.employee.count({ where: { companyId: cid, isActive: true } }),
      prisma.payroll.count({ where: { companyId: cid, status: "PENDING" } }),
      prisma.payroll.aggregate({
        where: {
          companyId: cid,
          status: "PAID",
          periodEnd: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { netPay: true },
      }),
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      pendingPayrolls,
      monthlyPayrollCost: monthlyPayrollCost._sum.netPay || 0,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── PILA Export ──────────────────────────────────────────────────────────────

app.get("/api/hr/pila-export", async (req, res) => {
  try {
    const { companyId, month, year } = req.query;
    if (!companyId || !month || !year) {
      return res.status(400).json({ error: "companyId, month, year required" });
    }

    const startDate = new Date(parseInt(String(year)), parseInt(String(month)) - 1, 1);
    const endDate = new Date(parseInt(String(year)), parseInt(String(month)), 0);

    const payrolls = await prisma.payroll.findMany({
      where: {
        companyId: String(companyId),
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
      },
      include: { employee: true },
    });

    const headers = "TipoDocumento,NumeroDocumento,Nombres,Apellidos,IBC,Salud,Pension,ARL,CCF";
    const rows = payrolls.map((p: typeof payrolls[number]) => {
      const ibc = p.totalEarnings || 0;
      return [
        p.employee.documentType || "CC",
        p.employee.documentNumber || "",
        p.employee.firstName,
        p.employee.lastName,
        ibc.toFixed(0),
        (ibc * 0.125).toFixed(0),
        (ibc * 0.16).toFixed(0),
        (ibc * 0.00522).toFixed(0),
        (ibc * 0.04).toFixed(0),
      ].join(",");
    });

    const csv = [headers, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=PILA_${year}_${month}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Employee Benefits CRUD ───────────────────────────────────────────────────

app.post('/api/hr/benefits', async (req, res) => {
  try {
    const { startDate, endDate, ...data } = req.body;
    const benefit = await prisma.employeeBenefit.create({
      data: {
        ...data,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      }
    });
    res.status(201).json({ success: true, data: benefit });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/hr/benefits/:id', async (req, res) => {
  try {
    const { endDate, ...data } = req.body;
    const benefit = await prisma.employeeBenefit.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(endDate ? { endDate: new Date(endDate) } : {}),
      }
    });
    res.json({ success: true, data: benefit });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/hr/benefits/:id', async (req, res) => {
  try {
    await prisma.employeeBenefit.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Time Off Requests ────────────────────────────────────────────────────────

app.get('/api/hr/time-off', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const requests = await prisma.timeOffRequest.findMany({
      where: { employee: { companyId: String(companyId) } },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, position: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/hr/time-off', async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;
    const request = await prisma.timeOffRequest.create({
      data: {
        employeeId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING'
      }
    });
    res.status(201).json({ success: true, request });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/hr/time-off/:id', async (req, res) => {
  try {
    const { status, approvedById } = req.body;
    const request = await prisma.timeOffRequest.update({
      where: { id: req.params.id },
      data: { status, approvedById }
    });
    res.json({ success: true, request });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Timesheets & Time Entries ────────────────────────────────────────────────

app.get('/api/hr/timesheets', async (req, res) => {
  try {
    const { companyId, employeeId, status } = req.query;
    const where: any = {};
    if (companyId) where.employee = { companyId: String(companyId) };
    if (employeeId) where.employeeId = String(employeeId);
    if (status) where.status = String(status);

    const timesheets = await prisma.timesheet.findMany({
      where,
      orderBy: { periodStart: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, position: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, name: true } },
        _count: { select: { timeEntries: true } }
      }
    });
    res.json({ timesheets, count: timesheets.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/hr/timesheets/:id', async (req, res) => {
  try {
    const { status, approvedById } = req.body;
    const sheet = await prisma.timesheet.update({
      where: { id: req.params.id },
      data: { status, approvedById }
    });
    res.json({ success: true, sheet });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/hr/time-entries', async (req, res) => {
  try {
    const { userId, kanbanTaskId, duration, startedAt, endedAt } = req.body;
    let targetTaskId = kanbanTaskId;
    if (!targetTaskId) {
      const firstTask = await prisma.kanbanTask.findFirst();
      if (firstTask) targetTaskId = firstTask.id;
    }
    if (!targetTaskId) {
      return res.status(400).json({ error: 'No active task available to log time against.' });
    }
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        kanbanTaskId: targetTaskId,
        duration,
        startedAt: new Date(startedAt),
        endedAt: new Date(endedAt),
      }
    });
    res.status(201).json({ success: true, data: timeEntry });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Employee Summary ─────────────────────────────────────────────────────────

app.get('/api/employees/:id/summary', async (req, res) => {
  try {
    const { companyId } = req.query;
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) }
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    const [payrollHistory, benefits] = await Promise.all([
      prisma.payroll.findMany({
        where: { employeeId: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) },
        orderBy: { periodStart: 'desc' },
        take: 12,
        select: { netPay: true, status: true, periodStart: true, periodEnd: true, id: true }
      }),
      prisma.employeeBenefit.findMany({
        where: { employeeId: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}), isActive: true }
      })
    ]);
    res.json({ employee, payrollHistory, benefits });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Event Bus ────────────────────────────────────────────────────────────────

const eventBus = new EventBus(REDIS_URL, "hr-service");
const redisClient = new Redis(REDIS_URL);
redisClient.on("error", (err) => console.error("[hr-service] Redis client error:", err.message));

eventBus.subscribe("invoice.paid", async (payload) => {
  const { companyId } = payload.data;
  if (companyId) {
    console.log(`[hr-service] Invoice paid event received for company ${companyId}`);
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`👥 HR Service running on port ${PORT}`);
  console.log(`   Modules: Employees, Payroll, Timesheets, PILA`);
});

process.on("SIGTERM", async () => {
  await eventBus.disconnect();
  await redisClient.quit();
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
