const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark' });

async function main() {
    const schema = fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf-8');
    const models = [];
    
    // Extract models and their @@map
    const modelRegex = /model\s+(\w+)\s+{([^}]+)}/g;
    let match;
    while ((match = modelRegex.exec(schema)) !== null) {
        const modelName = match[1];
        const body = match[2];
        const mapMatch = body.match(/@@map\("([^"]+)"\)/);
        if (mapMatch) {
            models.push({ modelName, newTable: mapMatch[1] });
        }
    }

    const dbTablesRaw = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    const oldTables = dbTablesRaw.map(t => t.tablename).filter(t => !t.startsWith('tbl_') && !t.startsWith('_'));

    const renames = [];
    const unmatchedOld = [];

    for (const old of oldTables) {
        // Try exact match with 'tbl_' + old
        let newTable = 'tbl_' + old;
        let matched = models.find(m => m.newTable === newTable);
        
        if (!matched) {
            // Try matching without underscores and case insensitive
            const normalizedOld = old.replace(/_/g, '').toLowerCase();
            matched = models.find(m => m.newTable.replace(/_/g, '').toLowerCase() === 'tbl' + normalizedOld);
        }

        // Hardcode remaining unmatched
        if (!matched) {
            if (old === 'AIAuditLog') matched = models.find(m => m.newTable === 'tbl_aiaudit_logs');
            if (old === 'AgentMemory') matched = models.find(m => m.newTable === 'tbl_agent_memorys');
            if (old === 'AgentSkillChain') matched = models.find(m => m.newTable === 'tbl_agent_skill_chains');
            if (old === 'AgentTeam') matched = models.find(m => m.newTable === 'tbl_agent_teams');
            if (old === 'AgentTeamMember') matched = models.find(m => m.newTable === 'tbl_agent_team_members');
            if (old === 'AgentTeamRun') matched = models.find(m => m.newTable === 'tbl_agent_team_runs');
            if (old === 'CustomObjectDefinition') matched = models.find(m => m.newTable === 'tbl_custom_object_definitions');
            if (old === 'CustomObjectField') matched = models.find(m => m.newTable === 'tbl_custom_object_fields');
            if (old === 'CustomObjectRelationship') matched = models.find(m => m.newTable === 'tbl_custom_object_relationships');
            if (old === 'CustomObjectPermission') matched = models.find(m => m.newTable === 'tbl_custom_object_permissions');
            if (old === 'accounts') matched = models.find(m => m.newTable === 'tbl_accounts');
            if (old === 'sessions') matched = models.find(m => m.newTable === 'tbl_sessions');
            if (old === 'users') matched = models.find(m => m.newTable === 'tbl_users');
            if (old === 'verification_tokens') matched = models.find(m => m.newTable === 'tbl_verification_tokens');
            if (old === 'user_profiles') matched = { newTable: 'tbl_user_profiles' };
            if (old === 'analytics_events') matched = { newTable: 'tbl_analytics_events' };
            if (old === 'experts') matched = { newTable: 'tbl_experts' };
            if (old === 'messages') matched = { newTable: 'tbl_messages' };
            if (old === 'conversations') matched = { newTable: 'tbl_conversations' };
            if (old === 'marketing_events') matched = { newTable: 'tbl_marketing_events' };
            if (old === 'mailing_list_subscribers') matched = { newTable: 'tbl_mailing_list_subscribers' };
            if (old === 'events') matched = { newTable: 'tbl_events' };
            if (old === 'inbox_macros') matched = { newTable: 'tbl_inbox_macros' };
            if (old === 'notifications') matched = { newTable: 'tbl_notifications' };
            if (old === 'email_blast_recipients') matched = { newTable: 'tbl_email_blast_recipients' };
            if (old === 'inbox_audit_logs') matched = { newTable: 'tbl_inbox_audit_logs' };
            if (old === 'agent_skills') matched = { newTable: 'tbl_agent_skills' };
            if (old === 'skill_templates') matched = { newTable: 'tbl_skill_templates' };
            if (old === 'video_editor_projects') matched = { newTable: 'tbl_video_editor_projects' };
            if (old === 'media_assets') matched = { newTable: 'tbl_media_assets' };
            if (old === 'video_render_jobs') matched = { newTable: 'tbl_video_render_jobs' };
        }

        if (matched) {
            renames.push({ oldTable: old, newTable: matched.newTable });
        } else {
            unmatchedOld.push(old);
        }
    }

    console.log("Applying renames...");
    for (const r of renames) {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${r.oldTable}" RENAME TO "${r.newTable}"`);
            console.log(`Renamed ${r.oldTable} to ${r.newTable}`);
        } catch (e) {
            console.error(`Failed to rename ${r.oldTable}:`, e.message);
        }
    }

    // Now rename join tables
    const joinTables = dbTablesRaw.map(t => t.tablename).filter(t => t.startsWith('_'));
    for (const jt of joinTables) {
        if (jt === '_prisma_migrations') continue;
        const newJt = 'tbl_' + jt;
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${jt}" RENAME TO "${newJt}"`);
            console.log(`Renamed join table ${jt} to ${newJt}`);
        } catch (e) {
            console.error(`Failed to rename ${jt}:`, e.message);
        }
    }

}

main().catch(console.error).finally(() => prisma.$disconnect());
