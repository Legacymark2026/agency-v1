'use client';

import { useState, useEffect } from "react";
import { getIntegrationConfig, updateIntegrationConfig, LinkedInAdsConfig, LinkedInWebhookConfig } from "@/actions/integration-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Key, Hash, Lock, Eye, EyeOff, Check, Linkedin, Megaphone, Globe 
} from "lucide-react";

export function LinkedInFamilyConfig() {
  const [loading, setLoading] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  
  const [linkedinAds, setLinkedinAds] = useState<LinkedInAdsConfig>({});
  const [linkedinWebhook, setLinkedinWebhook] = useState<LinkedInWebhookConfig>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    try {
      const [ads, webhook] = await Promise.all([
        getIntegrationConfig('linkedin-ads'),
        getIntegrationConfig('linkedin-webhook')
      ]);
      
      if (ads) setLinkedinAds(ads as LinkedInAdsConfig);
      if (webhook) setLinkedinWebhook(webhook as LinkedInWebhookConfig);
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
      if (linkedinAds.linkedinPartnerId || linkedinAds.linkedinAccessToken) {
        await updateIntegrationConfig('linkedin-ads', linkedinAds);
      }
      
      if (linkedinWebhook.linkedinClientId || linkedinWebhook.linkedinClientSecret) {
        await updateIntegrationConfig('linkedin-webhook', linkedinWebhook);
      }
      
      setSaved(true);
      toast.success("LinkedIn configurations saved!");
      
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
      {/* LinkedIn Ads */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[#0A66C2]" />
          <h3 className="text-sm font-semibold">LinkedIn Ads</h3>
          <Badge variant="secondary" className="text-xs">Insight Tag</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Partner ID</Label>
            <Input
              value={linkedinAds.linkedinPartnerId || ''}
              onChange={e => setLinkedinAds({ ...linkedinAds, linkedinPartnerId: e.target.value })}
              className="font-mono text-sm"
              placeholder="1234567"
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs">Conversion ID</Label>
            <Input
              value={linkedinAds.linkedinConversionId || ''}
              onChange={e => setLinkedinAds({ ...linkedinAds, linkedinConversionId: e.target.value })}
              className="font-mono text-sm"
              placeholder="12345678"
            />
          </div>
          
          <div className="grid gap-2 col-span-2">
            <Label className="text-xs">Conversions API Token</Label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type={showAccessToken ? "text" : "password"}
                value={linkedinAds.linkedinAccessToken || ''}
                onChange={e => setLinkedinAds({ ...linkedinAds, linkedinAccessToken: e.target.value })}
                className="pl-9 pr-10 font-mono text-xs"
                placeholder="AQ..."
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

      {/* LinkedIn Webhooks */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-[#0A66C2]" />
          <h3 className="text-sm font-semibold">LinkedIn Organization Webhooks</h3>
          <Badge variant="secondary" className="text-xs">Status & Follows</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Client ID</Label>
            <Input
              value={linkedinWebhook.linkedinClientId || ''}
              onChange={e => setLinkedinWebhook({ ...linkedinWebhook, linkedinClientId: e.target.value })}
              className="font-mono text-sm"
              placeholder="78abc..."
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs">Client Secret</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type={showClientSecret ? "text" : "password"}
                value={linkedinWebhook.linkedinClientSecret || ''}
                onChange={e => setLinkedinWebhook({ ...linkedinWebhook, linkedinClientSecret: e.target.value })}
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
                value={linkedinWebhook.linkedinWebhookSecret || ''}
                onChange={e => setLinkedinWebhook({ ...linkedinWebhook, linkedinWebhookSecret: e.target.value })}
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
            <p className="text-xs text-gray-400">
              Configure this URL in LinkedIn Developer: /api/webhooks/linkedin
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#0A66C2] hover:bg-[#004182]"
        >
          {loading ? (
            <>Saving...</>
          ) : saved ? (
            <><Check className="mr-2 h-4 w-4" /> Saved!</>
          ) : (
            "Save LinkedIn Family"
          )}
        </Button>
      </div>
    </div>
  );
}