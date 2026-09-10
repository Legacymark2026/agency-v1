import { describe, it, expect } from "vitest";
import { ProjectUseCases } from "../src/core/usecases/project.usecases";
import { calculateProjectProgress, ProjectDomain } from "../src/core/domain/project.domain";
import { IProjectRepositoryPort, IProjectEventPublisherPort } from "../src/core/ports/project.ports";

describe("ProjectService Hexagonal Architecture 5.0 (Inbound & Outbound Ports)", () => {
  it("calcula progreso de tareas de proyecto correctamente", () => {
    const tasks = [
      { id: "1", title: "Diseño", completed: true },
      { id: "2", title: "Backend", completed: true },
      { id: "3", title: "Frontend", completed: false },
      { id: "4", title: "QA", completed: false },
    ];
    expect(calculateProjectProgress(tasks)).toBe(50);
  });

  it("crea proyecto, agrega y completa tareas orquestadas por casos de uso", async () => {
    const store = new Map<string, ProjectDomain>();
    const publishedEvents: any[] = [];

    const mockRepo: IProjectRepositoryPort = {
      save: async (p) => {
        store.set(p.id, p);
        return p;
      },
      findById: async (id) => store.get(id) || null,
      findByCompany: async (cId) => Array.from(store.values()).filter((p) => p.companyId === cId),
    };

    const mockPublisher: IProjectEventPublisherPort = {
      publishEvent: async (topic, event) => {
        publishedEvents.push({ topic, event });
      },
    };

    const useCases = new ProjectUseCases(mockRepo, mockPublisher);

    // 1. Create project
    const project = await useCases.createProject({
      companyId: "comp-prj-1",
      name: "Portal de Pagos Web",
      budget: 15000000,
    });

    expect(project.id).toBeDefined();
    expect(project.status).toBe("PLANNING");
    expect(publishedEvents.some((e) => e.topic === "project.created")).toBe(true);

    // 2. Add task
    const withTask = await useCases.addTask(project.id, "Integrar pasarela PSE");
    expect(withTask.tasks.length).toBe(1);
    expect(withTask.progress).toBe(0);

    // 3. Complete task
    const completed = await useCases.completeTask(project.id, withTask.tasks[0].id);
    expect(completed.progress).toBe(100);
    expect(completed.status).toBe("COMPLETED");
    expect(publishedEvents.some((e) => e.topic === "project.task.completed")).toBe(true);
  });
});

