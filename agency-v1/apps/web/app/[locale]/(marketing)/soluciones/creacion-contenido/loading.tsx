export default function LoadingCreacionContenido() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero skeleton — same dimensions as ContentHero */}
            <div className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50/80 via-white to-sky-50/60">
                {/* Ambient blobs */}
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-teal-100/60 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-100/60 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

                <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
                    {/* Badge */}
                    <div className="mb-8 h-8 w-56 rounded-full bg-teal-100 animate-pulse" />

                    {/* H1 */}
                    <div className="space-y-4 mb-8 w-full max-w-4xl">
                        <div className="h-14 md:h-20 lg:h-24 w-3/4 mx-auto rounded-2xl bg-slate-100 animate-pulse" />
                        <div className="h-14 md:h-20 lg:h-24 w-1/2 mx-auto rounded-2xl bg-slate-100 animate-pulse" style={{ animationDelay: '100ms' }} />
                    </div>

                    {/* Subtitle */}
                    <div className="h-8 w-72 rounded-xl bg-slate-100 animate-pulse mb-12" style={{ animationDelay: '150ms' }} />

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center">
                        <div className="h-14 w-48 rounded-xl bg-slate-800/80 animate-pulse" style={{ animationDelay: '200ms' }} />
                        <div className="h-14 w-52 rounded-xl bg-slate-100 animate-pulse" style={{ animationDelay: '250ms' }} />
                    </div>
                </div>
            </div>

            {/* Section skeletons below the fold (subtle, not distracting) */}
            <div className="py-20 bg-white">
                <div className="container px-4 md:px-6 space-y-4">
                    <div className="h-10 w-64 mx-auto rounded-xl bg-slate-100 animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
