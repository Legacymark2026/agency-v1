'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveCampaignDraft, submitForApproval } from '@/actions/marketing/campaign-builder';
import { toast } from 'sonner';
import { CheckCircle2, ChevronRight, Save, Send, ArrowLeft } from 'lucide-react';
import PlatformParametersForm from './PlatformParametersForm';
import TrackingConfigurator from './TrackingConfigurator';

export interface CampaignFormState {
    name: string;
    platform: string;
    objective: string;
    budget: number;
    startDate: string;
    endDate: string;
    description: string;
    parameters: Record<string, any>;
    trackingConfig: Record<string, any>;
}

const STEPS = [
    { id: 1, title: 'Basic Settings', description: 'Name, platform & budget' },
    { id: 2, title: 'Platform Parameters', description: 'Targeting & placement' },
    { id: 3, title: 'Tracking & Creative', description: 'Pixel, UTMs & Assets' },
    { id: 4, title: 'Review', description: 'Review & Submit for Approval' }
];

export default function CampaignWizardClient() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [campaignId, setCampaignId] = useState<string | null>(null);

    // Form Data State
    const [formData, setFormData] = useState<CampaignFormState>({
        name: '',
        platform: 'FACEBOOK_ADS',
        objective: 'CONVERSIONS', // Initial value for new field
        budget: 0,
        startDate: '',
        endDate: '',
        description: '',
        parameters: {},
        trackingConfig: {}
    });

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveDraft = async () => {
        try {
            setIsSaving(true);
            const res = await saveCampaignDraft({ ...formData, campaignId: campaignId || undefined });
            if (res.success && res.id) {
                setCampaignId(res.id);
                toast.success("Draft saved successfully");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save draft");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitForApproval = async () => {
        try {
            setIsSaving(true);
            // First save
            const res = await saveCampaignDraft({ ...formData, campaignId: campaignId || undefined });
            if (res.success && res.id) {
                // Then submit
                await submitForApproval(res.id);
                toast.success("Campaign submitted for approval!");
                router.push('/dashboard/admin/marketing/approvals');
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit for approval");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar Stepper */}
            <Card className="col-span-1 border-none shadow-none bg-muted/30">
                <CardContent className="p-6">
                    <ul className="space-y-6">
                        {STEPS.map((step) => (
                            <li key={step.id} className="relative">
                                <div className="flex items-start group">
                                    <div className="flex items-center space-x-4">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 
                                            ${currentStep > step.id ? 'bg-primary border-primary text-primary-foreground' :
                                                currentStep === step.id ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}>
                                            {currentStep > step.id ? <CheckCircle2 className="h-6 w-6" /> : <span>{step.id}</span>}
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-semibold tracking-wide ${currentStep === step.id ? 'text-primary' : 'text-foreground'}`}>
                                                {step.title}
                                            </h4>
                                            <span className="text-sm text-muted-foreground">{step.description}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Wizard Content */}
            <Card className="col-span-1 md:col-span-3">
                <CardHeader>
                    <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                    <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[400px]">
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Campaign Name</Label>
                                <Input id="name" placeholder="e.g. Summer Retargeting 2026"
                                    value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Platform</Label>
                                    <Select value={formData.platform} onValueChange={(v) => handleChange('platform', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FACEBOOK_ADS">Meta (Facebook/Instagram)</SelectItem>
                                            <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                                            <SelectItem value="TIKTOK_ADS">TikTok Ads</SelectItem>
                                            <SelectItem value="LINKEDIN_ADS">LinkedIn Ads</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Daily Budget (USD)</Label>
                                    <Input type="number" value={formData.budget} onChange={(e) => handleChange('budget', parseFloat(e.target.value))} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input type="date" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date (Optional)</Label>
                                    <Input type="date" value={formData.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Campaign goals and notes..." />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <PlatformParametersForm
                                platform={formData.platform}
                                parameters={formData.parameters}
                                onChange={(params) => handleChange('parameters', params)}
                            />
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <TrackingConfigurator
                                platform={formData.platform}
                                trackingConfig={formData.trackingConfig}
                                onChange={(config) => handleChange('trackingConfig', config)}
                            />
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="rounded-lg border p-6 bg-muted/20">
                                <h3 className="text-lg font-semibold mb-4">Final Review</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Campaign Details</p>
                                        <ul className="mt-2 space-y-1 text-sm">
                                            <li><strong>Name:</strong> {formData.name || 'N/A'}</li>
                                            <li><strong>Platform:</strong> {formData.platform}</li>
                                            <li><strong>Budget:</strong> ${formData.budget}/day</li>
                                            <li><strong>Dates:</strong> {formData.startDate} - {formData.endDate || 'Ongoing'}</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Parameters (Preview)</p>
                                        <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-[150px]">
                                            {JSON.stringify(formData.parameters, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-muted-foreground">Tracking & Events</p>
                                    <ul className="mt-2 space-y-1 text-sm">
                                        <li><strong>Pixel/Source:</strong> {formData.trackingConfig.pixelId || 'Default'}</li>
                                        <li><strong>Conversion Event:</strong> {formData.trackingConfig.conversionEvent || 'N/A'}</li>
                                    </ul>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Submitting this campaign will move it to the approvals queue. A Senior Marketer or Admin must approve it before it is deployed to <strong>{formData.platform}</strong>.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex space-x-2">
                        <Button variant="secondary" onClick={handleSaveDraft} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" /> Save Draft
                        </Button>

                        {currentStep < 4 ? (
                            <Button onClick={handleNext}>
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmitForApproval} disabled={isSaving || !formData.name}>
                                <Send className="mr-2 h-4 w-4" /> Submit for Approval
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
