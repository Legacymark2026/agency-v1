'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { getProjects } from "@/actions/projects";

interface RelatedProjectSelectorProps {
    value: string[];
    onChange: (value: string[]) => void;
}

export function RelatedProjectSelector({ value = [], onChange }: RelatedProjectSelectorProps) {
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getProjects();
                setProjects(data);
            } catch (e) {
                console.error("Failed to load projects", e);
            } finally {
                setLoading(false);
            }
        }
        if (open && projects.length === 0) {
            load();
        }
    }, [open, projects.length]);

    const handleSelect = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter(v => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {value.map((id) => {
                    const project = projects.find(p => p.id === id);
                    return (
                        <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                            {project?.title || "Loading..."}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full ml-1 hover:bg-gray-200"
                                onClick={() => handleSelect(id)}
                            >
                                <span className="sr-only">Remove</span>
                                <span aria-hidden>×</span>
                            </Button>
                        </Badge>
                    );
                })}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        Select Related Projects...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search projects..." />
                        <CommandList>
                            <CommandEmpty>No projects found.</CommandEmpty>
                            <CommandGroup>
                                {loading ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="animate-spin h-4 w-4" />
                                    </div>
                                ) : (
                                    projects.map((project) => (
                                        <CommandItem
                                            key={project.id}
                                            value={project.title}
                                            onSelect={() => handleSelect(project.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value.includes(project.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {project.title}
                                        </CommandItem>
                                    ))
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
