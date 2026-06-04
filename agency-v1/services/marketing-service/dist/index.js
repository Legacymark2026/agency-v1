"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '4009', 10);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'marketing-service', version: '1.0.0', timestamp: new Date().toISOString() });
});
app.get('/ready', async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ready', db: 'connected' });
    }
    catch (err) {
        res.status(503).json({ status: 'not_ready', error: String(err) });
    }
});
// ─── Email Blasts ─────────────────────────────────────────────────────────────
app.post('/api/email-blast', async (req, res) => {
    try {
        const { name, subject, htmlBody, designJson, isAbTest, subjectB, htmlBodyB, fromName, fromEmail, status, scheduledAt, totalRecipients, companyId, createdById, recipients } = req.body;
        const blast = await database_1.prisma.emailBlast.create({
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
                    create: recipients.map((r, i) => ({
                        email: r.email,
                        name: r.name,
                        variant: isAbTest ? (i % 2 === 0 ? 'A' : 'B') : 'A',
                        variables: Object.fromEntries(Object.entries(r).filter(([k]) => !['email', 'name'].includes(k))),
                        status: 'PENDING'
                    }))
                }
            },
            include: { recipients: true }
        });
        res.status(201).json(blast);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/email-blast', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const blasts = await database_1.prisma.emailBlast.findMany({
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
        const userIds = Array.from(new Set(blasts.map((b) => b.createdById).filter(Boolean)));
        const users = await database_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        });
        const userMap = new Map(users.map((u) => [u.id, u.name || u.email || 'Sistema']));
        const results = blasts.map((b) => ({
            ...b,
            creatorName: b.createdById ? userMap.get(b.createdById) || 'Desconocido' : 'Sistema'
        }));
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/email-blast/:id', async (req, res) => {
    try {
        const { companyId } = req.query;
        const blast = await database_1.prisma.emailBlast.findFirst({
            where: { id: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) },
            include: {
                recipients: {
                    select: { email: true, name: true, status: true, errorMessage: true, sentAt: true },
                    orderBy: { status: 'asc' }
                }
            }
        });
        if (!blast)
            return res.status(404).json({ error: 'Blast no encontrado' });
        res.json(blast);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/email-blast/:id/send', async (req, res) => {
    try {
        const { companyId } = req.body;
        const blast = await database_1.prisma.emailBlast.findFirst({
            where: { id: req.params.id, companyId: String(companyId) }
        });
        if (!blast)
            return res.status(404).json({ error: 'Blast no encontrado' });
        const updated = await database_1.prisma.emailBlast.update({
            where: { id: req.params.id },
            data: {
                status: 'QUEUED',
                scheduledAt: blast.scheduledAt ?? new Date()
            }
        });
        res.json({ success: true, updated });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/email-blast/:id/retry', async (req, res) => {
    try {
        const { companyId } = req.body;
        const blast = await database_1.prisma.emailBlast.findFirst({
            where: { id: req.params.id, companyId: String(companyId) }
        });
        if (!blast)
            return res.status(404).json({ error: 'Blast no encontrado' });
        await database_1.prisma.emailBlastRecipient.updateMany({
            where: { blastId: req.params.id, status: { in: ['FAILED', 'PENDING'] } },
            data: { status: 'PENDING', errorMessage: null }
        });
        const updated = await database_1.prisma.emailBlast.update({
            where: { id: req.params.id },
            data: {
                status: 'QUEUED',
                scheduledAt: new Date()
            }
        });
        res.json({ success: true, updated });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/email-blast/:id', async (req, res) => {
    try {
        const { companyId } = req.query;
        await database_1.prisma.emailBlast.delete({
            where: { id: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/email-blast/bulk-delete', async (req, res) => {
    try {
        const { blastIds, companyId } = req.body;
        await database_1.prisma.emailBlast.deleteMany({
            where: { id: { in: blastIds }, companyId: String(companyId) }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/email-blast/:id/clone', async (req, res) => {
    try {
        const { companyId, userId } = req.body;
        const original = await database_1.prisma.emailBlast.findFirst({
            where: { id: req.params.id, companyId: String(companyId) },
            include: { recipients: { select: { email: true, name: true, variables: true } } }
        });
        if (!original)
            return res.status(404).json({ error: 'Blast no encontrado' });
        const clone = await database_1.prisma.emailBlast.create({
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
                    create: original.recipients.map((r) => ({
                        email: r.email,
                        name: r.name,
                        variables: r.variables ?? {},
                        status: 'PENDING'
                    }))
                }
            }
        });
        res.status(201).json(clone);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/email-blast/test', async (req, res) => {
    try {
        const { subject, html, toEmail } = req.body;
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey)
            return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
        const result = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'LegacyMark <noreply@legacymarksas.com>', to: toEmail, subject: `[PRUEBA] ${subject}`, html })
        });
        const data = await result.json();
        res.json({ success: !!data.id, id: data.id });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Email Templates ──────────────────────────────────────────────────────────
app.get('/api/email-templates', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const templates = await database_1.prisma.emailTemplate.findMany({
            where: { companyId: String(companyId) },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, subject: true, category: true, createdAt: true }
        });
        res.json(templates);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/email-templates/:id', async (req, res) => {
    try {
        const { companyId } = req.query;
        const tpl = await database_1.prisma.emailTemplate.findFirst({
            where: { id: req.params.id, companyId: String(companyId) }
        });
        if (!tpl)
            return res.status(404).json({ error: 'Plantilla no encontrada' });
        res.json(tpl);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/email-templates', async (req, res) => {
    try {
        const { name, subject, htmlBody, designJson, category, companyId } = req.body;
        const tpl = await database_1.prisma.emailTemplate.create({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/email-templates/:id', async (req, res) => {
    try {
        const { name, subject, htmlBody, designJson, category, companyId } = req.body;
        const tpl = await database_1.prisma.emailTemplate.update({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/email-templates/:id', async (req, res) => {
    try {
        const { companyId } = req.query;
        await database_1.prisma.emailTemplate.delete({
            where: { id: req.params.id, companyId: String(companyId) }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Mailing Lists ────────────────────────────────────────────────────────────
app.get('/api/mailing-lists', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const lists = await database_1.prisma.mailingList.findMany({
            where: { companyId: String(companyId) },
            include: { _count: { select: { subscribers: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(lists);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/mailing-lists', async (req, res) => {
    try {
        const { name, description, companyId } = req.body;
        const list = await database_1.prisma.mailingList.create({
            data: { name, description, companyId }
        });
        res.status(201).json(list);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/mailing-lists/:id/subscribers', async (req, res) => {
    try {
        const { companyId } = req.query;
        const list = await database_1.prisma.mailingList.findFirst({
            where: { id: req.params.id, companyId: String(companyId) }
        });
        if (!list)
            return res.status(404).json({ error: 'Lista no encontrada' });
        const subscribers = await database_1.prisma.mailingListSubscriber.findMany({
            where: { listId: req.params.id, status: 'SUBSCRIBED' }
        });
        res.json(subscribers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Suppression List ─────────────────────────────────────────────────────────
app.get('/api/suppression-lists', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const suppressionList = await database_1.prisma.suppressionList.findMany({
            where: { companyId: String(companyId) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(suppressionList);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/suppression-lists', async (req, res) => {
    try {
        const { companyId, email, reason } = req.body;
        const data = await database_1.prisma.suppressionList.upsert({
            where: { companyId_email: { companyId: String(companyId), email: String(email).toLowerCase() } },
            create: { companyId: String(companyId), email: String(email).toLowerCase(), reason: reason || 'UNSUBSCRIBED' },
            update: {}
        });
        res.status(201).json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Marketing Service listening at http://localhost:${PORT}`);
});
process.on('SIGTERM', async () => {
    await database_1.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map