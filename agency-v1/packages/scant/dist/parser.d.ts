export interface ParsedRoute {
    method: string;
    path: string;
    schemaVarName?: string;
    description?: string;
}
export interface ParsedSchemaField {
    type: string;
    required: boolean;
    format?: string;
}
export interface ParsedSchema {
    name: string;
    fields: Record<string, ParsedSchemaField>;
}
export interface ServiceSpecMetadata {
    title: string;
    version: string;
    routes: ParsedRoute[];
    schemas: Record<string, ParsedSchema>;
}
export declare class CodeParser {
    private serviceDir;
    private programFiles;
    private visitedFiles;
    constructor(serviceDir: string);
    private discoverFiles;
    parseService(): ServiceSpecMetadata;
    private analyzeNode;
    private isZodObjectCall;
    private parseZodObjectFields;
}
