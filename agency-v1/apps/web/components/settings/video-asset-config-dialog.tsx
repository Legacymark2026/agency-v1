'use client';

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { testVideoAssetConnection, saveVideoAssetConfig } from "@/actions/integrations/video-assets";
import type { VideoAssetConfig } from "@/actions/integrations/video-assets-types";
import { toast } from "sonner";

interface ProviderConfig {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    key: 'midjourney',
    name: 'Midjourney',
    description: 'Generación de imágenes IA de alta calidad',
    icon: '🎨',
    color: 'bg-purple-600',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Tu API Key de Midjourney' }
    ]
  },
  {
    key: 'pexels',
    name: 'Pexels',
    description: 'Videos stock gratuitos',
    icon: '📹',
    color: 'bg-green-600',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Tu API Key de Pexels' }
    ]
  },
  {
    key: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Clonación de voz y síntesis de voz',
    icon: '🎤',
    color: 'bg-blue-600',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Tu API Key de ElevenLabs' }
    ]
  },
  {
    key: 'suno',
    name: 'Suno',
    description: 'Generación de música con IA',
    icon: '🎵',
    color: 'bg-pink-600',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Tu API Key de Suno' }
    ]
  },
  {
    key: 'runway',
    name: 'Runway',
    description: 'Generación de video con IA',
    icon: '🎬',
    color: 'bg-orange-600',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Tu API Key de Runway' }
    ]
  },
  {
    key: 'adobeStock',
    name: 'Adobe Stock',
    description: 'Videos stock profesionales',
    icon: '🏢',
    color: 'bg-red-600',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Tu Adobe Client ID' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'Tu Adobe Client Secret' }
    ]
  }
];

interface VideoAssetConfigDialogProps {
  currentConfig?: VideoAssetConfig;
  onSave?: () => void;
}

export function VideoAssetConfigDialog({ 
  currentConfig = {},
  onSave 
}: VideoAssetConfigDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});

  const provider = PROVIDERS.find(p => p.key === selectedProvider);

  const handleTest = async () => {
    if (!provider) return;

    const data = formData[provider.key] || {};
    const apiKey = data.apiKey || data.clientId || '';

    if (!apiKey) {
      toast.error('Ingresa una API key para probar');
      return;
    }

    setIsTesting(true);
    try {
      const result = await testVideoAssetConnection(provider.key, apiKey);
      
      if (result.success) {
        toast.success(`✅ ${provider.name}: ${result.message}`);
      } else {
        toast.error(`❌ ${provider.name}: ${result.message}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
    setIsTesting(false);
  };

  const handleSave = async () => {
    if (!provider) return;

    setIsSaving(true);
    try {
      const newConfig = { ...currentConfig };
      
      const providerConfig: any = { isActive: true };
      const data = formData[provider.key] || {};
      
      for (const field of provider.fields) {
        providerConfig[field.key] = data[field.key] || '';
      }

      (newConfig as any)[provider.key] = providerConfig;

      const result = await saveVideoAssetConfig(newConfig);

      if (result.success) {
        toast.success(`✅ Configuración de ${provider.name} guardada`);
        onSave?.();
        setSelectedProvider(null);
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
    setIsSaving(false);
  };

  return (
    <>
      {/* Provider Selection */}
      <div className="space-y-4">
        <Label className="text-slate-300">Selecciona un proveedor</Label>
        <div className="grid grid-cols-2 gap-3">
          {PROVIDERS.map(p => {
            const providerConfig = currentConfig?.[p.key as keyof VideoAssetConfig];
            const isConfigured = providerConfig ? ('apiKey' in providerConfig && providerConfig.apiKey) || ('clientId' in providerConfig && providerConfig.clientId) : false;
            
            return (
              <button
                key={p.key}
                onClick={() => setSelectedProvider(p.key)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedProvider === p.key 
                    ? 'border-violet-500 bg-violet-500/10' 
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center text-white text-sm`}>
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400">{isConfigured ? '✅ Configurado' : 'No configurado'}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Form */}
      {selectedProvider && provider && (
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${provider.color} flex items-center justify-center text-white text-lg`}>
              {provider.icon}
            </div>
            <div>
              <h3 className="font-semibold text-white">{provider.name}</h3>
              <p className="text-xs text-slate-400">{provider.description}</p>
            </div>
          </div>

          <div className="space-y-3">
            {provider.fields.map(field => (
              <div key={field.key} className="space-y-1">
                <Label className="text-slate-300 text-sm">{field.label}</Label>
                <div className="relative">
                  <Input
                    type={field.key.includes('Secret') || field.key === 'clientSecret' 
                      ? (showSecret[provider.key] ? 'text' : 'password') 
                      : 'text'}
                    placeholder={field.placeholder}
                    value={formData[provider.key]?.[field.key] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [provider.key]: {
                        ...prev[provider.key],
                        [field.key]: e.target.value
                      }
                    }))}
                    className="bg-slate-800 border-slate-700 text-white pr-10"
                  />
                  {(field.key === 'apiKey' || field.key.includes('Secret') || field.key === 'clientSecret') && (
                    <button
                      type="button"
                      onClick={() => setShowSecret(prev => ({ ...prev, [provider.key]: !prev[provider.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showSecret[provider.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Probar conexión
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setSelectedProvider(null)}
            className="w-full text-slate-400 hover:text-white"
          >
            Cancelar
          </Button>
        </div>
      )}
    </>
  );
}

export default VideoAssetConfigDialog;