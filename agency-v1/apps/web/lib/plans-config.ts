import { Plan } from '@/types/subscription'

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfecto para comenzar',
    priceMonthly: 0,
    priceYearly: 0,
    priceYearlyWithDiscount: 0,
    highlighted: false,
    features: {
      leadsPerMonth: 100,
      users: 1,
      pipelines: 1,
      analytics: 'basic',
      integrations: ['Instagram', 'Facebook'],
      support: 'email',
      crm: false,
      whiteLabel: false,
      apiAccess: false,
      workflows: false,
      inboundMessaging: false,
      teamManagement: false,
      customBranding: false,
      advancedReporting: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
      emailPerMonth: 500,
      campaignsPerMonth: 1,
      aiAgents: 1,
      aiInteractions: 50,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para equipos en crecimiento',
    priceMonthly: 99000,
    priceYearly: 1188000,
    priceYearlyWithDiscount: 950000,
    highlighted: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    features: {
      leadsPerMonth: 5000,
      users: 5,
      pipelines: 3,
      analytics: 'advanced',
      integrations: ['Instagram', 'Facebook', 'WhatsApp', 'TikTok', 'LinkedIn', 'Google Ads'],
      support: 'priority',
      crm: true,
      whiteLabel: false,
      apiAccess: false,
      workflows: true,
      inboundMessaging: true,
      teamManagement: false,
      customBranding: false,
      advancedReporting: true,
      prioritySupport: true,
      dedicatedAccountManager: false,
      emailPerMonth: 10000,
      campaignsPerMonth: 10,
      aiAgents: 3,
      aiInteractions: 5000,
    },
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'Para agencias y empresas',
    priceMonthly: 299000,
    priceYearly: 3588000,
    priceYearlyWithDiscount: 2850000,
    highlighted: false,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_AGENCY_YEARLY,
    features: {
      leadsPerMonth: -1,
      users: -1,
      pipelines: -1,
      analytics: 'full',
      integrations: ['Instagram', 'Facebook', 'WhatsApp', 'TikTok', 'LinkedIn', 'Google Ads', 'Pixel', 'CAPI'],
      support: 'dedicated',
      crm: true,
      whiteLabel: true,
      apiAccess: true,
      workflows: true,
      inboundMessaging: true,
      teamManagement: true,
      customBranding: true,
      advancedReporting: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
      emailPerMonth: 100000,
      campaignsPerMonth: 999,
      aiAgents: 999,
      aiInteractions: 999999,
    },
  },
]

export const getPlanById = (id: string): Plan | undefined => {
  return PLANS.find((plan) => plan.id === id)
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price)
}

export const formatFeatures = (features: Plan['features']): string[] => {
  const lines: string[] = []

  if (features.leadsPerMonth === -1) {
    lines.push('Leads ilimitados')
  } else {
    lines.push(`${features.leadsPerMonth.toLocaleString('es-CO')} leads/mes`)
  }

  if (features.users === -1) {
    lines.push('Usuarios ilimitados')
  } else {
    lines.push(`${features.users} usuario${features.users > 1 ? 's' : ''}`)
  }

  if (features.pipelines === -1) {
    lines.push('Pipelines ilimitados')
  } else {
    lines.push(`${features.pipelines} pipeline${features.pipelines > 1 ? 's' : ''} de ventas`)
  }

  if (features.emailPerMonth === -1) {
    lines.push('Emails ilimitados')
  } else {
    lines.push(`${features.emailPerMonth.toLocaleString('es-CO')} emails/mes`)
  }

  if (features.campaignsPerMonth === -1) {
    lines.push('Campañas ilimitadas')
  } else {
    lines.push(`${features.campaignsPerMonth} campañas/mes`)
  }

  if (features.aiAgents === -1) {
    lines.push('AI Agents ilimitados')
  } else {
    lines.push(`${features.aiAgents} AI Agent${features.aiAgents > 1 ? 's' : ''}`)
  }

  if (features.aiInteractions === -1) {
    lines.push('Interacciones AI ilimitadas')
  } else {
    lines.push(`${features.aiInteractions.toLocaleString('es-CO')} interacciones AI/mes`)
  }

  lines.push(`Analytics ${features.advancedReporting ? 'Avanzado' : features.analytics}`)

  features.integrations.forEach((integration) => {
    lines.push(integration)
  })

  if (features.crm) lines.push('CRM completo')
  if (features.workflows) lines.push('Automatizaciones (Workflows)')
  if (features.inboundMessaging) lines.push('Mensajería entrante')
  if (features.teamManagement) lines.push('Gestión de equipos')
  if (features.whiteLabel) lines.push('White-label')
  if (features.customBranding) lines.push('Branding personalizado')
  if (features.apiAccess) lines.push('API Access')
  if (features.dedicatedAccountManager) lines.push('Account Manager dedicado')
  else if (features.prioritySupport) lines.push('Soporte prioritario')
  else lines.push('Soporte por email')

  return lines
}

export const FAQ_ITEMS = [
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer: 'Sí, puedes upgrade o downgrade de plan en cualquier momento. Los cambios se aplicarán en el siguiente ciclo de facturación.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) a través de Stripe, y PSE para pagos en Colombia.',
  },
  {
    question: '¿Hay período de prueba gratuita?',
    answer: 'Sí, el plan Free no tiene costo y puedes usarlo indefinidamente para probar la plataforma.',
  },
  {
    question: '¿Qué pasa si excedo los límites de mi plan?',
    answer: 'Te notificaremos cuando alcances el 80% de tu límite. Puedes upgrade a un plan superior en cualquier momento.',
  },
  {
    question: '¿Puedo cancelar mi suscripción?',
    answer: 'Sí, puedes cancelar en cualquier momento. Tu plan seguirá activo hasta el final del período pagado.',
  },
]