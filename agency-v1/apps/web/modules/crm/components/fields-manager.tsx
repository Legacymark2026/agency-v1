'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// import { createField, deleteField } from "@/actions/crm"; // TEMPORARY: Disabled until Prisma regenerates

const FIELD_TYPES = [
    { value: 'TEXT', label: 'Texto' },
    { value: 'NUMBER', label: 'Número' },
    { value: 'DATE', label: 'Fecha' },
    { value: 'SELECT', label: 'Lista Desplegable' },
    { value: 'BOOLEAN', label: 'Sí/No' },
    { value: 'USER_REF', label: 'Referencia a Usuario' },
    { value: 'TEAM_REF', label: 'Referencia a Equipo' },
];

export function FieldsManager({ definitionId, fields }: { definitionId: string, fields: any[] }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [type, setType] = useState('TEXT');
    const [required, setRequired] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TEMPORARY: Disabled until Prisma Client regenerates
        alert('Esta funcionalidad estará disponible después de reiniciar el servidor. Por favor, reinicia tu computadora y ejecuta "npx prisma generate" seguido de "npm run dev".');
        return;

        /* Original code - will be restored after Prisma regeneration
        setLoading(true);
        try {
            await createField(definitionId, { name, label, type, required });
            setOpen(false);
            setName('');
            setLabel('');
            setType('TEXT');
            setRequired(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Error al crear campo');
        } finally {
            setLoading(false);
        }
        */
    };

    const handleDelete = async (fieldId: string) => {
        // TEMPORARY: Disabled until Prisma Client regenerates
        alert('Esta funcionalidad estará disponible después de reiniciar el servidor.');
        return;

        /* Original code
        if (!confirm('¿Eliminar este campo?')) return;
        try {
            await deleteField(fieldId);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Error al eliminar campo');
        }
        */
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Campos del Objeto</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Campo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nuevo Campo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="field-name">Nombre Interno</Label>
                                <Input
                                    id="field-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="ej. deal_amount"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="field-label">Etiqueta</Label>
                                <Input
                                    id="field-label"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="ej. Monto del Deal"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="field-type">Tipo</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_TYPES.map(ft => (
                                            <SelectItem key={ft.value} value={ft.value}>
                                                {ft.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="field-required"
                                    checked={required}
                                    onChange={(e) => setRequired(e.target.checked)}
                                />
                                <Label htmlFor="field-required">Campo Obligatorio</Label>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Creando...' : 'Crear Campo'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {fields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No hay campos definidos. Agrega el primero.
                </div>
            ) : (
                <div className="border rounded-lg divide-y">
                    {fields.map(field => (
                        <div key={field.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div>
                                <div className="font-medium">{field.label}</div>
                                <div className="text-sm text-muted-foreground">
                                    {field.name} • {FIELD_TYPES.find(t => t.value === field.type)?.label}
                                    {field.required && <span className="ml-2 text-red-500">*</span>}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(field.id)}
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
