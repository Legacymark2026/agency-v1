'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus, Edit, Trash2, Eye, Star, Search, Filter, ExternalLink,
    MoreHorizontal, Copy, CheckSquare, Square, Trash, Archive, FileUp, GripVertical, ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { deleteProject, duplicateProject, updateProjectsStatus, reorderProjects } from '@/actions/projects';
import { ConfirmDialog } from '@/components/ui/slide-over';
import { Badge } from '@/components/ui/badge';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Project {
    id: string;
    title: string;
    slug: string;
    status: string;
    client: string | null;
    coverImage: string | null;
    featured: boolean;
    category: { name: string; color?: string | null } | null;
    _count: { views: number };
    createdAt: Date;
    displayOrder: number;
}

interface ProjectListProps {
    projects: Project[];
    categories: any[];
}

// Sortable Row Component
function SortableRow({ project, selectedIds, toggleSelect, statusColors, handleDuplicate, handleDelete, isReordering }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: project.id, disabled: !isReordering });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <tr ref={setNodeRef} style={style} className={`hover:bg-[#161b22]/40 transition-colors group border-b border-slate-900/50 ${isDragging ? "bg-[#161b22] shadow-2xl z-50 ring-1 ring-teal-500/50" : ""}`}>
            <td className="px-4 py-4">
                {isReordering ? (
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-400">
                        <GripVertical className="h-5 w-5" />
                    </div>
                ) : (
                    <button
                        onClick={() => toggleSelect(project.id)}
                        className={`${selectedIds.includes(project.id) ? 'text-black' : 'text-slate-600 group-hover:text-slate-500'} transition-colors`}
                    >
                        {selectedIds.includes(project.id) ? (
                            <CheckSquare className="h-5 w-5" />
                        ) : (
                            <Square className="h-5 w-5" />
                        )}
                    </button>
                )}
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 relative border border-slate-800/50">
                        {project.coverImage ? (
                            <img
                                src={project.coverImage}
                                alt={project.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <Eye size={20} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            {project.featured && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            )}
                            <Link
                                href={`/dashboard/projects/${project.id}`}
                                className="font-medium text-white hover:underline"
                            >
                                {project.title}
                            </Link>
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[200px]">
                            Last updated: {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {project.category ? (
                    <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                            backgroundColor: project.category.color ? `${project.category.color}20` : '#f3f4f6',
                            color: project.category.color || '#6b7280'
                        }}
                    >
                        {project.category.name}
                    </span>
                ) : (
                    <span className="text-slate-500">-</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-white">{project.client || '-'}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[project.status] || 'bg-slate-900'}`}>
                    {project.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Eye className="h-3 w-3" />
                    {project._count?.views || 0}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-500 hover:text-white hover:bg-slate-800 transition-all rounded-xl">
                                <MoreHorizontal size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0d1117] border-slate-800 p-1.5 rounded-xl shadow-2xl">
                            <Link href={`/dashboard/projects/${project.id}`}>
                                <DropdownMenuItem className="rounded-lg text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer py-2">
                                    <Edit className="h-4 w-4 mr-2 text-teal-500" /> Editar Detallado
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem 
                                onClick={() => handleDuplicate(project.id)}
                                className="rounded-lg text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer py-2"
                            >
                                <Copy className="h-4 w-4 mr-2 text-blue-500" /> Duplicar Proyecto
                            </DropdownMenuItem>
                            {project.status === 'published' && (
                                <DropdownMenuItem 
                                    onClick={() => window.open(`/portfolio/${project.slug}`, '_blank')}
                                    className="rounded-lg text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer py-2"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2 text-purple-500" /> Ver en Vivo
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className="rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer py-2"
                                onClick={() => handleDelete(project.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar Permanentemente
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </tr>
    );
}

export function ProjectList({ projects: initialProjects, categories }: ProjectListProps) {
    const router = useRouter();
    const [projects, setProjects] = useState(initialProjects);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmBulkAction, setConfirmBulkAction] = useState<'publish' | 'draft' | 'delete' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setProjects((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    displayOrder: index
                }));

                reorderProjects(updates).then(res => {
                    if (!res.success) console.error("Failed to save order");
                });

                return newItems;
            });
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === projects.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(projects.map(p => p.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDuplicate = async (id: string) => {
        setIsLoading(true);
        const result = await duplicateProject(id);
        setIsLoading(false);
        if (result.success) {
            router.refresh();
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmSingleDelete = async () => {
        if (!confirmDeleteId) return;
        setIsLoading(true);
        const result = await deleteProject(confirmDeleteId);
        setIsLoading(false);
        setConfirmDeleteId(null);
        if (result.success) {
            router.refresh();
        }
    };

    const handleBulkAction = async (action: 'publish' | 'draft' | 'delete') => {
        setConfirmBulkAction(action);
    };

    const confirmBulkExecute = async () => {
        if (!confirmBulkAction) return;

        setIsLoading(true);
        let result;

        if (confirmBulkAction === 'delete') {
            const promises = selectedIds.map(id => deleteProject(id));
            await Promise.all(promises);
            result = { success: true };
        } else {
            const status = confirmBulkAction === 'publish' ? 'published' : 'draft';
            result = await updateProjectsStatus(selectedIds, status, confirmBulkAction === 'publish');
        }

        setIsLoading(false);
        setConfirmBulkAction(null);
        if (result?.success) {
            setSelectedIds([]);
            router.refresh();
        }
    };

    const statusColors: Record<string, string> = {
        draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs',
        published: 'bg-teal-500/10 text-teal-400 border-teal-500/20 text-xs',
        scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs',
        archived: 'bg-slate-800 text-slate-400 border-slate-700 text-xs'
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex justify-end">
                <Button
                    variant={isReordering ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                        setIsReordering(!isReordering);
                        if (!isReordering) {
                            // Sort by displayOrder locally when entering reorder mode? 
                            // Or assume list is already sorted by displayOrder if that was the default sort.
                            // Ideally we might want to fetch and sort, but for now let's just enable drag.
                        }
                    }}
                    className={isReordering ? "bg-slate-800" : ""}
                >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {isReordering ? "Done Reordering" : "Reorder Projects"}
                </Button>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && !isReordering && (
                <div className="bg-teal-500 text-slate-950 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_50px_rgba(20,184,166,0.3)] animate-in slide-in-from-bottom-8 duration-500 z-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-950/20 rounded-full flex items-center justify-center font-black text-sm">
                            {selectedIds.length}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">proyectos seleccionados</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-slate-950 text-white hover:bg-slate-900 border-none font-bold text-[10px] uppercase tracking-widest px-4 h-9 rounded-xl transition-all"
                            onClick={() => handleBulkAction('publish')}
                            disabled={isLoading}
                        >
                            <FileUp className="h-4 w-4 mr-2 text-teal-400" /> Publicar
                        </Button>
                        <Button
                            size="sm"
                            className="bg-slate-950 text-white hover:bg-slate-900 border-none font-bold text-[10px] uppercase tracking-widest px-4 h-9 rounded-xl transition-all"
                            onClick={() => handleBulkAction('draft')}
                            disabled={isLoading}
                        >
                            <Archive className="h-4 w-4 mr-2 text-yellow-400" /> Borrador
                        </Button>
                        <Button
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700 border-none font-bold text-[10px] uppercase tracking-widest px-4 h-9 rounded-xl transition-all shadow-lg"
                            onClick={() => handleBulkAction('delete')}
                            disabled={isLoading}
                        >
                            <Trash className="h-4 w-4 mr-2" /> Eliminar
                        </Button>
                    </div>
                </div>
            )}

            <div className="bg-slate-950/50 rounded-lg shadow-sm border border-slate-800 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-900/30">
                            <tr>
                                <th className="px-4 py-3 w-[40px]">
                                    {!isReordering && (
                                        <button
                                            onClick={toggleSelectAll}
                                            className="text-slate-400 hover:text-black transition-colors"
                                        >
                                            {selectedIds.length === projects.length && projects.length > 0 ? (
                                                <CheckSquare className="h-5 w-5" />
                                            ) : (
                                                <Square className="h-5 w-5" />
                                            )}
                                        </button>
                                    )}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Views</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={projects.map(p => p.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody className="bg-slate-950/50 divide-y divide-slate-800">
                                {projects.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                                    <Plus className="h-8 w-8 text-slate-500" />
                                                </div>
                                                <p className="text-slate-400 mb-2">No projects found</p>
                                                <Link href="/dashboard/projects/create">
                                                    <Button>Create Project</Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map((project) => (
                                        <SortableRow
                                            key={project.id}
                                            project={project}
                                            selectedIds={selectedIds}
                                            toggleSelect={toggleSelect}
                                            statusColors={statusColors}
                                            handleDuplicate={handleDuplicate}
                                            handleDelete={handleDelete}
                                            isReordering={isReordering}
                                        />
                                    ))
                                )}
                            </tbody>
                        </SortableContext>
                    </table>
                </DndContext>
            </div>

            {/* Modal Dialogs */}
            <ConfirmDialog
                open={!!confirmDeleteId}
                onCancel={() => setConfirmDeleteId(null)}
                onConfirm={confirmSingleDelete}
                title="Eliminar Proyecto"
                message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción es irreversible y eliminará todos los datos asociados."
                confirmLabel="Sí, Eliminar"
                danger
            />

            <ConfirmDialog
                open={!!confirmBulkAction}
                onCancel={() => setConfirmBulkAction(null)}
                onConfirm={confirmBulkExecute}
                title={`Acción en Lote: ${confirmBulkAction === 'delete' ? 'Eliminar' : confirmBulkAction === 'publish' ? 'Publicar' : 'Pasar a Borrador'}`}
                message={`¿Confirmas que deseas aplicar esta acción a los ${selectedIds.length} proyectos seleccionados?`}
                confirmLabel="Confirmar Acción"
                danger={confirmBulkAction === 'delete'}
            />
        </div>
    );
}
