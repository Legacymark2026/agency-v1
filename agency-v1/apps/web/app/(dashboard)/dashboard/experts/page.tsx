"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { getAllExpertsAdmin, createExpert, updateExpert, deleteExpert, reorderExperts } from "@/actions/experts";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Skeleton } from "@/components/ui/skeleton";
import { ExpertCard } from "@/components/experts/ExpertCard";
import { ExpertForm } from "@/components/experts/ExpertForm";
import { ExpertStats } from "@/components/experts/ExpertStats";
import { ExpertToolbar } from "@/components/experts/ExpertToolbar";
import type { Expert } from "@/types/experts";



export default function ExpertsPage() {
    const [experts, setExperts] = useState<Expert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadExperts();

        // Keyboard Shortcut: Cmd/Ctrl + K for search
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('expert-search-input');
                if (searchInput) searchInput.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    async function loadExperts() {
        setIsLoading(true);
        try {
            const data = await getAllExpertsAdmin();
            // @ts-ignore
            setExperts(data);
        } catch (error) {
            toast.error("Failed to load experts.");
        } finally {
            setIsLoading(false);
        }
    }

    // --- Computed Stats & Filtered List ---
    const stats = useMemo(() => {
        const total = experts.length;
        const active = experts.filter(e => e.isVisible).length;
        const hidden = total - active;
        return { total, active, hidden };
    }, [experts]);

    const filteredExperts = useMemo(() => {
        return experts.filter(expert => {
            const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expert.role.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'all'
                ? true
                : filterStatus === 'active' ? expert.isVisible
                    : !expert.isVisible;
            return matchesSearch && matchesFilter;
        });
    }, [experts, searchQuery, filterStatus]);

    const isDragEnabled = searchQuery === "" && filterStatus === "all";

    // --- Handlers ---

    function openCreateSheet() {
        setEditingExpert(null);
        setIsSheetOpen(true);
    }

    function openEditSheet(expert: Expert) {
        setEditingExpert(expert);
        setIsSheetOpen(true);
    }

    function handleDuplicate(expert: Expert) {
        // Formateamos para que funcione con el modal de creación (eliminar IDs / timestamps no existe en form)
        const duplicatedData = {
            ...expert,
            id: undefined, // no id
            name: `${expert.name} (Copia)`,
            skills: expert.skills ? expert.skills.filter(s => typeof s === 'string') : []
        };
        // @ts-ignore // Setting initial form behavior for creation
        setEditingExpert(duplicatedData);
        setIsSheetOpen(true);
    }

    async function handleToggleVisibility(id: string, currentStatus: boolean) {
        // Optimistic UI Update
        const originalExperts = [...experts];
        setExperts(experts.map(e => e.id === id ? { ...e, isVisible: !currentStatus } : e));

        try {
            const res = await updateExpert(id, { isVisible: !currentStatus });
            if (res.success) {
                toast.success(currentStatus ? "Expert hidden." : "Expert is now visible.");
            } else {
                throw new Error(res.error);
            }
        } catch (error) {
            toast.error("Failed to update status.");
            setExperts(originalExperts); // Revert
        }
    }

    async function handleFormSubmit(data: any) {
        setIsSaving(true);
        // Transform skills string back to array and ensure socialLinks are strictly a JSON string
        const submitData = {
            ...data,
            skills: data.skills && typeof data.skills === 'string'
                ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
                : (Array.isArray(data.skills) ? data.skills : []),
            socialLinks: data.socialLinks ? JSON.stringify(data.socialLinks) : "[]"
        };

        try {
            if (editingExpert) {
                const res = await updateExpert(editingExpert.id, submitData);
                if (res.success) {
                    toast.success("Expert updated successfully.");
                } else {
                    throw new Error(res.error);
                }
            } else {
                const res = await createExpert({
                    ...submitData,
                    order: experts.length,
                });
                if (res.success) {
                    toast.success("Expert created successfully.");
                } else {
                    throw new Error(res.error);
                }
            }
            await loadExperts();
            setIsSheetOpen(false);
        } catch (error) {
            toast.error("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this expert?")) return;
        try {
            const res = await deleteExpert(id);
            if (res.success) {
                toast.success("Expert deleted.");
                setExperts(experts.filter(e => e.id !== id));
            } else {
                toast.error("Failed to delete expert.");
            }
        } catch (error) {
            toast.error("Error deleting expert.");
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setExperts((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Save new order
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    order: index
                }));

                reorderExperts(updates).catch(() => toast.error("Failed to save new order."));

                return newItems;
            });
        }
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-6 space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        </div>
                        Team Management
                    </h1>
                    <p className="text-slate-400 mt-1 text-lg font-mono text-xs uppercase tracking-widest">Manage the experts displayed on your "About Us" page</p>
                </div>
                <Button onClick={openCreateSheet} size="lg" className="shadow-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 rounded-sm px-6 font-mono text-xs uppercase tracking-widest font-bold">
                    <UserPlus size={16} className="mr-2" /> Add Expert
                </Button>
            </div>

            {/* Stats */}
            <ExpertStats total={stats.total} active={stats.active} hidden={stats.hidden} />

            {/* Toolbar */}
            <ExpertToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
            />

            {/* Content Area */}
            {isLoading ? (
                <div className="bg-slate-900/50 rounded-lg p-6 shadow-sm border border-slate-800 min-h-[400px]">
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-slate-800/80 bg-slate-900/40">
                                <Skeleton className="h-6 w-6 rounded-sm bg-slate-800" />
                                <Skeleton className="h-14 w-14 rounded-full bg-slate-800" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-5 w-[250px] bg-slate-800" />
                                    <Skeleton className="h-4 w-[200px] bg-slate-800" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-4 w-16 bg-slate-800" />
                                        <Skeleton className="h-4 w-20 bg-slate-800" />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4 border-t border-slate-800 sm:border-0 sm:pt-0">
                                    <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                                    <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                                    <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                                    <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-slate-950/80 rounded-lg p-6 min-h-[400px] border border-dashed border-slate-800">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={filteredExperts.map(e => e.id)}
                            strategy={verticalListSortingStrategy}
                            disabled={!isDragEnabled} // Disable dnd when filtering
                        >
                            {filteredExperts.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredExperts.map((expert) => (
                                        <ExpertCard
                                            key={expert.id}
                                            expert={expert}
                                            onEdit={openEditSheet}
                                            onDelete={handleDelete}
                                            onToggleVisibility={handleToggleVisibility}
                                            onDuplicate={handleDuplicate}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="p-4 rounded-full bg-slate-900 mb-4 border border-slate-800">
                                        <UserPlus className="h-10 w-10 text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-200">No experts found</h3>
                                    <p className="text-slate-500 max-w-sm mt-2 font-mono text-xs">
                                        {searchQuery || filterStatus !== 'all'
                                            ? "Try adjusting your search or filters."
                                            : "Get started by adding the first member of your team."}
                                    </p>
                                    {!searchQuery && filterStatus === 'all' && (
                                        <Button variant="ghost" onClick={openCreateSheet} className="mt-4 text-teal-500 hover:text-teal-400 hover:bg-teal-500/10 font-mono text-xs uppercase tracking-widest">
                                            Add your first expert
                                        </Button>
                                    )}
                                </div>
                            )}
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            {/* Create/Edit Sheet - Glassmorphism UI */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent
                    className="sm:max-w-[450px] overflow-y-auto bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl p-6 custom-scrollbar text-slate-200"
                    onInteractOutside={(e: any) => {
                        e.preventDefault();
                    }}
                >
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-slate-100 font-bold">{editingExpert ? "Edit Expert" : "Add New Expert"}</SheetTitle>
                        <SheetDescription className="text-slate-400 font-mono text-xs">
                            {editingExpert
                                ? "Make changes to the expert's profile here. Click save when you're done."
                                : "Fill in the details to add a new expert to your team."}
                        </SheetDescription>
                    </SheetHeader>

                    <ExpertForm
                        initialData={editingExpert ? {
                            name: editingExpert.name,
                            role: editingExpert.role,
                            bio: editingExpert.bio || "",
                            imageUrl: editingExpert.imageUrl || "",
                            socialLinks: editingExpert.socialLinks || [],
                            badgeId: editingExpert.badgeId || "",
                            iconName: editingExpert.iconName || "",
                            skills: editingExpert.skills && Array.isArray(editingExpert.skills) ? editingExpert.skills.join(",") : (editingExpert.skills || ""),
                            isVisible: editingExpert.isVisible !== undefined ? editingExpert.isVisible : true
                        } as any : undefined}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setIsSheetOpen(false)}
                        isLoading={isSaving}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}

