// app/(dashboard)/dashboard/inbox/loading.tsx
import { MessageSquare, Inbox, Hash } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
    return (
        <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-white border-t border-slate-200">

            {/* Panel 1 (Folders) Skeleton */}
            <div className="hidden md:flex flex-col border-r border-slate-200 bg-slate-50/50 w-64 transition-all duration-300 p-4 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-8 rounded-xl" />
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-4 w-16 mb-2" />
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-xl" />
                    ))}
                </div>

                <div className="space-y-3 pt-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-xl" />
                    ))}
                </div>
            </div>

            {/* Panel 2 (Chat List) Skeleton */}
            <div className="hidden md:flex w-80 lg:w-96 border-r border-slate-200 flex-col bg-white">
                <div className="p-4 border-b border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-24" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-full rounded-xl" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 flex-1 rounded-md" />
                        <Skeleton className="h-8 flex-1 rounded-md" />
                        <Skeleton className="h-8 flex-1 rounded-md" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="p-4 flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel 3 (Chat Window) Skeleton */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
                <div className="h-16 border-b border-slate-200 bg-white flex items-center p-4">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>

                <div className="flex-1 p-6 space-y-6">
                    <div className="flex gap-3 max-w-lg">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-20 flex-1 rounded-2xl rounded-tl-sm" />
                    </div>
                    <div className="flex gap-3 max-w-lg ml-auto flex-row-reverse">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-16 flex-1 rounded-2xl rounded-tr-sm bg-blue-100" />
                    </div>
                    <div className="flex gap-3 max-w-lg">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-24 flex-1 rounded-2xl rounded-tl-sm" />
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>

            {/* Panel 4 (Lead Profile) Skeleton */}
            <div className="hidden xl:flex w-80 border-l border-slate-200 flex-col bg-white p-6 space-y-6">
                <div className="flex flex-col items-center">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                    <Skeleton className="h-8 rounded-full" />
                    <Skeleton className="h-8 rounded-full" />
                </div>
                <Skeleton className="h-16 w-full mt-4" />
                <Skeleton className="h-full w-full mt-4" />
            </div>

        </div>
    );
}
