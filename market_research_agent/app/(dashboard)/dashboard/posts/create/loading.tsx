export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto animate-pulse">
            {/* Header skeleton */}
            <div className="mb-6 flex items-center justify-between">
                <div className="h-8 w-48 bg-gray-200 rounded-md" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main editor skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                        <div className="h-10 bg-gray-100 rounded-md" />
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                        <div className="h-10 bg-gray-100 rounded-md" />
                    </div>

                    {/* RichText skeleton */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-2">
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="bg-gray-50 border-b p-2 flex gap-2">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="h-8 w-8 bg-gray-200 rounded" />
                                ))}
                            </div>
                            <div className="min-h-[300px] p-4 space-y-3">
                                <div className="h-4 bg-gray-100 rounded w-3/4" />
                                <div className="h-4 bg-gray-100 rounded w-full" />
                                <div className="h-4 bg-gray-100 rounded w-5/6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar skeleton */}
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <div className="h-5 w-32 bg-gray-200 rounded" />
                            <div className="h-10 bg-gray-100 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer skeleton */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between">
                <div className="h-10 w-24 bg-gray-200 rounded-md" />
                <div className="h-10 w-36 bg-gray-200 rounded-md" />
            </div>
        </div>
    );
}
