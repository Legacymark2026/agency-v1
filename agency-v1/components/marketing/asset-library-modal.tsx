"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Image as ImageIcon } from "lucide-react";
import { getCompanyAssets } from "@/actions/marketing/creative-assets";
import Image from "next/image";

interface AssetLibraryModalProps {
    open: boolean;
    onClose: () => void;
    onSelectAsset: (url: string) => void;
}

export function AssetLibraryModal({ open, onClose, onSelectAsset }: AssetLibraryModalProps) {
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (open) {
            setIsLoading(true);
            getCompanyAssets()
                .then(data => setAssets(data))
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [open]);

    const filteredAssets = assets.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-4xl bg-slate-950 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-teal-400" />
                        Asset Library (Media Hub)
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Selecciona imágenes o videos previamente aprobados para tu campaña.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md p-2">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input 
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-200" 
                        placeholder="Buscar por nombre..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="h-[60vh] overflow-y-auto pr-2 mt-4">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p>No se encontraron assets en el Media Hub</p>
                            <p className="text-xs mt-1">Sube archivos desde el Creative Studio primero.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4">
                            {filteredAssets.map(asset => (
                                <div 
                                    key={asset.id} 
                                    className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer hover:border-teal-500 transition-colors"
                                    onClick={() => {
                                        onSelectAsset(asset.url);
                                        onClose();
                                    }}
                                >
                                    <div className="aspect-square relative">
                                        {asset.type === 'VIDEO' ? (
                                            <video src={asset.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <Image src={asset.url} alt={asset.name || "Asset"} fill className="object-cover" unoptimized />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white">
                                                Seleccionar
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-2 truncate text-xs text-slate-300">
                                        {asset.name || "Archivo sin nombre"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
