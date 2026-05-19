'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Play, FileVideo, CheckCircle, Loader2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectConfig, RenderOutput } from '@/actions/video-editor';
import { generateRenderOutputs } from '@/actions/video-editor';
import { createRenderJob, getRenderJobStatus } from '@/actions/video-render';
import { toast } from 'sonner';

interface ExportPanelProps {
  config: ProjectConfig;
  timeline: any;
  qualityPassed: boolean;
  projectId?: string;
  onExport: (outputs: RenderOutput[]) => void;
}

type ExportStatus = 'idle' | 'creating' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export function ExportPanel({ config, timeline, qualityPassed, projectId, onExport }: ExportPanelProps) {
  const [outputs, setOutputs] = useState<RenderOutput[]>([]);
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Generar lista de formatos de salida al montar
  useEffect(() => {
    const generate = async () => {
      setIsGeneratingOutputs(true);
      try {
        const result = await generateRenderOutputs(config);
        setOutputs(result);
      } catch (err) {
        console.error('Error generating render outputs:', err);
      } finally {
        setIsGeneratingOutputs(false);
      }
    };
    generate();
  }, [config]);

  // Polling del estado del job
  const startPolling = useCallback((id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const status = await getRenderJobStatus(id);
        if (!status) return;

        setProgress(status.progress);
        setExportStatus(status.status as ExportStatus);

        if (status.status === 'COMPLETED') {
          clearInterval(pollingRef.current!);
          setOutputUrl(status.outputUrl);
          toast.success('¡Video renderizado con éxito!');
          onExport(outputs);
        } else if (status.status === 'FAILED') {
          clearInterval(pollingRef.current!);
          setErrorMessage(status.errorMessage ?? 'Error desconocido');
          toast.error('Error al renderizar el video');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll cada 2 segundos
  }, [outputs, onExport]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleExport = async () => {
    if (!projectId) {
      toast.error('Guarda el proyecto primero para poder exportar');
      return;
    }
    if (!timeline) {
      toast.error('Genera el timeline antes de exportar');
      return;
    }

    setExportStatus('creating');
    setProgress(0);
    setErrorMessage(null);
    setOutputUrl(null);

    try {
      const { jobId: newJobId } = await createRenderJob(projectId, {
        timeline,
        colorGrades:  [],
        audioTracks:  [],
        textOverlays: [],
        config,
      });

      setJobId(newJobId);
      setExportStatus('PENDING');
      toast.info('Render iniciado — procesando en el servidor...');
      startPolling(newJobId);

    } catch (err: any) {
      setExportStatus('FAILED');
      setErrorMessage(err.message);
      toast.error('Error al iniciar el render: ' + err.message);
    }
  };

  const handleRetry = () => {
    setExportStatus('idle');
    setProgress(0);
    setJobId(null);
    setErrorMessage(null);
    setOutputUrl(null);
  };

  if (!qualityPassed) {
    return (
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-amber-400 mb-2">Corrige los Errores Primero</h3>
          <p className="text-amber-300 text-sm">
            El checklist de calidad tiene errores. Corrígelos antes de exportar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Resumen del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tipo',      value: config.type?.replace('-', ' ') },
              { label: 'Formato',   value: config.format },
              { label: 'Estilo',    value: config.style },
              { label: 'Plataforma',value: config.platform },
            ].map(item => (
              <div key={item.label} className="p-3 bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-white font-medium capitalize">{item.value ?? '—'}</p>
              </div>
            ))}
          </div>
          {timeline && (
            <div className="mt-4 p-3 bg-slate-900 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Duración Total</p>
                <p className="text-white font-medium">{timeline.totalDuration}s</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Cortes</p>
                <p className="text-white font-medium">{timeline.cuts}</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                <CheckCircle className="w-3 h-3 mr-1" />
                Listo para Exportar
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Formats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-teal-400" />
            Formatos de Exportación
          </CardTitle>
          <CardDescription className="text-slate-400">
            Archivos que se generarán en el servidor VPS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isGeneratingOutputs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              <span className="ml-2 text-slate-400">Calculando formatos...</span>
            </div>
          ) : (
            outputs.map((output, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                    <FileVideo className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{output.filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{output.resolution}</Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{output.codec}</Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{output.audioBitrate}kbps</Badge>
                    </div>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Render Status */}
      {exportStatus !== 'idle' && exportStatus !== 'creating' && (
        <Card className={cn(
          'border',
          exportStatus === 'COMPLETED' ? 'bg-emerald-900/20 border-emerald-500/30' :
          exportStatus === 'FAILED'    ? 'bg-red-900/20 border-red-500/30' :
          'bg-slate-800/50 border-slate-700'
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              {exportStatus === 'COMPLETED' ? (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              ) : exportStatus === 'FAILED' ? (
                <AlertCircle className="w-6 h-6 text-red-400" />
              ) : (
                <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              )}
              <div>
                <p className="text-white font-semibold">
                  {exportStatus === 'PENDING'    && 'En cola de render...'}
                  {exportStatus === 'PROCESSING' && 'Renderizando con FFmpeg...'}
                  {exportStatus === 'COMPLETED'  && '¡Render completado!'}
                  {exportStatus === 'FAILED'     && 'Error en el render'}
                </p>
                {jobId && (
                  <p className="text-xs text-slate-500 font-mono">Job: {jobId.slice(0, 8)}...</p>
                )}
              </div>
            </div>

            {(exportStatus === 'PENDING' || exportStatus === 'PROCESSING') && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2 bg-slate-700" />
                <p className="text-xs text-slate-400 text-right">{progress}%</p>
              </div>
            )}

            {exportStatus === 'COMPLETED' && outputUrl && (
              <div className="flex gap-3 mt-2">
                <Button
                  onClick={() => window.open(outputUrl, '_blank')}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar Video
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(outputUrl, '_blank')}
                  className="border-emerald-500/30 text-emerald-400 gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver en navegador
                </Button>
              </div>
            )}

            {exportStatus === 'FAILED' && (
              <div className="space-y-3">
                {errorMessage && (
                  <p className="text-sm text-red-400 font-mono bg-red-500/10 p-3 rounded-lg">
                    {errorMessage}
                  </p>
                )}
                <Button onClick={handleRetry} variant="outline" className="gap-2 border-red-500/30 text-red-400">
                  <RefreshCw className="w-4 h-4" />
                  Reintentar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      {(exportStatus === 'idle' || exportStatus === 'COMPLETED' || exportStatus === 'FAILED') && (
        <Card className="bg-gradient-to-r from-teal-900 to-slate-900 border-teal-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">
                  {exportStatus === 'COMPLETED' ? '¡Video listo!' : '¿Listo para exportar?'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {!projectId
                    ? 'Guarda el proyecto primero para poder exportar'
                    : exportStatus === 'COMPLETED'
                    ? 'Tu video fue renderizado en el servidor VPS'
                    : `Se generarán ${outputs.length} formato${outputs.length !== 1 ? 's' : ''} en el VPS`}
                </p>
              </div>
              <Button
                onClick={exportStatus === 'COMPLETED' ? handleRetry : handleExport}
                disabled={!projectId || exportStatus === 'creating'}
                className={cn(
                  'text-base px-6 py-5 gap-2',
                  exportStatus === 'COMPLETED'
                    ? 'bg-slate-600 hover:bg-slate-700'
                    : 'bg-teal-600 hover:bg-teal-700',
                )}
              >
                {exportStatus === 'creating' ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Iniciando...</>
                ) : exportStatus === 'COMPLETED' ? (
                  <><RefreshCw className="w-5 h-5" />Nuevo render</>
                ) : (
                  <><Play className="w-5 h-5" />Exportar Video</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}