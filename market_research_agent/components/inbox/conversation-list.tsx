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
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "transparent", width: "100%" }}>
            {/* Header / Search */}
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h2 style={{ fontWeight: 800, fontSize: "16px", color: "#e2e8f0", fontFamily: "monospace", margin: 0 }}>Inbox</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                            style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "7px", padding: "5px", cursor: "pointer", color: isSyncing ? "#2dd4bf" : "#475569", display: "flex" }}
                            onClick={handleSync}
                            disabled={isSyncing}
                            title="Sincronizar Meta"
                        >
                            <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
                        </button>
                        <button
                            style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "7px", padding: "5px", cursor: "pointer", color: "#475569", display: "flex" }}
                            onClick={() => setShowNewMessageModal(true)}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                <div style={{ position: "relative" }}>
                    <Search style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#334155", width: "13px", height: "13px" }} />
                    <input
                        placeholder="Search messages..."
                        style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "7px 10px 7px 28px", fontSize: "12px", color: "#cbd5e1", outline: "none", boxSizing: "border-box" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Channel Filters (Mini Icons) */}
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-start", overflowX: "auto", paddingBottom: "2px" }}>
                    <button
                        onClick={() => setActiveChannel('ALL')}
                        style={{ height: "26px", padding: "0 10px", borderRadius: "99px", border: `1px solid ${activeChannel === 'ALL' ? "rgba(13,148,136,0.4)" : "rgba(30,41,59,0.9)"}`, background: activeChannel === 'ALL' ? "rgba(13,148,136,0.15)" : "rgba(15,23,42,0.8)", color: activeChannel === 'ALL' ? "#2dd4bf" : "#475569", fontSize: "10px", fontWeight: 800, cursor: "pointer", fontFamily: "monospace", whiteSpace: "nowrap" }}
                    >
                        All
                    </button>
                    {(['WHATSAPP', 'MESSENGER', 'INSTAGRAM'] as ChannelType[]).map(ch => (
                        <button
                            key={ch}
                            onClick={() => setActiveChannel(ch)}
                            style={{ height: "26px", width: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${activeChannel === ch ? "rgba(13,148,136,0.4)" : "rgba(30,41,59,0.9)"}`, background: activeChannel === ch ? "rgba(13,148,136,0.15)" : "rgba(15,23,42,0.8)", cursor: "pointer", opacity: activeChannel !== ch ? 0.6 : 1 }}
                            title={ch}
                        >
                            <ChannelIcon channel={ch} className="text-sm" />
                        </button>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-9 bg-gray-100/80 p-1">
                        <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                        <TabsTrigger value="mine" className="text-xs">Míos</TabsTrigger>
                        <TabsTrigger value="unassigned" className="text-xs">Sin Asignar</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Status Tabs (Mini) */}
                <div style={{ display: "flex", gap: "4px" }}>
                    {['OPEN', 'CLOSED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            style={{ fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontFamily: "monospace", transition: "all 0.15s", border: `1px solid ${statusFilter === status ? "rgba(13,148,136,0.4)" : "rgba(30,41,59,0.9)"}`, background: statusFilter === status ? "rgba(13,148,136,0.15)" : "rgba(15,23,42,0.8)", color: statusFilter === status ? "#2dd4bf" : "#334155" }}
                        >
                            {status === 'OPEN' ? 'ABIERTOS' : 'CERRADOS'}
                        </button>
                    ))}
                    <div style={{ flex: 1 }} />
                    <button
                        onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]); }}
                        style={{ fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontFamily: "monospace", background: selectionMode ? "rgba(13,148,136,0.15)" : "transparent", border: "1px solid transparent", color: selectionMode ? "#2dd4bf" : "#334155" }}
                    >
                        {selectionMode ? 'Cancelar' : 'Select'}
                    </button>
                </div>

                {/* Bulk Actions Bar */}
                {selectionMode && selectedIds.length > 0 && (
                    <div style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.3)", borderRadius: "8px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#2dd4bf", fontFamily: "monospace" }}>{selectedIds.length} seleccionados</span>
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
