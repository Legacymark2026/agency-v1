'use client';

import { useState } from "react";
import { ChevronRight, ChevronDown, Users, Plus, Folder } from "lucide-react";
import { TeamNode } from "@/actions/crm";
import { Button } from "@/components/ui/button";
import { CreateTeamDialog } from "./create-team-dialog";

interface HierarchyNodeProps {
    node: TeamNode;
    level?: number;
}

function HierarchyNode({ node, level = 0 }: HierarchyNodeProps) {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={`group flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors`}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="mr-2 text-gray-500">
                    {hasChildren ? (
                        isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    ) : (
                        <div className="w-4" />
                    )}
                </div>

                <Folder size={18} className="mr-2 text-blue-500 fill-blue-100" />

                <span className="font-medium text-sm text-gray-700">{node.name}</span>

                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center" onClick={(e) => e.stopPropagation()}>
                    <CreateTeamDialog parentId={node.id} />
                </div>

                {(node as any)._count?.members ? (
                    <div className="ml-auto flex items-center text-xs text-gray-400">
                        <Users size={12} className="mr-1" />
                        {(node as any)._count.members}
                    </div>
                ) : null}
            </div>

            {isOpen && hasChildren && (
                <div className="border-l border-gray-100 ml-4">
                    {node.children.map(child => (
                        <HierarchyNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function HierarchyViewer({ data }: { data: TeamNode[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500">No hay equipos definidos.</p>
                <div className="mt-4 flex justify-center">
                    <CreateTeamDialog triggerButton={
                        <Button variant="outline" size="sm">
                            <Plus size={16} className="mr-2" /> Crear Equipo Raíz
                        </Button>
                    } />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Estructura Organizacional</h3>
                <Button size="sm" variant="ghost">Expandir Todo</Button>
            </div>
            <div className="p-2">
                {data.map(node => (
                    <HierarchyNode key={node.id} node={node} />
                ))}
            </div>
        </div>
    );
}
