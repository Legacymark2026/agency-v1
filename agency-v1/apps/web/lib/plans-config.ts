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
      analytics: 'basic',
      integrations: ['Instagram', 'Facebook'],
      support: 'email',
      crm: false,
      whiteLabel: false,
      apiAccess: false,
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
      leadsPerMonth: 1000,
      users: 5,
      analytics: 'advanced',
      integrations: ['Instagram', 'Facebook', 'WhatsApp', 'TikTok', 'LinkedIn', 'Google Ads'],
      support: 'priority',
      crm: true,
      whiteLabel: false,
      apiAccess: false,
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
      analytics: 'full',
      integrations: ['Instagram', 'Facebook', 'WhatsApp', 'TikTok', 'LinkedIn', 'Google Ads', 'Pixel', 'CAPI'],
      support: 'dedicated',
      crm: true,
      whiteLabel: true,
      apiAccess: true,
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

  lines.push(`Analytics ${features.analytics}`)

  features.integrations.forEach((integration) => {
    lines.push(integration)
  })

  if (features.crm) lines.push('CRM completo')
  if (features.whiteLabel) lines.push('White-label')
  if (features.apiAccess) lines.push('API Access')

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