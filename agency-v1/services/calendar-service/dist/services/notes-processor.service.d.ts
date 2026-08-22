export declare class NotesProcessorService {
    /**
     * Procesa las minutas de una reunión, extrayendo los ítems de tareas pendientes (- [ ])
     * y publicando eventos en el EventBus para agregarlas a la base de datos de tareas.
     */
    static processMeetingNotes(appointmentId: string, companyId: string, notes: string): Promise<any[]>;
}
