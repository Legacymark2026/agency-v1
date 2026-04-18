'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface PlatformParametersFormProps {
    platform: string;
    parameters: any;
    onChange: (params: any) => void;
}

export default function PlatformParametersForm({ platform, parameters, onChange }: PlatformParametersFormProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...parameters, [key]: value });
    };

    if (platform === 'FACEBOOK_ADS') {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Campaign Objective</Label>
                        <Select value={parameters.objective || ''} onValueChange={(v) => handleChange('objective', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Objective" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OUTCOME_LEADS">Leads</SelectItem>
                                <SelectItem value="OUTCOME_SALES">Sales</SelectItem>
                                <SelectItem value="OUTCOME_ENGAGEMENT">Engagement</SelectItem>
                                <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                                <SelectItem value="OUTCOME_AWARENESS">Awareness</SelectItem>
                                <SelectItem value="OUTCOME_APP_PROMOTION">App Promotion</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Budget Type</Label>
                        <Select value={parameters.budgetType || 'DAILY'} onValueChange={(v) => handleChange('budgetType', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Budget Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DAILY">Daily Budget</SelectItem>
                                <SelectItem value="LIFETIME">Lifetime Budget</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Bid Strategy</Label>
                        <Select value={parameters.bidStrategy || 'LOWEST_COST_WITHOUT_CAP'} onValueChange={(v) => handleChange('bidStrategy', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Strategy" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOWEST_COST_WITHOUT_CAP">Highest Volume (Lowest Cost)</SelectItem>
                                <SelectItem value="COST_CAP">Cost Per Result Goal (Cost Cap)</SelectItem>
                                <SelectItem value="ROAS_CAP">ROAS Goal (Minimum ROAS)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(parameters.bidStrategy === 'COST_CAP' || parameters.bidStrategy === 'ROAS_CAP') && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <Label>{parameters.bidStrategy === 'COST_CAP' ? 'Cost Cap Amount ($)' : 'Minimum ROAS'}</Label>
                            <Input type="number" value={parameters.bidAmount || ''} onChange={(e) => handleChange('bidAmount', parseFloat(e.target.value))} />
                        </div>
                    )}
                </div>

                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Advantage+ Audience & Targeting</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Included Locations</Label>
                            <Input placeholder="e.g. US, UK, Canada" value={parameters.locations || ''} onChange={(e) => handleChange('locations', e.target.value)} />
                        </div>
                        <div className="space-y-2 flex gap-2">
                            <div className="w-1/2">
                                <Label>Min Age</Label>
                                <Input type="number" placeholder="18" value={parameters.minAge || ''} onChange={(e) => handleChange('minAge', e.target.value)} />
                            </div>
                            <div className="w-1/2">
                                <Label>Max Age</Label>
                                <Input type="number" placeholder="65" value={parameters.maxAge || ''} onChange={(e) => handleChange('maxAge', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Included Custom Audiences (IDs comma separated)</Label>
                        <Input placeholder="12345678, 23456789" value={parameters.customAudiences || ''} onChange={(e) => handleChange('customAudiences', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Excluded Custom Audiences (IDs comma separated)</Label>
                        <Input placeholder="Exclude current customers..." value={parameters.excludedAudiences || ''} onChange={(e) => handleChange('excludedAudiences', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Detailed Targeting (Interests, Behaviors)</Label>
                        <Input placeholder="e.g. Marketing, SaaS, Business Owners" value={parameters.interests || ''} onChange={(e) => handleChange('interests', e.target.value)} />
                    </div>
                </div>

                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Placements & Delivery</h4>

                    <div className="flex items-center space-x-2">
                        <Switch id="advantage_plus" checked={parameters.advantagePlus || false} onCheckedChange={(v) => handleChange('advantagePlus', v)} />
                        <Label htmlFor="advantage_plus" className="flex-1 cursor-pointer">
                            <span className="font-semibold block">Advantage+ Placements</span>
                            <span className="text-muted-foreground font-normal">Use Meta's AI to maximize your budget automatically. If off, uses manual placements.</span>
                        </Label>
                    </div>

                    {!parameters.advantagePlus && (
                        <div className="space-y-2 pl-12 animate-in slide-in-from-top-2">
                            <Label>Manual Placements</Label>
                            <Select value={parameters.manualPlacements || 'ALL'} onValueChange={(v) => handleChange('manualPlacements', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Placements" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Facebook, Instagram, Audience Network, Messenger</SelectItem>
                                    <SelectItem value="FB_IG">Facebook & Instagram Feeds Only</SelectItem>
                                    <SelectItem value="IG_ONLY">Instagram Only (Feed & Stories)</SelectItem>
                                    <SelectItem value="STORIES_REELS">Stories & Reels Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

            </div>
        );
    }

    if (platform === 'TIKTOK_ADS') {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Advertising Objective</Label>
                        <Select value={parameters.objective || ''} onValueChange={(v) => handleChange('objective', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Objective" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LEAD_GENERATION">Lead Generation</SelectItem>
                                <SelectItem value="WEB_CONVERSIONS">Web Conversions</SelectItem>
                                <SelectItem value="TRAFFIC">Traffic</SelectItem>
                                <SelectItem value="VIDEO_VIEWS">Video Views</SelectItem>
                                <SelectItem value="APP_INSTALLS">App Installs</SelectItem>
                                <SelectItem value="CATALOG_SALES">Catalog Sales</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Optimization Goal</Label>
                        <Select value={parameters.optimizationGoal || 'CONVERSION'} onValueChange={(v) => handleChange('optimizationGoal', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Goal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CONVERSION">Conversion</SelectItem>
                                <SelectItem value="CLICK">Click</SelectItem>
                                <SelectItem value="REACH">Reach</SelectItem>
                                <SelectItem value="VIDEO_VIEW_6_S">6-Second Video View</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Demographics & Targeting</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Location IDs (Comma separated)</Label>
                            <Input placeholder="e.g. 1234, 5678" value={parameters.location_ids || ''} onChange={(e) => handleChange('location_ids', e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Languages (Codes comma separated)</Label>
                            <Input placeholder="en, es" value={parameters.languages || ''} onChange={(e) => handleChange('languages', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 flex gap-2">
                            <div className="w-1/2">
                                <Label>Age Groups</Label>
                                <Select value={parameters.ageGroups || 'ALL'} onValueChange={(v) => handleChange('ageGroups', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Ages" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">No Limit</SelectItem>
                                        <SelectItem value="13_17">13-17</SelectItem>
                                        <SelectItem value="18_24">18-24</SelectItem>
                                        <SelectItem value="25_34">25-34</SelectItem>
                                        <SelectItem value="35_PLUS">35+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-1/2">
                                <Label>Gender</Label>
                                <Select value={parameters.gender || 'ALL'} onValueChange={(v) => handleChange('gender', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Operating System</Label>
                            <Select value={parameters.os || 'ALL'} onValueChange={(v) => handleChange('os', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Systems</SelectItem>
                                    <SelectItem value="IOS">iOS Only</SelectItem>
                                    <SelectItem value="ANDROID">Android Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Behavioral Targeting (Categories)</Label>
                        <Input placeholder="e.g. Entertainment, Tech & Electronics" value={parameters.behavioralCategories || ''} onChange={(e) => handleChange('behavioralCategories', e.target.value)} />
                    </div>
                </div>

                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Placements & Identity</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Placements</Label>
                            <Select value={parameters.placements || 'AUTOMATIC'} onValueChange={(v) => handleChange('placements', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Automatic" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AUTOMATIC">Automatic Placements</SelectItem>
                                    <SelectItem value="TIKTOK_ONLY">TikTok app only</SelectItem>
                                    <SelectItem value="PANGLE">Pangle (Audience Network)</SelectItem>
                                    <SelectItem value="GLOBAL_APP_BUNDLE">Global App Bundle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Ad Format Identity</Label>
                            <Select value={parameters.adFormatType || 'STANDARD'} onValueChange={(v) => handleChange('adFormatType', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STANDARD">Standard Video Ad</SelectItem>
                                    <SelectItem value="SPARK_AD">Spark Ad (Organic Post Boost)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {parameters.adFormatType === 'SPARK_AD' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <Label>TikTok Post Authorization Code</Label>
                            <Input placeholder="Enter auth code from creator..." value={parameters.sparkAdAuthCode || ''} onChange={(e) => handleChange('sparkAdAuthCode', e.target.value)} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (platform === 'GOOGLE_ADS') {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Campaign Type</Label>
                        <Select value={parameters.campaignType || 'SEARCH'} onValueChange={(v) => handleChange('campaignType', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SEARCH">Search Network</SelectItem>
                                <SelectItem value="DISPLAY">Display Network</SelectItem>
                                <SelectItem value="VIDEO">Video (YouTube)</SelectItem>
                                <SelectItem value="SHOPPING">Shopping</SelectItem>
                                <SelectItem value="PERFORMANCE_MAX">Performance Max</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Bidding Strategy</Label>
                        <Select value={parameters.strategy || 'MAXIMIZE_CONVERSIONS'} onValueChange={(v) => handleChange('strategy', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Strategy" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MAXIMIZE_CONVERSIONS">Maximize Conversions</SelectItem>
                                <SelectItem value="TARGET_CPA">Target CPA</SelectItem>
                                <SelectItem value="TARGET_ROAS">Target ROAS</SelectItem>
                                <SelectItem value="MAXIMIZE_CLICKS">Maximize Clicks</SelectItem>
                                <SelectItem value="MANUAL_CPC">Manual CPC</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {['TARGET_CPA', 'TARGET_ROAS', 'MANUAL_CPC'].includes(parameters.strategy) && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <Label>{
                                parameters.strategy === 'TARGET_CPA' ? 'Target CPA ($)' :
                                    parameters.strategy === 'TARGET_ROAS' ? 'Target ROAS (%)' : 'Default Max CPC ($)'
                            }</Label>
                            <Input type="number" value={parameters.targetValue || ''} onChange={(e) => handleChange('targetValue', parseFloat(e.target.value))} />
                        </div>
                    </div>
                )}

                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Networks & Locations</h4>

                    {parameters.campaignType === 'SEARCH' && (
                        <div className="flex items-center space-x-2">
                            <Switch id="search_partners" checked={parameters.searchPartners ?? true} onCheckedChange={(v) => handleChange('searchPartners', v)} />
                            <Label htmlFor="search_partners" className="flex-1 cursor-pointer">
                                Include Google search partners
                            </Label>
                        </div>
                    )}

                    {parameters.campaignType === 'SEARCH' && (
                        <div className="flex items-center space-x-2">
                            <Switch id="display_network" checked={parameters.displayNetwork ?? false} onCheckedChange={(v) => handleChange('displayNetwork', v)} />
                            <Label htmlFor="display_network" className="flex-1 cursor-pointer">
                                Include Google Display Network
                            </Label>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                            <Label>Target Locations</Label>
                            <Input placeholder="e.g. New York, United States" value={parameters.locations || ''} onChange={(e) => handleChange('locations', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Excluded Locations</Label>
                            <Input placeholder="e.g. California" value={parameters.excludedLocations || ''} onChange={(e) => handleChange('excludedLocations', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Keywords & Audiences</h4>

                    <div className="space-y-2">
                        <Label>Keywords (One per line, use "phrase", [exact])</Label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={"broad match\n\"phrase match\"\n[exact match]"}
                            value={parameters.keywords || ''}
                            onChange={(e) => handleChange('keywords', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Negative Keywords</Label>
                        <Input placeholder="e.g. free, cheap" value={parameters.negativeKeywords || ''} onChange={(e) => handleChange('negativeKeywords', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Audience Segments (IDs comma separated)</Label>
                        <Input placeholder="Affinity or In-Market Audience IDs" value={parameters.audienceSegments || ''} onChange={(e) => handleChange('audienceSegments', e.target.value)} />
                    </div>
                </div>
            </div>
        );
    }

    if (platform === 'LINKEDIN_ADS') {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Objective</Label>
                        <Select value={parameters.objective || 'LEAD_GENERATION'} onValueChange={(v) => handleChange('objective', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Objective" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LEAD_GENERATION">Lead Generation</SelectItem>
                                <SelectItem value="WEBSITE_CONVERSIONS">Website Conversions</SelectItem>
                                <SelectItem value="WEBSITE_VISITS">Website Visits</SelectItem>
                                <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                                <SelectItem value="BRAND_AWARENESS">Brand Awareness</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Ad Format</Label>
                        <Select value={parameters.adFormat || ''} onValueChange={(v) => handleChange('adFormat', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SINGLE_IMAGE">Single Image Ad</SelectItem>
                                <SelectItem value="CAROUSEL">Carousel Image Ad</SelectItem>
                                <SelectItem value="VIDEO">Video Ad</SelectItem>
                                <SelectItem value="MESSAGE_AD">Message Ad</SelectItem>
                                <SelectItem value="CONVERSATION_AD">Conversation Ad</SelectItem>
                                <SelectItem value="DOCUMENT_AD">Document Ad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Bidding Strategy</Label>
                        <Select value={parameters.biddingStrategy || 'MAXIMUM_DELIVERY'} onValueChange={(v) => handleChange('biddingStrategy', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Strategy" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MAXIMUM_DELIVERY">Maximum Delivery (Automated)</SelectItem>
                                <SelectItem value="TARGET_COST">Target Cost</SelectItem>
                                <SelectItem value="MANUAL">Manual Bidding</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {['TARGET_COST', 'MANUAL'].includes(parameters.biddingStrategy) && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <Label>Bid Amount ($)</Label>
                            <Input type="number" value={parameters.bidAmount || ''} onChange={(e) => handleChange('bidAmount', parseFloat(e.target.value))} />
                        </div>
                    )}
                </div>

                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Professional Audience Targeting</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Locations</Label>
                            <Input placeholder="e.g. North America, EMEA" value={parameters.locations || ''} onChange={(e) => handleChange('locations', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Profile Language</Label>
                            <Select value={parameters.profileLanguage || 'EN'} onValueChange={(v) => handleChange('profileLanguage', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="English" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EN">English</SelectItem>
                                    <SelectItem value="ES">Spanish</SelectItem>
                                    <SelectItem value="FR">French</SelectItem>
                                    <SelectItem value="DE">German</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <Label>Job Titles</Label>
                        <Input placeholder="e.g. CEO, Marketing Director, Software Engineer" value={parameters.jobTitles || ''} onChange={(e) => handleChange('jobTitles', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company Sizes</Label>
                            <Select value={parameters.companySize || ''} onValueChange={(v) => handleChange('companySize', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1_10">1-10 Employees</SelectItem>
                                    <SelectItem value="11_50">11-50 Employees</SelectItem>
                                    <SelectItem value="51_200">51-200 Employees</SelectItem>
                                    <SelectItem value="201_500">201-500 Employees</SelectItem>
                                    <SelectItem value="501_1000">501-1000 Employees</SelectItem>
                                    <SelectItem value="1000_PLUS">1000+ Employees</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Seniority Levels</Label>
                            <Select value={parameters.seniority || ''} onValueChange={(v) => handleChange('seniority', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CXO">CXO</SelectItem>
                                    <SelectItem value="VP">VP</SelectItem>
                                    <SelectItem value="DIRECTOR">Director</SelectItem>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="SENIOR">Senior</SelectItem>
                                    <SelectItem value="ENTRY">Entry</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <Label>Member Skills (Comma separated)</Label>
                        <Input placeholder="e.g. React.js, B2B Marketing, Strategic Planning" value={parameters.skills || ''} onChange={(e) => handleChange('skills', e.target.value)} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 text-center border border-dashed rounded-lg bg-muted/10">
            <p className="text-muted-foreground mb-2">Please select a valid platform to configure targeting parameters.</p>
        </div>
    );
}
