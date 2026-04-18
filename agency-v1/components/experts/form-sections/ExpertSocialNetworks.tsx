"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { SocialLinksInput } from "@/components/ui/social-links-input";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExpertSocialNetworks({ isLoading }: { isLoading: boolean }) {
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80 mt-6">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">Redes & Ajustes</h3>
            </div>

            <FormField
                control={form.control}
                name="socialLinks"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Enlaces Sociales</FormLabel>
                        <FormControl>
                            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                                <SocialLinksInput
                                    value={field.value || []}
                                    onChange={field.onChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                    <FormItem className={cn(
                        "flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm transition-all duration-300",
                        field.value ? "border-teal-500/30 bg-teal-500/10" : "border-slate-800 bg-slate-900/30"
                    )}>
                        <div className="space-y-0.5">
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                                Estado Público
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className={cn(
                                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                        field.value ? "bg-teal-400" : "hidden"
                                    )}></span>
                                    <span className={cn(
                                        "relative inline-flex rounded-full h-2.5 w-2.5",
                                        field.value ? "bg-teal-500" : "bg-gray-400"
                                    )}></span>
                                </span>
                            </FormLabel>
                            <FormDescription className={field.value ? "text-teal-400/70 text-xs font-mono tracking-widest uppercase" : "text-slate-500 text-xs font-mono tracking-widest uppercase"}>
                                {field.value
                                    ? "Visible: Aparecerá listado en la web."
                                    : "Oculto: Solo tú puedes verlo aquí."}
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-teal-500"
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
