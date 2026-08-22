export declare class AgentTeamService {
    /**
     * Obtener equipos de agentes configurados por empresa
     */
    static getTeams(companyId: string): Promise<any>;
    /**
     * Ejecuta una tarea colaborativa secuencial entre los agentes de un equipo
     */
    static runCollaborativeTeam(teamId: string, companyId: string, userMessage: string): Promise<any>;
}
