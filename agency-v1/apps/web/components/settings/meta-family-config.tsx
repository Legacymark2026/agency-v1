'use client';

import { useState } from "react";
import { getIntegrationConfig, updateIntegrationConfig, MetaAppConfig, FacebookPageConfig, WhatsAppConfig, MetaPixelConfig } from "@/actions/integration-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Key, Hash, Lock, Eye, EyeOff, Check, Copy, Settings, 
  Facebook, MessageSquare, Instagram, Phone 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetaFamilyConfigProps {
  companyId?: string;
}

export function MetaFamilyConfig({ companyId }: MetaFamilyConfigProps) {
  const [loading, setLoading] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [showPageToken, setShowPageToken] = useState(false);
  const [showCapiToken, setShowCapiToken] = useState(false);
  
  // Config states
  const [metaApp, setMetaApp] = useState<MetaAppConfig>({});
  const [facebookPage, setFacebookPage] = useState<FacebookPageConfig>({});
  const [whatsApp, setWhatsApp] = useState<WhatsAppConfig>({});
  const [metaPixel, setMetaPixel] = useState<MetaPixelConfig>({});
  const [saved, setSaved] = useState(false);

  // Load configs on mount
  useState(() => {
    loadConfigs();
  });

  async function loadConfigs() {
    setLoading(true);
    try {
      const [app, page, wa, pixel] = await Promise.all([
        getIntegrationConfig('meta-app'),
        getIntegrationConfig('facebook-page'),
        getIntegrationConfig('whatsapp'),
        getIntegrationConfig('meta-pixel')
      ]);
      
      if (app) setMetaApp(app as MetaAppConfig);
      if (page) setFacebookPage(page as FacebookPageConfig);
      if (wa) setWhatsApp(wa as WhatsAppConfig);
      if (pixel) setMetaPixel(pixel as MetaPixelConfig);
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
      // Save meta-app credentials
      if (metaApp.appId || metaApp.appSecret) {
        await updateIntegrationConfig('meta-app', metaApp);
      }
      
      // Save facebook-page config
      if (facebookPage.pageId || facebookPage.accessToken || facebookPage.manualPageId) {
        await updateIntegrationConfig('facebook-page', facebookPage);
      }
      
      // Save whatsapp config
      if (whatsApp.phoneNumberId || whatsApp.accessToken) {
        await updateIntegrationConfig('whatsapp', whatsApp);
      }
      
      // Save meta-pixel config
      if (metaPixel.pixelId || metaPixel.capiToken) {
        await updateIntegrationConfig('meta-pixel', metaPixel);
      }
      
      setSaved(true);
      toast.success("Meta family configurations saved!");
      
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
      {/* Meta App Credentials (Shared) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold">Meta App Credentials (Shared)</h3>
          <Badge variant="secondary" className="text-xs">All Meta Products</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">App ID</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={metaApp.appId || ''}
                onChange={e => setMetaApp({ ...metaApp, appId: e.target.value })}
                className="pl-9 font-mono text-sm"
                placeholder="1234567890"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs">App Secret</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type={showAppSecret ? "text" : "password"}
                value={metaApp.appSecret || ''}
                onChange={e => setMetaApp({ ...metaApp, appSecret: e.target.value })}
                className="pl-9 pr-10 font-mono text-sm"
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowAppSecret(!showAppSecret)}
              >
                {showAppSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Facebook Page */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <h3 className="text-sm font-semibold">Facebook Page</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Page ID (Manual Override)</Label>
            <Input
              value={facebookPage.manualPageId || ''}
              onChange={e => setFacebookPage({ ...facebookPage, manualPageId: e.target.value })}
              className="font-mono text-sm"
              placeholder="929804106889746"
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs">Page Access Token</Label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type={showPageToken ? "text" : "password"}
                value={facebookPage.manualPageToken || ''}
                onChange={e => setFacebookPage({ ...facebookPage, manualPageToken: e.target.value })}
                className="pl-9 pr-10 font-mono text-xs"
                placeholder="Token..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowPageToken(!showPageToken)}
              >
                {showPageToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* WhatsApp */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-green-600" />
          <h3 className="text-sm font-semibold">WhatsApp Business</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Phone Number ID</Label>
            <Input
              value={whatsApp.phoneNumberId || ''}
              onChange={e => setWhatsApp({ ...whatsApp, phoneNumberId: e.target.value })}
              className="font-mono text-sm"
              placeholder="9876543210"
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs">WABA ID</Label>
            <Input
              value={whatsApp.wabaId || ''}
              onChange={e => setWhatsApp({ ...whatsApp, wabaId: e.target.value })}
              className="font-mono text-sm"
              placeholder="1234567890"
            />
          </div>
          
          <div className="grid gap-2 col-span-2">
            <Label className="text-xs">Access Token</Label>
            <Input
              value={whatsApp.accessToken || ''}
              onChange={e => setWhatsApp({ ...whatsApp, accessToken: e.target.value })}
              className="font-mono text-xs"
              placeholder="EA..."
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Meta Pixel */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-700" />
          <h3 className="text-sm font-semibold">Meta Pixel (CAPI)</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Pixel ID</Label>
            <Input
              value={metaPixel.pixelId || ''}
              onChange={e => setMetaPixel({ ...metaPixel, pixelId: e.target.value })}
              className="font-mono text-sm"
              placeholder="1234567890"
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs">Conversions API Token</Label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type={showCapiToken ? "text" : "password"}
                value={metaPixel.capiToken || ''}
                onChange={e => setMetaPixel({ ...metaPixel, capiToken: e.target.value })}
                className="pl-9 pr-10 font-mono text-xs"
                placeholder="EA..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowCapiToken(!showCapiToken)}
              >
                {showCapiToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>Saving...</>
          ) : saved ? (
            <><Check className="mr-2 h-4 w-4" /> Saved!</>
          ) : (
            "Save Meta Family"
          )}
        </Button>
      </div>
    </div>
  );
}