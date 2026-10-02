import { getExecutionById } from "@/actions/automation";
import { notFound } from "next/navigation";
import ExecutionDetailClient from "./execution-client";

export default async function ExecutionDetailsPage({ params }: { params: { id: string } }) {
    const execution = await getExecutionById(params.id);

    if (!execution) {
        notFound();
    }

    // Pass data to client component for interactivity and potential real-time polling
    return <ExecutionDetailClient initialExecution={execution} />;
}
