'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from 'lucide-react';
import { createTeam } from '@/actions/crm';

export function CreateTeamDialog({ parentId, companyId, triggerButton }: { parentId?: string, companyId?: string, triggerButton?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return the trigger button statically or nothing to avoid mismatch
        return triggerButton ? <>{triggerButton}</> :
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1"><Plus size={14} /></Button>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!companyId) {
            alert('Error: No company ID provided');
            setLoading(false);
            return;
        }

        try {
            await createTeam(name, companyId, parentId);
            setOpen(false);
            setName('');
            // Ideally refresh router here
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Error creating team');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                        <Plus size={14} />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Equipo</DialogTitle>
                    <DialogDescription>
                        Añade un sub-equipo a la jerarquía.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Equipo'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
