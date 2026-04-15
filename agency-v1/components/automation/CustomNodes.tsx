"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import {
    Mail, MessageSquare, Clock, Split, Zap, Bot, Webhook, Smartphone, Phone,
    Briefcase, Users, CheckCircle, LayoutDashboard, MoreHorizontal, Edit2, Copy, Trash2,
    CalendarClock, ActivitySquare, Tags, UserPlus, Network, GitBranch, Repeat, Mic, BookOpen,
    FileJson, Terminal, Search, CalendarPlus, CreditCard, ShoppingCart, Target,
    Inbox, FileText, Bell, Sparkles, Database, Layers, Globe, Star, ShieldCheck,
    PhoneCall, Wand2, ArrowLeftRight
} from 'lucide-react';

const NodeWrapper = ({ children, selected, colorClass = "border-slate-700", bgClass = "bg-slate-900" }: any) => (
    <div className={`shadow-lg shadow-teal-900/10 border-slate-700 rounded-xl border-2 min-w-[240px] transition-all duration-200 ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-100' : `${colorClass} hover:border-slate-600`} ${bgClass}`}>
        {children}
    </div>
);

const NodeHeader = ({ id, icon, label, color }: any) => {
    const { setNodes, setEdges, getNode } = useReactFlow();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Seleccionar este nodo y deseleccionar los demás, esto abre el panel de configuración al instante
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
        setMenuOpen(false);
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        const node = getNode(id);
        if(!node) return;
        const newNode = {
            ...node,
            id: `dndnode_${Date.now()}`,
            position: { x: node.position.x + 50, y: node.position.y + 50 },
            selected: false,
        };
        setNodes((nds) => nds.concat(newNode));
        setMenuOpen(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        setMenuOpen(false);
    };

    return (
        <div className={`px-4 py-2 border-b flex items-center gap-2 rounded-t-lg bg-opacity-950/40 relative group ${color}`}>
            {icon}
            <span className="text-sm font-bold text-white drop-shadow-sm">{label}</span>
            <div className="ml-auto relative">
                <button 
                  onMouseDown={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="p-1 rounded hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <MoreHorizontal size={14} className="text-slate-400" />
                </button>
                {menuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-slate-900 rounded-lg shadow-xl border border-slate-700 z-50 flex flex-col overflow-hidden">
                        <button onMouseDown={handleEdit} className="px-3 py-2 text-xs text-left hover:bg-slate-800/80 flex items-center gap-2 text-slate-200 transition-colors">
                            <Edit2 size={12} className="text-blue-500" /> Editar
                        </button>
                        <button onMouseDown={handleDuplicate} className="px-3 py-2 text-xs text-left hover:bg-slate-800/80 flex items-center gap-2 text-slate-200 transition-colors">
                            <Copy size={12} className="text-indigo-500" /> Duplicar
                        </button>
                        <div className="h-px bg-slate-800 w-full" />
                        <button onMouseDown={handleDelete} className="px-3 py-2 text-xs text-left hover:bg-red-950/40 text-red-400 flex items-center gap-2 transition-colors font-medium">
                            <Trash2 size={12} className="text-red-500" /> Eliminar
                        </button>
                    </div>
                )}
            </div>
            {menuOpen && <div className="fixed inset-0 z-40" onMouseDown={(e) => { e.stopPropagation(); setMenuOpen(false); }} />}
        </div>
    );
};

const NodeBody = ({ children }: any) => (
    <div className="p-3 text-xs text-slate-400 bg-slate-900/95 backdrop-blur-sm rounded-b-lg border-t border-slate-700/50 text-slate-300 shadow-inner">
        {children}
    </div>
);

// 1. TRIGGER NODE
const TriggerNode = memo(({ id, data, selected }: any) => {
    const type = data.triggerType || 'FORM_SUBMISSION';
    let icon = <Zap size={14} className="text-amber-400" />;
    let headerColor = "bg-amber-950/40 border-amber-800/60";
    let colorClass = "border-amber-700/80";
    let bodyText = "Trigger event";

    if (type === 'DEAL_STAGE_CHANGED') {
        icon = <Briefcase size={14} className="text-purple-400" />;
        headerColor = "bg-purple-950/40 border-purple-800/60";
        colorClass = "border-purple-700/80";
        bodyText = data.stage ? `To stage: ${data.stage}` : "When deal moves stage";
    } else if (type === 'LEAD_CREATED') {
        icon = <Users size={14} className="text-blue-400" />;
        headerColor = "bg-blue-950/40 border-blue-800/60";
        colorClass = "border-blue-700/80";
        bodyText = "When new lead enters CRM";
    } else if (type === 'SCHEDULE') {
        icon = <CalendarClock size={14} className="text-rose-400" />;
        headerColor = "bg-rose-950/40 border-rose-800/60";
        colorClass = "border-rose-700/80";
        bodyText = data.cronExpression ? `Cron: ${data.cronExpression}` : "Time-based schedule";
    } else if (type === 'WEBHOOK_LISTENER') {
        icon = <Webhook size={14} className="text-teal-400" />;
        headerColor = "bg-teal-950/40 border-teal-800/60";
        colorClass = "border-teal-700/80";
        bodyText = "Listens for HTTP POST";
    } else if (type === 'LEAD_SCORE') {
        icon = <ActivitySquare size={14} className="text-fuchsia-400" />;
        headerColor = "bg-fuchsia-950/40 border-fuchsia-800/60";
        colorClass = "border-fuchsia-700/80";
        bodyText = `Score > ${data.targetScore || 50}`;
    } else if (type === 'WHATSAPP_TRIGGER') {
        icon = <MessageSquare size={14} className="text-green-400" />;
        headerColor = "bg-green-950/40 border-green-800/60";
        colorClass = "border-green-700/80";
        bodyText = "On WhatsApp Message";
    } else if (type === 'META_LEADS') {
        icon = <Target size={14} className="text-blue-400" />;
        headerColor = "bg-blue-950/40 border-blue-800/60";
        colorClass = "border-blue-700/80";
        bodyText = "Meta Ads Lead Capture";
    } else if (type === 'STRIPE_PAYMENT') {
        icon = <CreditCard size={14} className="text-indigo-400" />;
        headerColor = "bg-indigo-950/40 border-indigo-800/60";
        colorClass = "border-indigo-700/80";
        bodyText = "Stripe Checkout Paid";
    } else if (type === 'SHOPIFY_ORDER') {
        icon = <ShoppingCart size={14} className="text-emerald-400" />;
        headerColor = "bg-emerald-950/40 border-emerald-800/60";
        colorClass = "border-emerald-700/80";
        bodyText = "New Shopify Order";
    } else if (type === 'EMAIL_LISTENER') {
        icon = <Inbox size={14} className="text-slate-400" />;
        headerColor = "bg-slate-800/80 border-slate-700";
        colorClass = "border-slate-600";
        bodyText = "Inbox Email Received";
    } else if (type === 'FORM_SUBMISSION') {
        bodyText = "Type: Form Submit";
    }

    return (
        <NodeWrapper selected={selected} colorClass={colorClass}>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-slate-900" />
            <NodeHeader id={id} icon={icon} label={data.label} color={headerColor} />
            <NodeBody>
                <p>{bodyText}</p>
            </NodeBody>
        </NodeWrapper>
    );
});

// 2. CRM ACTION NODE
const CRMActionNode = memo(({ id, data, selected }: any) => {
    const type = data.actionType || 'CREATE_TASK';
    let icon = <CheckCircle size={14} className="text-emerald-400" />;
    let label = "CRM Action";
    let body = "Update CRM Record";

    if (type === 'CREATE_TASK') {
        label = "Create Task";
        body = data.taskTitle ? `Task: ${data.taskTitle}` : "Create a new task";
    } else if (type === 'UPDATE_DEAL') {
        icon = <Briefcase size={14} className="text-emerald-400" />;
        label = "Update Deal";
        body = "Modify properties";
    } else if (type === 'ADD_TAG') {
        icon = <Tags size={14} className="text-emerald-400" />;
        label = "Add Tag";
        body = data.tagName ? `Tag: ${data.tagName}` : "Add a tag to lead";
    } else if (type === 'REMOVE_TAG') {
        icon = <Tags size={14} className="text-emerald-400" />;
        label = "Remove Tag";
        body = data.tagName ? `Remove: ${data.tagName}` : "Remove tag from lead";
    } else if (type === 'ASSIGN_USER') {
        icon = <UserPlus size={14} className="text-emerald-400" />;
        label = "Assign User";
        body = data.userId ? `Assign to ID: ${data.userId}` : "Assign to sales rep";
    } else if (type === 'ADJUST_SCORE') {
        icon = <Star size={14} className="text-fuchsia-400" />;
        label = "Adjust Score";
        body = data.scoreAdj ? `Score: ${data.scoreAdj}` : "Adjust Lead Score";
    } else if (type === 'META_AUDIENCE') {
        icon = <Users size={14} className="text-blue-400" />;
        label = "Meta Audience";
        body = "Add to Ad Audience";
    } else if (type === 'GENERATE_INVOICE') {
        icon = <FileText size={14} className="text-indigo-400" />;
        label = "Invoice";
        body = "Generate Billing Doc";
    } else if (type === 'VALIDATE_DATA') {
        icon = <ShieldCheck size={14} className="text-emerald-400" />;
        label = "Validate";
        body = "Validate Email/Phone";
    }

    return (
        <NodeWrapper selected={selected} colorClass="border-emerald-700/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={icon} label={data.label || label} color="bg-emerald-950/40 border-emerald-800/60" />
            <NodeBody><p>{body}</p></NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

// 3. COMMUNICATION & ACTION NODES
const ActionNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-indigo-700/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Mail size={14} className="text-indigo-400" />} label={data.label || "Send Email"} color="bg-indigo-950/40 border-indigo-800/60" />
            <NodeBody>
                <div className="truncate max-w-[200px]">{data.subject || "No Subject"}</div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const SlackNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-pink-700/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<MessageSquare size={14} className="text-pink-400" />} label={data.label || "Slack Notification"} color="bg-pink-950/40 border-pink-800/60" />
            <NodeBody>
                <div className="truncate max-w-[200px]">{data.message || "No message configured"}</div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-pink-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const WhatsappNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-green-700/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Phone size={14} className="text-green-400" />} label={data.label || "WhatsApp"} color="bg-green-950/40 border-green-800/60" />
            <NodeBody>
                <p className="font-bold text-green-300">{data.phoneNumber || 'No Contact'}</p>
                <div className="truncate max-w-[200px]">{data.message || "No message configured"}</div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const SmsNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-sky-700/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Smartphone size={14} className="text-sky-400" />} label={data.label || "SMS"} color="bg-sky-950/40 border-sky-800/60" />
            <NodeBody>
                <div className="truncate max-w-[200px]">{data.message || "No message configured"}</div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-sky-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const HttpNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-cyan-700/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Network size={14} className="text-cyan-400" />} label={data.label || "HTTP Request"} color="bg-cyan-950/40 border-cyan-800/60" />
            <NodeBody>
                <div className="flex items-center gap-1 font-mono">
                    <span className="font-bold text-cyan-400">{data.method || 'POST'}</span>
                    <span className="truncate max-w-[150px]">{data.url || 'http://...'}</span>
                </div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

// NEW COMMUNICATION NODES
const SocialNode = memo(({ id, data, selected }: any) => {
    const isReply = data.channel === 'SOCIAL_COMMENT';
    return (
        <NodeWrapper selected={selected} colorClass={isReply ? "border-blue-600/80" : "border-pink-600/80"}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<MessageSquare size={14} className={isReply ? "text-blue-400" : "text-pink-400"} />} label={data.label || (isReply ? "Comment Reply" : "IG Message")} color={isReply ? "bg-blue-950/40 border-blue-700/80" : "bg-pink-950/40 border-pink-700/80"} />
            <NodeBody>
                <div className="truncate max-w-[200px]">{data.message || "Message body..."}</div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className={`w-3 h-3 border-2 border-slate-900 ${isReply ? "bg-blue-500" : "bg-pink-500"}`} />
        </NodeWrapper>
    );
});

const PhoneCallNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-violet-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<PhoneCall size={14} className="text-violet-400" />} label={data.label || "AI Voice Call"} color="bg-violet-950/40 border-violet-700/80" />
            <NodeBody>
                <div className="truncate max-w-[200px]">Agent: <span className="font-bold text-violet-300">{data.agentId || 'Sales Bot'}</span></div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-violet-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const PushNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-amber-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Bell size={14} className="text-amber-400" />} label={data.label || "Push Notification"} color="bg-amber-950/40 border-amber-700/80" />
            <NodeBody>
                <div className="truncate max-w-[200px]">{data.title || "Notification Title"}</div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

// 4. LOGIC NODES
const WaitNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-orange-700/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Clock size={14} className="text-orange-400" />} label={data.label || "Delay"} color="bg-orange-950/40 border-orange-800/60" />
            <NodeBody>
                Wait for <span className="font-bold">{data.delayValue || '1'} {data.delayUnit || 'h'}</span>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const ConditionNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-slate-600">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />

            <NodeHeader id={id} icon={<Split size={14} className="text-slate-400" />} label={data.label || "Condition (If/Else)"} color="bg-slate-800/80 border-slate-700" />

            <div className="p-3 bg-slate-900 text-xs space-y-2 font-mono">
                <div className="text-center bg-slate-800/80 p-1 rounded border border-slate-700/50 text-slate-200">
                    IF {data.variable || 'Data'} {data.operator || 'equals'} {data.conditionValue || '...'}
                </div>
            </div>

            <div className="flex justify-between px-3 pb-3 rounded-b-lg bg-slate-900 mt-4">
                <div className="relative">
                    <span className="absolute -bottom-6 -left-1 text-[10px] font-bold text-green-400">YES</span>
                    <Handle type="source" id="true" position={Position.Bottom} className="w-3 h-3 bg-green-500 border-2 border-slate-900" style={{ left: 10 }} />
                </div>
                <div className="relative">
                    <span className="absolute -bottom-6 -right-1 text-[10px] font-bold text-red-400">NO</span>
                    <Handle type="source" id="false" position={Position.Bottom} className="w-3 h-3 bg-red-500 border-2 border-slate-900" style={{ left: 'auto', right: 10 }} />
                </div>
            </div>
        </NodeWrapper>
    );
});

const SwitchNode = memo(({ id, data, selected }: any) => {
    // We expect data.branches to be an array of strings/objects representing branch labels/values
    const branches = Array.isArray(data.branches) && data.branches.length > 0
        ? data.branches
        : [{ id: 'case_1', label: 'Case 1' }, { id: 'case_2', label: 'Case 2' }];

    return (
        <NodeWrapper selected={selected} colorClass="border-indigo-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<GitBranch size={14} className="text-indigo-400" />} label={data.label || "Switch Paths"} color="bg-indigo-950/40 border-indigo-700/80" />
            
            <div className="p-3 bg-slate-900 text-xs space-y-2 font-mono border-b border-slate-700/50">
                <div className="text-center bg-indigo-950/40/50 p-1 rounded border border-indigo-800/60 text-indigo-300">
                    Evaluate: {data.variable || 'Variable'}
                </div>
            </div>

            {/* Dynamic Branch Handles */}
            <div className="flex justify-evenly px-2 pb-5 pt-3 rounded-b-lg bg-slate-900 relative">
                {branches.map((branch: any, index: number) => {
                    // Calculate left percentage to evenly distribute handles
                    const leftPos = branches.length > 1
                        ? `${(index / (branches.length - 1)) * 100}%`
                        : '50%';

                    return (
                        <div key={branch.id} className="absolute flex flex-col items-center" style={{ left: leftPos, transform: 'translateX(-50%)', bottom: '-4px' }}>
                            <span className="absolute -bottom-5 whitespace-nowrap text-[10px] font-bold text-indigo-400 max-w-[50px] truncate" title={branch.label || branch.value}>
                                {branch.label || branch.value || `Path ${index + 1}`}
                            </span>
                            <Handle
                                type="source"
                                id={branch.id}
                                position={Position.Bottom}
                                className="w-3 h-3 bg-indigo-500 border-2 border-slate-900 !static !transform-none"
                            />
                        </div>
                    );
                })}
            </div>
        </NodeWrapper>
    );
});

const LoopNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-teal-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            
            <NodeHeader id={id} icon={<Repeat size={14} className="text-teal-400" />} label={data.label || "Loop / For-Each"} color="bg-teal-950/40 border-teal-700/80" />
            
            <div className="p-3 bg-slate-900 text-xs space-y-2 font-mono">
                <div className="text-center bg-teal-950/40/50 p-1 rounded border border-teal-800/60 text-teal-300">
                    Iterate: {data.iterableVariable || 'List'}
                </div>
            </div>

            <div className="flex justify-between px-3 pb-3 rounded-b-lg bg-slate-900 mt-4 relative">
                <div className="relative">
                    <span className="absolute -bottom-6 -left-4 text-[10px] font-bold text-teal-400 whitespace-nowrap">NEXT ITEM</span>
                    <Handle type="source" id="loop" position={Position.Bottom} className="w-3 h-3 bg-teal-500 border-2 border-slate-900" style={{ left: 10 }} />
                </div>
                <div className="relative">
                    <span className="absolute -bottom-6 -right-4 text-[10px] font-bold text-gray-500 whitespace-nowrap">DONE</span>
                    <Handle type="source" id="done" position={Position.Bottom} className="w-3 h-3 bg-slate-800/800 border-2 border-slate-900" style={{ left: 'auto', right: 10 }} />
                </div>
            </div>
        </NodeWrapper>
    );
});

// NEW LOGIC NODES
const SplitNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-fuchsia-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<ArrowLeftRight size={14} className="text-fuchsia-400" />} label={data.label || "A/B Split"} color="bg-fuchsia-950/40 border-fuchsia-700/80" />
            <div className="p-3 bg-slate-900 text-xs space-y-2 font-mono">
                <div className="text-center bg-fuchsia-950/40/50 p-1 rounded border border-fuchsia-800/60 text-fuchsia-300">
                    Split Ratio: {data.splitRatio || '50/50'}
                </div>
            </div>
            <div className="flex justify-between px-3 pb-3 rounded-b-lg bg-slate-900 mt-4">
                <div className="relative">
                    <span className="absolute -bottom-6 -left-1 text-[10px] font-bold text-fuchsia-400">A (50%)</span>
                    <Handle type="source" id="path_a" position={Position.Bottom} className="w-3 h-3 bg-fuchsia-500 border-2 border-slate-900" style={{ left: 10 }} />
                </div>
                <div className="relative">
                    <span className="absolute -bottom-6 -right-1 text-[10px] font-bold text-fuchsia-400">B (50%)</span>
                    <Handle type="source" id="path_b" position={Position.Bottom} className="w-3 h-3 bg-fuchsia-500 border-2 border-slate-900" style={{ left: 'auto', right: 10 }} />
                </div>
            </div>
        </NodeWrapper>
    );
});

const TransformerNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-teal-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Layers size={14} className="text-teal-400" />} label={data.label || "Transform Data"} color="bg-teal-950/40 border-teal-700/80" />
            <NodeBody>
                <div className="truncate max-w-[200px]">Format: <span className="font-bold text-teal-300">{data.formatType || 'JSON -> Params'}</span></div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const EnrichmentNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-emerald-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Database size={14} className="text-emerald-400" />} label={data.label || "Data Enrichment"} color="bg-emerald-950/40 border-emerald-700/80" />
            <NodeBody>
                <div className="truncate max-w-[200px]">Service: <span className="font-bold text-emerald-300">{data.service || 'Clearbit'}</span></div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

// --- ADVANCED AI & DATA NODES ---

// --- ADVANCED AI & DATA NODES ---

const VoiceNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-violet-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Mic size={14} className="text-violet-400" />} label={data.label || "Audio Transcriber"} color="bg-violet-950/40 border-violet-700/80" />
            <NodeBody>
                <div className="flex items-center gap-1">
                    <span className="text-violet-400 font-bold truncate max-w-[180px]">Input: {data.audioUrlVariable || '{{trigger.audioUrl}}'}</span>
                </div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-violet-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const RagNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-blue-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<BookOpen size={14} className="text-blue-400" />} label={data.label || "Knowledge Retrieval"} color="bg-blue-950/40 border-blue-700/80" />
            <NodeBody>
                <div className="truncate max-w-[200px]">Doc: <span className="font-mono text-blue-300">{data.documentSource || 'All Company Docs'}</span></div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const ExtractorNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-amber-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<FileJson size={14} className="text-amber-400" />} label={data.label || "Data Extractor"} color="bg-amber-950/40 border-amber-700/80" />
            <NodeBody>
                <div className="truncate max-w-[200px] font-mono text-amber-300">Schema: {data.schemaKeys ? data.schemaKeys.toString() : '{ ... }'}</div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const CodeNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-gray-500" bgClass="bg-gray-900 border-gray-800">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-800/800 border-2 border-gray-900" />
            <NodeHeader id={id} icon={<Terminal size={14} className="text-green-400" />} label={data.label || "Run JS Code"} color="bg-gray-800 border-gray-700 text-gray-100" />
            <div className="p-3 text-xs bg-gray-900 text-green-400 rounded-b-lg font-mono truncate max-w-[200px]">
                {data.code ? '{ Script... }' : '// Code Block'}
            </div>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500 border-2 border-gray-900" />
        </NodeWrapper>
    );
});

const FindRecordNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-emerald-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Search size={14} className="text-emerald-400" />} label={data.label || "Find Contact"} color="bg-emerald-950/40 border-emerald-700/80" />
            <NodeBody>
                <div className="truncate max-w-[200px]">By: <span className="font-bold text-emerald-300">{data.searchBy || 'Email'}</span></div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const CalendarNode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-rose-600/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<CalendarPlus size={14} className="text-rose-400" />} label={data.label || "Schedule Meeting"} color="bg-rose-950/40 border-rose-700/80" />
            <NodeBody>
                <div className="truncate max-w-[200px]">Event: <span className="font-bold text-rose-300">{data.eventTitle || 'Consultation'}</span></div>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-rose-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

const AINode = memo(({ id, data, selected }: any) => {
    return (
        <NodeWrapper selected={selected} colorClass="border-violet-700/80">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-slate-900" />
            <NodeHeader id={id} icon={<Bot size={14} className="text-violet-400" />} label={data.label || "AI Agent"} color="bg-violet-950/40 border-violet-800/60" />
            <NodeBody>
                Task: <span className="font-bold text-violet-300">{data.aiTask || 'SENTIMENT'}</span>
            </NodeBody>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-violet-500 border-2 border-slate-900" />
        </NodeWrapper>
    );
});

export const nodeTypes = {
    triggerNode: TriggerNode,
    actionNode: ActionNode,
    crmActionNode: CRMActionNode,
    waitNode: WaitNode,
    conditionNode: ConditionNode,
    switchNode: SwitchNode,
    loopNode: LoopNode,
    slackNode: SlackNode,
    aiNode: AINode,
    httpNode: HttpNode,
    whatsappNode: WhatsappNode,
    smsNode: SmsNode,
    voiceNode: VoiceNode,
    ragNode: RagNode,
    extractorNode: ExtractorNode,
    codeNode: CodeNode,
    findRecordNode: FindRecordNode,
    calendarNode: CalendarNode,
    socialNode: SocialNode,
    phoneCallNode: PhoneCallNode,
    pushNode: PushNode,
    splitNode: SplitNode,
    transformerNode: TransformerNode,
    enrichmentNode: EnrichmentNode,
};

// Required names for proper imports
TriggerNode.displayName = "TriggerNode";
CRMActionNode.displayName = "CRMActionNode";
ActionNode.displayName = "ActionNode";
WaitNode.displayName = "WaitNode";
ConditionNode.displayName = "ConditionNode";
SwitchNode.displayName = "SwitchNode";
LoopNode.displayName = "LoopNode";
SlackNode.displayName = "SlackNode";
WhatsappNode.displayName = "WhatsappNode";
SmsNode.displayName = "SmsNode";
HttpNode.displayName = "HttpNode";
AINode.displayName = "AINode";
VoiceNode.displayName = "VoiceNode";
RagNode.displayName = "RagNode";
ExtractorNode.displayName = "ExtractorNode";
CodeNode.displayName = "CodeNode";
FindRecordNode.displayName = "FindRecordNode";
CalendarNode.displayName = "CalendarNode";
SocialNode.displayName = "SocialNode";
PhoneCallNode.displayName = "PhoneCallNode";
PushNode.displayName = "PushNode";
SplitNode.displayName = "SplitNode";
TransformerNode.displayName = "TransformerNode";
EnrichmentNode.displayName = "EnrichmentNode";
