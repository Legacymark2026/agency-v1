"use client"

export function GridBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Dot grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }}
            />

            {/* Gradient overlays */}
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-gray-200/20 to-transparent blur-3xl" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-gray-200/20 to-transparent blur-3xl" />
        </div>
    )
}
