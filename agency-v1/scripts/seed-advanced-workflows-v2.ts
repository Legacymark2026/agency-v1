import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate node
const n = (id: string, type: string, data: any, x: number, y: number) => ({
    id,
    type,
    data,
    position: { x, y }
});

// Helper to generate edge
const e = (id: string, source: string, target: string, sourceHandle?: string) => ({
    id,
    source,
    target,
    animated: true,
    ...(sourceHandle ? { sourceHandle } : {})
});

async function main() {
    console.log('Seeding 20 Ultra-Advanced Workflows...');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found to associate workflows.');
        process.exit(1);
    }

    const agent = await prisma.aIAgent.findFirst({ where: { companyId: company.id, isActive: true } });
    const agentId = agent?.id ?? 'no-agent';

    console.log('Using Company:', company.id, 'Agent:', agentId);

    // 1. Delete existing workflows
    await prisma.workflow.deleteMany({ where: { companyId: company.id } });

    const workflows = [
        {
            name: '01 🎯 Lead Scoring Automático + Routing ICP',
            isActive: true,
            triggerType: 'FORM_SUBMISSION',
            triggerConfig: {},
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Nuevo Lead Form', triggerType: 'FORM_SUBMISSION' }, 400, 50),
                    n('a1', 'aiNode', { aiTask: 'EXTRACTION', agentId, promptContext: 'Extract name, email, company, and calculate leadScore from 1 to 100 based on title.' }, 400, 220),
                    n('s1', 'switchNode', { variable: 'leadScore', branches: [{ id: 'b1', label: '> 80', value: '80', matchMode: 'gt' }, { id: 'b2', label: '> 50', value: '50', matchMode: 'gt' }, { id: 'b3', label: '< 50', value: '0', matchMode: 'gt' }] }, 400, 390),
                    n('h1', 'crmActionNode', { actionType: 'UPDATE_DEAL', stage: 'HOT_LEAD' }, 150, 560),
                    n('w1', 'crmActionNode', { actionType: 'UPDATE_DEAL', stage: 'WARM_LEAD' }, 400, 560),
                    n('c1', 'crmActionNode', { actionType: 'UPDATE_DEAL', stage: 'COLD_LEAD' }, 650, 560),
                    n('nt', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Llamar Lead VIP: {{name}}', priority: 'HIGH' }, 150, 730)
                ],
                edges: [
                    e('e1', 't1', 'a1'), e('e2', 'a1', 's1'),
                    e('e3', 's1', 'h1', 'b1'), e('e4', 's1', 'w1', 'b2'), e('e5', 's1', 'c1', 'b3'),
                    e('e6', 'h1', 'nt')
                ]
            }
        },
        {
            name: '02 🔁 Drip Omnicanal 7 Toques (Email + WA)',
            isActive: true,
            triggerType: 'FORM_SUBMISSION',
            triggerConfig: {},
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Webinar Reg', triggerType: 'FORM_SUBMISSION' }, 400, 50),
                    n('e1', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Bienvenido al Webinar', toVariable: 'email' }, 400, 220),
                    n('w1', 'waitNode', { delayValue: 1, delayUnit: 'd' }, 400, 390),
                    n('wa1', 'actionNode', { actionType: 'SEND_WHATSAPP', message: 'Hola {{name}}, listo para mañana?', phoneVariable: 'phone' }, 400, 560),
                    n('w2', 'waitNode', { delayValue: 1, delayUnit: 'd' }, 400, 730),
                    n('e2', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Comenzamos en 1 hora!', toVariable: 'email' }, 400, 900),
                ],
                edges: [
                    e('e1', 't1', 'e1'), e('e2', 'e1', 'w1'), e('e3', 'w1', 'wa1'), e('e4', 'wa1', 'w2'), e('e5', 'w2', 'e2')
                ]
            }
        },
        {
            name: '03 💬 WhatsApp Conversational AI + Memory',
            isActive: true,
            triggerType: 'WHATSAPP_TRIGGER',
            triggerConfig: { channel: 'all' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Mensaje WA', triggerType: 'WHATSAPP_TRIGGER' }, 400, 50),
                    n('a1', 'aiNode', { aiTask: 'CLASSIFICATION', agentId, promptContext: 'Classify intent: SALES, SUPPORT, CHIT_CHAT' }, 400, 220),
                    n('s1', 'switchNode', { variable: 'ai_response', branches: [{ id: 'b1', value: 'SALES' }, { id: 'b2', value: 'SUPPORT' }] }, 400, 390),
                    n('n1', 'actionNode', { actionType: 'SEND_WHATSAPP', message: 'Para ventas te paso con un agente. Un momento.' }, 200, 560),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Ventas WA: {{name}}', priority: 'HIGH' }, 200, 730),
                    n('n2', 'actionNode', { actionType: 'SEND_WHATSAPP', message: 'Soporte técnico: escribe tu problema.' }, 600, 560)
                ],
                edges: [
                    e('e1', 't1', 'a1'), e('e2', 'a1', 's1'),
                    e('e3', 's1', 'n1', 'b1'), e('e4', 'n1', 'tk'),
                    e('e5', 's1', 'n2', 'b2')
                ]
            }
        },
        {
            name: '04 🔄 Contract Renewal 90-60-30 días',
            isActive: true,
            triggerType: 'DEAL_STAGE_CHANGED',
            triggerConfig: { stage: 'WON' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Deal Won', triggerType: 'DEAL_STAGE_CHANGED' }, 400, 50),
                    n('w1', 'waitNode', { delayValue: 275, delayUnit: 'd' }, 400, 220),
                    n('e1', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Tu contrato vence en 90 días' }, 400, 390),
                    n('w2', 'waitNode', { delayValue: 30, delayUnit: 'd' }, 400, 560),
                    n('e2', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Renovación en 60 días' }, 400, 730),
                    n('w3', 'waitNode', { delayValue: 30, delayUnit: 'd' }, 400, 900),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Cerrar renovación: {{companyName}}' }, 400, 1070),
                ],
                edges: [
                    e('e1', 't1', 'w1'), e('e2', 'w1', 'e1'), e('e3', 'e1', 'w2'), e('e4', 'w2', 'e2'), e('e5', 'e2', 'w3'), e('e6', 'w3', 'tk')
                ]
            }
        },
        {
            name: '05 ⚡ SLA Breach Real-Time Escalation',
            isActive: true,
            triggerType: 'WHATSAPP_TRIGGER',
            triggerConfig: { channel: 'all' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'WA Input', triggerType: 'WHATSAPP_TRIGGER' }, 400, 50),
                    n('w1', 'waitNode', { delayValue: 4, delayUnit: 'h' }, 400, 220),
                    n('c1', 'conditionNode', { variable: 'status', operator: 'equals', conditionValue: 'UNANSWERED' }, 400, 390),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'SLA BREACH: Responder a {{name}}' }, 400, 560),
                    n('nt', 'actionNode', { actionType: 'SEND_NOTIFICATION', message: 'SLA incumplido cliente {{name}}' }, 400, 730),
                ],
                edges: [
                    e('e1', 't1', 'w1'), e('e2', 'w1', 'c1'), e('e3', 'c1', 'tk', 'true'), e('e4', 'tk', 'nt')
                ]
            }
        },
        {
            name: '06 🌍 Multi-Language Support Router',
            isActive: true,
            triggerType: 'WHATSAPP_TRIGGER',
            triggerConfig: { channel: 'all' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'WA Message', triggerType: 'WHATSAPP_TRIGGER' }, 400, 50),
                    n('a1', 'aiNode', { aiTask: 'CLASSIFICATION', promptContext: 'Detect lang: EN, ES, PT' }, 400, 220),
                    n('s1', 'switchNode', { variable: 'ai_response', branches: [{ id: 'b1', value: 'ES' }, { id: 'b2', value: 'EN' }, { id: 'b3', value: 'PT' }] }, 400, 390),
                    n('tg1', 'crmActionNode', { actionType: 'ADD_TAG', tag: 'lang-es' }, 150, 560),
                    n('tg2', 'crmActionNode', { actionType: 'ADD_TAG', tag: 'lang-en' }, 400, 560),
                    n('tg3', 'crmActionNode', { actionType: 'ADD_TAG', tag: 'lang-pt' }, 650, 560),
                ],
                edges: [
                    e('e1', 't1', 'a1'), e('e2', 'a1', 's1'), e('e3', 's1', 'tg1', 'b1'), e('e4', 's1', 'tg2', 'b2'), e('e5', 's1', 'tg3', 'b3')
                ]
            }
        },
        {
            name: '07 🧠 Customer Health Score Weekly',
            isActive: true,
            triggerType: 'SCHEDULE',
            triggerConfig: { cronExpression: '0 8 * * 5' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Friday 8AM', triggerType: 'SCHEDULE' }, 400, 50),
                    n('db1', 'actionNode', { actionType: 'FIND_RECORD', searchBy: 'status', searchValue: 'ACTIVE' }, 400, 220),
                    n('a1', 'aiNode', { aiTask: 'GENERATION', promptContext: 'Calculate health score based on recent activity.' }, 400, 390),
                    n('c1', 'conditionNode', { variable: 'ai_response', operator: 'contains', conditionValue: 'RISK' }, 400, 560),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'CHURN RISK: Intervenir' }, 400, 730),
                ],
                edges: [
                    e('e1', 't1', 'db1'), e('e2', 'db1', 'a1'), e('e3', 'a1', 'c1'), e('e4', 'c1', 'tk', 'true')
                ]
            }
        },
        {
            name: '08 💰 Invoice Payment Cascade Reminders',
            isActive: true,
            triggerType: 'WEBHOOK_LISTENER',
            triggerConfig: { source: 'stripe' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Invoice Due', triggerType: 'WEBHOOK_LISTENER' }, 400, 50),
                    n('e1', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Recordatorio Factura' }, 400, 220),
                    n('w1', 'waitNode', { delayValue: 3, delayUnit: 'd' }, 400, 390),
                    n('e2', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Factura Vencida (3 días)' }, 400, 560),
                    n('w2', 'waitNode', { delayValue: 4, delayUnit: 'd' }, 400, 730),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Suspender cuenta: {{companyName}}' }, 400, 900),
                ],
                edges: [
                    e('e1', 't1', 'e1'), e('e2', 'e1', 'w1'), e('e3', 'w1', 'e2'), e('e4', 'e2', 'w2'), e('e5', 'w2', 'tk')
                ]
            }
        },
        {
            name: '09 🎁 Post-WON Social Proof Collection',
            isActive: true,
            triggerType: 'DEAL_STAGE_CHANGED',
            triggerConfig: { stage: 'WON' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Deal Won', triggerType: 'DEAL_STAGE_CHANGED' }, 400, 50),
                    n('w1', 'waitNode', { delayValue: 14, delayUnit: 'd' }, 400, 220),
                    n('a1', 'aiNode', { aiTask: 'GENERATION', promptContext: 'Write a warm email asking for a review.' }, 400, 390),
                    n('e1', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Nos dejas un review?' }, 400, 560),
                    n('tg', 'crmActionNode', { actionType: 'ADD_TAG', tag: 'review-asked' }, 400, 730),
                ],
                edges: [
                    e('e1', 't1', 'w1'), e('e2', 'w1', 'a1'), e('e3', 'a1', 'e1'), e('e4', 'e1', 'tg')
                ]
            }
        },
        {
            name: '10 🔥 Competitor Mention Intelligence',
            isActive: true,
            triggerType: 'WEBHOOK_LISTENER',
            triggerConfig: { source: 'gong' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Call Transcript', triggerType: 'WEBHOOK_LISTENER' }, 400, 50),
                    n('a1', 'aiNode', { aiTask: 'EXTRACTION', promptContext: 'Extract competitor names mentioned.' }, 400, 220),
                    n('c1', 'conditionNode', { variable: 'ai_response', operator: 'not_equals', conditionValue: 'NONE' }, 400, 390),
                    n('slk', 'actionNode', { actionType: 'SLACK', message: '⚠️ Competitor mentioned: {{ai_response}}' }, 400, 560),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Estrategia vs competidor: {{ai_response}}' }, 400, 730),
                ],
                edges: [
                    e('e1', 't1', 'a1'), e('e2', 'a1', 'c1'), e('e3', 'c1', 'slk', 'true'), e('e4', 'slk', 'tk')
                ]
            }
        },
        {
            name: '11 🚀 Product Demo → Onboarding Sequence',
            isActive: true,
            triggerType: 'DEAL_STAGE_CHANGED',
            triggerConfig: { stage: 'DEMO' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Demo Completed', triggerType: 'DEAL_STAGE_CHANGED' }, 400, 50),
                    n('a1', 'aiNode', { aiTask: 'GENERATION', promptContext: 'Draft summary of demo features discussed.' }, 400, 220),
                    n('e1', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Resumen de tu Demo' }, 400, 390),
                    n('w1', 'waitNode', { delayValue: 2, delayUnit: 'd' }, 400, 560),
                    n('e2', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Siguientes pasos' }, 400, 730),
                ],
                edges: [
                    e('e1', 't1', 'a1'), e('e2', 'a1', 'e1'), e('e3', 'e1', 'w1'), e('e4', 'w1', 'e2')
                ]
            }
        },
        {
            name: '12 👔 Internal HR Onboarding New Employee',
            isActive: true,
            triggerType: 'FORM_SUBMISSION',
            triggerConfig: { source: 'hr' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Nuevo Ingreso', triggerType: 'FORM_SUBMISSION' }, 400, 50),
                    n('tk1', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Crear email para {{name}}', priority: 'HIGH' }, 200, 220),
                    n('tk2', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Enviar equipo a {{address}}', priority: 'HIGH' }, 600, 220),
                    n('slk', 'actionNode', { actionType: 'SLACK', message: '🎉 Nuevo miembro: {{name}}' }, 400, 390),
                ],
                edges: [
                    e('e1', 't1', 'tk1'), e('e2', 't1', 'tk2'), e('e3', 't1', 'slk')
                ]
            }
        },
        {
            name: '13 📈 Upsell Intelligence (Usage-Based)',
            isActive: true,
            triggerType: 'SCHEDULE',
            triggerConfig: { cronExpression: '0 0 * * *' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Daily Scan', triggerType: 'SCHEDULE' }, 400, 50),
                    n('rc', 'actionNode', { actionType: 'RUN_CODE', code: 'context.highUsage = context.usage > 90;' }, 400, 220),
                    n('c1', 'conditionNode', { variable: 'highUsage', operator: 'equals', conditionValue: 'true' }, 400, 390),
                    n('a1', 'aiNode', { aiTask: 'GENERATION', promptContext: 'Draft upsell pitch.' }, 400, 560),
                    n('e1', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Aprovecha al máximo tu plan' }, 400, 730),
                ],
                edges: [
                    e('e1', 't1', 'rc'), e('e2', 'rc', 'c1'), e('e3', 'c1', 'a1', 'true'), e('e4', 'a1', 'e1')
                ]
            }
        },
        {
            name: '14 📣 Executive Weekly Digest',
            isActive: true,
            triggerType: 'SCHEDULE',
            triggerConfig: { cronExpression: '0 8 * * 1' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Monday 8AM', triggerType: 'SCHEDULE' }, 400, 50),
                    n('a1', 'aiNode', { aiTask: 'SUMMARIZE', promptContext: 'Summarize CRM metrics.' }, 400, 220),
                    n('slk', 'actionNode', { actionType: 'SLACK', message: '📊 Resumen Semanal: {{ai_response}}' }, 400, 390),
                ],
                edges: [
                    e('e1', 't1', 'a1'), e('e2', 'a1', 'slk')
                ]
            }
        },
        {
            name: '15 🏁 A/B Test Email Campaign Optimizer',
            isActive: true,
            triggerType: 'FORM_SUBMISSION',
            triggerConfig: {},
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Opt-in', triggerType: 'FORM_SUBMISSION' }, 400, 50),
                    n('rc', 'actionNode', { actionType: 'RUN_CODE', code: 'context.variant = Math.random() > 0.5 ? "A" : "B";' }, 400, 220),
                    n('s1', 'switchNode', { variable: 'variant', branches: [{ id: 'b1', value: 'A' }, { id: 'b2', value: 'B' }] }, 400, 390),
                    n('e1', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Subject A' }, 200, 560),
                    n('e2', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Subject B' }, 600, 560),
                ],
                edges: [
                    e('e1', 't1', 'rc'), e('e2', 'rc', 's1'), e('e3', 's1', 'e1', 'b1'), e('e4', 's1', 'e2', 'b2')
                ]
            }
        },
        {
            name: '16 🛡️ Fraud/Spam Lead Filter',
            isActive: true,
            triggerType: 'FORM_SUBMISSION',
            triggerConfig: {},
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'New Lead', triggerType: 'FORM_SUBMISSION' }, 400, 50),
                    n('a1', 'aiNode', { aiTask: 'CLASSIFICATION', promptContext: 'Classify as SPAM or LEGIT.' }, 400, 220),
                    n('c1', 'conditionNode', { variable: 'ai_response', operator: 'contains', conditionValue: 'SPAM' }, 400, 390),
                    n('tg', 'crmActionNode', { actionType: 'ADD_TAG', tag: 'spam' }, 200, 560),
                    n('db', 'crmActionNode', { actionType: 'UPDATE_DEAL', stage: 'NEW' }, 600, 560),
                ],
                edges: [
                    e('e1', 't1', 'a1'), e('e2', 'a1', 'c1'), e('e3', 'c1', 'tg', 'true'), e('e4', 'c1', 'db', 'false')
                ]
            }
        },
        {
            name: '17 📊 Pipeline Velocity Monitor',
            isActive: true,
            triggerType: 'SCHEDULE',
            triggerConfig: { cronExpression: '0 12 * * *' },
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Daily Scan', triggerType: 'SCHEDULE' }, 400, 50),
                    n('rc', 'actionNode', { actionType: 'RUN_CODE', code: 'context.stalled = context.daysInStage > 14;' }, 400, 220),
                    n('c1', 'conditionNode', { variable: 'stalled', operator: 'equals', conditionValue: 'true' }, 400, 390),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Deal Atascado: revisar' }, 400, 560),
                ],
                edges: [
                    e('e1', 't1', 'rc'), e('e2', 'rc', 'c1'), e('e3', 'c1', 'tk', 'true')
                ]
            }
        },
        {
            name: '18 🌐 Webhook → Normalizar → CRM Sync',
            isActive: true,
            triggerType: 'WEBHOOK_LISTENER',
            triggerConfig: {},
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'External Source', triggerType: 'WEBHOOK_LISTENER' }, 400, 50),
                    n('a1', 'aiNode', { aiTask: 'EXTRACTION', promptContext: 'Normalize payload into CRM schema.' }, 400, 220),
                    n('db', 'actionNode', { actionType: 'DB_WRITE', operation: 'create', model: 'lead' }, 400, 390),
                ],
                edges: [
                    e('e1', 't1', 'a1'), e('e2', 'a1', 'db')
                ]
            }
        },
        {
            name: '19 🏆 Referral Program Detector & Reward',
            isActive: true,
            triggerType: 'FORM_SUBMISSION',
            triggerConfig: {},
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Submit', triggerType: 'FORM_SUBMISSION' }, 400, 50),
                    n('c1', 'conditionNode', { variable: 'referrerId', operator: 'not_equals', conditionValue: 'null' }, 400, 220),
                    n('e1', 'actionNode', { actionType: 'SEND_EMAIL', subject: 'Gracias por tu referido!' }, 400, 390),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Enviar premio a {{referrerId}}' }, 400, 560),
                ],
                edges: [
                    e('e1', 't1', 'c1'), e('e2', 'c1', 'e1', 'true'), e('e3', 'e1', 'tk')
                ]
            }
        },
        {
            name: '20 📅 Demo Request → Calendar → Brief AI',
            isActive: true,
            triggerType: 'FORM_SUBMISSION',
            triggerConfig: {},
            steps: {
                nodes: [
                    n('t1', 'triggerNode', { label: 'Demo Form', triggerType: 'FORM_SUBMISSION' }, 400, 50),
                    n('cal', 'actionNode', { actionType: 'CALENDAR_EVENT', eventTitle: 'Demo con {{name}}' }, 400, 220),
                    n('a1', 'aiNode', { aiTask: 'GENERATION', promptContext: 'Create prep brief for AE.' }, 400, 390),
                    n('tk', 'crmActionNode', { actionType: 'CREATE_TASK', taskTitle: 'Prep Demo: {{ai_response}}' }, 400, 560),
                ],
                edges: [
                    e('e1', 't1', 'cal'), e('e2', 'cal', 'a1'), e('e3', 'a1', 'tk')
                ]
            }
        }
    ];

    for (const flow of workflows) {
        const { steps, ...rest } = flow;
        await prisma.workflow.create({
            data: {
                ...rest,
                steps: steps as any,
                companyId: company.id
            }
        });
        console.log(`✅ ${flow.name}`);
    }

    console.log(`\n🎉 Success: ${workflows.length} workflows seeded.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
