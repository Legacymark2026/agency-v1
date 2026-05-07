'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Play, FileVideo, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectConfig, RenderOutput } from '@/actions/video-editor';
import { generateRenderOutputs } from '@/actions/video-editor';

interface ExportPanelProps {
  config: ProjectConfig;
  timeline: any;
  qualityPassed: boolean;
  onExport: (outputs: RenderOutput[]) => void;
}

export function ExportPanel({ config, timeline, qualityPassed, onExport }: ExportPanelProps) {
  const [outputs, setOutputs] = useState<RenderOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'generating' | 'complete'>('idle');

  useEffect(() => {
    const generateOutputs = async () => {
      setIsGenerating(true);
      try {
        const result = await generateRenderOutputs(config);
        setOutputs(result);
      } catch (error) {
        console.error('Error generating outputs:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateOutputs();
  }, [config]);

  const handleExport = () => {
    setExportStatus('generating');
    // Simulate export process
    setTimeout(() => {
      setExportStatus('complete');
      onExport(outputs);
    }, 2000);
  };

  if (!qualityPassed) {
    return (
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-amber-400" />
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
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-xs text-slate-400">Tipo</p>
              <p className="text-white font-medium capitalize">{config.type?.replace('-', ' ')}</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-xs text-slate-400">Formato</p>
              <p className="text-white font-medium">{config.format}</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-xs text-slate-400">Estilo</p>
              <p className="text-white font-medium capitalize">{config.style}</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-xs text-slate-400">Plataforma</p>
              <p className="text-white font-medium capitalize">{config.platform}</p>
            </div>
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
            Archivos que se generarán
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              <span className="ml-2 text-slate-400">Generando formatos...</span>
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
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        {output.resolution}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        {output.codec}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        {output.audioBitrate}kbps
                      </Badge>
                    </div>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Export Button */}
      <Card className="bg-gradient-to-r from-teal-900 to-slate-900 border-teal-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">¡Tu video está listo!</h3>
              <p className="text-slate-400 text-sm">
                Haz clic para exportar {outputs.length} formato{outputs.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={exportStatus === 'generating'}
              className="bg-teal-600 hover:bg-teal-700 text-lg px-8 py-6"
            >
              {exportStatus === 'generating' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : exportStatus === 'complete' ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Exportado
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Exportar Video
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}