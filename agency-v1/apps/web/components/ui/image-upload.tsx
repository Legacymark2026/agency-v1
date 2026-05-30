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
                <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-900/60 hover:bg-slate-900/90 text-white border border-slate-700 hover:border-teal-500/50 rounded-xl cursor-pointer transition-all shadow-sm">
                        <ImagePlus className="h-4 w-4 text-teal-400" />
                        <span className="text-xs font-semibold">Seleccionar Imagen Local</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                    toast.error("La imagen local no debe superar los 5MB.");
                                    return;
                                }
                                setIsUploading(true);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const base64 = reader.result as string;
                                    onChange(base64);
                                    toast.success("Imagen cargada exitosamente.");
                                    setIsUploading(false);
                                };
                                reader.onerror = () => {
                                    toast.error("Error al leer el archivo local.");
                                    setIsUploading(false);
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                    </label>
                    <p className="text-[10px] text-slate-500 font-mono text-center">
                        ⚡ Carga local activa (Base64) | Cloudinary no configurado
                    </p>
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
