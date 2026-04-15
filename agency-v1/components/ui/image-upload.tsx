"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash, AlertCircle } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { toast } from "sonner";

interface ImageUploadProps {
    disabled?: boolean;
    onChange: (value: string) => void;
    onRemove: (value: string) => void;
    value: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    disabled,
    onChange,
    onRemove,
    value,
    id
}: ImageUploadProps & { id?: string }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const onUpload = (result: any) => {
        try {
            setIsUploading(false);
            if (result.event === "success") {
                onChange(result.info.secure_url);
                toast.success("Image uploaded successfully!");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
        }
    };

    const onError = (error: any) => {
        setIsUploading(false);
        console.error("Cloudinary error:", error);
        // Show detailed error
        const msg = error?.statusText || error?.message || "Check console for details";
        toast.error(`Upload failed: ${msg}`);
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div id={id}>
            <div className="mb-4 flex items-center gap-4">
                {value.map((url) => (
                    <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden border-2 border-gray-200">
                        <div className="z-10 absolute top-2 right-2">
                            <Button
                                type="button"
                                onClick={() => {
                                    onRemove(url);
                                    toast.success("Image removed");
                                }}
                                variant="secondary"
                                size="icon"
                                className="bg-red-500 hover:bg-red-600 text-white">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            className="object-cover"
                            alt="Expert profile"
                            src={url}
                        />
                    </div>
                ))}
            </div>

            {!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME === 'your-cloud-name' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">Cloudinary not configured</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Please set your NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env to enable image uploads.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <CldUploadWidget
                    onSuccess={onUpload}
                    onError={onError}
                    uploadPreset="ml_default"
                    options={{
                        maxFiles: 1,
                        maxFileSize: 5000000, // 5MB
                        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                        resourceType: "image",
                    }}
                >
                    {({ open }) => {
                        const onClick = () => {
                            setIsUploading(true);
                            open();
                        };

                        return (
                            <Button
                                type="button"
                                disabled={disabled || isUploading}
                                variant="secondary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onClick();
                                }}
                                className="w-full"
                            >
                                <ImagePlus className="h-4 w-4 mr-2" />
                                {isUploading ? "Uploading..." : "Upload an Image"}
                            </Button>
                        );
                    }}
                </CldUploadWidget>
            )}
            {/* Debugging Info - Removable later */}
            <p className="text-xs text-gray-400 mt-1">
                Cloud: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME} | Preset: ml_default
            </p>
            <p className="text-xs text-gray-500 mt-2">
                Recommended: Square image, at least 400x400px. Max 5MB.
            </p>
        </div>
    );
}

export default ImageUpload;
