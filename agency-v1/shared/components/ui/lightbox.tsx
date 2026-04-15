"use client";

import { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LightboxProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
}

export function Lightbox({ src, alt, isOpen, onClose }: LightboxProps) {
    const [scale, setScale] = useState(1);

    // Reset scale when opening new image
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setScale(1), 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleZoomIn = () => setScale(p => Math.min(p + 0.5, 3));
    const handleZoomOut = () => setScale(p => Math.max(p - 0.5, 1));

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = alt || 'image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            window.open(src, '_blank');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] h-[90vh] bg-transparent border-0 shadow-none p-0 flex flex-col items-center justify-center">
                <DialogTitle className="sr-only">{alt}</DialogTitle>

                {/* Controls */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <Button variant="secondary" size="icon" onClick={handleZoomIn} className="rounded-full bg-black/50 text-white hover:bg-black/70 border-0">
                        <ZoomIn size={20} />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={handleZoomOut} className="rounded-full bg-black/50 text-white hover:bg-black/70 border-0">
                        <ZoomOut size={20} />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={handleDownload} className="rounded-full bg-black/50 text-white hover:bg-black/70 border-0">
                        <Download size={20} />
                    </Button>
                    <DialogClose asChild>
                        <Button variant="secondary" size="icon" className="rounded-full bg-black/50 text-white hover:bg-black/70 border-0">
                            <X size={20} />
                        </Button>
                    </DialogClose>
                </div>

                {/* Image Container */}
                <div
                    className="relative w-full h-full flex items-center justify-center overflow-auto"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt}
                        className="transition-transform duration-200 ease-out max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                        style={{ transform: `scale(${scale})` }}
                    />
                </div>

                {alt && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm max-w-[80vw] truncate">
                        {alt}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Wrapper component to be used in MDX/Content pages
export function ContentImageLightbox({ contentRef }: { contentRef: React.RefObject<HTMLDivElement | null> }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState<{ src: string; alt: string } | null>(null);

    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        const handleImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
                const img = target as HTMLImageElement;
                // Ignore small icons or avatars if any
                if (img.width < 50 || img.height < 50) return;

                setCurrentImage({ src: img.src, alt: img.alt });
                setLightboxOpen(true);
            }
        };

        container.addEventListener('click', handleImageClick);

        // Add cursor-zoom-in to all images
        const images = container.querySelectorAll('img');
        images.forEach(img => img.classList.add('cursor-zoom-in', 'hover:opacity-90', 'transition-opacity'));

        return () => {
            container.removeEventListener('click', handleImageClick);
        };
    }, [contentRef]);

    if (!currentImage) return null;

    return (
        <Lightbox
            src={currentImage.src}
            alt={currentImage.alt}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
        />
    );
}
