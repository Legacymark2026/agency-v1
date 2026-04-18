export function PerformanceMetrics() {
    const metrics = [
        { label: "Performance", score: 92, color: "bg-green-500" },
        { label: "Accessibility", score: 88, color: "bg-green-500" },
        { label: "Best Practices", score: 95, color: "bg-green-500" },
        { label: "SEO", score: 100, color: "bg-green-500" },
        { label: "PWA", score: 45, color: "bg-orange-500" },
    ];

    return (
        <div className="space-y-6">
            {metrics.map((metric) => (
                <div key={metric.label}>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{metric.label}</span>
                        <span className="text-sm font-bold">{metric.score}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${metric.color}`}
                            style={{ width: `${metric.score}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
