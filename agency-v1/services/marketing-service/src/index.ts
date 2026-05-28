import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from '@agency/database';

const app = express();
const PORT = parseInt(process.env.PORT || '4009', 10);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'marketing-service', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', error: String(err) });
  }
});

// ─── Email Blasts ─────────────────────────────────────────────────────────────
app.post('/api/email-blast', async (req: Request, res: Response) => {
  try {
    const { name, subject, htmlBody, designJson, isAbTest, subjectB, htmlBodyB, fromName, fromEmail, status, scheduledAt, totalRecipients, companyId, createdById, recipients } = req.body;
    const blast = await (prisma as any).emailBlast.create({
      data: {
        name,
        subject,
        htmlBody,
        designJson: designJson ?? null,
        isAbTest: isAbTest ?? false,
        subjectB: subjectB ?? null,
        htmlBodyB: htmlBodyB ?? null,
        fromName: fromName ?? 'LegacyMark',
        fromEmail: fromEmail ?? 'noreply@legacymarksas.com',
        status: status || (scheduledAt ? 'QUEUED' : 'DRAFT'),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalRecipients: totalRecipients || recipients.length,
        companyId,
        createdById,
        recipients: {
          create: recipients.map((r: any, i: number) => ({
            email: r.email,
            name: r.name,
            variant: isAbTest ? (i % 2 === 0 ? 'A' : 'B') : 'A',
            variables: Object.fromEntries(
              Object.entries(r).filter(([k]) => !['email', 'name'].includes(k))
            ),
            status: 'PENDING'
          }))
        }
      },
      include: { recipients: true }
    });
    res.status(201).json(blast);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/email-blast', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const blasts = await (prisma as any).emailBlast.findMany({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        totalRecipients: true,
        sent: true,
        failed: true,
        sentAt: true,
        createdAt: true,
        createdById: true
      }
    });

    const userIds = Array.from(new Set(blasts.map((b: any) => b.createdById).filter(Boolean)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });
    const userMap = new Map(users.map((u) => [u.id, u.name || u.email || 'Sistema']));

    const results = blasts.map((b: any) => ({
      ...b,
      creatorName: b.createdById ? userMap.get(b.createdById) || 'Desconocido' : 'Sistema'
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/email-blast/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const blast = await (prisma as any).emailBlast.findFirst({
      where: { id: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) },
      include: {
        recipients: {
          select: { email: true, name: true, status: true, errorMessage: true, sentAt: true },
          orderBy: { status: 'asc' }
        }
      }
    });
    if (!blast) return res.status(404).json({ error: 'Blast no encontrado' });
    res.json(blast);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email-blast/:id/send', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;
    const blast = await (prisma as any).emailBlast.findFirst({
      where: { id: req.params.id, companyId: String(companyId) }
    });
    if (!blast) return res.status(404).json({ error: 'Blast no encontrado' });
    const updated = await (prisma as any).emailBlast.update({
      where: { id: req.params.id },
      data: {
        status: 'QUEUED',
        scheduledAt: blast.scheduledAt ?? new Date()
      }
    });
    res.json({ success: true, updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email-blast/:id/retry', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;
    const blast = await (prisma as any).emailBlast.findFirst({
      where: { id: req.params.id, companyId: String(companyId) }
    });
    if (!blast) return res.status(404).json({ error: 'Blast no encontrado' });
    await (prisma as any).emailBlastRecipient.updateMany({
      where: { blastId: req.params.id, status: { in: ['FAILED', 'PENDING'] } },
      data: { status: 'PENDING', errorMessage: null }
    });
    const updated = await (prisma as any).emailBlast.update({
      where: { id: req.params.id },
      data: {
        status: 'QUEUED',
        scheduledAt: new Date()
      }
    });
    res.json({ success: true, updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/email-blast/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    await (prisma as any).emailBlast.delete({
      where: { id: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email-blast/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { blastIds, companyId } = req.body;
    await (prisma as any).emailBlast.deleteMany({
      where: { id: { in: blastIds }, companyId: String(companyId) }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email-blast/:id/clone', async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = req.body;
    const original = await (prisma as any).emailBlast.findFirst({
      where: { id: req.params.id, companyId: String(companyId) },
      include: { recipients: { select: { email: true, name: true, variables: true } } }
    });
    if (!original) return res.status(404).json({ error: 'Blast no encontrado' });
    const clone = await (prisma as any).emailBlast.create({
      data: {
        name: `${original.name} (Copia)`,
        subject: original.subject,
        htmlBody: original.htmlBody,
        fromName: original.fromName,
        fromEmail: original.fromEmail,
        status: 'DRAFT',
        totalRecipients: original.totalRecipients,
        companyId,
        createdById: userId,
        recipients: {
          create: original.recipients.map((r: any) => ({
            email: r.email,
            name: r.name,
            variables: r.variables ?? {},
            status: 'PENDING'
          }))
        }
      }
    });
    res.status(201).json(clone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email-blast/test', async (req: Request, res: Response) => {
  try {
    const { subject, html, toEmail } = req.body;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'LegacyMark <noreply@legacymarksas.com>', to: toEmail, subject: `[PRUEBA] ${subject}`, html })
    });
    const data = await result.json() as { id?: string };
    res.json({ success: !!data.id, id: data.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Email Templates ──────────────────────────────────────────────────────────
app.get('/api/email-templates', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const templates = await (prisma as any).emailTemplate.findMany({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, subject: true, category: true, createdAt: true }
    });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/email-templates/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const tpl = await (prisma as any).emailTemplate.findFirst({
      where: { id: req.params.id, companyId: String(companyId) }
    });
    if (!tpl) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json(tpl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email-templates', async (req: Request, res: Response) => {
  try {
    const { name, subject, htmlBody, designJson, category, companyId } = req.body;
    const tpl = await (prisma as any).emailTemplate.create({
      data: {
        name,
        subject,
        body: htmlBody,
        designJson: designJson ?? null,
        category: category ?? 'MARKETING',
        companyId
      }
    });
    res.status(201).json(tpl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/email-templates/:id', async (req: Request, res: Response) => {
  try {
    const { name, subject, htmlBody, designJson, category, companyId } = req.body;
    const tpl = await (prisma as any).emailTemplate.update({
      where: { id: req.params.id, companyId: String(companyId) },
      data: {
        name,
        subject,
        body: htmlBody,
        designJson: designJson ?? null,
        category: category ?? 'MARKETING'
      }
    });
    res.json(tpl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/email-templates/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    await (prisma as any).emailTemplate.delete({
      where: { id: req.params.id, companyId: String(companyId) }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Mailing Lists ────────────────────────────────────────────────────────────
app.get('/api/mailing-lists', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const lists = await (prisma as any).mailingList.findMany({
      where: { companyId: String(companyId) },
      include: { _count: { select: { subscribers: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(lists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mailing-lists', async (req: Request, res: Response) => {
  try {
    const { name, description, companyId } = req.body;
    const list = await (prisma as any).mailingList.create({
      data: { name, description, companyId }
    });
    res.status(201).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mailing-lists/:id/subscribers', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const list = await (prisma as any).mailingList.findFirst({
      where: { id: req.params.id, companyId: String(companyId) }
    });
    if (!list) return res.status(404).json({ error: 'Lista no encontrada' });
    const subscribers = await (prisma as any).mailingListSubscriber.findMany({
      where: { listId: req.params.id, status: 'SUBSCRIBED' }
    });
    res.json(subscribers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Suppression List ─────────────────────────────────────────────────────────
app.get('/api/suppression-lists', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const suppressionList = await (prisma as any).suppressionList.findMany({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(suppressionList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppression-lists', async (req: Request, res: Response) => {
  try {
    const { companyId, email, reason } = req.body;
    const data = await (prisma as any).suppressionList.upsert({
      where: { companyId_email: { companyId: String(companyId), email: String(email).toLowerCase() } },
      create: { companyId: String(companyId), email: String(email).toLowerCase(), reason: reason || 'UNSUBSCRIBED' },
      update: {}
    });
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Marketing Service listening at http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
