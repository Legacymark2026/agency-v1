// Analytics Module Types

export interface AnalyticsData {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    conversions: number;
    period: DatePeriod;
}

export interface DatePeriod {
    from: Date | string;
    to: Date | string;
}

export interface TrafficSource {
    source: string;
    visitors: number;
    percentage: number;
}

export interface PagePerformance {
    path: string;
    views: number;
    avgDuration: number;
    bounceRate: number;
}

export enum MetricType {
    PAGEVIEWS = 'pageviews',
    VISITORS = 'visitors',
    CONVERSIONS = 'conversions',
    REVENUE = 'revenue'
}
