"use client";

import { useState, useTransition } from "react";
import { UserRole } from "@/types/auth";
import { updateUserRole } from "@/actions/admin";
import { toast } from "sonner";

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
    { value: UserRole.SUPER_ADMIN, label: "SuperAdmin", color: "bg-red-100 text-red-700 border-red-200" },
    { value: UserRole.ADMIN, label: "ProjectManager", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    { value: UserRole.CONTENT_MANAGER, label: "Marketing / SEO", color: "bg-teal-100 text-teal-700 border-teal-200" },
    { value: UserRole.CLIENT_ADMIN, label: "Ventas", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: UserRole.CLIENT_USER, label: "Creativo", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

interface RoleSelectorProps {
    userId: string;
    currentRole: string;
    isSelf: boolean;
    customRoles?: any[];
}

export function RoleSelector({ userId, currentRole, isSelf, customRoles = [] }: RoleSelectorProps) {
    const [isPending, startTransition] = useTransition();
    const [selected, setSelected] = useState<string>(currentRole);
    const [open, setOpen] = useState(false);

    const dynamicRoles = customRoles.length > 0
        ? customRoles.map(r => ({
            value: r.id,
            label: r.name,
            color: `bg-${r.color || 'slate'}-100 text-${r.color || 'slate'}-700 border-${r.color || 'slate'}-200`
        }))
        : ROLE_OPTIONS;

    const currentOption = dynamicRoles.find((r) => r.value === selected)
        ?? { label: selected, color: "bg-gray-100 text-gray-600 border-gray-200" };

    const handleSelect = (newRole: string) => {
        if (newRole === selected) { setOpen(false); return; }

        setOpen(false);
        startTransition(async () => {
            const result = await updateUserRole(userId, newRole as UserRole);
            if (result.success) {
                setSelected(newRole);
                const roleLabel = dynamicRoles.find(r => r.value === newRole)?.label || newRole;
                toast.success(`Rol actualizado a ${roleLabel}`);
            } else {
                toast.error(result.error ?? "Error al actualizar el rol");
            }
        });
    };

    if (isSelf) {
        // No puedes cambiarte el rol a ti mismo
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${currentOption.color}`}>
                {currentOption.label}
                <span className="ml-1.5 text-[10px] opacity-60">(tú)</span>
            </span>
        );
    }

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen((v) => !v)}
                disabled={isPending}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-opacity cursor-pointer hover:opacity-80 ${currentOption.color} ${isPending ? "opacity-50 cursor-wait" : ""}`}
            >
                {isPending ? (
                    <span className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                ) : null}
                {currentOption.label}
                <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <>
                    {/* Overlay para cerrar */}
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

                    <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                        <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                            Cambiar rol
                        </p>
                        {dynamicRoles.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value as any)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${selected === option.value ? "font-semibold" : "text-gray-700"
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${option.color.replace("text-", "bg-").split(" ")[0].replace("bg-", "bg-")}`} />
                                {option.label}
                                {selected === option.value && (
                                    <svg className="ml-auto h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
