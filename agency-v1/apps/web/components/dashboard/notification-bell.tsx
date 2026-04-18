"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, MailOpen, User, FileText, DollarSign, Megaphone, Palette } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notifications";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchAlerts = async () => {
        const { success, data, unreadCount } = await getNotifications();
        if (success) {
            setNotifications(data || []);
            setUnreadCount(unreadCount || 0);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // SWR-like polling every 60 seconds for ultra-realtime feel
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { }
    };

    const handleReadAll = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (e) { }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 text-slate-300 group-hover:text-teal-400 transition-colors" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] text-xs bg-teal-500 hover:bg-teal-400 border-none flex items-center justify-center animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 bg-slate-900 border-slate-800 p-0 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">Notificaciones</span>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="bg-slate-800 text-teal-400">
                                {unreadCount} nuevas
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleReadAll} className="h-8 text-xs text-slate-400 hover:text-teal-400 px-2 transition-colors">
                            <Check className="h-3.5 w-3.5 mr-1" /> Marcar todas leídas
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                            <MailOpen className="h-10 w-10 text-slate-700 mb-3" />
                            <p className="text-sm text-slate-400">Todo al día. No hay notificaciones.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 text-sm border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors relative group",
                                        !notif.isRead && "bg-teal-950/20"
                                    )}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {notif.type === "CRM" || notif.type === "LEAD" ? <User className="h-5 w-5 text-blue-400" /> :
                                         notif.type === "PAYROLL" ? <FileText className="h-5 w-5 text-purple-400" /> :
                                         notif.type === "TREASURY" || notif.type === "EXPENSE" ? <DollarSign className="h-5 w-5 text-emerald-400" /> :
                                         notif.type === "MARKETING" || notif.type === "CAMPAIGN" ? <Megaphone className="h-5 w-5 text-orange-400" /> :
                                         notif.type === "CREATIVE" ? <Palette className="h-5 w-5 text-pink-400" /> :
                                         <Bell className="h-5 w-5 text-slate-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className={cn("font-medium truncate", !notif.isRead ? "text-slate-200" : "text-slate-400")}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-slate-600 font-medium tracking-wider uppercase">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                            </span>
                                            {notif.link && (
                                                <Link href={notif.link} className="text-xs font-medium text-teal-500 hover:text-teal-400 transition-colors">
                                                    Ver detalles &rarr;
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    {!notif.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-teal-400 hover:bg-slate-800"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleMarkAsRead(notif.id);
                                            }}
                                            title="Marcar como leída"
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
