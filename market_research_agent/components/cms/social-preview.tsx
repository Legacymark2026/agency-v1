'use client';

import { Image as ImageIcon } from 'lucide-react';

interface SocialPreviewProps {
    title: string;
    description: string;
    image?: string;
}

export function SocialPreview({ title, description, image }: SocialPreviewProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Social Share Preview</h3>

            <div className="max-w-[500px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                {/* Facebook/OpenGraph Style */}
                <div className="bg-gray-100 h-[260px] flex items-center justify-center overflow-hidden">
                    {image ? (
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                            <ImageIcon className="h-12 w-12 mb-2" />
                            <span className="text-sm">No cover image</span>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">LEGACYMARK.COM</p>
                    <h4 className="font-bold text-gray-900 line-clamp-1">{title || "Your Project Title"}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {description || "Your project description will appear here..."}
                    </p>
                </div>
            </div>
        </div>
    );
}
