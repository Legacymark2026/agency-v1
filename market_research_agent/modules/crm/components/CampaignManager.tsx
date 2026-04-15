"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, type Campaign } from "@/actions/leads"
import { formatDistanceToNow } from "date-fns"
import { Plus, Edit, Trash2, Target, DollarSign, Users, TrendingUp, Pause, Play } from "lucide-react"
import { toast } from "sonner"

interface CampaignManagerProps {
    companyId: string;
}

const PLATFORMS = [
    { value: 'FACEBOOK', label: 'Facebook', icon: '📘' },
    { value: 'GOOGLE', label: 'Google Ads', icon: '🔍' },
    { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
    { value: 'INSTAGRAM', label: 'Instagram', icon: '📷' },
    { value: 'TIKTOK', label: 'TikTok', icon: '🎵' },
    { value: 'EMAIL', label: 'Email', icon: '📧' },
    { value: 'YOUTUBE', label: 'YouTube', icon: '▶️' },
    { value: 'OTHER', label: 'Other', icon: '🌐' },
];

const STATUS_COLORS: Record<string, string> = {
    'ACTIVE': 'bg-green-100 text-green-700',
    'PAUSED': 'bg-amber-100 text-amber-700',
    'COMPLETED': 'bg-gray-100 text-gray-600',
};

export function CampaignManager({ companyId }: CampaignManagerProps) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        platform: 'FACEBOOK',
        budget: '',
        description: '',
    });

    // Fetch campaigns
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const res = await getCampaigns(companyId);
            if (res.success) setCampaigns(res.data || []);
            setLoading(false);
        }
        fetchData();
    }, [companyId]);

    // Reset form
    const resetForm = () => {
        setFormData({ name: '', code: '', platform: 'FACEBOOK', budget: '', description: '' });
        setEditingCampaign(null);
    };

    // Open dialog for new campaign
    const handleNewCampaign = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    // Open dialog for edit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (campaign: any) => {
        setEditingCampaign(campaign);
        setFormData({
            name: campaign.name,
            code: campaign.code,
            platform: campaign.platform,
            budget: campaign.budget?.toString() || '',
            description: campaign.description || '',
        });
        setIsDialogOpen(true);
    };

    // Submit form
    const handleSubmit = async () => {
        if (!formData.name || !formData.code) {
            toast.error("Name and code are required");
            return;
        }

        if (editingCampaign) {
            // Update
            const res = await updateCampaign(editingCampaign.id, {
                name: formData.name,
                code: formData.code.toUpperCase(),
                platform: formData.platform,
                budget: formData.budget ? parseFloat(formData.budget) : null,
            });
            if (res.success) {
                setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? res.data : c));
                toast.success("Campaign updated");
            }
        } else {
            // Create
            const res = await createCampaign({
                name: formData.name,
                code: formData.code.toUpperCase(),
                platform: formData.platform,
                budget: formData.budget ? parseFloat(formData.budget) : undefined,
                companyId,
            });
            if (res.success) {
                setCampaigns([res.data, ...campaigns]);
                toast.success("Campaign created");
            }
        }

        setIsDialogOpen(false);
        resetForm();
    };

    // Toggle status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleToggleStatus = async (campaign: any) => {
        const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        const res = await updateCampaign(campaign.id, { status: newStatus });
        if (res.success) {
            setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c));
            toast.success(`Campaign ${newStatus.toLowerCase()}`);
        }
    };

    // Delete
    const handleDelete = async (campaignId: string) => {
        if (!confirm("Delete this campaign?")) return;
        const res = await deleteCampaign(campaignId);
        if (res.success) {
            setCampaigns(campaigns.filter(c => c.id !== campaignId));
            toast.success("Campaign deleted");
        }
    };

    // Calculate totals
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + (c._count?.leads || 0), 0);
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Campaigns</h2>
                    <p className="text-gray-500">Manage your marketing campaigns and track lead attribution</p>
                </div>
                <Button onClick={handleNewCampaign} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Campaign
                </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-2xl font-bold">{activeCampaigns}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Budget</p>
                            <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Leads</p>
                            <p className="text-2xl font-bold">{totalLeads}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Spend</p>
                            <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Campaign Grid */}
            <div className="grid grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 text-center py-12 text-gray-400">Loading campaigns...</div>
                ) : campaigns.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No campaigns yet. Create your first campaign!</p>
                    </div>
                ) : (
                    campaigns.map((campaign) => {
                        const platform = PLATFORMS.find(p => p.value === campaign.platform);
                        const cpl = campaign._count?.leads > 0 && campaign.spend > 0
                            ? (campaign.spend / campaign._count.leads).toFixed(2)
                            : null;

                        return (
                            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{platform?.icon || '🌐'}</span>
                                            <div>
                                                <h3 className="font-semibold">{campaign.name}</h3>
                                                <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {campaign.code}
                                                </code>
                                            </div>
                                        </div>
                                        <Badge className={STATUS_COLORS[campaign.status]}>
                                            {campaign.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                                        <div className="bg-gray-50 p-2 rounded text-center">
                                            <p className="text-gray-500 text-xs">Leads</p>
                                            <p className="font-bold">{campaign._count?.leads || 0}</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded text-center">
                                            <p className="text-gray-500 text-xs">Budget</p>
                                            <p className="font-bold">${campaign.budget?.toLocaleString() || 0}</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded text-center">
                                            <p className="text-gray-500 text-xs">CPL</p>
                                            <p className="font-bold">{cpl ? `$${cpl}` : '—'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <span className="text-xs text-gray-400">
                                            Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                                        </span>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggleStatus(campaign)}
                                                title={campaign.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                                            >
                                                {campaign.status === 'ACTIVE' ? (
                                                    <Pause className="w-4 h-4" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(campaign)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(campaign.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Campaign Name</label>
                            <Input
                                placeholder="Summer Sale 2024"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Campaign Code (for UTM)</label>
                            <Input
                                placeholder="SUMMER-SALE-24"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use this code in your utm_campaign parameter
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Platform</label>
                            <Select
                                value={formData.platform}
                                onValueChange={(val) => setFormData({ ...formData, platform: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PLATFORMS.map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                            <span className="flex items-center gap-2">
                                                <span>{p.icon}</span>
                                                <span>{p.label}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Budget (optional)</label>
                            <Input
                                type="number"
                                placeholder="5000"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingCampaign ? 'Update' : 'Create'} Campaign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
