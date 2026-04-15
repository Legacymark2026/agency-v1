import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { TopBar } from "@/components/layout/top-bar";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <TopBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
        </div>
    );
}
