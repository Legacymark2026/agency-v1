import React from "react";
import { Handle, Position } from "reactflow";
import { Database } from "lucide-react";

export default function DBWriteNode({ data, isConnectable }: any) {
  return (
    <div className="flex w-60 flex-col rounded-xl border border-slate-500/30 bg-slate-800/90 shadow-lg backdrop-blur">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-slate-400"
      />
      <div className="flex items-center gap-2 rounded-t-xl bg-slate-700/50 px-4 py-2 border-b border-slate-600/50">
        <Database className="h-4 w-4 text-slate-300" />
        <span className="text-sm font-semibold text-slate-200">DB Write</span>
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-slate-100">{data.label}</p>
        <div className="mt-2 flex gap-2">
          <span className="rounded bg-slate-900 px-2 py-1 text-[10px] font-mono text-emerald-400 uppercase">
            {data.config?.operation || "upsert"}
          </span>
          <span className="rounded bg-slate-900 px-2 py-1 text-[10px] font-mono text-blue-400 uppercase">
            {data.config?.model || "unknown"}
          </span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-slate-400"
      />
    </div>
  );
}
