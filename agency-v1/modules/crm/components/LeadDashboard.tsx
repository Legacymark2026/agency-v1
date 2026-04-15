"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { LeadSourceBadge, SourceStatsBar } from "./LeadSourceBadge"
import { getLeads, getLeadAnalyticsBySource, updateLeadStatus, convertLeadToDeal, type Lead } from "@/actions/leads"
import { formatDistanceToNow } from "date-fns"
import { Search, Filter, ArrowRight, Users, TrendingUp, Target, Zap } from "lucide-react"
import { toast } from "sonner"

interface LeadDashboardProps {
    companyId: string;
}

const STATUS_COLORS: Record<string, string> = {
    'NEW': 'bg-blue-100 text-blue-700',
    'CONTACTED': 'bg-amber-100 text-amber-700',
    'QUALIFIED': 'bg-green-100 text-green-700',
    'CONVERTED': 'bg-purple-100 text-purple-700',
    'LOST': 'bg-gray-100 text-gray-700',
};

export function LeadDashboard({ companyId }: LeadDashboardProps) {
    const [leads, setLeads] = useState<any[]>([]);
    const [sourceStats, setSourceStats] = useState<{ source: string; count: number; avgScore: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sourceFilter, setSourceFilter] = useState("ALL");

    // Fetch leads and analytics
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [leadsRes, analyticsRes] = await Promise.all([
                getLeads(companyId),
                getLeadAnalyticsBySource(companyId)
            ]);

            if (leadsRes.success) setLeads(leadsRes.data || []);
            if (analyticsRes.success) setSourceStats(analyticsRes.data || []);
            setLoading(false);
        }
        fetchData();
    }, [companyId]);

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = !searchQuery ||
            lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
        const matchesSource = sourceFilter === "ALL" || lead.source === sourceFilter;

        return matchesSearch && matchesStatus && matchesSource;
    });

    // Calculate metrics
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'NEW').length;
    const qualifiedLeads = leads.filter(l => l.status === 'QUALIFIED').length;
    const avgScore = leads.length > 0
        ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
        : 0;

    // Handle status change
    const handleStatusChange = async (leadId: string, newStatus: string) => {
        const res = await updateLeadStatus(leadId, newStatus);
        if (res.success) {
            setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            toast.success("Lead status updated");
        } else {
            toast.error("Failed to update status");
        }
    };

    // Handle convert to deal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConvert = async (lead: any) => {
        const res = await convertLeadToDeal(lead.id, {
            title: `${lead.company || lead.name || 'New Deal'} - ${lead.source}`,
            value: 5000, // Default value, should be customizable
        });
        if (res.success) {
            setLeads(leads.map(l => l.id === lead.id ? { ...l, status: 'CONVERTED' } : l));
            toast.success("Lead converted to deal!");
        } else {
            toast.error("Failed to convert lead");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Leads</p>
                            <p className="text-2xl font-bold">{totalLeads}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Zap className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">New Leads</p>
                            <p className="text-2xl font-bold">{newLeads}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Qualified</p>
                            <p className="text-2xl font-bold">{qualifiedLeads}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Avg. Score</p>
                            <p className="text-2xl font-bold">{avgScore}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Source Distribution */}
            {sourceStats.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Lead Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SourceStatsBar sources={sourceStats} />
                        <div className="flex flex-wrap gap-3 mt-3">
                            {sourceStats.map(s => (
                                <div key={s.source} className="flex items-center gap-2 text-sm">
                                    <LeadSourceBadge source={s.source} size="sm" />
                                    <span className="text-gray-500">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search leads..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Sources</SelectItem>
                        <SelectItem value="FACEBOOK">Facebook</SelectItem>
                        <SelectItem value="GOOGLE">Google</SelectItem>
                        <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                        <SelectItem value="REFERRAL">Referral</SelectItem>
                        <SelectItem value="DIRECT">Direct</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Leads Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                    Loading leads...
                                </TableCell>
                            </TableRow>
                        ) : filteredLeads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                    No leads found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLeads.map((lead) => (
                                <TableRow key={lead.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{lead.name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-500">{lead.email}</p>
                                            {lead.company && (
                                                <p className="text-xs text-gray-400">{lead.company}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <LeadSourceBadge source={lead.source} size="sm" />
                                        {lead.utmCampaign && (
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {lead.utmCampaign}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {lead.campaign ? (
                                            <Badge variant="outline" className="text-[10px]">
                                                {lead.campaign.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${lead.score >= 70 ? 'bg-green-100 text-green-700' :
                                            lead.score >= 40 ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {lead.score}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={lead.status}
                                            onValueChange={(val) => handleStatusChange(lead.id, val)}
                                        >
                                            <SelectTrigger className={`w-[120px] h-7 text-xs ${STATUS_COLORS[lead.status] || ''}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                                <SelectItem value="LOST">Lost</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                        {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs h-7 gap-1"
                                                onClick={() => handleConvert(lead)}
                                            >
                                                <ArrowRight className="w-3 h-3" />
                                                Convert
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
