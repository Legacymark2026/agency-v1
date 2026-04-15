'use client';

import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { CharacterCounter } from './character-counter';
import Image from 'next/image';

interface ImageUploadPreviewProps {
    imageUrl: string;
    imageAlt: string;
    onImageUrlChange: (url: string) => void;
    onImageAltChange: (alt: string) => void;
}

export function ImageUploadPreview({
    imageUrl,
    imageAlt,
    onImageUrlChange,
    onImageAltChange
}: ImageUploadPreviewProps) {
    const [isValidImage, setIsValidImage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!imageUrl || imageUrl === '') {
            // Avoid sync state update warning
            const timer = setTimeout(() => setIsValidImage(false), 0);
            return () => clearTimeout(timer);
        }

        setIsLoading(true);
        const img = new window.Image();
        img.onload = () => {
            setIsValidImage(true);
            setIsLoading(false);
        };
        img.onerror = () => {
            setIsValidImage(false);
            setIsLoading(false);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <label className="text-sm font-medium">Cover Image URL</label>
                <Input
                    value={imageUrl}
                    onChange={(e) => onImageUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full"
                />
            </div>

            {/* Image Preview */}
            {imageUrl && (
                <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                    {isLoading && (
                        <div className="flex items-center justify-center h-40 text-gray-500">
                            Loading preview...
                        </div>
                    )}
                    {!isLoading && isValidImage && (
                        <div className="space-y-3">
                            <div className="relative w-full h-48 bg-gray-100 rounded overflow-hidden">
                                <Image
                                    src={imageUrl}
                                    alt={imageAlt || 'Cover image preview'}
                                    className="object-cover"
                                    fill
                                    unoptimized
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Alt Text (SEO)</label>
                                    <CharacterCounter
                                        current={imageAlt?.length || 0}
                                        max={125}
                                    />
                                </div>
                                <Input
                                    value={imageAlt}
                                    onChange={(e) => onImageAltChange(e.target.value)}
                                    placeholder="Describe the image for accessibility and SEO"
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500">
                                    Describe what's in the image for screen readers and search engines
                                </p>
                            </div>
                        </div>
                    )}
                    {!isLoading && !isValidImage && (
                        <div className="flex items-center justify-center h-40 text-red-500 text-sm">
                            Invalid image URL. Please check the URL and try again.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
