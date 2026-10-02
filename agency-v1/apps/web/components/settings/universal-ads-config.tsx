"use client";

import { useState, useEffect } from "react";
import { getIntegrationConfig, updateIntegrationConfig } from "@/actions/integration-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Hash, Eye, EyeOff, Check, Megaphone, Globe } from "lucide-react";

export function UniversalAdsConfig({ 
  provider, 
  title, 
  icon: Icon,
  colorClass 
}: { 
  provider: "linkedin" | "meta" | "tiktok", 
  title: string, 
  icon: any,
  colorClass: string 
}) {
  const [loading, setLoading] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  
  const [adsConfig, setAdsConfig] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, [provider]);

  async function loadConfigs() {
    setLoading(true);
    try {
      const ads = await getIntegrationConfig(`${provider}-ads`);
      setAdsConfig(ads || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      await updateIntegrationConfig(`${provider}-ads`, adsConfig);
      toast.success(`Configuración de ${title} guardada.`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error("Error al guardar la configuración.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title} Ads API</h2>
          <p className="text-sm text-slate-400">Configura la integración de {title} para importación de leads.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Client ID</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={adsConfig.clientId || ''}
              onChange={(e) => setAdsConfig({ ...adsConfig, clientId: e.target.value })}
              className="pl-9"
              placeholder="Ej. 78a9c0..."
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Client Secret</Label>
          <div className="relative">
            <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type={showClientSecret ? "text" : "password"}
              value={adsConfig.clientSecret || ''}
              onChange={(e) => setAdsConfig({ ...adsConfig, clientSecret: e.target.value })}
              className="pl-9 pr-10"
              placeholder="••••••••••••••••"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setShowClientSecret(!showClientSecret)}
            >
              {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label>Access Token (Opcional)</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type={showAccessToken ? "text" : "password"}
              value={adsConfig.accessToken || ''}
              onChange={(e) => setAdsConfig({ ...adsConfig, accessToken: e.target.value })}
              className="pl-9 pr-10"
              placeholder="••••••••••••••••"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setShowAccessToken(!showAccessToken)}
            >
              {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {saved ? <><Check className="mr-2 h-4 w-4" /> Guardado</> : "Guardar Configuración"}
      </Button>
    </div>
  );
}
