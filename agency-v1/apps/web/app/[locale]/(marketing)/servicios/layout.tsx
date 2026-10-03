import { ServicesSidebar } from "@/components/sections/services-sidebar";

export default function ServicesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black pt-24 pb-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-4">
                    {/* Sidebar */}
                    <aside className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24">
                            <ServicesSidebar />
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="lg:col-span-3">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
