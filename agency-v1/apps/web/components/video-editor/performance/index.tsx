'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Eye, Clock, BarChart3 } from 'lucide-react';

interface PerformanceMetrics {
  predictedScore: number;
  retentionRate: number;
  hookStrength: number;
  pacingScore: number;
  audioQuality: number;
  visualQuality: number;
}

interface PerformanceDashboardProps {
  metrics: PerformanceMetrics;
  views?: number;
  avgWatchTime?: number;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excelente';
  if (score >= 80) return 'Muy bueno';
  if (score >= 70) return 'Bueno';
  if (score >= 60) return 'Regular';
  return 'Necesita mejora';
};

export function PerformanceDashboard({ metrics, views = 0, avgWatchTime = 0 }: PerformanceDashboardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-400" />
          Predicción de Rendimiento
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="text-center mb-4">
          <div className={`text-4xl font-bold ${getScoreColor(metrics.predictedScore)}`}>
            {metrics.predictedScore}
          </div>
          <p className="text-slate-400 text-sm">{getScoreLabel(metrics.predictedScore)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Eye className="w-3 h-3" />
              Vistas predichas
            </div>
            <p className="text-white font-semibold">{views > 0 ? views.toLocaleString() : '—'}</p>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="w-3 h-3" />
              Retención
            </div>
            <p className="text-white font-semibold">{metrics.retentionRate}%</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Hook (primeros 3s)', value: metrics.hookStrength, icon: metrics.hookStrength > 70 ? TrendingUp : TrendingDown },
            { label: 'Ritmo del video', value: metrics.pacingScore, icon: metrics.pacingScore > 70 ? TrendingUp : TrendingDown },
            { label: 'Calidad de audio', value: metrics.audioQuality, icon: metrics.audioQuality > 70 ? TrendingUp : TrendingDown },
            { label: 'Calidad visual', value: metrics.visualQuality, icon: metrics.visualQuality > 70 ? TrendingUp : TrendingDown },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-400">{metric.label}</span>
                <div className="flex items-center gap-1">
                  <metric.icon className={`w-3 h-3 ${getScoreColor(metric.value)}`} />
                  <span className={getScoreColor(metric.value)}>{metric.value}%</span>
                </div>
              </div>
              <Progress value={metric.value} className="h-2 bg-slate-700" />
            </div>
          ))}
        </div>

        {avgWatchTime > 0 && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
            <p className="text-slate-400 text-xs mb-1">Tiempo promedio de visualización</p>
            <p className="text-white font-semibold">{avgWatchTime}s</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
