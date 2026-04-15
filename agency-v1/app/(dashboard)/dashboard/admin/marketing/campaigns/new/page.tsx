import { CampaignWizard } from '@/components/marketing/campaign-wizard';

export const metadata = {
    title: 'Nueva Campaña | Torre de Control',
    description: 'Configura y lanza anuncios en múltiples plataformas desde una sola interfaz.',
};

export default async function NewCampaignPage() {
    return <CampaignWizard />;
}
