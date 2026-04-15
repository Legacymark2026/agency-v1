'use client';

import { useState } from 'react';
import { Plus, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TeamMember {
    name: string;
    role: string;
    image?: string;
}

interface TeamMemberInputProps {
    value: TeamMember[];
    onChange: (value: TeamMember[]) => void;
}

export function TeamMemberInput({ value = [], onChange }: TeamMemberInputProps) {
    const [newItem, setNewItem] = useState<TeamMember>({ name: '', role: '' });
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
        if (newItem.name && newItem.role) {
            onChange([...value, newItem]);
            setNewItem({ name: '', role: '' });
            setIsAdding(false);
        }
    };

    const handleRemove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Team & Credits
                </label>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                >
                    <Plus className="h-4 w-4 mr-1" /> Add Member
                </Button>
            </div>

            <div className="space-y-3">
                {value.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white border rounded-lg group">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                            {member.image ? (
                                <img src={member.image} alt={member.name} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                                <User className="h-4 w-4" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemove(index)}
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                    </div>
                ))}

                {isAdding && (
                    <div className="p-3 bg-gray-50 border border-dashed rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                placeholder="Name (e.g. Jane Doe)"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                autoFocus
                            />
                            <Input
                                placeholder="Role (e.g. Lead Designer)"
                                value={newItem.role}
                                onChange={(e) => setNewItem({ ...newItem, role: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAdding(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAdd}
                                disabled={!newItem.name || !newItem.role}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
