/**
 * Project Service — Pure Domain Entities & Calculations
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export function calculateProjectProgress(tasks: TaskItem[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

export class ProjectDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly description: string = "",
    public readonly status: ProjectStatus = "PLANNING",
    public readonly budget: number = 0,
    public readonly tasks: TaskItem[] = [],
    public readonly createdAt: Date = new Date()
  ) {}

  public get progress(): number {
    return calculateProjectProgress(this.tasks);
  }

  public addTask(title: string): ProjectDomain {
    const newTask: TaskItem = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      title,
      completed: false,
    };
    return new ProjectDomain(
      this.id,
      this.companyId,
      this.name,
      this.description,
      this.status,
      this.budget,
      [...this.tasks, newTask],
      this.createdAt
    );
  }

  public completeTask(taskId: string): ProjectDomain {
    const updated = this.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t));
    const allDone = updated.length > 0 && updated.every((t) => t.completed);

    return new ProjectDomain(
      this.id,
      this.companyId,
      this.name,
      this.description,
      allDone ? "COMPLETED" : "IN_PROGRESS",
      this.budget,
      updated,
      this.createdAt
    );
  }
}
