"use client";

import { FaFacebook, FaLinkedin, FaTiktok } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

type LivePreviewProps = {
    platform: string;
    content: string;
    mediaUrl?: string;
    authorName: string;
    authorImage?: string;
};

export function SocialLivePreview({ platform, content, mediaUrl, authorName, authorImage }: LivePreviewProps) {
    const today = format(new Date(), "MMM d, yyyy");

    if (platform === "FACEBOOK") {
        return (
            <div className="bg-white text-black rounded-lg shadow-md max-w-sm mx-auto overflow-hidden text-sm">
                <div className="p-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={authorImage} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold text-[15px] leading-tight flex items-center gap-1">
                            {authorName}
                            <span className="text-blue-500 text-[12px]">✓</span>
                        </p>
                        <p className="text-gray-500 text-[12px] flex items-center gap-1">
                            <span>{today}</span>
                            <span>·</span>
                            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block text-xs text-center leading-3">🌍</span>
                        </p>
                    </div>
                </div>
                <div className="px-4 pb-2 whitespace-pre-wrap font-sans text-[15px]">
                    {content || "Escribe algo para ver cómo se verá tu publicación en Facebook..."}
                </div>
                {mediaUrl && (
                    <div className="w-full bg-gray-100 h-64 flex items-center justify-center overflow-hidden">
                        <img src={mediaUrl} alt="Media" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 text-gray-500">
                    <div className="flex items-center gap-1 text-[13px]">
                        <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">👍</span>
                        <span>0</span>
                    </div>
                    <div className="text-[13px]">
                        0 comentarios · 0 veces compartido
                    </div>
                </div>
            </div>
        );
    }

    if (platform === "LINKEDIN") {
        return (
            <div className="bg-white text-black rounded-lg shadow-sm border border-gray-200 max-w-sm mx-auto overflow-hidden text-sm font-sans">
                <div className="p-4 flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={authorImage} />
                        <AvatarFallback className="bg-slate-200 text-slate-700 font-bold">{authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold text-[14px] leading-tight">{authorName}</p>
                        <p className="text-gray-500 text-[12px] leading-tight">LegacyMark Administrator</p>
                        <p className="text-gray-500 text-[12px] flex items-center gap-1 mt-0.5">
                            <span>Just now</span> · <span>🌐</span>
                        </p>
                    </div>
                </div>
                <div className="px-4 pb-3 whitespace-pre-wrap text-[14px]">
                    {content || "Escribe algo para ver cómo se verá en LinkedIn..."}
                </div>
                {mediaUrl && (
                    <div className="w-full bg-gray-100 mb-2 h-64 flex items-center justify-center overflow-hidden">
                        <img src={mediaUrl} alt="Media" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="px-4 py-2 flex items-center gap-4 text-gray-500 text-[12px] border-t border-gray-100 mt-2">
                    <span>👍 Like</span>
                    <span>💬 Comment</span>
                    <span>🔄 Repost</span>
                    <span>✈️ Send</span>
                </div>
            </div>
        );
    }

    if (platform === "TIKTOK") {
        return (
            <div className="bg-black text-white rounded-xl shadow-lg max-w-[280px] mx-auto overflow-hidden relative aspect-[9/16] font-sans">
                {mediaUrl ? (
                    <img src={mediaUrl} alt="Media" className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-700">
                        <FaTiktok size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-bold opacity-40">Preview de Video</p>
                    </div>
                )}
                <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 left-4 right-16">
                    <p className="font-bold text-[15px] mb-1">@{authorName.replace(/\s+/g, '').toLowerCase()}</p>
                    <div className="whitespace-pre-wrap text-[13px] leading-snug break-words">
                        {content || "Descripción para TikTok con #hashtags"}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[12px]">
                        <span className="bg-white/20 px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                            🎵 Sonido original
                        </span>
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                            ❤️
                        </div>
                        <span className="text-xs font-bold">0</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                            💬
                        </div>
                        <span className="text-xs font-bold">0</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                            🔖
                        </div>
                        <span className="text-xs font-bold">0</span>
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 mt-2 rotate-slow">
                         <Avatar className="w-full h-full">
                            <AvatarImage src={authorImage} />
                            <AvatarFallback className="bg-zinc-800 text-xs">{authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-500 font-mono text-xs">
            Preview de plataforma no disponible
        </div>
    );
}
