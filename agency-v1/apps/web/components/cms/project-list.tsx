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
        <tr ref={setNodeRef} style={style} className={`hover:bg-slate-900 transition-colors group ${isDragging ? "bg-slate-900 shadow-md" : ""}`}>
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
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-black">
                                <MoreHorizontal size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <Link href={`/dashboard/projects/${project.id}`}>
                                <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem onClick={() => handleDuplicate(project.id)}>
                                <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            {project.status === 'published' && (
                                <DropdownMenuItem onClick={() => window.open(`/portfolio/${project.slug}`, '_blank')}>
                                    <ExternalLink className="h-4 w-4 mr-2" /> View Live
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(project.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
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

                // Persist order
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    displayOrder: index
                }));

                // Fire and forget (or handle loading)
                reorderProjects(updates).then(res => {
                    if (!res.success) alert("Failed to save order");
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
        } else {
            alert("Failed to duplicate project");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        setIsLoading(true);
        const result = await deleteProject(id);
        setIsLoading(false);
        if (result.success) {
            router.refresh();
        } else {
            alert("Failed to delete project");
        }
    };

    const handleBulkAction = async (action: 'publish' | 'draft' | 'delete') => {
        if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} projects?`)) return;

        setIsLoading(true);
        let result;

        if (action === 'delete') {
            const promises = selectedIds.map(id => deleteProject(id));
            await Promise.all(promises);
            result = { success: true };
        } else {
            const status = action === 'publish' ? 'published' : 'draft';
            result = await updateProjectsStatus(selectedIds, status, action === 'publish');
        }

        setIsLoading(false);
        if (result?.success) {
            setSelectedIds([]);
            router.refresh();
        } else {
            alert("Bulk action failed");
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
                <div className="bg-black text-white p-3 rounded-lg flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-5">
                    <span className="text-sm font-medium px-2">{selectedIds.length} projects selected</span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleBulkAction('publish')}
                            disabled={isLoading}
                        >
                            <FileUp className="h-4 w-4 mr-2" /> Publish
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleBulkAction('draft')}
                            disabled={isLoading}
                        >
                            <Archive className="h-4 w-4 mr-2" /> Draft
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleBulkAction('delete')}
                            disabled={isLoading}
                        >
                            <Trash className="h-4 w-4 mr-2" /> Delete
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
        </div>
    );
}
