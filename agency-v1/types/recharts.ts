// Recharts types for analytics components
export interface RechartsPayload {
    name?: string;
    value?: number;
    payload?: Record<string, any>;
    color?: string;
    dataKey?: string;
    [key: string]: any;
}

export interface RechartsTooltipProps {
    active?: boolean;
    payload?: RechartsPayload[];
    label?: string | number;
    total?: number;
}

export interface ChartDataItem {
    name: string;
    value: number;
    [key: string]: any;
}
