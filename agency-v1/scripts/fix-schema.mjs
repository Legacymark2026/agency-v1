import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// 1. Remove the appended duplicate models block
const splitIndex = content.lastIndexOf('model AIAgent {');
if (splitIndex > 20000) { // ensure it's the duplicate at the end
    content = content.substring(0, splitIndex).trimEnd() + '\n';
}

// 2. Add 'conversations AgentConversation[]' to original AIAgent model
content = content.replace(
  '  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)\n\n  @@index([companyId])\n  @@index([isActive])\n  @@map("ai_agents")\n}',
  '  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)\n  conversations AgentConversation[]\n\n  @@index([companyId])\n  @@index([isActive])\n  @@map("ai_agents")\n}'
);

// 3. Add 'agent AIAgent? @relation...' to AgentConversation
content = content.replace(
  '  messages AgentMessage[]\n  user     User?          @relation(fields: [userId], references: [id], onDelete: SetNull)\n  company  Company        @relation(fields: [companyId], references: [id], onDelete: Cascade)\n\n  @@index([userId])',
  '  messages AgentMessage[]\n  user     User?          @relation(fields: [userId], references: [id], onDelete: SetNull)\n  company  Company        @relation(fields: [companyId], references: [id], onDelete: Cascade)\n  agent    AIAgent?       @relation(fields: [agentId], references: [id], onDelete: Cascade)\n\n  @@index([userId])'
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Schema fixed successfully!');
