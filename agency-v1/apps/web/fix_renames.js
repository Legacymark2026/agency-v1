const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark' });

async function main() {
    const toRename = [
        ['tbl__PostToTag', '_PostToTag'],
        ['tbl__CategoryToPost', '_CategoryToPost'],
        ['tbl__AIAgentToKnowledgeBase', '_AIAgentToKnowledgeBase'],
        ['tbl__ProjectToProjectTag', '_ProjectToProjectTag'],
        ['tbl__ProjectToService', '_ProjectToService'],
        ['AgentTeamRun', 'tbl_agent_team_runs']
    ];

    for (const [oldName, newName] of toRename) {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`);
            console.log(`Renamed ${oldName} to ${newName}`);
        } catch (e) {
            console.error(`Failed to rename ${oldName}:`, e.message);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
