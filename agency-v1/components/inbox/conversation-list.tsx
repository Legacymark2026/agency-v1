'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Search, Filter, SlidersHorizontal, Plus, X, Send, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChannelIcon } from './channel-icon';
import { Badge } from '@/components/ui/badge';
import { ChannelType } from '@/types/inbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Users, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { syncMetaConversations } from '@/actions/inbox';

// Mock types for props - replace with actual types later
interface Conversation {
    id: string;
    channel: ChannelType;
    status: string;
    unreadCount: number;
    lastMessageAt: Date;
    lastMessagePreview: string;
    lead: {
        id: string;
        name: string;
        image?: string;
    } | null;
    assignedTo?: string | null;
    tags?: any;
    sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT' | null;
    topic?: string | null;
}

export function ConversationList({ conversations, currentUser }: { conversations: Conversation[], currentUser?: any }) {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const folderParam = searchParams.get('folder');
    const tagParam = searchParams.get('tag');
    const activeId = params?.conversationId;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // all, mine, unassigned
    const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const mockUserId = currentUser?.id; // Real user ID
    const [activeChannel, setActiveChannel] = useState<ChannelType | 'ALL'>('ALL'); // Channel Filter

    // Interactive Modal States
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        toast.info("Sincronizando mensajes de Meta...");
        const res = await syncMetaConversations();
        if (res.success) {
            toast.success(`Sincronización completa: ${(res as any).messagesSynced} mensajes nuevos.`);
            router.refresh();
        } else {
            toast.error("Error al sincronizar: " + ((res as any).error || "Revisa la conexión de Meta."));
        }
        setIsSyncing(false);
    };

    // Real-time Polling & Time Update (Phase 1 Improvement)
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
            setCurrentTime(new Date());
        }, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [router]);

    // Filter logic
    const filteredConversations = conversations.filter(convo => {
        const matchesSearch = convo.lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            convo.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ? true : convo.status === statusFilter;

        let matchesTab = true;
        if (activeTab === 'mine') matchesTab = convo.assignedTo === mockUserId;
        if (activeTab === 'unassigned') matchesTab = !convo.assignedTo;

        const matchesChannel = activeChannel === 'ALL' ? true : convo.channel === activeChannel;

        let matchesFolder = true;
        if (folderParam === 'unassigned') matchesFolder = !convo.assignedTo;
        if (folderParam === 'mine') matchesFolder = convo.assignedTo === mockUserId;
        if (folderParam === 'pending') matchesFolder = convo.status === 'OPEN';
        if (folderParam === 'resolved') matchesFolder = convo.status === 'CLOSED';

        let matchesTag = true;
        if (tagParam) matchesTag = (convo.tags as string[])?.includes(tagParam);

        return matchesSearch && matchesStatus && matchesTab && matchesChannel && matchesFolder && matchesTag;
    });

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col h-full bg-transparent w-full">
            {/* Header / Search */}
            <div className="p-3.5 pb-2.5 border-b border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                    <h2 className="font-extrabold text-base text-slate-200 font-mono m-0">Inbox</h2>
                    <div className="flex items-center gap-1">
                        <button
                            className={cn(
                                "bg-slate-800/60 border border-slate-800/90 rounded-md p-1.5 flex transition-colors",
                                isSyncing ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
                            )}
                            onClick={handleSync}
                            disabled={isSyncing}
                            title="Sincronizar Meta"
                        >
                            <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
                        </button>
                        <button
                            className="bg-slate-800/60 border border-slate-800/90 rounded-md p-1.5 flex text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => setShowNewMessageModal(true)}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                <div className="relative pointer-events-auto">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 w-3.5 h-3.5 pointer-events-none" />
                    <input
                        placeholder="Search messages..."
                        className="w-full bg-slate-900/80 border border-slate-800/90 rounded-lg py-1.5 pr-2.5 pl-8 text-xs text-slate-300 outline-none focus:border-slate-700 transition-colors placeholder:text-slate-600"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Channel Filters (Mini Icons) */}
                <div className="flex gap-1.5 justify-start overflow-x-auto pb-0.5">
                    <button
                        onClick={() => setActiveChannel('ALL')}
                        className={cn(
                            "h-[26px] px-2.5 rounded-full text-[10px] font-extrabold cursor-pointer font-mono whitespace-nowrap transition-colors border",
                            activeChannel === 'ALL' 
                                ? "border-teal-600/40 bg-teal-600/15 text-teal-400" 
                                : "border-slate-800/90 bg-slate-900/80 text-slate-500 hover:text-slate-300"
                        )}
                    >
                        All
                    </button>
                    {(['WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN'] as ChannelType[]).map(ch => (
                        <button
                            key={ch}
                            onClick={() => setActiveChannel(ch)}
                            className={cn(
                                "h-[26px] w-[26px] rounded-full flex items-center justify-center cursor-pointer transition-colors border",
                                activeChannel === ch
                                    ? "border-teal-600/40 bg-teal-600/15"
                                    : "border-slate-800/90 bg-slate-900/80 opacity-60 hover:opacity-100"
                            )}
                            title={ch}
                        >
                            <ChannelIcon channel={ch} className="text-sm" />
                        </button>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-9 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80">
                        <TabsTrigger value="all" className="text-xs data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400 text-slate-400 font-medium">Todos</TabsTrigger>
                        <TabsTrigger value="mine" className="text-xs data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400 text-slate-400 font-medium">Míos</TabsTrigger>
                        <TabsTrigger value="unassigned" className="text-xs data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400 text-slate-400 font-medium">Sin Asignar</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Status Tabs (Mini) */}
                <div className="flex gap-1">
                    {['OPEN', 'CLOSED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={cn(
                                "text-[10px] font-extrabold py-1 px-2.5 rounded-md cursor-pointer font-mono transition-all border",
                                statusFilter === status
                                    ? "border-teal-600/40 bg-teal-600/15 text-teal-400"
                                    : "border-slate-800/90 bg-slate-900/80 text-slate-600 hover:text-slate-400"
                            )}
                        >
                            {status === 'OPEN' ? 'ABIERTOS' : 'CERRADOS'}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button
                        onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]); }}
                        className={cn(
                            "text-[10px] font-extrabold py-1 px-2 rounded-md cursor-pointer font-mono border",
                            selectionMode
                                ? "bg-teal-600/15 border-transparent text-teal-400"
                                : "bg-transparent border-transparent text-slate-600 hover:text-slate-400 hover:bg-slate-800/40"
                        )}
                    >
                        {selectionMode ? 'Cancelar' : 'Select'}
                    </button>
                </div>

                {/* Bulk Actions Bar */}
                {selectionMode && selectedIds.length > 0 && (
                    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-2 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-teal-400 font-mono">{selectedIds.length} seleccionados</span>
                    </div>
                )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredConversations.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "160px", padding: "32px", textAlign: "center" }}>
                        <Filter size={28} style={{ marginBottom: "10px", opacity: 0.2, color: "#475569" }} />
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "#334155", fontFamily: "monospace", margin: 0 }}>No results found</p>
                        <p style={{ fontSize: "11px", color: "#1e293b", marginTop: "4px", fontFamily: "monospace" }}>Try adjusting filters or search</p>
                    </div>
                ) : (
                    <div>
                        {filteredConversations.map((convo) => {
                            const isActive = activeId === convo.id;
                            
                            // Safe date parsing to avoid client-side crashes
                            const lastMsgDate = convo.lastMessageAt ? new Date(convo.lastMessageAt) : new Date();
                            const isValidDate = !isNaN(lastMsgDate.getTime());
                            
                            // SLA Logic: Over 15 mins, open, has unread? Let's just say if unread and > 15 mins
                            const isSlaBreached = convo.unreadCount > 0 && isValidDate &&
                                (currentTime.getTime() - lastMsgDate.getTime()) > 15 * 60 * 1000;

                            const getSentimentColor = (s: string | null | undefined) => {
                                if (s === 'URGENT' || s === 'NEGATIVE') return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
                                if (s === 'POSITIVE') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                                return 'text-slate-400 bg-slate-400/10 border-slate-400/20'; // NEUTRAL
                            };

                            return (
                                <Link
                                    key={convo.id}
                                    href={`/dashboard/inbox/${convo.id}`}
                                    style={{ display: "block", padding: "12px 14px", borderBottom: "1px solid rgba(30,41,59,0.5)", cursor: "pointer", position: "relative", background: isActive ? "rgba(13,148,136,0.08)" : "transparent", transition: "background 0.15s" }}
                                >
                                    {isActive && (
                                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(to bottom, #0d9488, #2dd4bf)", borderRadius: "0 3px 3px 0" }} />
                                    )}

                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                        {selectionMode && (
                                            <div style={{ paddingTop: "10px" }} onClick={(e) => { e.preventDefault(); toggleSelection(convo.id); }}>
                                                <Checkbox checked={selectedIds.includes(convo.id)} />
                                            </div>
                                        )}
                                        {/* Avatar */}
                                        <div style={{ position: "relative", flexShrink: 0 }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: isActive ? "rgba(13,148,136,0.2)" : "rgba(30,41,59,0.8)", border: `1px solid ${isActive ? "rgba(13,148,136,0.4)" : "rgba(30,41,59,0.9)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: isActive ? "#2dd4bf" : "#475569", fontWeight: 800, fontSize: "11px", fontFamily: "monospace" }}>
                                                {convo.lead?.name?.substring(0, 2).toUpperCase() || 'UN'}
                                            </div>
                                            <div style={{ position: "absolute", bottom: "-3px", right: "-3px", width: "18px", height: "18px", background: "rgba(8,12,20,0.95)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(30,41,59,0.9)" }}>
                                                <ChannelIcon channel={convo.channel} className="text-[10px]" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                                                <h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", color: isSlaBreached ? "#fb7185" : (isActive ? "#2dd4bf" : convo.unreadCount > 0 ? "#e2e8f0" : "#94a3b8"), fontWeight: convo.unreadCount > 0 || isActive ? 800 : 500, fontFamily: "monospace", margin: 0 }}>
                                                    {convo.lead?.name || 'Unknown Lead'} {isSlaBreached && '🔥'}
                                                </h3>
                                                <span style={{ fontSize: "10px", whiteSpace: "nowrap", marginLeft: "8px", color: isSlaBreached ? "#fb7185" : (convo.unreadCount > 0 ? "#2dd4bf" : "#1e293b"), fontFamily: "monospace" }}>
                                                    {isValidDate ? formatDistanceToNow(lastMsgDate, { addSuffix: false }) : 'N/A'}
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "4px" }}>
                                                <div style={{display: "flex", gap: "4px", flexWrap: "wrap", overflow: "hidden"}}>
                                                  {convo.topic && (
                                                      <span className={cn("px-1.5 py-[2px] rounded border text-[9px] font-mono leading-none", getSentimentColor(convo.sentiment))}>
                                                          {convo.topic}
                                                      </span>
                                                  )}
                                                  {convo.sentiment === 'URGENT' && (
                                                      <span className="px-1.5 py-[2px] rounded border text-[9px] font-mono leading-none text-rose-400 bg-rose-400/10 border-rose-400/20">
                                                          URGENT
                                                      </span>
                                                  )}
                                                </div>

                                                {convo.unreadCount > 0 && (
                                                    <span style={{ padding: "1px 6px", borderRadius: "99px", fontSize: "10px", fontWeight: 800, background: "rgba(13,148,136,0.2)", color: "#2dd4bf", border: "1px solid rgba(13,148,136,0.3)", fontFamily: "monospace", flexShrink: 0 }}>
                                                        {convo.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* New Message Composition Modal */}
            {showNewMessageModal && (
                <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ background: "rgba(11,15,25,0.98)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "16px", width: "100%", maxWidth: "400px", overflow: "hidden" }}>
                        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(8,12,20,0.9)" }}>
                            <h3 style={{ fontWeight: 800, color: "#e2e8f0", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontFamily: "monospace", margin: 0 }}><Send size={14} style={{ color: "#2dd4bf" }} /> New Message</h3>
                            <button onClick={() => setShowNewMessageModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex" }}><X size={14} /></button>
                        </div>
                        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>Channel</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {['WHATSAPP', 'MESSENGER', 'INSTAGRAM'].map(ch => (
                                        <button key={ch} style={{ padding: "8px", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", background: "rgba(15,23,42,0.8)", flex: 1, display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}>
                                            <ChannelIcon channel={ch as any} className="text-xl" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>Recipient</label>
                                <input type="text" style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#cbd5e1", outline: "none", boxSizing: "border-box" }} placeholder="Search contacts..." autoFocus />
                            </div>
                            <div>
                                <label style={{ fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", display: "block", marginBottom: "6px" }}>First Message</label>
                                <textarea style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#cbd5e1", outline: "none", minHeight: "80px", resize: "none", boxSizing: "border-box" }} placeholder="Type your message here..." />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px", borderTop: "1px solid rgba(30,41,59,0.8)" }}>
                                <button onClick={() => setShowNewMessageModal(false)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(30,41,59,0.9)", background: "transparent", color: "#475569", fontSize: "12px", cursor: "pointer", fontFamily: "monospace" }}>Cancelar</button>
                                <button style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(13,148,136,0.4)", background: "rgba(13,148,136,0.15)", color: "#2dd4bf", fontSize: "12px", cursor: "pointer", fontWeight: 800, fontFamily: "monospace" }} onClick={() => { toast.success('Message queued'); setShowNewMessageModal(false); router.refresh(); }}>Enviar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
