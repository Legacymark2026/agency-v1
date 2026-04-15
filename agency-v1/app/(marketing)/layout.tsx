import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { TopBar } from "@/components/layout/top-bar";
import { CustomCursor } from "@/components/layout/custom-cursor";
import { IAStatus } from "@/components/layout/ia-status";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <CustomCursor />
            <TopBar />
            <Header />
            <main className="flex-1">{children}</main>
            <div className="fixed bottom-8 right-8 z-50 hidden md:block">
                <IAStatus />
            </div>
            <Footer />
            <WhatsAppButton />
        </div>
    );
}
