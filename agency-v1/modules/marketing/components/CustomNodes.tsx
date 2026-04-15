import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Mail, Clock, PlayCircle, Brain, MessageSquare, Globe, Smartphone, MessageCircle } from 'lucide-react';

const TriggerNode = memo(({ data, isConnectable }: NodeProps) => {
    return (
        <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
            <div className="relative px-5 py-4 shadow-lg rounded-lg bg-white border border-gray-100 min-w-[200px] flex flex-col">
                <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-3 shadow-inner">
                        <PlayCircle size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-blue-500 tracking-wider uppercase">Trigger</div>
                        <div className="text-sm font-bold text-gray-900">{data.label}</div>
                    </div>
                </div>
                <div className="text-xs text-gray-400">Form Submission</div>
            </div>
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
        </div>
    );
});

const ActionNode = memo(({ data, isConnectable }: NodeProps) => {
    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-25 transition duration-200"></div>
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-purple-500 border-2 border-white shadow-sm" />
            <div className="relative px-5 py-4 shadow-md rounded-lg bg-white border border-gray-100 min-w-[200px]">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mr-3 shadow-inner">
                        <Mail size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-purple-500 tracking-wider uppercase">Action</div>
                        <div className="text-sm font-bold text-gray-900">{data.label}</div>
                    </div>
                </div>
                {/* Status Indicator (Mock) */}
                <div className="mt-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                    <span className="text-[10px] text-gray-400">Ready</span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-purple-500 border-2 border-white shadow-sm" />
        </div>
    );
});

const WaitNode = memo(({ data, isConnectable }: NodeProps) => {
    return (
        <div className="relative group">
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-orange-500 border-2 border-white shadow-sm" />
            <div className="relative px-5 py-3 shadow-md rounded-full bg-white border border-orange-100 min-w-[150px] flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                        <Clock size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">Wait</div>
                        <div className="text-md font-bold text-gray-800">
                            {data.delayValue || '24'} <span className="text-xs text-gray-400 font-normal">{data.delayUnit === 'm' ? 'min' : data.delayUnit === 'd' ? 'days' : 'hours'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-orange-500 border-2 border-white shadow-sm" />
        </div>
    );
});

// New Conditional Node (Diamond Shape)
const ConditionNode = memo(({ data, isConnectable }: NodeProps) => {
    return (
        <div className="relative group flex justify-center">
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-gray-500 border-2 border-white shadow-sm -mt-1 z-10" />

            <div className="w-24 h-24 bg-white border-2 border-gray-200 transform rotate-45 flex items-center justify-center shadow-lg group-hover:border-gray-400 transition-colors">
                <div className="transform -rotate-45 text-center">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Check</div>
                    <div className="text-xs font-bold text-gray-800">If...</div>
                </div>
            </div>

            {/* True Handle */}
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                <div className="text-[9px] font-bold text-green-600 bg-white px-1 rounded shadow-sm border border-green-100 absolute -top-5 left-1">Yes</div>
                <Handle type="source" id="true" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-green-500 border-2 border-white shadow-sm" />
            </div>

            {/* False Handle */}
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                <div className="text-[9px] font-bold text-red-600 bg-white px-1 rounded shadow-sm border border-red-100 absolute -top-5 right-1">No</div>
                <Handle type="source" id="false" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-red-500 border-2 border-white shadow-sm" />
            </div>
        </div>
    );
});

// AI Agent Node (Brain)
const AINode = memo(({ data, isConnectable }: NodeProps) => {
    return (
        <div className="relative group">
            {/* Pulsing Aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-60 animate-pulse transition duration-500"></div>

            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-500 border-2 border-white shadow-sm" />

            <div className="relative px-5 py-4 shadow-xl rounded-lg bg-gray-900 border border-gray-700 min-w-[220px]">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center text-indigo-400 mr-3 border border-indigo-500/30">
                        <Brain size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">AI Agent</div>
                        <div className="text-sm font-bold text-white">{data.label || 'AI Brain'}</div>
                    </div>
                </div>

                {/* Details Pill */}
                <div className="mt-3 flex gap-2">
                    <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                        {data.aiTask || 'General Task'}
                    </span>
                    {data.aiModel && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{data.aiModel}</span>}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-500 border-2 border-white shadow-sm" />
        </div>
    );
});

TriggerNode.displayName = "TriggerNode";
ActionNode.displayName = "ActionNode";
WaitNode.displayName = "WaitNode";
ConditionNode.displayName = "ConditionNode";
AINode.displayName = "AINode";

export const nodeTypes = {
    triggerNode: TriggerNode,
    actionNode: ActionNode,
    waitNode: WaitNode,
    conditionNode: ConditionNode,
    aiNode: AINode,
};
