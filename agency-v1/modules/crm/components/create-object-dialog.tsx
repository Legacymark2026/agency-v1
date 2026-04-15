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
import { createCustomObjectDefinition } from '@/actions/crm';

export function CreateObjectDialog({ companyId, triggerButton }: { companyId?: string, triggerButton?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return triggerButton ? <>{triggerButton}</> : (
            <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Crear Definición
            </Button>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!companyId) {
            alert('Error: No company ID provided');
            return;
        }

        try {
            await createCustomObjectDefinition({
                name: label || name,
                apiName: name.toLowerCase().replace(/\s+/g, '_'),
                companyId,
                description
            });

            setOpen(false);
            setName('');
            setLabel('');
            setDescription('');
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Error creating object definition');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="outline" className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Crear Definición
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Objeto Personalizado</DialogTitle>
                    <DialogDescription>
                        Define una nueva entidad de datos (ej. Vehículo, Póliza).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="obj-name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="obj-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="Ej. Propiedad"
                                autoFocus
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="obj-label" className="text-right">
                                Etiqueta
                            </Label>
                            <Input
                                id="obj-label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                className="col-span-3"
                                placeholder="Ej. Propiedades (Plural)"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="obj-desc" className="text-right">
                                Descripción
                            </Label>
                            <Input
                                id="obj-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
