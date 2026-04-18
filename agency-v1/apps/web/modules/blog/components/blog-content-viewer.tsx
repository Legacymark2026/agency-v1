"use client";

import { useRef } from "react";
import { ContentImageLightbox } from "@/components/ui/lightbox";

interface BlogContentViewerProps {
    content: string;
}

export function BlogContentViewer({ content }: BlogContentViewerProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div className="relative max-w-full overflow-hidden">
            <div
                ref={contentRef}
                className="prose prose-lg max-w-full break-words [overflow-wrap:anywhere] hyphens-auto
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:scroll-mt-20
                    prose-headings:text-teal-400
                    prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                    prose-p:text-slate-300 prose-p:leading-[1.8] prose-p:mb-7 [&_p:empty]:h-6 prose-p:font-light
                    prose-a:text-teal-400 prose-a:font-bold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-teal-300
                    prose-strong:text-slate-100 prose-strong:font-bold
                    prose-ul:list-disc prose-ul:pl-6 prose-ul:my-6
                    prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-6
                    prose-li:text-slate-300 prose-li:mb-3 prose-li:leading-[1.8] prose-li:font-light
                    prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:rounded-r-lg prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-4 prose-blockquote:italic prose-blockquote:text-slate-300 prose-blockquote:not-italic
                    prose-code:text-teal-300 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                    prose-pre:rounded-xl prose-pre:p-6 prose-pre:overflow-x-auto prose-pre:max-w-full
                    prose-img:rounded-xl prose-img:shadow-2xl prose-img:mx-auto prose-img:cursor-zoom-in prose-img:max-w-full prose-img:h-auto
                    prose-hr:border-slate-800
                    [&_blockquote]:bg-[rgba(13,148,136,0.07)] [&_blockquote]:border-teal-500
                    [&_code:not(pre_code)]:bg-[rgba(30,41,59,0.8)] [&_code:not(pre_code)]:border [&_code:not(pre_code)]:border-slate-700
                    [&_pre]:bg-[rgba(15,23,42,0.95)] [&_pre]:border [&_pre]:border-[rgba(30,41,59,0.8)]
                    [&_table]:border-collapse [&_table]:w-full [&_table]:block [&_table]:overflow-x-auto
                    [&_th]:bg-[rgba(15,23,42,0.8)] [&_th]:border [&_th]:border-slate-800 [&_th]:px-4 [&_th]:py-3 [&_th]:text-teal-400 [&_th]:font-black [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-widest
                    [&_td]:border [&_td]:border-slate-800 [&_td]:px-4 [&_td]:py-3 [&_td]:text-slate-400
                    [&_h1]:text-teal-400 [&_h2]:text-teal-400 [&_h3]:text-teal-400 [&_h4]:text-teal-400 [&_h5]:text-teal-400 [&_h6]:text-teal-400
                    [&_p]:text-slate-300 [&_li]:text-slate-300"
                dangerouslySetInnerHTML={{ __html: content }}
            />
            <ContentImageLightbox contentRef={contentRef} />
        </div>
    );
}
