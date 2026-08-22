import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let eventBus: EventBus | null = null;
try {
  eventBus = new EventBus(REDIS_URL, "calendar-service");
} catch {
  console.warn("Redis EventBus not available for notes-processor");
}

export class NotesProcessorService {
  /**
   * Procesa las minutas de una reunión, extrayendo los ítems de tareas pendientes (- [ ])
   * y publicando eventos en el EventBus para agregarlas a la base de datos de tareas.
   */
  static async processMeetingNotes(appointmentId: string, companyId: string, notes: string): Promise<any[]> {
    console.log(`[NotesProcessorService] Processing notes for appointment ${appointmentId}`);

    const lines = notes.split(/\r?\n/);
    const tasksFound: string[] = [];

    const taskRegex = /^\s*-\s*\[\s*\]\s*(.+)$/;

    lines.forEach(line => {
      const match = line.match(taskRegex);
      if (match && match[1]) {
        tasksFound.push(match[1].trim());
      }
    });

    const createdTasks: any[] = [];

    for (const taskText of tasksFound) {
      const taskId = `task-${Math.random().toString(36).substring(2, 7)}`;
      const taskObj = {
        id: taskId,
        companyId,
        title: taskText,
        description: `Creado automáticamente a partir de minutas de cita: ${appointmentId}`,
        status: "TODO",
        createdAt: new Date().toISOString()
      };

      createdTasks.push(taskObj);

      if (eventBus) {
        try {
          await eventBus.publish("task.created" as any, taskObj);
        } catch (e: any) {
          console.warn(`[NotesProcessorService] EventBus publish failed:`, e.message);
        }
      }
    }

    return createdTasks;
  }
}
