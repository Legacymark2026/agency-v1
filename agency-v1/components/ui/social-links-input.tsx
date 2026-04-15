"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Linkedin, Twitter, Github, Globe, Plus, X } from "lucide-react";

export interface SocialLink {
    platform: string;
    url: string;
}

interface SocialLinksInputProps {
    value: SocialLink[];
    onChange: (links: SocialLink[]) => void;
    disabled?: boolean;
}

const platformIcons: Record<string, any> = {
    linkedin: Linkedin,
    twitter: Twitter,
    github: Github,
    website: Globe,
};

const platformLabels: Record<string, string> = {
    linkedin: "LinkedIn",
    twitter: "Twitter / X",
    github: "GitHub",
    website: "Website",
};

export function SocialLinksInput({ value, onChange, disabled, id: providedId }: SocialLinksInputProps & { id?: string }) {
    const generatedId = useId();
    const id = providedId || generatedId;

    const [selectedPlatform, setSelectedPlatform] = useState<string>("");
    const [url, setUrl] = useState("");

    const addLink = () => {
        if (selectedPlatform && url) {
            const newLinks = [...value, { platform: selectedPlatform, url }];
            onChange(newLinks);
            setSelectedPlatform("");
            setUrl("");
        }
    };

    const removeLink = (index: number) => {
        const newLinks = value.filter((_, i) => i !== index);
        onChange(newLinks);
    };

    const availablePlatforms = Object.keys(platformLabels).filter(
        (platform) => !value.some((link) => link.platform === platform)
    );

    return (
        <div className="space-y-4" id={id}>
            {/* Display existing links */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((link, index) => {
                        const Icon = platformIcons[link.platform] || Globe;
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <Icon className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                                    {platformLabels[link.platform] || link.platform}
                                </span>
                                <span className="text-sm text-gray-500 flex-1 truncate">{link.url}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => removeLink(index)}
                                    disabled={disabled}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add new link */}
            {availablePlatforms.length > 0 && (
                <div className="space-y-2">
                    <Label htmlFor={`${id}-platform`}>Add Social Link</Label>
                    <div className="flex gap-2">
                        <select
                            id={`${id}-platform`}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            disabled={disabled}
                        >
                            <option value="">Select platform...</option>
                            {availablePlatforms.map((platform) => (
                                <option key={platform} value={platform}>
                                    {platformLabels[platform]}
                                </option>
                            ))}
                        </select>
                        <Input
                            placeholder="https://..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={disabled || !selectedPlatform}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            onClick={addLink}
                            disabled={disabled || !selectedPlatform || !url}
                            size="icon"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
