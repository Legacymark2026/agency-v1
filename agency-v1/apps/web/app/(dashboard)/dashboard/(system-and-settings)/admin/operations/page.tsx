import { getOperationsDashboardData } from "@/actions/operations";
import { OperationsDashboardClient } from "@/components/operations/operations-dashboard-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operations Command Center | LegacyMark",
  description: "Real-time tracking of projects, resources, and velocity.",
};

export default async function OperationsPage() {
  const result = await getOperationsDashboardData();

  if (!result.success) {
    return (
      <div className="p-8 text-red-400">
        Failed to load operations data. {result.error}
      </div>
    );
  }

  return <OperationsDashboardClient data={result.data} />;
}
