"use client";

import React, { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Custom Nodes Components (to be implemented)
import AgentNode from "./nodes/agent-node";
import WaitNode from "./nodes/wait-node";
import NotifyNode from "./nodes/notify-node";
import DBWriteNode from "./nodes/db-write-node";
import BranchNode from "./nodes/branch-node";

const nodeTypes = {
  AI_AGENT: AgentNode,
  WAIT: WaitNode,
  NOTIFY: NotifyNode,
  DB_WRITE: DBWriteNode,
  BRANCH: BranchNode,
};

// Helper to convert DB JSON steps to React Flow nodes
function parseWorkflowToDAG(steps: any[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Simple layout engine: vertical layout
  let y = 50;
  const x = 250;
  const Y_SPACING = 150;

  steps.forEach((step, index) => {
    // Determine dimensions based on type (estimated)
    nodes.push({
      id: step.id,
      type: step.type, // Map to custom nodeTypes
      position: { x, y: y + index * Y_SPACING },
      data: {
        label: step.label || step.id,
        config: step.config,
        branches: step.branches,
      },
    });

    // Create Edges
    if (step.nextId) {
      edges.push({
        id: `e-${step.id}-${step.nextId}`,
        source: step.id,
        target: step.nextId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#14b8a6", strokeWidth: 2 }, // Teal stroke
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#14b8a6",
        },
      });
    }

    if (step.type === "BRANCH" && step.branches) {
      step.branches.forEach((branch: any, bIdx: number) => {
        if (branch.nextId) {
          edges.push({
            id: `e-${step.id}-${branch.nextId}-branch-${bIdx}`,
            source: step.id,
            target: branch.nextId,
            sourceHandle: `branch-${bIdx}`, // custom handle id in BranchNode
            type: "smoothstep",
            animated: true,
            label: branch.condition.value,
            labelStyle: { fill: "#cbd5e1", fontSize: 12 },
            labelBgStyle: { fill: "#0f172a" },
            style: { stroke: "#f59e0b", strokeWidth: 2 }, // Amber stroke
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#f59e0b",
            },
          });
        }
      });
    }
  });

  return { nodes, edges };
}

export function WorkflowCanvas({ workflow }: { workflow: any }) {
  const parsed = useMemo(() => parseWorkflowToDAG(workflow.steps || []), [workflow.steps]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(parsed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsed.edges);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-slate-950">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workflows" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-50 flex items-center gap-3">
              {workflow.name}
              {workflow.isActive ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">Activo</Badge>
              ) : (
                <Badge variant="outline" className="text-slate-500 border-slate-700 text-xs">Inactivo</Badge>
              )}
            </h1>
            <p className="text-sm text-slate-400">Trigger: {workflow.triggerType}</p>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-950"
          >
            <Background color="#1e293b" gap={16} />
            <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
            <MiniMap 
              nodeColor={(n) => {
                if (n.type === 'AI_AGENT') return '#14b8a6';
                if (n.type === 'WAIT') return '#f59e0b';
                if (n.type === 'NOTIFY') return '#ef4444';
                if (n.type === 'BRANCH') return '#a855f7';
                return '#475569';
              }}
              maskColor="rgba(2, 6, 23, 0.7)"
              className="bg-slate-900 border border-slate-800" 
            />
          </ReactFlow>
        </div>

        {/* Sidebar for Node Details */}
        {selectedNode && (
          <div className="w-80 border-l border-slate-800 bg-slate-900/80 p-6 backdrop-blur flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-2">
              Configuración de Nodo
            </h3>
            
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase font-semibold">Tipo</p>
              <Badge variant="outline" className="text-teal-400 border-teal-500/30 bg-teal-500/10">
                {selectedNode.type}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase font-semibold">Label</p>
              <p className="text-sm text-slate-300">{selectedNode.data.label}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase font-semibold">Configuración Interna</p>
              <pre className="text-xs text-slate-400 bg-slate-950 p-3 rounded-md border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedNode.data.config, null, 2)}
              </pre>
            </div>
            
            {selectedNode.data.branches && (
              <div className="space-y-2 mt-4">
                <p className="text-xs text-slate-500 uppercase font-semibold">Condicionales</p>
                <pre className="text-xs text-amber-400/80 bg-slate-950 p-3 rounded-md border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.data.branches, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
