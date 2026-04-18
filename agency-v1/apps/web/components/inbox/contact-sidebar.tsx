'use client';

import {
    User, Mail, Phone, MapPin, Tag, Calendar,
    Facebook, Linkedin, Instagram, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function ContactSidebar({ conversation }: { conversation: any }) {
    if (!conversation?.lead) return null;

    const lead = conversation.lead;

    return (
        <div className="h-full flex flex-col overflow-y-auto">
            {/* Header / Profile */}
            <div className="p-6 text-center border-b border-gray-100">
                <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold mb-3">
                    {lead.name?.substring(0, 2).toUpperCase() || 'UN'}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{lead.name || 'Unknown'}</h3>
                <p className="text-sm text-gray-500">{lead.jobTitle || 'Lead'}</p>

                <div className="flex justify-center gap-2 mt-4">
                    <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0">
                        <Mail size={14} />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0">
                        <Phone size={14} />
                    </Button>
                    <Link href={`/dashboard/crm/${lead.id}`}>
                        <Button size="sm" variant="outline" className="rounded-full text-xs">
                            View CRM
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Info Sections */}
            <div className="p-6 space-y-6">

                {/* Contact Info */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Details</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail size={16} className="text-gray-400" />
                            <span className="text-gray-700 truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-gray-700">{lead.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="text-gray-700">{lead.city || 'Location unknown'}</span>
                        </div>
                    </div>
                </div>

                {/* Score */}
                <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Lead Score</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">High</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <div className="mt-2 text-right text-xs text-gray-500 font-medium">85/100</div>
                </div>

                {/* Tags */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {['Interested', 'VIP', 'Q1-Promo'].map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                {tag}
                            </span>
                        ))}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full bg-gray-100 hover:bg-gray-200">
                            +
                        </Button>
                    </div>
                </div>

                {/* Past Activity */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h4>
                    <div className="space-y-4 relative pl-4 border-l border-gray-200">
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div>
                            <p className="text-sm font-medium text-gray-900">Visited Pricing Page</p>
                            <span className="text-xs text-gray-500">2 hours ago</span>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-white"></div>
                            <p className="text-sm font-medium text-gray-900">Opened Email Campaign</p>
                            <span className="text-xs text-gray-500">Yesterday</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
