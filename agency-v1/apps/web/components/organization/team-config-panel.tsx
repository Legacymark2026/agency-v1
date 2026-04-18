"use client";

import { useEffect, useState } from "react";
import { X, Users, Settings, TrendingUp, DollarSign, Target, Loader2, UserPlus, Trash2, Trophy, Plus, ShieldAlert, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTeamDetails, updateTeamConfig, createTeamBounty, deleteTeamBounty } from "@/actions/organization";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamConfigPanelProps {
    teamId: string | null;
    open: boolean;
    onClose: () => void;
}

export function TeamConfigPanel({ teamId, open, onClose }: TeamConfigPanelProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [team, setTeam] = useState<any>(null);

    // Form Stats
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editBudget, setEditBudget] = useState("");
    const [editHeadcount, setEditHeadcount] = useState("");

    // Bounties State
    const [newBountyTitle, setNewBountyTitle] = useState("");
    const [newBountyReward, setNewBountyReward] = useState("");
    const [creatingBounty, setCreatingBounty] = useState(false);

    useEffect(() => {
        if (open && teamId) {
            loadTeam();
        } else {
            setTeam(null);
        }
    }, [open, teamId]);

    const loadTeam = async () => {
        setLoading(true);
        const res = await getTeamDetails(teamId!);
        if (res.success && res.data) {
            setTeam(res.data);
            setEditName(res.data.name || "");
            setEditDesc(res.data.description || "");
            setEditBudget((res.data as any).monthlyBudget?.toString() || "");
            setEditHeadcount((res.data as any).maxHeadcount?.toString() || "");
        } else {
            toast.error(res.error || "Error al cargar el departamento");
            onClose();
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if(!teamId) return;
        setSaving(true);
        const res = await updateTeamConfig(teamId, {
            name: editName,
            description: editDesc,
            monthlyBudget: editBudget ? parseFloat(editBudget) : null,
            maxHeadcount: editHeadcount ? parseInt(editHeadcount) : null
        });
        if(res.success) {
            toast.success("Configuración del equipo actualizada.");
            loadTeam(); // reload local visual state
        } else {
            toast.error(res.error);
        }
        setSaving(false);
    };

    const handleCreateBounty = async () => {
        if(!teamId || !newBountyTitle || !newBountyReward) return;
        setCreatingBounty(true);
        // Assuming there is a current user context. We will use a mock super admin ID for presentation or fetch real userId if avail.
        // As a trick, we'll try to find any user from team.members or pass a robust fallback string.
        const mockUserId = team.members?.[0]?.user?.id || "admin-system-id"; 

        const res = await createTeamBounty(teamId, newBountyTitle, parseFloat(newBountyReward), mockUserId);
        if(res.success) {
            toast.success("Bounty publicado. ¡A motivar al equipo! 🏆");
            setNewBountyTitle("");
            setNewBountyReward("");
            loadTeam(); // refresh bounties
        } else {
            toast.error(res.error);
        }
        setCreatingBounty(false);
    };

    const handleDeleteBounty = async (id: string) => {
        const res = await deleteTeamBounty(id);
        if(res.success) {
            toast.success("Bounty eliminado.");
            loadTeam();
        } else {
            toast.error(res.error);
        }
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" 
                onClick={onClose}
            />

            {/* Panel */}
            <div 
                className={`fixed top-0 right-0 h-full w-[450px] bg-slate-950 border-l border-slate-800 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                            <Settings size={18} className="text-teal-500" /> 
                            Configuración de Equipo
                        </h2>
                        {team && <p className="text-xs text-slate-400 mt-0.5">{team.path}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <X size={20} />
                    </Button>
                </div>

                {loading || !team ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
                        <p>Cargando información segura...</p>
                    </div>
                ) : (
                    <Tabs defaultValue="general" className="flex-1 flex flex-col">
                        <div className="px-4 pt-4 border-b border-slate-800">
                            <TabsList className="bg-slate-900 border border-slate-800 w-full mb-4">
                                <TabsTrigger value="general" className="flex-1 text-xs data-[state=active]:bg-teal-950 data-[state=active]:text-teal-400">General</TabsTrigger>
                                <TabsTrigger value="members" className="flex-1 text-xs data-[state=active]:bg-teal-950 data-[state=active]:text-teal-400">Personal ({team.members?.length || 0})</TabsTrigger>
                                <TabsTrigger value="bounties" className="flex-1 text-xs data-[state=active]:bg-teal-950 data-[state=active]:text-teal-400">Bounties</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-6">
                                {/* TAB: GENERAL */}
                                <TabsContent value="general" className="space-y-4 mt-0 outline-none">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Nombre del Departamento</Label>
                                        <Input 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="bg-slate-900 border-slate-700 focus-visible:ring-teal-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Descripción Estratégica</Label>
                                        <textarea 
                                            value={editDesc}
                                            onChange={(e) => setEditDesc(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-md bg-slate-900 border-slate-700 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 p-3 text-slate-200"
                                            placeholder="Ej: Lidera la captación de leads en redes..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-xs">Presupuesto ($)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                                <Input 
                                                    type="number"
                                                    value={editBudget}
                                                    onChange={(e) => setEditBudget(e.target.value)}
                                                    className="bg-slate-900 border-slate-700 focus-visible:ring-teal-500 pl-8"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-xs">Límite de Personal</Label>
                                            <div className="relative">
                                                <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                                <Input 
                                                    type="number"
                                                    value={editHeadcount}
                                                    onChange={(e) => setEditHeadcount(e.target.value)}
                                                    className="bg-slate-900 border-slate-700 focus-visible:ring-teal-500 pl-8"
                                                    placeholder="Sin Límite"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                                            <p className="text-xs text-slate-400 font-medium">Headcount Actual</p>
                                            <p className={`text-2xl font-semibold mt-1 ${team.maxHeadcount && team.members.length >= team.maxHeadcount ? 'text-red-400' : 'text-slate-200'}`}>
                                                {team.members?.length || 0}
                                                {team.maxHeadcount && <span className="text-sm text-slate-500 ml-1">/ {team.maxHeadcount}</span>}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                                            <p className="text-xs text-slate-400 font-medium">Nivel de Jerarquía</p>
                                            <p className="text-2xl font-semibold text-slate-200 mt-1">L{team.level}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button variant="outline" className="w-full bg-red-950/50 text-red-400 hover:bg-red-900 hover:text-white border border-red-900/50">
                                            <Trash2 size={16} className="mr-2" /> Eliminar Equipo
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* TAB: MEMBERS */}
                                <TabsContent value="members" className="mt-0 outline-none">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-slate-300">Lista de Asignación</h3>
                                        <Button size="sm" variant="outline" className="h-7 text-xs bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-teal-400">
                                            <UserPlus size={14} className="mr-1" /> Reubicar Talento
                                        </Button>
                                    </div>

                                    {(!team.members || team.members.length === 0) ? (
                                        <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
                                            <Users size={24} className="mx-auto text-slate-600 mb-2" />
                                            <p className="text-sm text-slate-500">No hay usuarios asignados a este rubro.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {team.members.map((m: any) => (
                                                <div 
                                                    key={m.id} 
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'companyUser', id: m.id }));
                                                    }}
                                                    className="relative flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors cursor-grab active:cursor-grabbing group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border border-slate-700">
                                                            <AvatarImage src={m.user.image} />
                                                            <AvatarFallback className="bg-slate-800 text-xs text-slate-300">
                                                                {m.user.name?.substring(0, 2).toUpperCase() || 'US'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-200 leading-none">{m.user.name || 'Sin Nombre'}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{m.role.toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-slate-500 hover:text-teal-400 hover:bg-slate-800"
                                                            onClick={() => {
                                                                if (m.phoneExtension || m.user.phone) {
                                                                    window.open(`tel:${m.phoneExtension || m.user.phone}`, '_self');
                                                                } else {
                                                                    toast.warning("El usuario no tiene una extensión telefónica registrada.");
                                                                }
                                                            }}
                                                        >
                                                            <Phone size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-slate-800">
                                                            <X size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB: BOUNTIES / GAMIFICACION */}
                                <TabsContent value="bounties" className="mt-0 outline-none space-y-4">
                                    <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl">
                                        <Trophy size={20} className="text-amber-500 mb-2" />
                                        <h4 className="font-semibold text-amber-400 text-sm">Bounties de Desempeño</h4>
                                        <p className="text-xs text-amber-500/70 mt-1">
                                            Lanza recompensas económicas o premios por alcanzar metas críticas y acelera la urgencia del área.
                                        </p>
                                    </div>

                                    {/* Create Bounty Form */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-400">Nuevo Bounty (Objetivo)</Label>
                                            <Input 
                                                value={newBountyTitle}
                                                onChange={(e) => setNewBountyTitle(e.target.value)}
                                                className="h-8 text-xs bg-slate-950 border-slate-700" 
                                                placeholder="Ej: Cerrar la cuenta Enterprise X" 
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-slate-400">Premio ($)</Label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-2 top-2 h-3 w-3 text-slate-500" />
                                                    <Input 
                                                        value={newBountyReward}
                                                        onChange={(e) => setNewBountyReward(e.target.value)}
                                                        type="number" className="h-8 pl-6 text-xs bg-slate-950 border-slate-700" placeholder="500" 
                                                    />
                                                </div>
                                            </div>
                                            <Button 
                                                disabled={creatingBounty || !newBountyTitle}
                                                onClick={handleCreateBounty}
                                                className="h-8 self-end bg-amber-600 hover:bg-amber-500 text-white flex-1 text-xs"
                                            >
                                                {creatingBounty ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
                                                Lanzar Bounty
                                            </Button>
                                        </div>
                                    </div>

                                    {/* List of active bounties */}
                                    <div className="space-y-2 mt-4">
                                        <Label className="text-xs text-slate-500 font-semibold tracking-wider uppercase mb-2 block">Bounties Activos ({team.bounties?.length || 0})</Label>
                                        {team.bounties && team.bounties.length > 0 ? (
                                            team.bounties.map((b: any) => (
                                                <div key={b.id} className="relative bg-slate-900 border border-amber-500/30 rounded-lg p-3 flex justify-between items-start group">
                                                    <div className="pr-8">
                                                        <h5 className="text-sm font-medium text-slate-200">{b.title}</h5>
                                                        <p className="text-xl font-bold text-emerald-400 mt-1">${b.rewardAmount}</p>
                                                    </div>
                                                    <Button 
                                                        onClick={() => handleDeleteBounty(b.id)}
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-slate-500 hover:text-red-400 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
                                                <ShieldAlert size={20} className="mx-auto text-slate-700 mb-2" />
                                                <p className="text-xs text-slate-500">Mánager: Aún no has lanzado retos.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                        
                        <div className="p-4 border-t border-slate-800 mt-auto bg-slate-900/50">
                            <Button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                            >
                                {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                Guardar Cambios
                            </Button>
                        </div>
                    </Tabs>
                )}
            </div>
        </>
    );
}
