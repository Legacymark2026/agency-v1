/**
 * Tier-1 Enterprise Marketing Suite Types (HubSpot Enterprise / Marketo / Klaviyo Standard)
 */

// 1. Segmentación Dinámica RFM & Comportamental
export interface RFMSmartSegment {
  id: string;
  name: string;
  code: "VIP_CHAMPIONS" | "LOYAL_CUSTOMERS" | "POTENTIAL_GROWTH" | "AT_RISK" | "HIBERNATING" | "HIGH_INTENT_LEADS";
  description: string;
  recencyScore: number; // 1-5
  frequencyScore: number; // 1-5
  monetaryScore: number; // 1-5
  contactsCount: number;
  avgOrderValueUsd: number;
  recommendedAction: string;
  criteria: string[];
}

// 2. Motor de Atribución Multi-Toque
export interface AttributionTouchpoint {
  id: string;
  channelName: string;
  channelType: "PAID_SEARCH" | "PAID_SOCIAL" | "ORGANIC_SEARCH" | "DIRECT" | "EMAIL" | "WEBINAR" | "SALES_OUTREACH";
  firstTouchWeight: number; // %
  lastTouchWeight: number; // %
  linearWeight: number; // %
  wShapedWeight: number; // %
  timeDecayWeight: number; // %
  attributedRevenueUsd: number;
  conversionsCount: number;
}

export interface MultiTouchAttributionReport {
  period: string;
  totalRevenueUsd: number;
  totalConversions: number;
  touchpoints: AttributionTouchpoint[];
}

// 3. Escudo de Entregabilidad, Dominio & Spam Shield
export interface DomainDeliverabilityAudit {
  domain: string;
  spfStatus: "VALID" | "MISSING" | "MISCONFIGURED";
  dkimStatus: "VALID" | "MISSING" | "MISCONFIGURED";
  dmarcStatus: "ENFORCED_REJECT" | "QUARANTINE" | "NONE" | "MISSING";
  bimiStatus: "VALID_SVG" | "PENDING_VMC" | "NOT_CONFIGURED";
  reputationScore: number; // 0 - 100
  ipWarmupDay: number;
  dailySendLimit: number;
  spamRiskScore: number; // 0 - 100 (Bajo es mejor)
  spamShieldFindings: { rule: string; passed: boolean; tip: string }[];
}

// 4. Publicador Multicanal de Redes Sociales
export interface SocialChannelPublishingTask {
  id: string;
  content: string;
  mediaUrls: string[];
  platforms: ("INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "X_TWITTER" | "TIKTOK" | "YOUTUBE_SHORTS")[];
  scheduledDate: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  aiGeneratedHashtags: string[];
  analytics?: { impressions: number; clicks: number; engagementRate: number };
}

// 5. Constructor de Formularios Inteligentes & Popups
export interface SmartFormConfig {
  id: string;
  name: string;
  type: "EMBED_INLINE" | "EXIT_INTENT_POPUP" | "SLIDE_IN_BANNER" | "FLOATING_BAR";
  triggerCondition: "EXIT_INTENT" | "SCROLL_50" | "TIME_10S" | "IMMEDIATE";
  headline: string;
  subheadline: string;
  fields: { name: string; label: string; type: string; required: boolean; isProgressive: boolean }[];
  conversionRate: number;
  submissionsCount: number;
  isActive: boolean;
}

// 6. Despacho Predictivo por IA (Send-Time Optimization)
export interface SendTimeOptimizationProfile {
  timeZone: string;
  optimalHourUTC: number;
  optimalDayOfWeek: string;
  predictedOpenRateBoost: number; // %
  contactsOptimizedCount: number;
  sampleDistribution: { hourLabel: string; openProbability: number }[];
}

// 7. Radar de Inteligencia Competitiva & Benchmarking
export interface CompetitorBenchmarkingRecord {
  id: string;
  competitorName: string;
  domain: string;
  estimatedMonthlyVisits: number;
  organicKeywordsCount: number;
  activeAdsCount: number;
  topTrafficChannels: { channel: string; sharePercentage: number }[];
  contentGapOpportunities: string[];
}
