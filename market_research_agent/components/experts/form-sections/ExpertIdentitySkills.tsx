"use client";

import React, { useState, KeyboardEvent, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sparkles, Hash, Info, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ImageUpload from "@/components/ui/image-upload";
import { motion, AnimatePresence } from "framer-motion";

export function ExpertIdentitySkills({ isLoading }: { isLoading: boolean }) {
    const form = useFormContext();
    const [skillInput, setSkillInput] = useState("");
    const watchIconName = form.watch("iconName");

    // Dynamic Icon Preview
    const IconComponent = useMemo(() => {
        if (!watchIconName) return null;
        // @ts-ignore
        const Icon = LucideIcons[watchIconName];
        return Icon ? Icon : null;
    }, [watchIconName]);

    // Handle Skill Pills Addition
    const handleAddSkill = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newSkill = skillInput.trim();
            if (newSkill && newSkill.length > 0) {
                const currentSkills = form.getValues("skills") || [];
                if (!currentSkills.includes(newSkill)) {
                    form.setValue("skills", [...currentSkills, newSkill], { shouldDirty: true });
                }
                setSkillInput("");
            }
        }
    };

    const removeSkill = (skillToRemove: string) => {
        const currentSkills = form.getValues("skills") || [];
        form.setValue("skills", currentSkills.filter((s: string) => s !== skillToRemove), { shouldDirty: true });
    };

    // Auto-Format Badge ID (Uppercase) on Blur
    const handleBadgeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val) {
            form.setValue("badgeId", val.toUpperCase(), { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80 mt-6">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">Identidad & Habilidades</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="badgeId"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center gap-1.5">
                                <FormLabel>Badge ID</FormLabel>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-800 text-slate-300">Identificador oficial interno (Ej: OP-01)</TooltipContent>
                                </Tooltip>
                            </div>
                            <FormControl>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        className="pl-9 font-mono uppercase bg-slate-900/50 border-slate-800 text-slate-100 focus:bg-slate-900"
                                        placeholder="Ej. OP-01"
                                        {...field}
                                        onBlur={(e) => {
                                            field.onBlur();
                                            handleBadgeBlur(e);
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="iconName"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center gap-1.5">
                                <FormLabel>Icono (Lucide)</FormLabel>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-800 text-slate-300">Escribe el nombre de un icono de <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline text-teal-400">lucide.dev</a></TooltipContent>
                                </Tooltip>
                            </div>
                            <FormControl>
                                <div className="relative">
                                    {/* ICON REAL-TIME PREVIEW */}
                                    <div className="absolute left-3 top-2.5 flex items-center justify-center text-teal-500 font-bold">
                                        {IconComponent ? <IconComponent size={16} /> : <div className="h-4 w-4 border border-dashed border-slate-700 rounded-sm" />}
                                    </div>
                                    <Input className="pl-9 bg-slate-900/50 border-slate-800 text-slate-100 focus:bg-slate-900" placeholder="Ej. Shield, Rocket" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Interactive Skills System */}
            <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center gap-1.5">
                            <FormLabel>Habilidades Clave (Skills)</FormLabel>
                            <FormDescription className="text-[9px] font-mono tracking-widest uppercase m-0">Presiona Enter o Coma para agregar</FormDescription>
                        </div>
                        <FormControl>
                            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <AnimatePresence>
                                        {(field.value || []).map((skill: string) => (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                key={skill}
                                                className="flex items-center gap-1 bg-slate-800 border border-slate-700 shadow-sm px-2.5 py-1 rounded-sm font-mono tracking-tight text-xs font-medium text-slate-300 group hover:border-teal-500/50 transition-colors"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="text-slate-500 hover:text-red-400 focus:outline-none bg-slate-700 hover:bg-red-500/20 rounded-sm p-0.5 ml-1 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                <Input
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={handleAddSkill}
                                    className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-600 text-slate-200 text-sm font-mono"
                                    placeholder="Ej. Strategy, React, Ventas..."
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem className="pt-2">
                        <FormLabel>Fotografía / Avatar</FormLabel>
                        <FormControl>
                            <div className="p-1 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900/80 transition-colors">
                                <ImageUpload
                                    value={field.value ? [field.value] : []}
                                    disabled={isLoading}
                                    onChange={(url) => field.onChange(url)}
                                    onRemove={() => field.onChange("")}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
