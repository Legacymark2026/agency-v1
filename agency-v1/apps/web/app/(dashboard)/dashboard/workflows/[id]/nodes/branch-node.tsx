import React from "react";
import { Handle, Position } from "reactflow";
import { GitBranch } from "lucide-react";

export default function BranchNode({ data, isConnectable }: any) {
  const branches = data.branches || [];

  return (
    <div className="flex w-64 flex-col rounded-xl border border-purple-500/30 bg-slate-900/90 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-purple-400"
      />
      <div className="flex items-center gap-2 rounded-t-xl bg-purple-500/10 px-4 py-2 border-b border-purple-500/20">
        <GitBranch className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-semibold text-purple-100">Branch (Condition)</span>
      </div>
      <div className="p-4 space-y-2 relative">
        <p className="text-sm font-medium text-slate-200">{data.label}</p>
        
        {/* Dynamic Branch Handles */}
        <div className="flex flex-col gap-3 mt-4">
          {branches.map((b: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 text-xs text-slate-400">
              <span>{b.condition?.field} {b.condition?.operator} {b.condition?.value}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`branch-${idx}`}
                isConnectable={isConnectable}
                style={{ top: `${(idx + 1) * 35 + 20}px` }} // Approximate dynamic positioning
                className="h-3 w-3 border-2 border-slate-900 bg-purple-400"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
