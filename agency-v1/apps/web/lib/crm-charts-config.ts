import { format } from "date-fns";

import { z } from "zod";

export const ForecastDataSchema = z.object({
    name: z.string(),
    weighted: z.number(),
    total: z.number(),
});

export const LeadSourceSchema = z.object({
    name: z.string(),
    value: z.number(),
});

export const LostReasonSchema = z.object({
    reason: z.string(),
    count: z.number(),
});

export type ForecastData = z.infer<typeof ForecastDataSchema>;
export type LeadSource = z.infer<typeof LeadSourceSchema>;
export type LostReason = z.infer<typeof LostReasonSchema>;

export const CRM_CHART_COLORS = {
    primary: "#2563eb",
    secondary: "#3b82f6",
    tertiary: "#60a5fa",
    quaternary: "#93c5fd",
    quinary: "#bfdbfe",
    accent: "#f59e0b",
    danger: "#ef4444",
    success: "#10b981",
    muted: "#888888",
};

export const CRM_CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
});

export const CRM_TOOLTIP_STYLE = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    padding: '8px'
};

export const chartConfig = {
    xAxis: {
        stroke: CRM_CHART_COLORS.muted,
        fontSize: 12,
        tickLine: false,
        axisLine: false,
    },
    yAxis: {
        stroke: CRM_CHART_COLORS.muted,
        fontSize: 12,
        tickLine: false,
        axisLine: false,
    }
};
