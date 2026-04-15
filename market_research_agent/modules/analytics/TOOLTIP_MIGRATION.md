# Analytics Tooltip Type Fixes

## Files to Update

All these files need `import { RechartsTooltipProps } from '@/types/recharts';` and tooltip type updates:

1. bounce-trend.tsx - Line 21
2. funnel-chart.tsx - Line 10, 56
3. browser-os-stats.tsx - Line 11
4. channel-attribution.tsx - Line 11, 16
5. engagement-radar.tsx - Line 15, 20
6. seo-metrics.tsx - Line 20, 22, 26
7. session-histogram.tsx - Line 11
8. traffic-sources.tsx - Line 13
9. ab-test-results.tsx - Line 38, 39

## Pattern

Replace: `const CustomTooltip = ({ active, payload }: any) =>`
With: `const CustomTooltip = ({ active, payload }: RechartsTooltipProps) =>`

Replace: `(entry: any, ` or `(v: any, `
With: `(entry: RechartsPayload, ` or use proper types
