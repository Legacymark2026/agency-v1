import { requireCompany } from "@/lib/company-utils";
import { getWorkflows, getAutomationAnalytics, getRecentExecutions } from "@/actions/automation";
import WorkflowListClient from "./workflow-list";

export const metadata = {
    title: "Automatización | Dashboard",
};

export default async function AutomationPage() {
    // This will redirect if no company
    const { companyId } = await requireCompany();

    const [workflows, analytics, recentExecutions] = await Promise.all([
        getWorkflows(companyId),
        getAutomationAnalytics(companyId),
        getRecentExecutions(companyId)
    ]);

    // Serialization for client component
    const serializedWorkflows = workflows.map(w => ({
        ...w,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
    }));

    return (
        <div className="ds-page">
            <WorkflowListClient
                initialWorkflows={serializedWorkflows as any}
                analytics={analytics as any}
                recentExecutions={recentExecutions as any}
            />
        </div>
    );
}
