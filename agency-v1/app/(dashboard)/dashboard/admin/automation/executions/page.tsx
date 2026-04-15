import { prisma } from "@/lib/prisma";
import ExecutionList from "./execution-list";

export const metadata = {
    title: "Historial de Ejecuciones",
};

export default async function ExecutionsPage() {
    const executions = await prisma.workflowExecution.findMany({
        take: 50,
        orderBy: {
            startedAt: 'desc'
        },
        include: {
            workflow: {
                select: {
                    name: true
                }
            }
        }
    });

    const serializedExecutions = executions.map(e => ({
        ...e,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        // Logs is JSON, prisma returns it as flexible type, OK for client
    }));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Historial de Ejecuciones</h2>
                <div className="flex items-center space-x-2">
                    {/* Add Retry button later */}
                </div>
            </div>

            <ExecutionList executions={serializedExecutions} />
        </div>
    );
}
