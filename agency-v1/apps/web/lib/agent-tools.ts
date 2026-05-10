import { tool } from "ai";
import { AIAgentTools, executeAgentTool } from "@/lib/services/ai-tools";

export function getToolDeclarations(
    enabledToolNames: string[],
    companyId: string,
    contactData: Record<string, unknown>,
    userContext: any
) {
    const tools: Record<string, any> = {};

    for (const name of enabledToolNames) {
        const toolDef = (AIAgentTools as any)[name];
        if (toolDef) {
            tools[name] = tool({
                description: toolDef.description,
                parameters: toolDef.parameters,
                execute: async (args: any) => {
                    // Enrich args with contact context
                    const enrichedArgs = {
                        ...args,
                        _contactEmail: args._contactEmail ?? contactData?.email,
                        _contactName: args._contactName ?? contactData?.firstName,
                    };
                    return await executeAgentTool(companyId, name, enrichedArgs, userContext);
                }
            });
        }
    }

    return tools;
}
