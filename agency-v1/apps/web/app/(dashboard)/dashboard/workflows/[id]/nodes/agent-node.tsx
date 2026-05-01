import React from "react";
import { Handle, Position } from "reactflow";
import { Sparkles } from "lucide-react";

export default function AgentNode({ data, isConnectable }: any) {
  return (
    <div className="flex w-64 flex-col rounded-xl border border-teal-500/30 bg-slate-900/90 shadow-[0_0_15px_rgba(20,184,166,0.15)] backdrop-blur">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-teal-400"
      />
      <div className="flex items-center gap-2 rounded-t-xl bg-teal-500/10 px-4 py-2 border-b border-teal-500/20">
        <Sparkles className="h-4 w-4 text-teal-400" />
        <span className="text-sm font-semibold text-teal-100">AI Agent</span>
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-slate-200">{data.label}</p>
        <p className="mt-2 text-xs text-slate-400 line-clamp-3">
          {data.config?.messageTemplate || "No prompt configured"}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-teal-400"
      />
    </div>
  );
}
