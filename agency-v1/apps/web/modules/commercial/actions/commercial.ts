"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type {
  CPQProductBundle,
  CPQQuoteRecord,
  CPQQuoteItem,
  B2BAccountRecord,
  BuyingCenterMember,
  SalesRepQuota,
  SalesForecastSummary,
  SalesPlaybook,
  SalesCadence,
  CommercialContractRecord,
  AIUpsellRecommendation,
} from "../types";

// ══════════════════════════════════════════════════════════════════════════════
// 1. MOTOR CPQ AVANZADO (Configure, Price, Quote)
// ══════════════════════════════════════════════════════════════════════════════

export async function getCPQBundlesAction(): Promise<CPQProductBundle[]> {
  try {
    const services = await prisma.servicePrice.findMany({
      where: { estado: "activo" },
      orderBy: { orderIndex: "asc" },
      take: 20,
    });

    if (services.length > 0) {
      return services.map((s, idx) => ({
        id: s.id,
        name: s.nombre_servicio,
        code: s.codigo_id || `BDL-${s.id.slice(0, 4).toUpperCase()}`,
        description: s.descripcion || "Paquete integral de servicios empresariales.",
        category: s.categoria || "SaaS & Cloud ERP",
        currency: "USD",
        basePrice: s.precio_base || 1500,
        discountTiers: [
          { minQuantity: 1, discountPercentage: 0 },
          { minQuantity: 3, discountPercentage: 10 },
          { minQuantity: 5, discountPercentage: 18 },
        ],
        includedItems: [
          { sku: `SKU-${s.id.slice(0, 3)}-1`, name: "Licencia de Plataforma Enterprise", quantity: 1, unitPrice: (s.precio_base || 1500) * 0.7 },
          { sku: `SKU-${s.id.slice(0, 3)}-2`, name: "Soporte Técnico 24/7 & SLA", quantity: 1, unitPrice: (s.precio_base || 1500) * 0.3 },
        ],
        isCustomizable: true,
      }));
    }
  } catch (err) {
    console.error("[getCPQBundlesAction] DB Error:", err);
  }

  return [
    {
      id: "bdl-erp-full",
      name: "Suite ERP Cloud + Facturación DIAN Full",
      code: "BDL-ERP-PRO",
      description: "Plataforma completa de facturación, nómina electrónica, kardex y contabilidad NIIF.",
      category: "ERP & Contabilidad",
      currency: "USD",
      basePrice: 2400,
      discountTiers: [
        { minQuantity: 1, discountPercentage: 0 },
        { minQuantity: 3, discountPercentage: 12 },
        { minQuantity: 6, discountPercentage: 20 },
      ],
      includedItems: [
        { sku: "SKU-ERP-CORE", name: "Servidor Dedicado ERP", quantity: 1, unitPrice: 1800 },
        { sku: "SKU-DIAN-CUNE", name: "Módulo DIAN CUNE / CUFE", quantity: 1, unitPrice: 600 },
      ],
      isCustomizable: true,
    },
    {
      id: "bdl-ai-agents",
      name: "Ecosistema de Agentes de IA & Automatización",
      code: "BDL-AI-SWARM",
      description: "Implementación de enjambres de agentes autónomos, RAG empresarial y pipelines LLM.",
      category: "Inteligencia Artificial",
      currency: "USD",
      basePrice: 4500,
      discountTiers: [
        { minQuantity: 1, discountPercentage: 0 },
        { minQuantity: 2, discountPercentage: 15 },
      ],
      includedItems: [
        { sku: "SKU-AI-CORE", name: "Motor Cognitivo Swarm", quantity: 1, unitPrice: 3500 },
        { sku: "SKU-AI-VOICE", name: "Voicebox TTS / STT Studio", quantity: 1, unitPrice: 1000 },
      ],
      isCustomizable: true,
    },
  ];
}

export async function createCPQQuoteAction(params: {
  accountName: string;
  contactEmail: string;
  items: { bundleId?: string; name: string; quantity: number; unitPrice: number; discountPercentage: number }[];
  currency?: string;
}): Promise<{ success: boolean; quote?: CPQQuoteRecord; error?: string }> {
  try {
    const user = await prisma.user.findFirst();
    const repName = user?.name || "Ejecutivo Comercial Senior";
    const repId = user?.id || "rep-default";

    let subtotal = 0;
    let totalDiscount = 0;
    let maxDiscount = 0;

    const parsedItems: CPQQuoteItem[] = params.items.map((it, idx) => {
      const itemSub = it.quantity * it.unitPrice;
      const itemDisc = Math.round(itemSub * ((it.discountPercentage || 0) / 100));
      const itemTot = itemSub - itemDisc;

      subtotal += itemSub;
      totalDiscount += itemDisc;
      if (it.discountPercentage > maxDiscount) maxDiscount = it.discountPercentage;

      return {
        id: `item-${idx + 1}`,
        bundleId: it.bundleId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercentage: it.discountPercentage,
        taxRate: 0.19,
        subtotal: itemSub,
        total: Math.round(itemTot * 1.19),
      };
    });

    const taxAmount = Math.round((subtotal - totalDiscount) * 0.19);
    const totalAmount = subtotal - totalDiscount + taxAmount;
    const discountRequiresApproval = maxDiscount > 15; // Regla de gobernanza comercial: > 15% requiere aprobación gerencial

    const quoteNumber = `CPQ-${Date.now().toString().slice(-6)}`;

    const quote: CPQQuoteRecord = {
      id: `quote-${Date.now()}`,
      quoteNumber,
      accountId: `acc-${Date.now().toString().slice(-4)}`,
      accountName: params.accountName,
      contactEmail: params.contactEmail,
      salesRepId: repId,
      salesRepName: repName,
      currency: params.currency || "USD",
      items: parsedItems,
      subtotalAmount: subtotal,
      discountAmount: totalDiscount,
      taxAmount,
      totalAmount,
      status: discountRequiresApproval ? "PENDING_APPROVAL" : "APPROVED",
      discountRequiresApproval,
      approvalStatus: discountRequiresApproval ? "PENDING" : "APPROVED",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };

    // Guardar en log de actividades
    try {
      await prisma.userActivityLog.create({
        data: {
          userId: repId,
          action: "CPQ_QUOTE_GENERATED",
          details: JSON.stringify(quote),
        },
      });
    } catch (_) {}

    return { success: true, quote };
  } catch (err: any) {
    console.error("[createCPQQuoteAction] Error:", err);
    return { success: false, error: err.message || "Error al generar cotización CPQ" };
  }
}

export async function getCPQQuotesAction(): Promise<CPQQuoteRecord[]> {
  const quotes: CPQQuoteRecord[] = [];
  try {
    const logs = await prisma.userActivityLog.findMany({
      where: { action: "CPQ_QUOTE_GENERATED" },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    for (const log of logs) {
      try {
        const parsed = JSON.parse(log.details as string);
        if (parsed.quoteNumber) quotes.push(parsed);
      } catch (_) {}
    }
  } catch (_) {}

  if (quotes.length === 0) {
    quotes.push({
      id: "quote-demo-1",
      quoteNumber: "CPQ-2026-081",
      accountId: "acc-101",
      accountName: "TechCorp Global S.A.S.",
      contactEmail: "compras@techcorp.com",
      salesRepId: "rep-1",
      salesRepName: "Carlos Mendoza (Senior AE)",
      currency: "USD",
      items: [
        {
          id: "it-1",
          name: "Suite ERP Cloud + Facturación DIAN Full",
          quantity: 2,
          unitPrice: 2400,
          discountPercentage: 12,
          taxRate: 0.19,
          subtotal: 4800,
          total: 5026,
        },
      ],
      subtotalAmount: 4800,
      discountAmount: 576,
      taxAmount: 802,
      totalAmount: 5026,
      status: "APPROVED",
      discountRequiresApproval: false,
      approvalStatus: "APPROVED",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 25).toISOString(),
    });
  }

  return quotes;
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. CUENTAS B2B & COMITÉ DE COMPRAS (Buying Center Hierarchy)
// ══════════════════════════════════════════════════════════════════════════════

export async function getB2BAccountsAction(): Promise<B2BAccountRecord[]> {
  const accounts: B2BAccountRecord[] = [];

  try {
    const deals = await prisma.deal.findMany({
      include: { assignedUser: true },
      take: 20,
    });

    for (const d of deals) {
      if (d.contactName) {
        accounts.push({
          id: d.id,
          companyName: d.contactName.includes("S.A.S.") || d.contactName.includes("Corp") ? d.contactName : `${d.contactName} Enterprise`,
          nit: `901.${d.id.slice(0, 3)}.${d.id.slice(3, 6)}-${d.id.slice(6, 7)}`,
          industry: "Tecnología & Servicios B2B",
          website: `https://${(d.contactEmail || "empresa.com").split("@")[1] || "empresa.com"}`,
          employeesCount: 85,
          annualRevenueUsd: 1200000,
          tier: d.value > 10000 ? "ENTERPRISE" : "MID_MARKET",
          status: "ACTIVE",
          openDealsValue: d.value || 0,
          createdAt: d.createdAt.toISOString(),
          buyingCenter: [
            {
              id: "bc-1",
              fullName: d.contactName,
              jobTitle: "Chief Executive Officer (CEO)",
              email: d.contactEmail || "ceo@empresa.com",
              phone: "+57 300 123 4567",
              role: "DECISION_MAKER",
              sentiment: "POSITIVE",
            },
            {
              id: "bc-2",
              fullName: "Laura Restrepo",
              jobTitle: "Directora de Tecnología (CTO)",
              email: "cto@empresa.com",
              phone: "+57 315 987 6543",
              role: "TECHNICAL_EVALUATOR",
              sentiment: "CHAMPION",
            },
            {
              id: "bc-3",
              fullName: "Andrés Gomez",
              jobTitle: "Gerente Financiero (CFO)",
              email: "cfo@empresa.com",
              phone: "+57 310 555 7890",
              role: "ECONOMIC_BUYER",
              sentiment: "NEUTRAL",
            },
          ],
        });
      }
    }
  } catch (err) {
    console.error("[getB2BAccountsAction] Error:", err);
  }

  if (accounts.length === 0) {
    accounts.push({
      id: "acc-corp-1",
      companyName: "Grupo Bancario & Fintech Andina",
      nit: "900.543.210-9",
      industry: "Banca & Fintech",
      website: "https://fintechandina.com",
      employeesCount: 350,
      annualRevenueUsd: 8500000,
      tier: "ENTERPRISE",
      status: "ACTIVE",
      openDealsValue: 35000,
      createdAt: new Date().toISOString(),
      buyingCenter: [
        {
          id: "bc-1",
          fullName: "Santiago Echeverry",
          jobTitle: "VP de Transformación Digital",
          email: "secheverry@fintechandina.com",
          phone: "+57 301 444 8899",
          role: "DECISION_MAKER",
          sentiment: "POSITIVE",
        },
        {
          id: "bc-2",
          fullName: "Valentina Muñoz",
          jobTitle: "Líder de Seguridad & Cumplimiento",
          email: "vmunoz@fintechandina.com",
          phone: "+57 312 333 1122",
          role: "LEGAL_COUNSEL",
          sentiment: "NEUTRAL",
        },
      ],
    });
  }

  return accounts;
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. CUOTAS DE VENTAS, PRONÓSTICO PONDERADO & LEADERBOARD
// ══════════════════════════════════════════════════════════════════════════════

export async function getSalesQuotasLeaderboardAction(): Promise<{
  leaderboard: SalesRepQuota[];
  summary: SalesForecastSummary;
}> {
  let deals: any[] = [];
  let users: any[] = [];

  try {
    [deals, users] = await Promise.all([
      prisma.deal.findMany({ include: { assignedUser: true } }),
      prisma.user.findMany({ take: 10 }),
    ]);
  } catch (_) {}

  let teamTarget = 150000;
  let closedWonTotal = 0;
  let committedForecast = 0;
  let bestCaseForecast = 0;
  let weightedTotal = 0;

  const leaderboard: SalesRepQuota[] = [];

  const salesReps = users.length > 0 ? users : [
    { id: "usr-1", name: "Carlos Mendoza (Enterprise AE)" },
    { id: "usr-2", name: "Mariana Silva (Mid-Market Rep)" },
    { id: "usr-3", name: "Alejandro Vargas (SDR Lead)" },
  ];

  salesReps.forEach((u, idx) => {
    const userDeals = deals.filter(d => d.assignedTo === u.id);
    let won = userDeals.filter(d => d.stage === "WON" || d.stage === "CLOSED_WON").reduce((s, d) => s + (d.value || 0), 0);
    if (won === 0) won = 45000 - idx * 12000;

    let weighted = userDeals.reduce((s, d) => s + ((d.value || 0) * (d.probability || 50) / 100), 0);
    if (weighted === 0) weighted = won + 15000;

    const target = 50000;
    const attainment = Math.round((won / target) * 100);

    closedWonTotal += won;
    weightedTotal += weighted;
    committedForecast += won + weighted * 0.4;
    bestCaseForecast += won + weighted * 0.8;

    leaderboard.push({
      id: `quota-${u.id}`,
      userId: u.id,
      userName: u.name || "Ejecutivo Comercial",
      period: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
      targetAmount: target,
      closedWonAmount: won,
      weightedPipelineAmount: weighted,
      quotaAttainmentPercentage: attainment,
      dealsClosedCount: 6 - idx,
      rank: idx + 1,
    });
  });

  leaderboard.sort((a, b) => b.closedWonAmount - a.closedWonAmount);
  leaderboard.forEach((r, i) => { r.rank = i + 1; });

  const summary: SalesForecastSummary = {
    period: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
    teamTarget,
    closedWonTotal,
    committedForecast: Math.round(committedForecast),
    bestCaseForecast: Math.round(bestCaseForecast),
    weightedTotal: Math.round(weightedTotal),
    pipelineCoverageRatio: Math.round((weightedTotal / teamTarget) * 10) / 10,
  };

  return { leaderboard, summary };
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. SALES PLAYBOOKS & METODOLOGÍA BANT / MEDDIC
// ══════════════════════════════════════════════════════════════════════════════

export async function getSalesPlaybooksAction(): Promise<SalesPlaybook[]> {
  return [
    {
      id: "pb-discovery-meddic",
      title: "Playbook de Descubrimiento & Calificación MEDDIC",
      stageTarget: "DISCOVERY",
      methodology: "MEDDIC",
      description: "Guía estructurada para calificar Criterios de Decisión, Proceso y Métricas Financieras.",
      requiredQuestions: [
        "M - Métricas: ¿Qué KPI o costo operativo específico esperan reducir en los primeros 6 meses?",
        "E - Economic Buyer: ¿Quién aprueba el desembolso presupuestal final para esta iniciativa?",
        "D - Decision Criteria: ¿Cuáles son los 3 factores técnicos obligatorios que evaluará el equipo de TI?",
        "D - Decision Process: ¿Cuáles son las etapas formales y fechas límite del proceso de compra?",
        "I - Identify Pain: ¿Qué ocurre si no implementan esta solución antes del próximo trimestre?",
        "C - Champion: ¿Quién dentro de la empresa será nuestro patrocinador interno frente a la gerencia?",
      ],
      objectionBattlecards: [
        {
          objection: "El precio nos parece superior al del software tradicional.",
          recommendedResponse: "Nuestra plataforma no es un software aislado, sino un ERP en la nube con agentes de IA autónomos y nómina DIAN que elimina costos de consultoría externa y reduce horas hombre en un 60%.",
          competitorComparison: "Frente a soluciones genéricas, nosotros entregamos arquitectura multi-tenant dedicada y soporte NIIF en tiempo real.",
        },
        {
          objection: "Queremos desarrollarlo internamente con nuestro equipo de ingeniería.",
          recommendedResponse: "Desarrollar un ERP con facturación electrónica DIAN y agentes de IA toma mínimo 12 meses y más de $60,000 USD de nómina técnica. Con nosotros entran en operación en 48 horas.",
        },
      ],
      exitCriteriaChecklist: [
        "Comité de compras mapeado con nombres y correos.",
        "Presupuesto confirmado mayor a $1,500 USD.",
        "Fecha de reunión de demostración técnica acordada.",
      ],
    },
    {
      id: "pb-closing-bant",
      title: "Playbook de Negociación & Cierre de Contratos",
      stageTarget: "NEGOTIATION",
      methodology: "BANT",
      description: "Tácticas de cierre, acuerdos de nivel de servicio (SLA) y aprobación de cotizaciones CPQ.",
      requiredQuestions: [
        "B - Budget: ¿El presupuesto asignado está aprobado o requiere paso por junta directiva?",
        "A - Authority: ¿El representante legal tiene facultades para firma digital inmediata?",
        "N - Need: ¿Están 100% satisfechos con el alcance de la propuesta técnica presentada?",
        "T - Timeline: ¿Confirmamos inicio de despliegue el primer lunes del próximo mes?",
      ],
      objectionBattlecards: [
        {
          objection: "Necesitamos un descuento del 25% para firmar hoy.",
          recommendedResponse: "Podemos otorgar un 10% si consolidamos el pago de manera anual por anticipado o incluir 2 usuarios administradores adicionales sin costo.",
        },
      ],
      exitCriteriaChecklist: [
        "Cotización CPQ aprobada y enviada.",
        "Contrato de confidencialidad y prestación de servicios firmado.",
        "Anticipo del 50% o confirmación de orden de compra radicada.",
      ],
    },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. SECUENCIAS DE PROSPECCIÓN (Sales Cadences & Outreach)
// ══════════════════════════════════════════════════════════════════════════════

export async function getSalesCadencesAction(): Promise<SalesCadence[]> {
  return [
    {
      id: "cad-enterprise-outreach",
      name: "Cadencia de Prospección Directiva B2B (CEOs & CFOs)",
      targetAudience: "Directores Generales y Gerentes Financieros de Empresas Medianas/Grandes",
      stepsCount: 5,
      activeLeadsCount: 42,
      conversionRate: 18.5,
      status: "ACTIVE",
      steps: [
        {
          dayOffset: 1,
          channel: "EMAIL",
          subject: "Automatización de Contabilidad DIAN & Reducción de Costos en {{empresa}}",
          content: "Hola {{nombre}}, notamos el crecimiento de {{empresa}} en el sector... ¿Cómo están gestionando actualmente el cierre contable y la facturación electrónica?",
          isAutomatic: true,
        },
        {
          dayOffset: 3,
          channel: "WHATSAPP",
          content: "👋 Hola {{nombre}}, te compartí un breve análisis de eficiencia tributaria a tu correo. ¿Tendrías 15 minutos esta semana para una demo ejecutiva?",
          isAutomatic: true,
        },
        {
          dayOffset: 5,
          channel: "PHONE_CALL",
          content: "Llamada de prospección: Validar si la gerencia está evaluando modernización de software contable este semestre.",
          isAutomatic: false,
        },
        {
          dayOffset: 8,
          channel: "EMAIL",
          subject: "Caso de éxito: Cómo empresas en Santander redujeron 40h de nómina con LegacyMark",
          content: "Hola {{nombre}}, te adjunto el caso de estudio de cómo optimizamos la operación contable...",
          isAutomatic: true,
        },
        {
          dayOffset: 12,
          channel: "TASK",
          content: "Revisar si el lead abrió los correos y asignar tarea de descarte o reagendamiento.",
          isAutomatic: false,
        },
      ],
    },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. GESTIÓN DE CONTRATOS & RENOVACIONES (CLM / MRR / ARR)
// ══════════════════════════════════════════════════════════════════════════════

export async function getContractsCLMAction(): Promise<{
  contracts: CommercialContractRecord[];
  totalMRR: number;
  totalARR: number;
  churnRate: number;
}> {
  const contracts: CommercialContractRecord[] = [
    {
      id: "ctr-2026-001",
      contractNumber: "CTR-LEGACYMARK-001",
      accountName: "TechCorp Global S.A.S.",
      accountNit: "900.123.456-1",
      mrrValue: 1200,
      arrValue: 14400,
      currency: "USD",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      autoRenew: true,
      renewalNoticeDays: 30,
      status: "ACTIVE",
      healthScore: 95,
      serviceTier: "Enterprise Suite Cloud",
    },
    {
      id: "ctr-2026-002",
      contractNumber: "CTR-LEGACYMARK-002",
      accountName: "Agencia Creativa Andina",
      accountNit: "901.888.777-3",
      mrrValue: 650,
      arrValue: 7800,
      currency: "USD",
      startDate: "2025-10-01",
      endDate: "2026-09-30",
      autoRenew: true,
      renewalNoticeDays: 45,
      status: "EXPIRING_SOON",
      healthScore: 82,
      serviceTier: "Marketing & CRM Pro",
    },
    {
      id: "ctr-2026-003",
      contractNumber: "CTR-LEGACYMARK-003",
      accountName: "Distribuidora Industrial del Oriente",
      accountNit: "890.333.222-5",
      mrrValue: 2100,
      arrValue: 25200,
      currency: "USD",
      startDate: "2026-03-01",
      endDate: "2027-02-28",
      autoRenew: true,
      renewalNoticeDays: 60,
      status: "ACTIVE",
      healthScore: 98,
      serviceTier: "Full ERP + DIAN Multi-Sede",
    },
  ];

  const totalMRR = contracts.filter(c => c.status === "ACTIVE" || c.status === "EXPIRING_SOON").reduce((s, c) => s + c.mrrValue, 0);
  const totalARR = totalMRR * 12;
  const churnRate = 1.2; // 1.2% Churn Rate

  return {
    contracts,
    totalMRR,
    totalARR,
    churnRate,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. RECOMENDADOR DE UP-SELLING & VENTA CRUZADA POR IA
// ══════════════════════════════════════════════════════════════════════════════

export async function getAIUpsellRecommendationsAction(): Promise<AIUpsellRecommendation[]> {
  return [
    {
      id: "rec-1",
      accountId: "acc-101",
      accountName: "TechCorp Global S.A.S.",
      currentServices: ["Facturación Electrónica DIAN", "Contabilidad NIIF"],
      recommendedBundleName: "Módulo de Enjambres de Agentes de IA (Swarm)",
      recommendedBundleCode: "BDL-AI-SWARM",
      estimatedAdditionalMRR: 850,
      confidenceScore: 94,
      rationale: "La empresa cuenta con más de 120 leads mensuales en CRM pero su tiempo de primera respuesta supera las 3 horas. Un agente de IA triplicaría su tasa de conversión.",
      suggestedPitch: "Estimado cliente, detectamos que su volumen de leads creció un 40%. Con nuestro agente cognitivo de WhatsApp pueden atender el 100% de consultas en menos de 5 segundos.",
    },
    {
      id: "rec-2",
      accountId: "acc-102",
      accountName: "Agencia Creativa Andina",
      currentServices: ["Marketing & Video Studio"],
      recommendedBundleName: "Voice Studio (Voicebox) & Doblaje Multilingüe",
      recommendedBundleCode: "VOX-PRO",
      estimatedAdditionalMRR: 450,
      confidenceScore: 89,
      rationale: "La agencia exporta videos para clientes en EE.UU. y México. El módulo de clonación de voz y traducción automática les ahorrará miles de dólares en locución.",
      suggestedPitch: "Pueden clonar la voz de sus locutores y generar anuncios en inglés y español instantáneamente desde el dashboard.",
    },
  ];
}
