import React from "react";
import { Handle, Position } from "reactflow";
import { BellRing } from "lucide-react";

export default function NotifyNode({ data, isConnectable }: any) {
  return (
    <div className="flex w-64 flex-col rounded-xl border border-red-500/30 bg-slate-900/90 shadow-[0_0_15px_rgba(239,68,68,0.1)] backdrop-blur">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-red-400"
      />
      <div className="flex items-center gap-2 rounded-t-xl bg-red-500/10 px-4 py-2 border-b border-red-500/20">
        <BellRing className="h-4 w-4 text-red-400" />
        <span className="text-sm font-semibold text-red-100">Notification</span>
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-slate-200">{data.config?.title || data.label}</p>
        <p className="mt-1 text-xs text-slate-400 line-clamp-2">
          {data.config?.message || "No message content"}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-red-400"
      />
    </div>
  );
}
