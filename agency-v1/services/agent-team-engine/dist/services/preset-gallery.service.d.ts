export interface AgentPreset {
    id: string;
    name: string;
    category: string;
    role: string;
    description: string;
    icon: string;
    systemPrompt: string;
    tools: string[];
    temperature: number;
}
export declare class PresetGalleryService {
    /**
     * Obtiene la lista de agentes prediseñados listos para desplegar
     */
    static getPresets(): AgentPreset[];
    /**
     * Obtiene las categorías de agentes disponibles
     */
    static getCategories(): string[];
}
