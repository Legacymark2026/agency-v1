'use client';

import { useState, useEffect } from "react";
import { getIntegrationConfig, updateIntegrationConfig, TikTokAdsConfig, TikTokMessagesConfig } from "@/actions/integration-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Key, Hash, Lock, Eye, EyeOff, Check, Megaphone, MessageSquare 
} from "lucide-react";

export function TikTokFamilyConfig() {
  const [loading, setLoading] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  
  const [tiktokAds, setTiktokAds] = useState<TikTokAdsConfig>({});
  const [tiktokMessages, setTiktokMessages] = useState<TikTokMessagesConfig>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    try {
      const [ads, messages] = await Promise.all([
        getIntegrationConfig('tiktok-ads'),
        getIntegrationConfig('tiktok-messages')
      ]);
      
      if (ads) setTiktokAds(ads as TikTokAdsConfig);
      if (messages) setTiktokMessages(messages as TikTokMessagesConfig);
    } catch (e) {
      console.error("Error loading configs:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (loading) return;
    setLoading(true);
    setSaved(false);
    
    try {
      if (tiktokAds.tiktokPixelId || tiktokAds.tiktokAccessToken) {
        await updateIntegrationConfig('tiktok-ads', tiktokAds);
      }
      
      if (tiktokMessages.tiktokAppId || tiktokMessages.tiktokClientSecret) {
        await updateIntegrationConfig('tiktok-messages', tiktokMessages);
      }
      
      setSaved(true);
      toast.success("TikTok configurations saved!");
      
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      console.error("Error saving:", e);
      toast.error(e?.message || "Error saving configuration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* TikTok Ads */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-pink-600" />
          <h3 className="text-sm font-semibold">TikTok Ads</h3>
          <Badge variant="secondary" className="text-[10px]">Pixel</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Pixel ID</Label>
            <Input
              value={tiktokAds.tiktokPixelId || ''}
              onChange={e => setTiktokAds({ ...tiktokAds, tiktokPixelId: e.target.value })}
              className="font-mono text-sm"
              placeholder="C01XXXXXXXXXX"
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs">Events API Access Token</Label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type={showAccessToken ? "text" : "password"}
                value={tiktokAds.tiktokAccessToken || ''}
                onChange={e => setTiktokAds({ ...tiktokAds, tiktokAccessToken: e.target.value })}
                className="pl-9 pr-10 font-mono text-xs"
                placeholder="bc..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowAccessToken(!showAccessToken)}
              >
                {showAccessToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* TikTok Messages/Webhooks */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-black" />
          <h3 className="text-sm font-semibold">TikTok Webhooks</h3>
          <Badge variant="secondary" className="text-[10px]">Comments sync</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">App ID</Label>
            <Input
              value={tiktokMessages.tiktokAppId || ''}
              onChange={e => setTiktokMessages({ ...tiktokMessages, tiktokAppId: e.target.value })}
              className="font-mono text-sm"
              placeholder="tiktok_..."
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs">Client Secret</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type={showClientSecret ? "text" : "password"}
                value={tiktokMessages.tiktokClientSecret || ''}
                onChange={e => setTiktokMessages({ ...tiktokMessages, tiktokClientSecret: e.target.value })}
                className="pl-9 pr-10 font-mono text-xs"
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowClientSecret(!showClientSecret)}
              >
                {showClientSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          <div className="grid gap-2 col-span-2">
            <Label className="text-xs">Webhook Secret</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type={showWebhookSecret ? "text" : "password"}
                value={tiktokMessages.tiktokWebhookSecret || ''}
                onChange={e => setTiktokMessages({ ...tiktokMessages, tiktokWebhookSecret: e.target.value })}
                className="pl-9 pr-10 font-mono text-xs"
                placeholder="Webhook secret..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              >
                {showWebhookSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400">
              Configure this URL in TikTok Developers: /api/integrations/tiktok/webhook
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-pink-600 hover:bg-pink-700"
        >
          {loading ? (
            <>Saving...</>
          ) : saved ? (
            <><Check className="mr-2 h-4 w-4" /> Saved!</>
          ) : (
            "Save TikTok Family"
          )}
        </Button>
      </div>
    </div>
  );
}