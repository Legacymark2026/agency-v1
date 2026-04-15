"use client";

import { useState, KeyboardEvent, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExpertBasicInfo } from "./form-sections/ExpertBasicInfo";
import { ExpertIdentitySkills } from "./form-sections/ExpertIdentitySkills";
import { ExpertSocialNetworks } from "./form-sections/ExpertSocialNetworks";

const expertSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name is too long."),
    role: z.string().min(2, "Role is required.").max(100, "Role is too long."),
    bio: z.string().max(500, "Bio must be 500 characters or less.").optional(),
    imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
    socialLinks: z.array(z.object({
        platform: z.string(),
        url: z.string().url("Must be a valid URL."),
    })).optional(),
    badgeId: z.string().optional(),
    iconName: z.string().optional(),
    skills: z.array(z.string()).default([]), // Now handling strictly as array internally
    isVisible: z.boolean().default(true),
});

type ExpertFormValues = z.infer<typeof expertSchema>;

interface ExpertFormProps {
    initialData?: Omit<ExpertFormValues, "skills"> & { skills?: string };
    onSubmit: (data: any) => Promise<void>; // Any due to the string conversion needed by parent for legacy reasons
    onCancel: () => void;
    isLoading: boolean;
}

export function ExpertForm({ initialData, onSubmit, onCancel, isLoading }: ExpertFormProps) {
    // Determine initial skills array from legacy comma-separated string if provided
    const initialSkillsArray = useMemo(() => {
        if (!initialData?.skills) return [];
        return initialData.skills.split(',').map(s => s.trim()).filter(Boolean);
    }, [initialData?.skills]);

    const form = useForm<ExpertFormValues>({
        resolver: zodResolver(expertSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            role: initialData?.role || "",
            bio: initialData?.bio || "",
            imageUrl: initialData?.imageUrl || "",
            socialLinks: initialData?.socialLinks || [],
            badgeId: initialData?.badgeId || "",
            iconName: initialData?.iconName || "",
            skills: initialSkillsArray,
            isVisible: initialData?.isVisible ?? true,
        },
    });



    // Prepare data for submit
    const handleSubmit = async (data: ExpertFormValues) => {
        // Parent component expects skills as string for legacy handling
        const submitData = {
            ...data,
            skills: data.skills.join(", ")
        };
        await onSubmit(submitData);
    };

    return (
        <TooltipProvider>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 pb-8">

                    <ExpertBasicInfo />
                    <ExpertIdentitySkills isLoading={isLoading} />
                    <ExpertSocialNetworks isLoading={isLoading} />

                    {/* Floater footer actions */}
                    <div className="sticky bottom-0 left-0 right-0 p-4 -mx-6 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-end gap-3 rounded-b-lg shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
                        <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading} className="hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-sm font-mono text-[10px] tracking-widest uppercase font-bold">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-500 text-white border border-teal-500/50 rounded-sm px-8 shadow-md hover:shadow-lg transition-all font-mono text-[10px] tracking-widest uppercase font-bold">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : "Guardar Operativo"}
                        </Button>
                    </div>
                </form>
            </Form>
        </TooltipProvider>
    );
}
