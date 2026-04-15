"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExpertBasicInfo() {
    const form = useFormContext();
    const watchBio = form.watch("bio");

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <User className="w-5 h-5 text-teal-500" />
                <h3 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">Información Básica</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input className="pl-9 bg-slate-900/50 border-slate-800 text-slate-100 focus:bg-slate-900 transition-colors" placeholder="Ej. Alex Rivera" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rol / Posición</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input className="pl-9 bg-slate-900/50 border-slate-800 text-slate-100 focus:bg-slate-900 transition-colors" placeholder="Ej. Head of Engineering" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="bio"
                render={({ field }) => {
                    const bioLength = watchBio?.length || 0;
                    const isApproachingLimit = bioLength > 450;
                    const isOverLimit = bioLength > 500;

                    return (
                        <FormItem>
                            <FormLabel>Biografía Corta</FormLabel>
                            <FormControl>
                                <Textarea
                                    className="resize-none bg-slate-900/50 border-slate-800 text-slate-100 focus:bg-slate-900 transition-colors"
                                    placeholder="Breve descripción del perfil..."
                                    {...field}
                                    rows={3}
                                />
                            </FormControl>
                            <div className="flex justify-between items-center mt-1">
                                <FormMessage />
                                <div className="flex-1" />
                                {/* Smart Progress Bar */}
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-300",
                                                isOverLimit ? "bg-red-500" : isApproachingLimit ? "bg-amber-400" : "bg-teal-500"
                                            )}
                                            style={{ width: `${Math.min((bioLength / 500) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-medium tabular-nums font-mono uppercase tracking-widest",
                                        isOverLimit ? "text-red-500" : isApproachingLimit ? "text-amber-500" : "text-slate-500"
                                    )}>
                                        {bioLength}/500
                                    </span>
                                </div>
                            </div>
                        </FormItem>
                    );
                }}
            />
        </div>
    );
}
