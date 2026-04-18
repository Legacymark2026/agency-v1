'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';

interface TrackingConfiguratorProps {
    platform: string;
    trackingConfig: any;
    onChange: (config: any) => void;
}

export default function TrackingConfigurator({ platform, trackingConfig, onChange }: TrackingConfiguratorProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...trackingConfig, [key]: value });
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Pixel & Conversion Event */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold tracking-tight">Pixel & Setup</h4>
                        <p className="text-sm text-muted-foreground mb-4">Select the tracking source and optimization event.</p>
                    </div>

                    <div className="space-y-4 border p-4 rounded-md">
                        <div className="space-y-2">
                            <Label>Tracking Source (Pixel ID)</Label>
                            <Input placeholder="e.g. 1029384857463" value={trackingConfig.pixelId || ''} onChange={(e) => handleChange('pixelId', e.target.value)} />
                            <p className="text-xs text-muted-foreground">Select the pixel connected to your external property.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Conversion Event</Label>
                            <Select value={trackingConfig.conversionEvent || ''} onValueChange={(v) => handleChange('conversionEvent', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Event" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LEAD">Lead (Form Submit)</SelectItem>
                                    <SelectItem value="PURCHASE">Purchase</SelectItem>
                                    <SelectItem value="ADD_TO_CART">Add To Cart</SelectItem>
                                    <SelectItem value="CUSTOM_EVENT">Custom Event</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch id="capi" checked={trackingConfig.useCAPI || false} onCheckedChange={(v) => handleChange('useCAPI', v)} />
                            <Label htmlFor="capi" className="cursor-pointer">Use Conversions API (Server-Side)</Label>
                        </div>
                    </div>
                </div>

                {/* UTM Parameters */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold tracking-tight">UTM Tracking Template</h4>
                        <p className="text-sm text-muted-foreground mb-4">Append these parameters to your Ad URLs to track attribution in Google Analytics & LegacyMark DB.</p>
                    </div>

                    <div className="space-y-4 border p-4 rounded-md">
                        <div className="space-y-2">
                            <Label>UTM Source</Label>
                            <Input placeholder="e.g. facebook, google, tiktok" value={trackingConfig.utmSource || ''} onChange={(e) => handleChange('utmSource', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>UTM Medium</Label>
                            <Input placeholder="e.g. cpc, paid_social" value={trackingConfig.utmMedium || ''} onChange={(e) => handleChange('utmMedium', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>UTM Campaign</Label>
                            <Input placeholder="e.g. summer_promo_2026" value={trackingConfig.utmCampaign || ''} onChange={(e) => handleChange('utmCampaign', e.target.value)} />
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                <Info className="h-3 w-3 mr-1" /> Best practice is to match the technical Campaign Name.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
