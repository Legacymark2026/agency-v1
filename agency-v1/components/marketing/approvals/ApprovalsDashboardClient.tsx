'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Rocket, Eye, Link } from 'lucide-react';
import { updateApprovalStatus, launchCampaign } from '@/actions/marketing/campaign-builder';

interface ApprovalsDashboardClientProps {
    defaultCampaigns: any[];
}

export default function ApprovalsDashboardClient({ defaultCampaigns }: ApprovalsDashboardClientProps) {
    const [campaigns, setCampaigns] = useState<any[]>(defaultCampaigns);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleAction = async (campaignId: string, actionType: 'APPROVED' | 'REJECTED' | 'LAUNCH') => {
        try {
            setIsProcessing(campaignId);

            if (actionType === 'LAUNCH') {
                await launchCampaign(campaignId);
                toast.success("Campaign launched successfully!");
                setCampaigns(prev => prev.filter(c => c.id !== campaignId));
            } else {
                await updateApprovalStatus(campaignId, actionType);
                if (actionType === 'REJECTED') {
                    toast.info("Campaign rejected. Sent back to draft.");
                    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
                } else if (actionType === 'APPROVED') {
                    toast.success("Campaign approved! Ready for launch.");
                    // Update local status so we can show 'Launch' button
                    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, approvalStatus: 'APPROVED' } : c));
                }
            }
        } catch (error: any) {
            toast.error(error.message || `Failed to ${actionType.toLowerCase()} campaign.`);
        } finally {
            setIsProcessing(null);
        }
    };

    if (!campaigns || campaigns.length === 0) {
        return (
            <Card className="mt-6 border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold">All Caught Up!</h3>
                    <p className="text-muted-foreground mt-2">There are no pending campaigns waiting for your approval right now.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {campaigns.map((campaign) => (
                <Card key={campaign.id} className={`transition-all ${campaign.approvalStatus === 'APPROVED' ? 'border-primary/50 bg-primary/5' : ''}`}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="text-xl">{campaign.name}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                                <span className="font-medium mr-2">{campaign.platform}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                                    {campaign.approvalStatus === 'APPROVED' ? 'Ready to Launch' : 'Pending Review'}
                                </span>
                            </CardDescription>
                        </div>
                        <div className="font-mono text-lg font-bold">
                            ${campaign.budget.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/day</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {campaign.description && (
                            <p className="text-sm text-foreground/80">{campaign.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm mt-4 p-4 border rounded-md bg-muted/20">
                            <div>
                                <p className="font-semibold text-muted-foreground mb-1">Duration</p>
                                <p>{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-muted-foreground mb-1">Configuration (JSON)</p>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="flex items-center"><Link className="h-3 w-3 mr-1" /> Parameters</Badge>
                                    <Badge variant="outline" className="flex items-center"><Link className="h-3 w-3 mr-1" /> Tracking</Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                        {campaign.approvalStatus === 'PENDING_APPROVAL' && (
                            <>
                                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={() => handleAction(campaign.id, 'REJECTED')}
                                    disabled={isProcessing === campaign.id}>
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleAction(campaign.id, 'APPROVED')}
                                    disabled={isProcessing === campaign.id}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Campaign
                                </Button>
                            </>
                        )}
                        {campaign.approvalStatus === 'APPROVED' && (
                            <Button className="w-full bg-primary"
                                onClick={() => handleAction(campaign.id, 'LAUNCH')}
                                disabled={isProcessing === campaign.id}>
                                <Rocket className="mr-2 h-4 w-4 animate-pulse" /> Launch to {campaign.platform}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
