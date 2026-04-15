import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Users, MoreVertical, Shield, Trophy } from 'lucide-react';
import { useState } from 'react';

const TeamNode = ({ data }: { data: any }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    const isOverCapacity = data.maxHeadcount && data.memberCount > data.maxHeadcount;
    const isAtCapacity = data.maxHeadcount && data.memberCount === data.maxHeadcount;

    let borderClass = "border-teal-500/30 hover:border-teal-400 focus:ring-teal-500/50";
    if (isOverCapacity) borderClass = "border-red-500/50 hover:border-red-400 focus:ring-red-500/50";
    else if (isAtCapacity) borderClass = "border-orange-500/50 hover:border-orange-400 focus:ring-orange-500/50";
    else if (isDragOver) borderClass = "border-emerald-500 bg-emerald-950/20 scale-105 z-50 ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950";

    return (
        <div 
            className={`relative min-w-[200px] rounded-xl border ${borderClass} bg-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.15)] backdrop-blur-md overflow-hidden transition-all focus:outline-none`}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const rawData = e.dataTransfer.getData('application/json');
                if (rawData) {
                    try {
                        const payload = JSON.parse(rawData);
                        if (payload.type === 'companyUser' && data.onDropUser) {
                            data.onDropUser(payload.id, data.id);
                        }
                    } catch (err) {}
                }
            }}
        >
            {/* Input handle from parent */}
            <Handle type="target" position={Position.Top} className="w-16 h-1 !bg-teal-500 rounded-none border-none top-0 translate-y-0" />
            
            <div className="p-3 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-teal-50">{data.name}</h3>
                        {data.level === 0 && (
                            <span className="inline-flex items-center text-[10px] uppercase font-mono tracking-wider text-teal-400 bg-teal-950/50 px-1.5 py-0.5 rounded mt-1">
                                <Shield className="w-3 h-3 mr-1" /> HQ / Root
                            </span>
                        )}
                    </div>
                    
                    <button 
                        className="text-slate-400 hover:text-teal-300 transition-colors p-1 -mr-1 rounded-md hover:bg-slate-800"
                        onClick={(e) => { e.stopPropagation(); data.onTriggerConfig(data.id); }}
                    >
                        <MoreVertical size={14} />
                    </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-1.5">
                        <Users size={12} className={isOverCapacity ? "text-red-400" : isAtCapacity ? "text-orange-400" : data.memberCount > 0 ? "text-teal-400" : ""} />
                        <span className={isOverCapacity ? "text-red-300 font-medium" : isAtCapacity ? "text-orange-300 font-medium" : data.memberCount > 0 ? "text-teal-100 font-medium" : ""}>
                            {data.memberCount} / {data.maxHeadcount ? data.maxHeadcount : '∞'} {data.memberCount === 1 ? 'Miembro' : 'Miembros'}
                        </span>
                    </div>
                    {data.activeBounties > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/40 rounded-full border border-amber-500/30">
                            <Trophy size={12} className="text-amber-400" />
                            <span className="text-amber-400 font-medium">{data.activeBounties}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Output handle for children */}
            <Handle type="source" position={Position.Bottom} className="w-16 h-1 !bg-teal-500 rounded-none border-none bottom-0 translate-y-0" />
            
        </div>
    );
};

export default memo(TeamNode);
