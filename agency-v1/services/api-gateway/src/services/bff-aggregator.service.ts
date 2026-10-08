/**
 * BFF Aggregator Service — High-Performance Dashboard Consolidation
 * ─────────────────────────────────────────────────────────────────────────────
 * Consolidates distributed microservice calls for dashboards into single requests:
 *   - Parallel asynchronous fetching via Promise.allSettled
 *   - Redis multi-tier caching (L1 in-memory + L2 Redis) with automatic invalidation
 *   - Per-tenant isolation with companyId scoping
 *   - Resilient partial-failure degradation (returns available data with alerts)
 */
import { redisClient } from "../lib/redis.singleton";
import { SERVICES, ServiceName, resolveServiceUrl } from "../lib/service-registry";

export interface BffRequestOptions {
  companyId: string;
  userId: string;
  token?: string;
  correlationId?: string;
  role?: string;
  bypassCache?: boolean;
}

export interface BffDashboardSummary {
  cached: boolean;
  cacheTtlRemaining?: number;
  generatedAt: string;
  durationMs: number;
  companyId: string;
  overview: {
    leadsCount: number;
    dealsValue: number;
    activeDealsCount: number;
    invoicesCount: number;
    pendingInvoicesValue: number;
    activeCampaignsCount: number;
    unreadNotificationsCount: number;
    activeEmployeesCount: number;
    todayPosSalesTotal: number;
  };
  crm: {
    totalLeads: number;
    totalDeals: number;
    totalRevenue: number;
    conversionRate: number;
    topDeals: any[];
    funnel: any[];
  };
  finance: {
    totalRevenueMonth: number;
    pendingInvoicesCount: number;
    recentInvoices: any[];
  };
  marketing: {
    activeCampaigns: number;
    totalAudiences: number;
  };
  pos: {
    activeShiftsCount: number;
    todaySales: number;
    openRegistersCount: number;
  };
  activity: any[];
  systemHealth: {
    degradedServices: string[];
    allServicesOperational: boolean;
  };
}

// Local in-memory micro-cache (L1) for ultrafast sub-millisecond responses
const L1_CACHE = new Map<string, { data: BffDashboardSummary; expiresAt: number }>();
const L1_TTL_MS = 10_000; // 10 seconds L1
const REDIS_TTL_SECONDS = 60; // 60 seconds L2

export class BffAggregatorService {
  /**
   * Helper to perform authenticated inter-service HTTP requests with strict timeouts.
   */
  private static async fetchServiceJson<T = any>(
    serviceName: ServiceName,
    path: string,
    options: BffRequestOptions,
    timeoutMs: number = 3000
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const baseUrl = await resolveServiceUrl(serviceName);
      const url = `${baseUrl}${path}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-company-id": options.companyId,
        "x-user-id": options.userId,
        "x-user-role": options.role || "ADMIN",
        "x-bff-aggregated": "true",
      };

      if (options.token) {
        headers["Authorization"] = options.token.startsWith("Bearer ")
          ? options.token
          : `Bearer ${options.token}`;
      }

      if (options.correlationId) {
        headers["x-correlation-id"] = options.correlationId;
      }

      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status} from ${serviceName}` };
      }

      const data = await res.json() as T;
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || `Timeout/Error fetching ${serviceName}` };
    }
  }

  /**
   * Consolidates all dashboard panel data in parallel for a given company/user.
   */
  public static async getAggregatedDashboard(
    options: BffRequestOptions
  ): Promise<BffDashboardSummary> {
    const startTime = Date.now();
    const cacheKey = `bff:dashboard:${options.companyId}:${options.userId}`;

    // ── 1. Check L1 Memory Cache ─────────────────────────────────────────────
    if (!options.bypassCache) {
      const l1Hit = L1_CACHE.get(cacheKey);
      if (l1Hit && l1Hit.expiresAt > Date.now()) {
        return {
          ...l1Hit.data,
          cached: true,
          durationMs: Date.now() - startTime,
        };
      }
    }

    // ── 2. Check L2 Redis Cache ──────────────────────────────────────────────
    if (!options.bypassCache) {
      try {
        const cachedRaw = await redisClient.get(cacheKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw) as BffDashboardSummary;
          const ttlRemaining = await redisClient.ttl(cacheKey);
          
          // Populate L1 cache
          L1_CACHE.set(cacheKey, {
            data: parsed,
            expiresAt: Date.now() + L1_TTL_MS,
          });

          return {
            ...parsed,
            cached: true,
            cacheTtlRemaining: ttlRemaining > 0 ? ttlRemaining : 0,
            durationMs: Date.now() - startTime,
          };
        }
      } catch (redisErr: any) {
        console.warn("[BffAggregator] Redis cache lookup error (proceeding to live fetch):", redisErr.message);
      }
    }

    // ── 3. Parallel Execution across Distributed Microservices ────────────────
    const degradedServices: string[] = [];

    const [
      crmRes,
      financeRes,
      marketingRes,
      posRes,
      analyticsRes,
      notificationRes,
    ] = await Promise.allSettled([
      // A. CRM Service (4002)
      this.fetchServiceJson("crm", `/api/crm/stats?companyId=${encodeURIComponent(options.companyId)}`, options),
      // B. Finance Service (4006)
      this.fetchServiceJson("finance", `/api/invoices?companyId=${encodeURIComponent(options.companyId)}&limit=5`, options),
      // C. Marketing Service (4009)
      this.fetchServiceJson("marketing", `/api/campaigns?companyId=${encodeURIComponent(options.companyId)}`, options),
      // D. POS Service (4020)
      this.fetchServiceJson("pos", `/api/pos/sessions?companyId=${encodeURIComponent(options.companyId)}`, options),
      // E. Analytics Service (4013)
      this.fetchServiceJson("analytics", `/api/analytics/activity?limit=5`, options),
      // F. Notification Service (4016)
      this.fetchServiceJson("notification", `/api/notifications?unreadOnly=true`, options),
    ]);

    // ── 4. Normalize & Extract CRM Data ──────────────────────────────────────
    let crmData = {
      totalLeads: 0,
      totalDeals: 0,
      totalRevenue: 0,
      conversionRate: 0,
      topDeals: [] as any[],
      funnel: [] as any[],
    };
    if (crmRes.status === "fulfilled" && crmRes.value.success && crmRes.value.data) {
      const c = crmRes.value.data;
      crmData = {
        totalLeads: Number(c.leads?.total || c.totalLeads || 0),
        totalDeals: Number(c.deals?.total || c.totalDeals || 0),
        totalRevenue: Number(c.deals?.revenue || c.totalRevenue || 0),
        conversionRate: Number(c.conversionRate || 0),
        topDeals: Array.isArray(c.topDeals) ? c.topDeals : [],
        funnel: Array.isArray(c.funnel) ? c.funnel : [],
      };
    } else {
      degradedServices.push("crm-service");
    }

    // ── 5. Normalize & Extract Finance Data ──────────────────────────────────
    let financeData = {
      totalRevenueMonth: 0,
      pendingInvoicesCount: 0,
      recentInvoices: [] as any[],
    };
    if (financeRes.status === "fulfilled" && financeRes.value.success && financeRes.value.data) {
      const f = financeRes.value.data;
      const list = Array.isArray(f.invoices || f.data) ? (f.invoices || f.data) : [];
      financeData = {
        totalRevenueMonth: Number(f.totalRevenueMonth || 0),
        pendingInvoicesCount: list.filter((i: any) => i.status === "PENDING" || i.status === "SENT").length,
        recentInvoices: list.slice(0, 5),
      };
    } else {
      degradedServices.push("finance-service");
    }

    // ── 6. Normalize & Extract Marketing Data ────────────────────────────────
    let marketingData = {
      activeCampaigns: 0,
      totalAudiences: 0,
    };
    if (marketingRes.status === "fulfilled" && marketingRes.value.success && marketingRes.value.data) {
      const m = marketingRes.value.data;
      const campaigns = Array.isArray(m.campaigns || m.data) ? (m.campaigns || m.data) : [];
      marketingData = {
        activeCampaigns: campaigns.filter((c: any) => c.status === "ACTIVE" || c.status === "RUNNING").length,
        totalAudiences: Number(m.totalAudiences || 0),
      };
    } else {
      degradedServices.push("marketing-service");
    }

    // ── 7. Normalize & Extract POS Data ──────────────────────────────────────
    let posData = {
      activeShiftsCount: 0,
      todaySales: 0,
      openRegistersCount: 0,
    };
    if (posRes.status === "fulfilled" && posRes.value.success && posRes.value.data) {
      const p = posRes.value.data;
      posData = {
        activeShiftsCount: p.activeShift ? 1 : 0,
        todaySales: Number(p.activeShift?.totalSales || 0),
        openRegistersCount: p.activeShift?.registerId ? 1 : 0,
      };
    } else {
      degradedServices.push("pos-service");
    }

    // ── 8. Normalize & Extract Activity Logs ─────────────────────────────────
    let activityLogs: any[] = [];
    if (analyticsRes.status === "fulfilled" && analyticsRes.value.success && analyticsRes.value.data) {
      const a = analyticsRes.value.data;
      activityLogs = Array.isArray(a.logs || a.data) ? (a.logs || a.data) : [];
    } else {
      degradedServices.push("analytics-service");
    }

    // ── 9. Normalize & Extract Notifications ─────────────────────────────────
    let unreadCount = 0;
    if (notificationRes.status === "fulfilled" && notificationRes.value.success && notificationRes.value.data) {
      const n = notificationRes.value.data;
      unreadCount = Number(n.unreadCount || (Array.isArray(n.notifications) ? n.notifications.length : 0));
    } else {
      degradedServices.push("notification-service");
    }

    // ── 10. Assemble Consolidated Aggregation Payload ────────────────────────
    const summary: BffDashboardSummary = {
      cached: false,
      cacheTtlRemaining: REDIS_TTL_SECONDS,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      companyId: options.companyId,
      overview: {
        leadsCount: crmData.totalLeads,
        dealsValue: crmData.totalRevenue,
        activeDealsCount: crmData.totalDeals,
        invoicesCount: financeData.pendingInvoicesCount,
        pendingInvoicesValue: 0,
        activeCampaignsCount: marketingData.activeCampaigns,
        unreadNotificationsCount: unreadCount,
        activeEmployeesCount: 0,
        todayPosSalesTotal: posData.todaySales,
      },
      crm: crmData,
      finance: financeData,
      marketing: marketingData,
      pos: posData,
      activity: activityLogs,
      systemHealth: {
        degradedServices,
        allServicesOperational: degradedServices.length === 0,
      },
    };

    // ── 11. Store in L1 and L2 Caches ─────────────────────────────────────────
    L1_CACHE.set(cacheKey, {
      data: summary,
      expiresAt: Date.now() + L1_TTL_MS,
    });

    try {
      await redisClient.set(cacheKey, JSON.stringify(summary), "EX", REDIS_TTL_SECONDS);
    } catch (saveErr: any) {
      console.warn("[BffAggregator] Failed to write cache to Redis:", saveErr.message);
    }

    return summary;
  }

  /**
   * Programmatic Cache Invalidation for Company Data Mutations
   */
  public static async invalidateCompanyCache(companyId: string): Promise<void> {
    try {
      // Invalidate local L1
      for (const key of L1_CACHE.keys()) {
        if (key.includes(`:${companyId}:`)) {
          L1_CACHE.delete(key);
        }
      }

      // Invalidate Redis L2
      const keys = await redisClient.keys(`bff:dashboard:${companyId}:*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err: any) {
      console.warn("[BffAggregator] Error invalidating cache:", err.message);
    }
  }
}
