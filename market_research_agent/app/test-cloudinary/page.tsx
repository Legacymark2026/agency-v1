"use client";

import ImageUpload from "@/components/ui/image-upload";
import { useState } from "react";

export default function TestCloudinaryPage() {
    const [url, setUrl] = useState("");

    return (
        <div className="p-10 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Cloudinary Test</h1>

            <div className="bg-gray-100 p-4 rounded mb-4">
                <p className="font-mono text-xs mb-2">
                    Cloud Name: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "MISSING"}
                </p>
            </div>

            <ImageUpload
                value={url ? [url] : []}
                onChange={(url) => setUrl(url)}
                onRemove={() => setUrl("")}
            />

            {url && (
                <div className="mt-4 p-4 border rounded bg-green-50">
                    <p className="text-green-600 font-bold">Success!</p>
                    <p className="text-xs break-all">{url}</p>
                </div>
            )}
        </div>
    );
}
