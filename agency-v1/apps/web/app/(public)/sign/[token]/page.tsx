import { prisma } from "@/lib/prisma";
import { SignProposalClient } from "@/components/proposals/sign-proposal-client";
import { Metadata } from "next";

// Enable ISR - revalidate every hour
export const revalidate = 3600;

interface Props {
    params: Promise<{ token: string }>;
}

// Generate metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { token } = await params;
    
    try {
        const proposal = await prisma.proposal.findUnique({
            where: { token },
            select: { title: true }
        });

        if (!proposal) return { title: 'Propuesta no encontrada' };

        return {
            title: `Firmar: ${proposal.title}`,
            robots: { index: false, follow: false }
        };
    } catch (error) {
        return { title: 'Propuesta no encontrada' };
    }
}

export default async function SignProposalPage({ params }: Props) {
    const { token } = await params;

    try {
        // Fetch proposal data on server - SERVER-SIDE RENDERING FOR SEO
        const proposal = await prisma.proposal.findUnique({
            where: { token },
            include: {
                company: {
                    select: { name: true }
                },
                items: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        price: true,
                        quantity: true
                    }
                }
            }
        });

        if (!proposal) {
            return (
                <div className="min-h-screen flex items-center justify-center" style={{ background: '#020817' }}>
                    <div className="text-center">
                        <p className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">Propuesta no encontrada</p>
                    </div>
                </div>
            );
        }

        return (
            <SignProposalClient
                proposal={{
                    id: proposal.id,
                    title: proposal.title,
                    company: proposal.company ? { name: proposal.company.name } : undefined,
                    items: proposal.items.map(item => ({
                        id: item.id,
                        title: item.title,
                        description: item.description || undefined,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    expiresAt: proposal.expiresAt?.toISOString()
                }}
            />
        );
    } catch (error) {
        console.error('Error loading proposal:', error);
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#020817' }}>
                <div className="text-center">
                    <p className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">Error al cargar la propuesta</p>
                </div>
            </div>
        );
    }
}
