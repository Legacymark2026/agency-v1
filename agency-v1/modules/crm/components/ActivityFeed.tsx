"use client"

// import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// removed unused import
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Plus, Edit, Trash2, Trophy, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
    id: string
    type: 'MOVE' | 'CREATE' | 'UPDATE' | 'DELETE' | 'WIN' | 'LOSE'
    dealTitle: string
    fromStage?: string
    toStage?: string
    timestamp: Date
    user?: string
}

// Phase 15: Activity Feed Component
export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'MOVE': return <ArrowRight className="w-3 h-3" />
            case 'CREATE': return <Plus className="w-3 h-3" />
            case 'UPDATE': return <Edit className="w-3 h-3" />
            case 'DELETE': return <Trash2 className="w-3 h-3" />
            case 'WIN': return <Trophy className="w-3 h-3 text-yellow-500" />
            case 'LOSE': return <X className="w-3 h-3" />
        }
    }

    const getActivityColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'MOVE': return 'bg-blue-100 text-blue-700'
            case 'CREATE': return 'bg-green-100 text-green-700'
            case 'UPDATE': return 'bg-amber-100 text-amber-700'
            case 'DELETE': return 'bg-red-100 text-red-700'
            case 'WIN': return 'bg-yellow-100 text-yellow-700'
            case 'LOSE': return 'bg-gray-100 text-gray-700'
        }
    }

    const getActivityText = (activity: ActivityItem) => {
        switch (activity.type) {
            case 'MOVE':
                return `moved "${activity.dealTitle}" from ${activity.fromStage} to ${activity.toStage}`
            case 'CREATE':
                return `created "${activity.dealTitle}"`
            case 'UPDATE':
                return `updated "${activity.dealTitle}"`
            case 'DELETE':
                return `deleted "${activity.dealTitle}"`
            case 'WIN':
                return `🎉 Won "${activity.dealTitle}"!`
            case 'LOSE':
                return `Lost "${activity.dealTitle}"`
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    📋 Recent Activity
                    <Badge variant="outline" className="text-[10px]">{activities.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="h-[200px] px-4 overflow-y-auto">
                    <div className="space-y-2 py-2">
                        {activities.length === 0 ? (
                            <div className="text-center text-sm text-gray-400 py-4">
                                No recent activity
                            </div>
                        ) : (
                            activities.slice(0, 10).map((activity) => (
                                <div key={activity.id} className="flex items-start gap-2 text-xs">
                                    <div className={`p-1 rounded ${getActivityColor(activity.type)}`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-700 truncate">
                                            {getActivityText(activity)}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Phase 15: Deal Templates
export const DEAL_TEMPLATES = [
    {
        id: 'enterprise',
        name: 'Enterprise Deal',
        icon: '🏢',
        defaults: {
            value: 50000,
            priority: 'HIGH',
            probability: 30,
            source: 'Outbound'
        }
    },
    {
        id: 'smb',
        name: 'SMB Deal',
        icon: '🏪',
        defaults: {
            value: 5000,
            priority: 'MEDIUM',
            probability: 50,
            source: 'Inbound'
        }
    },
    {
        id: 'referral',
        name: 'Referral',
        icon: '🤝',
        defaults: {
            value: 15000,
            priority: 'HIGH',
            probability: 70,
            source: 'Referral'
        }
    },
    {
        id: 'upsell',
        name: 'Upsell',
        icon: '⬆️',
        defaults: {
            value: 10000,
            priority: 'MEDIUM',
            probability: 60,
            source: 'Existing Client'
        }
    }
]

export function TemplateSelector({ onSelect }: { onSelect: (template: typeof DEAL_TEMPLATES[0]) => void }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {DEAL_TEMPLATES.map((template) => (
                <button
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                    <span className="text-xl">{template.icon}</span>
                    <div>
                        <p className="text-sm font-medium">{template.name}</p>
                        <p className="text-[10px] text-gray-500">${template.defaults.value.toLocaleString()}</p>
                    </div>
                </button>
            ))}
        </div>
    )
}
