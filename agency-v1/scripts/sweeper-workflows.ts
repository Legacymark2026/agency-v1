import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runSweeper() {
    console.log("🧹 [Sweeper] Starting Zombie Executions cleanup...");

    const ZOMBIE_TIMEOUT_MINUTES = 10;
    const timeoutThreshold = new Date(Date.now() - ZOMBIE_TIMEOUT_MINUTES * 60 * 1000);

    try {
        // Find executions stuck in RUNNING state older than the threshold
        const zombieExecutions = await prisma.workflowExecution.findMany({
            where: {
                status: "RUNNING",
                startedAt: {
                    lt: timeoutThreshold,
                },
            },
            select: { id: true, workflowId: true, startedAt: true },
        });

        if (zombieExecutions.length === 0) {
            console.log("✅ [Sweeper] No zombie executions found. System is clean.");
            return;
        }

        console.log(`⚠️ [Sweeper] Found ${zombieExecutions.length} zombie execution(s). Failing them...`);

        for (const exec of zombieExecutions) {
            await prisma.workflowExecution.update({
                where: { id: exec.id },
                data: {
                    status: "FAILED",
                    completedAt: new Date(),
                    logs: {
                        push: {
                            stepId: "SYSTEM",
                            result: { error: `Execution timed out or crashed. Marked as FAILED by Zombie Sweeper after ${ZOMBIE_TIMEOUT_MINUTES} minutes.` },
                            executedAt: new Date().toISOString(),
                        }
                    }
                },
            });
            console.log(`❌ [Sweeper] Failed zombie execution: ${exec.id} (Started at: ${exec.startedAt.toISOString()})`);
        }

        console.log("✅ [Sweeper] Cleanup completed.");
    } catch (error) {
        console.error("❌ [Sweeper] Failed to run sweeper:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if executed directly
if (require.main === module) {
    runSweeper().catch(console.error);
}
