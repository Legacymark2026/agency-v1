import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicProposalClient } from "@/components/proposals/public-proposal-client";
import { Metadata } from "next";
import { AlertCircle } from "lucide-react";

// Enable ISR - revalidate every hour
export const revalidate = 3600;

interface Props {
    params: Promise<{ token: string }>;
}

// Generate metadata for public proposal pages
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { token } = await params;
    
    try {
        const proposal = await (prisma.proposal as any).findUnique({
            where: { token },
            select: {
                title: true,
                description: true,
            }
        });

        if (!proposal) return { title: 'Propuesta no encontrada' };

        return {
            title: `${proposal.title} | Propuesta Comercial`,
            description: proposal.description || 'Propuesta comercial segura y protegida',
            robots: { index: false, follow: false }, // Don't index proposals
        };
    } catch (error) {
        return { title: 'Propuesta no encontrada' };
    }
}

export default async function PublicProposalPage({ params }: Props) {
    const { token } = await params;

    try {
        // Fetch proposal data on server - SERVER-SIDE RENDERING FOR SEO
        const proposal = await prisma.proposal.findUnique({
            where: { token },
            include: {
                company: {
                    select: {
                        name: true,
                        logoUrl: true,
                    }
                },
                items: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        quantity: true,
                        price: true,
                    }
                }
            }
        });

        if (!proposal) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-400 gap-4 px-4 text-center">
                    <AlertCircle className="h-16 w-16 text-red-500/80 mb-2" />
                    <h1 className="text-2xl font-bold text-white">Acceso Denegado</h1>
                    <p className="text-slate-400 max-w-md">Propuesta no encontrada o expirada.</p>
                </div>
            );
        }

        // Track VIEWED status if needed (Fire and forget - don't block rendering)
        if (proposal.status === "DRAFT" || proposal.status === "SENT") {
            try {
                // Note: This is non-blocking. We don't await it to keep page fast
                await (prisma.proposal as any).update({
                    where: { id: proposal.id },
                    data: { viewedAt: new Date() }
                }).catch(() => {
                    // Silently fail if tracking doesn't work
                });
            } catch (error) {
                // Ignore tracking errors
            }
        }

        return (
            <PublicProposalClient 
                proposal={{
                    id: proposal.id,
                    title: proposal.title,
                    token: proposal.token,
                    status: proposal.status,
                    value: proposal.value,
                    currency: proposal.currency,
                    contactName: proposal.contactName || undefined,
                    contactEmail: proposal.contactEmail || undefined,
                    createdAt: proposal.createdAt.toISOString(),
                    company: proposal.company ? {
                        name: proposal.company.name,
                        logoUrl: proposal.company.logoUrl || undefined
                    } : undefined,
                    content: (proposal as any).description || undefined,
                    items: proposal.items.map(item => ({
                        id: item.id,
                        title: item.title,
                        description: item.description || undefined,
                        quantity: item.quantity,
                        price: item.price,
                    }))
                }}
                onViewTracked={() => {}}
            />
        );
    } catch (error) {
        console.error('Error loading proposal:', error);
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-400 gap-4 px-4 text-center">
                <AlertCircle className="h-16 w-16 text-red-500/80 mb-2" />
                <h1 className="text-2xl font-bold text-white">Error al Cargar</h1>
                <p className="text-slate-400 max-w-md">Ocurrió un error al cargar el documento.</p>
            </div>
        );
    }
}


