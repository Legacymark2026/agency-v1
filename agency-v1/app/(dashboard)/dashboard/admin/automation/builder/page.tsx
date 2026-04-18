"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Edge,
    MarkerType,
    Node,
    MiniMap,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader2, Save, Play, ChevronLeft, LayoutGrid, Undo2, Redo2, Check, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import dagre from 'dagre';

import Sidebar from '../../../../../../components/automation/Sidebar';
import { nodeTypes } from '../../../../../../components/automation/CustomNodes';
import NodeConfigPanel from '../../../../../../components/automation/NodeConfigPanel';
import { saveUserWorkflow, getLatestWorkflow, getWorkflowById } from '@/actions/automation';

const initialNodes = [
    {
        id: 'start',
        type: 'triggerNode',
        data: { label: 'Form Submission', triggerType: 'FORM_SUBMISSION' },
        position: { x: 400, y: 50 },
    },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

// --- DAGRE LAYOUT FUNCTION ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 280;
const nodeHeight = 150; // Increased spacing

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newNode = { ...node };

        newNode.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return newNode;
    });

    return { nodes: newNodes, edges };
};

// --- MAIN BUILDER ---
function AutomationBuilder() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [isSimulating, setIsSimulating] = useState(false);

    // History for Undo/Redo
    const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Config Panel State
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    // --- Load Workflow on Mount ---
    useEffect(() => {
        const idParam = searchParams.get('id');
        const isNew = searchParams.get('new');

        if (idParam) {
            loadWorkflowById(idParam);
        } else if (isNew) {
            setIsLoading(false); // Start fresh
            saveHistory(initialNodes, []);
        } else {
            loadLatestWorkflow();
        }
    }, [searchParams]);

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) { // Ctrl+Shift+Z = Redo
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
            // Ctrl+Y or Cmd+Y = Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                handleRedo();
            }
            // Ctrl+S or Cmd+S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave(false); // save as draft by default on ctrl+s if needed, or active
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, historyIndex, nodes, edges, workflowName]);

    // --- HISTORY MGMT ---
    const saveHistory = (n: Node[], e: Edge[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: JSON.parse(JSON.stringify(n)), edges: JSON.parse(JSON.stringify(e)) });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            setHistoryIndex(historyIndex - 1);
            toast.info("Acción deshecha", { duration: 1500 });
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setHistoryIndex(historyIndex + 1);
            toast.info("Acción re-hecha", { duration: 1500 });
        }
    };

    const handleAutoLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        saveHistory(layoutedNodes, layoutedEdges);
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 200);
        toast.success("Nodos auto-organizados");
    }, [nodes, edges, reactFlowInstance]);

    // --- Loading Logic ---
    const loadWorkflowById = async (id: string) => {
        setIsLoading(true);
        try {
            const workflow = await getWorkflowById(id);
            if (workflow) {
                setWorkflowId(workflow.id);
                setWorkflowName(workflow.name);
                if (workflow.steps) {
                    const { nodes: newNodes, edges: newEdges } = transformStepsToGraph(workflow);
                    setNodes(newNodes);
                    setEdges(newEdges);
                    saveHistory(newNodes, newEdges);
                    setTimeout(() => reactFlowInstance?.fitView(), 100);
                }
            } else {
                toast.error("Workflow not found");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load workflow");
        } finally {
            setIsLoading(false);
        }
    };

    const loadLatestWorkflow = async () => {
        setIsLoading(true);
        try {
            const workflow = await getLatestWorkflow();
            if (workflow && workflow.steps) {
                setWorkflowId(workflow.id);
                setWorkflowName(workflow.name);
                const { nodes: newNodes, edges: newEdges } = transformStepsToGraph(workflow);
                setNodes(newNodes);
                setEdges(newEdges);
                saveHistory(newNodes, newEdges);
                setTimeout(() => reactFlowInstance?.fitView(), 100);
            }
        } catch (error) {
            console.error("Failed to load workflow", error);
        } finally {
            setIsLoading(false);
        }
    };

    const transformStepsToGraph = (workflow: any) => {
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        let yPos = 50;
        const xPos = 400;

        // 1. Trigger Node
        const triggerId = 'start';
        newNodes.push({
            id: triggerId,
            type: 'triggerNode',
            position: { x: xPos, y: yPos },
            data: {
                label: workflow.triggerType === 'DEAL_STAGE_CHANGED' ? 'Deal Stage' : 'Trigger',
                triggerType: workflow.triggerType,
                ...(workflow.triggerConfig as any)
            }
        });

        yPos += 180;
        let previousNodeId = triggerId;

        // 2. Steps
        const steps = workflow.steps as any[];
        if (Array.isArray(steps)) {
            steps.forEach((step, index) => {
                const stepId = `step_${index}`;
                let type = 'actionNode'; // Default
                let data = { ...step.config };

                if (step.type === 'WAIT') {
                    type = 'waitNode';
                    const delay = step.delay || 0;
                    if (delay >= 86400 && delay % 86400 === 0) {
                        data = { delayValue: delay / 86400, delayUnit: 'd' };
                    } else if (delay >= 3600 && delay % 3600 === 0) {
                        data = { delayValue: delay / 3600, delayUnit: 'h' };
                    } else {
                        data = { delayValue: Math.floor(delay / 60), delayUnit: 'm' };
                    }
                } else if (step.type === 'CREATE_TASK' || step.type === 'UPDATE_DEAL') {
                    type = 'crmActionNode';
                    data = { ...step.config, actionType: step.type };
                } else if (step.type === 'SLACK') {
                    type = 'slackNode';
                } else if (step.type === 'AI_AGENT') {
                    type = 'aiNode';
                } else if (step.type === 'CONDITION') {
                    type = 'conditionNode';
                    data = {
                        variable: step.config?.variable,
                        operator: step.config?.operator,
                        conditionValue: step.config?.value
                    };
                }

                newNodes.push({
                    id: stepId,
                    type,
                    position: { x: xPos, y: yPos },
                    data
                });

                newEdges.push({
                    id: `e_${previousNodeId}_${stepId}`,
                    source: previousNodeId,
                    target: stepId,
                    animated: true, // Edge animation natively enabled
                    markerEnd: { type: MarkerType.ArrowClosed }
                });

                previousNodeId = stepId;
                yPos += 180;
                id = Math.max(id, index + 2);
            });
        }

        return { nodes: newNodes, edges: newEdges };
    };

    // --- React Flow Handlers ---
    const onConnect = useCallback(
        (params: Connection | Edge) => {
            setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
            // Defer history save until state updates
            setTimeout(() => saveHistory(nodes, edges), 0);
        },
        [setEdges, nodes, edges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow/type');
            const label = event.dataTransfer.getData('application/reactflow/label');
            const dataStr = event.dataTransfer.getData('application/reactflow/data');
            const extraData = dataStr ? JSON.parse(dataStr) : {};

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type,
                position,
                data: { label: label, ...extraData },
            };

            setNodes((nds) => {
                const updated = nds.concat(newNode);
                saveHistory(updated, edges);
                return updated;
            });
        },
        [reactFlowInstance, setNodes, edges],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onNodeDataChange = (nodeId: string, newData: any) => {
        setNodes((nds) => {
            const updated = nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData };
                }
                return node;
            });
            saveHistory(updated, edges);
            return updated;
        });
        setSelectedNode((prev) => prev?.id === nodeId ? { ...prev, data: newData } : prev);
    };

    const handleNodeDelete = useCallback(() => {
        // Will be called by react flow automatically on pressing Backspace
        setTimeout(() => saveHistory(nodes, edges), 100);
    }, [nodes, edges]);

    const transformGraphToSteps = () => {
        const steps: any[] = [];
        let currentNode = nodes.find((n) => n.type === 'triggerNode');
        let limit = 0;

        while (currentNode && limit < 50) {
            let edge = edges.find((e) => e.source === currentNode?.id);
            if (currentNode?.type === 'conditionNode') {
                const trueEdge = edges.find(e => e.source === currentNode?.id && e.sourceHandle === 'true');
                edge = trueEdge || edges.find(e => e.source === currentNode?.id);
                steps.push({
                    type: 'CONDITION',
                    config: {
                        variable: (currentNode.data as any).variable || 'email',
                        operator: (currentNode.data as any).operator || 'contains',
                        value: (currentNode.data as any).conditionValue || (currentNode.data as any).value
                    }
                });
            }

            if (!edge) break;
            const nextNode = nodes.find((n) => n.id === edge.target);
            if (!nextNode) break;

            const nodeData = nextNode.data as any;

            if (nextNode.type === 'actionNode') {
                steps.push({
                    type: 'EMAIL',
                    templateId: nodeData.templateId || 'default-template',
                    config: { subject: nodeData.subject, body: nodeData.body }
                });
            } else if (nextNode.type === 'crmActionNode') {
                steps.push({
                    type: (nodeData.actionType as any) || 'CREATE_TASK',
                    config: {
                        taskTitle: nodeData.taskTitle,
                        taskDescription: nodeData.taskDescription,
                        priority: nodeData.priority,
                        dealStage: nodeData.dealStage
                    }
                });
            } else if (nextNode.type === 'waitNode') {
                const val = parseInt(nodeData.delayValue || '24');
                const unit = nodeData.delayUnit || 'h';
                let seconds = val * 3600;
                if (unit === 'm') seconds = val * 60;
                if (unit === 'd') seconds = val * 86400;

                steps.push({ type: 'WAIT', delay: seconds });
            } else if (nextNode.type === 'conditionNode') {
                // Handled in loop start
            } else if (nextNode.type === 'aiNode') {
                steps.push({
                    type: 'AI_AGENT',
                    config: { aiTask: nodeData.aiTask || 'SENTIMENT', promptContext: nodeData.promptContext || '' }
                });
            } else if (nextNode.type === 'slackNode') {
                steps.push({
                    type: 'SLACK',
                    config: { webhookUrl: nodeData.webhookUrl, message: nodeData.message }
                });
            } else if (nextNode.type === 'httpNode') {
                steps.push({
                    type: 'HTTP',
                    config: { url: nodeData.url, method: nodeData.method || 'POST' }
                });
            } else if (nextNode.type === 'smsNode') {
                steps.push({
                    type: 'SMS',
                    config: { phoneNumber: nodeData.phoneNumber, message: nodeData.message }
                });
            } else if (nextNode.type === 'whatsappNode') {
                steps.push({
                    type: 'WHATSAPP',
                    config: { phoneNumber: nodeData.phoneNumber, message: nodeData.message }
                });
            }

            currentNode = nextNode;
            limit++;
        }
        return steps;
    };

    // --- Save & Test Logic ---
    const handleSave = async (isActive: boolean) => {
        setIsSaving(true);
        // Validation check for unconnected nodes (aside from trigger)
        const connectedIds = new Set(edges.flatMap(e => [e.source, e.target]));
        const isolated = nodes.filter(n => n.type !== 'triggerNode' && !connectedIds.has(n.id));
        if (isolated.length > 0) {
            toast.warning(`Advertencia: Hay ${isolated.length} nodos desconectados.`, { duration: 4000 });
        }

        try {
            const steps = { nodes, edges };
            const triggerNode = nodes.find(n => n.type === 'triggerNode');
            const triggerType = triggerNode?.data?.triggerType || 'FORM_SUBMISSION';
            const triggerConfig = { ...triggerNode?.data };
            delete triggerConfig.label;

            const result = await saveUserWorkflow({
                id: workflowId,
                name: workflowName,
                triggerType: triggerType,
                triggerConfig: triggerConfig,
                steps: steps,
                isActive: isActive
            });

            if (result.success) {
                toast.success(isActive ? 'Flujo Activo Guardado!' : 'Borrador Guardado!');
            } else {
                toast.error(result.error || 'Failed to save');
            }
        } catch (e: any) {
            toast.error('Error saving: ' + e.message);
        }
        setIsSaving(false);
    };

    const handleTestRun = () => {
        setIsSimulating(true);
        toast.info("Iniciando simulación del flujo...");

        let step = 0;
        const interval = setInterval(() => {
            if (step >= nodes.length) {
                clearInterval(interval);
                setIsSimulating(false);
                toast.success("Simulación completada con éxito");
                return;
            }
            // Flash node or show progress
            toast.success(`Ejecutando nodo: ${nodes[step].data.label || nodes[step].type}`);
            step++;
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] w-full relative bg-slate-950">
            {isLoading && (
                <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center">
                    <Loader2 className="animate-spin text-teal-400 h-10 w-10" />
                </div>
            )}

            {/* TOP NAVIGATION BAR */}
            <div className="bg-slate-900 border-b border-slate-700/60 px-6 py-3 flex flex-col md:flex-row justify-between md:items-center shadow-lg shadow-black/30 z-10 w-full gap-4 md:gap-0" style={{backdropFilter:'blur(8px)'}}>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/automation">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300">
                            <ChevronLeft size={16} />
                        </Button>
                    </Link>
                    <div>
                        <input
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            className="text-xl font-bold text-white bg-transparent border-none focus:ring-0 p-0 outline-none hover:bg-slate-800/50 rounded px-1 transition-colors"
                        />
                        {workflowId && <div className="text-xs text-teal-400/70 font-mono mt-0.5">ID: {workflowId}</div>}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Undo / Redo / Layout */}
                    <div className="flex items-center mr-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700" onClick={handleUndo} disabled={historyIndex <= 0}>
                            <Undo2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                            <Redo2 size={16} />
                        </Button>
                        <div className="w-[1px] h-4 bg-slate-600 mx-1"></div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700" onClick={handleAutoLayout} title="Auto-organizar Nodos">
                            <LayoutGrid size={16} />
                        </Button>
                    </div>

                    <Button variant="outline" className="gap-2 text-teal-300 bg-slate-800 shadow-sm border-slate-600 hover:bg-slate-700 hover:border-teal-500" onClick={handleTestRun} disabled={isSimulating}>
                        <Play size={16} className="text-teal-400" />
                        {isSimulating ? "Simulando..." : "Simular Flujo"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                        className="gap-2 text-slate-300 border-slate-600 hover:bg-slate-700 bg-slate-800"
                    >
                        <FileDown size={16} /> Guardar Borrador
                    </Button>
                    <Button
                        onClick={() => handleSave(true)}
                        disabled={isSaving}
                        className="gap-2 bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-900/40 font-semibold"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        Publicar y Activar
                    </Button>
                </div>
            </div>

            {/* FLOW BUILDER KERNEL */}
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar />
                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={() => setSelectedNode(null)}
                        onNodesDelete={handleNodeDelete}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Background color="#334155" gap={20} size={1.5} />
                        <Controls className="bg-slate-800 shadow-md border border-slate-700 rounded-lg p-1 [&>button]:bg-slate-800 [&>button]:text-slate-300 [&>button:hover]:bg-slate-700 [&>button]:border-slate-700" />
                        <MiniMap
                            nodeStrokeColor={(n) => {
                                if (n.type === 'triggerNode') return '#f59e0b';
                                if (n.type === 'conditionNode') return '#94a3b8';
                                return '#14b8a6';
                            }}
                            nodeColor={(n) => {
                                if (n.type === 'triggerNode') return '#78350f';
                                if (n.type === 'conditionNode') return '#1e293b';
                                return '#134e4a';
                            }}
                            maskColor="rgba(2,6,23,0.7)"
                            style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                            className="shadow-xl rounded-lg overflow-hidden"
                        />
                    </ReactFlow>

                    {selectedNode && (
                        <NodeConfigPanel
                            selectedNode={selectedNode}
                            onChange={onNodeDataChange}
                            onClose={() => setSelectedNode(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-950"><Loader2 className="animate-spin text-teal-400 h-12 w-12" /></div>}>
            <ReactFlowProvider>
                <AutomationBuilder />
            </ReactFlowProvider>
        </Suspense>
    );
}
