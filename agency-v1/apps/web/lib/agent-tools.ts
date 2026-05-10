import { tool } from "ai";
import { z } from "zod";
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
            
            // Add _human_approved parameter if the tool requires approval
            const parameters = toolDef.requiresApproval 
                ? toolDef.parameters.extend({ 
                    _human_approved: z.boolean().optional().describe("Set to true ONLY if the user has explicitly confirmed/approved this action in their last message.") 
                  })
                : toolDef.parameters;

            tools[name] = tool({
                description: toolDef.description,
                parameters,
                execute: async (args: any) => {
                    if (toolDef.requiresApproval && !args._human_approved) {
                        return {
                            success: false,
                            status: "APPROVAL_PENDING",
                            message: "Acción crítica bloqueada. Dile al usuario lo que vas a hacer y pídele que lo apruebe explícitamente. Si dice que sí, vuelve a ejecutar esta herramienta pasando _human_approved=true."
                        };
                    }

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
