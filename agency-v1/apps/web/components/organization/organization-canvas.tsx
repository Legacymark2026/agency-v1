'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Controls,
    Background,
    Panel,
    Connection,
    Edge,
    Node,
    MarkerType,
    MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import TeamNode from './team-node';
import { getOrganizationChart, updateTeamParent, reassignUserToTeam } from '@/actions/organization';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Maximize, Minimize, ArrowDownToLine, ArrowRightToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTeamDialog } from '@/modules/crm/components/create-team-dialog';
import { TeamConfigPanel } from './team-config-panel';

const nodeTypes = {
    team: TeamNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Posicionamiento Automático
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 100 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 220, height: 100 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top' as any;
        node.sourcePosition = isHorizontal ? 'right' : 'bottom' as any;

        // Shift position to center the node
        node.position = {
            x: nodeWithPosition.x - 110,
            y: nodeWithPosition.y - 50,
        };
        return node;
    });

    return { nodes, edges };
};

interface OrganizationCanvasProps {
    companyId: string;
}

export default function OrganizationCanvas({ companyId }: OrganizationCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [direction, setDirection] = useState<'TB' | 'LR'>('TB');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    const handleDropUser = async (companyUserId: string, targetTeamId: string) => {
        setIsLoading(true); // Mostrar ligero loader o toast
        const res = await reassignUserToTeam(companyUserId, targetTeamId);
        if (res.success) {
            toast.success("Talento reasignado con éxito a la nueva división.");
            await loadData(); // recargar canvas para actualizar números
            // Refrescar panel si el equipo origen/destino estaba abierto, o se puede dejar abierto para ver cómo bajó de headcount.
        } else {
            toast.error(res.error || "No se pudo mover el talento.");
        }
        setIsLoading(false);
    };

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const start = performance.now();
        const result = await getOrganizationChart(companyId);
        
        if (result.success && result.data) {
            const initialNodes: Node[] = result.data.map(team => ({
                id: team.id,
                type: 'team',
                position: { x: 0, y: 0 },
                data: { 
                    id: team.id,
                    name: team.name,
                    level: team.level,
                    memberCount: team.memberCount,
                    maxHeadcount: team.maxHeadcount,
                    activeBounties: team.activeBounties,
                    onTriggerConfig: (id: string) => setSelectedTeamId(id),
                    onDropUser: handleDropUser
                }
            }));
            
            const initialEdges: Edge[] = [];
            result.data.forEach((team) => {
                if (team.parentId) {
                    initialEdges.push({
                        id: `e-${team.parentId}-${team.id}`,
                        source: team.parentId,
                        target: team.id,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#14b8a6', strokeWidth: 1.5, opacity: 0.5 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#14b8a6' }
                    });
                }
            });

            // Layout Auto
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                initialNodes,
                initialEdges,
                direction
            );

            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
        } else {
            toast.error(result.error || "Error cargando la estructura");
        }
        setIsLoading(false);
    }, [companyId, setNodes, setEdges, direction]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onConnect = useCallback(async (params: Connection | Edge) => {
        // params.source = parent node
        // params.target = child node
        if (!params.source || !params.target) return;

        // Visual update optimistic
        setEdges((eds) => addEdge(
            { 
                ...params, 
                type: 'smoothstep', 
                animated: true, 
                style: { stroke: '#14b8a6', strokeWidth: 2 } 
            }, 
            eds.filter(e => e.target !== params.target) // Remove old parent connection
        ));

        toast.promise(
            updateTeamParent(params.target, params.source, companyId),
            {
                loading: 'Reasignando equipo...',
                success: (res) => {
                    if (res.success) {
                        loadData(); // Reload for accurate paths & levels from DB
                        return 'Estructura actualizada.';
                    }
                    loadData(); // Revert
                    throw new Error(res.error || 'Error reasignando');
                },
                error: (err) => err.message
            }
        );
    }, [setEdges, companyId, loadData]);

    if (isLoading && nodes.length === 0) {
        return <div className="h-full w-full flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-teal-500 w-8 h-8" /></div>;
    }

    return (
        <div className={`w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative h-full min-h-[750px] max-h-[80vh]'}`}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="react-flow-hud"
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#1e293b" gap={16} size={1} />
                <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
                <MiniMap 
                    nodeColor={(n) => '#14b8a6'} 
                    maskColor="rgba(2, 6, 23, 0.8)" 
                    className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden"
                />
                <Panel position="top-right" className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setDirection(d => d === 'TB' ? 'LR' : 'TB')} className="h-8 w-8 text-slate-400 hover:text-teal-400 hover:bg-slate-800" title="Cambiar Orientación">
                        {direction === 'TB' ? <ArrowRightToLine size={16} /> : <ArrowDownToLine size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="h-8 w-8 text-slate-400 hover:text-teal-400 hover:bg-slate-800" title="Modo Pantalla Completa">
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </Button>
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                    <Button variant="outline" size="sm" onClick={loadData} className="bg-slate-950/50 h-8 px-2 border-slate-700 hover:bg-slate-800">
                        <RefreshCw size={14} className="text-teal-400 mr-2" /> Refrescar
                    </Button>
                    <CreateTeamDialog companyId={companyId} triggerButton={
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white h-8">
                            Añadir Equipo
                        </Button>
                    } />
                </Panel>
            </ReactFlow>

            {/* Panel de Configuración Deslizable */}
            <TeamConfigPanel 
                teamId={selectedTeamId}
                open={!!selectedTeamId}
                onClose={() => setSelectedTeamId(null)}
            />
        </div>
    );
}
