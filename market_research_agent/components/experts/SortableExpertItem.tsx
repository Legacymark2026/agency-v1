"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Expert {
    id: string;
    name: string;
    role: string;
    bio: string | null;
    imageUrl: string | null;
    socialLinks: any;
    isVisible: boolean;
    order: number;
}

interface SortableExpertItemProps {
    expert: Expert;
    onEdit: (expert: Expert) => void;
    onDelete: (id: string) => void;
}

export function SortableExpertItem({ expert, onEdit, onDelete }: SortableExpertItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: expert.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center justify-between p-4 mb-3 transition-all duration-200 hover:shadow-md bg-white border-gray-200",
                isDragging && "shadow-xl border-blue-500/50 ring-2 ring-blue-500/20"
            )}
        >
            <div className="flex items-center gap-4 flex-1">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab hover:text-gray-900 text-gray-400 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                    <GripVertical size={20} />
                </div>

                {/* Avatar */}
                <div className="relative h-14 w-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    {expert.imageUrl ? (
                        <Image
                            src={expert.imageUrl}
                            alt={expert.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-bold text-lg">
                            {expert.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{expert.name}</h3>
                        {!expert.isVisible && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-gray-100 text-gray-500">
                                <EyeOff size={10} className="mr-1" /> Hidden
                            </Badge>
                        )}
                        {expert.isVisible && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-green-600 border-green-200 bg-green-50">
                                <Eye size={10} className="mr-1" /> Active
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">{expert.role}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(expert)}
                    className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                >
                    <Pencil size={14} />
                    <span className="sr-only">Edit</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(expert.id)}
                    className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                    <Trash2 size={14} />
                    <span className="sr-only">Delete</span>
                </Button>
            </div>
        </Card>
    );
}
