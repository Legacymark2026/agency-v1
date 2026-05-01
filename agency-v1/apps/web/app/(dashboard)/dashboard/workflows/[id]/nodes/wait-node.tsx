import React from "react";
import { Handle, Position } from "reactflow";
import { Clock } from "lucide-react";

export default function WaitNode({ data, isConnectable }: any) {
  return (
    <div className="flex w-56 flex-col rounded-xl border border-amber-500/30 bg-slate-900/90 shadow-[0_0_15px_rgba(245,158,11,0.1)] backdrop-blur">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-amber-400"
      />
      <div className="flex items-center gap-2 rounded-t-xl bg-amber-500/10 px-4 py-2 border-b border-amber-500/20">
        <Clock className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-semibold text-amber-100">Wait Delay</span>
      </div>
      <div className="p-4 flex items-center justify-center">
        <div className="text-2xl font-bold text-amber-300">
          {data.config?.delayMinutes >= 1440 
            ? `${Math.round(data.config.delayMinutes / 1440)} Días`
            : `${data.config?.delayMinutes || 0} Min`}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-amber-400"
      />
    </div>
  );
}
