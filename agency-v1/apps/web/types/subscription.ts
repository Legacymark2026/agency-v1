export type PlanId = 'free' | 'pro' | 'agency'

export interface PlanFeatures {
  leadsPerMonth: number
  users: number
  analytics: 'basic' | 'advanced' | 'full'
  integrations: string[]
  support: 'email' | 'priority' | 'dedicated'
  crm: boolean
  whiteLabel: boolean
  apiAccess: boolean
}

export interface Plan {
  id: PlanId
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  priceYearlyWithDiscount: number
  features: PlanFeatures
  highlighted: boolean
  stripePriceIdMonthly?: string
  stripePriceIdYearly?: string
}

export interface PricingPeriod {
  isYearly: boolean
  label: string
  discount: number
}

export interface SubscriptionStatus {
  planId: PlanId
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

export interface CheckoutSession {
  url?: string
  error?: string
}