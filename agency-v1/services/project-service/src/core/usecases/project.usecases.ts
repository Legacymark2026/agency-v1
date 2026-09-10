/**
 * Project Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IProjectUseCases,
  IProjectRepositoryPort,
  IProjectEventPublisherPort,
  CreateProjectDTO,
} from "../ports/project.ports";
import { ProjectDomain } from "../domain/project.domain";

export class ProjectUseCases implements IProjectUseCases {
  constructor(
    private readonly repoPort: IProjectRepositoryPort,
    private readonly eventPublisher: IProjectEventPublisherPort
  ) {}

  public async createProject(dto: CreateProjectDTO): Promise<ProjectDomain> {
    const project = new ProjectDomain(
      "prj_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.name,
      dto.description || "",
      "PLANNING",
      dto.budget || 0
    );

    const saved = await this.repoPort.save(project);

    await this.eventPublisher.publishEvent("project.created", {
      projectId: saved.id,
      companyId: saved.companyId,
      name: saved.name,
    });

    return saved;
  }

  public async addTask(projectId: string, title: string): Promise<ProjectDomain> {
    const project = await this.repoPort.findById(projectId);
    if (!project) throw new Error(`Proyecto ${projectId} no encontrado`);

    const updated = project.addTask(title);
    const saved = await this.repoPort.save(updated);

    await this.eventPublisher.publishEvent("project.task.added", {
      projectId: saved.id,
      title,
    });

    return saved;
  }

  public async completeTask(projectId: string, taskId: string): Promise<ProjectDomain> {
    const project = await this.repoPort.findById(projectId);
    if (!project) throw new Error(`Proyecto ${projectId} no encontrado`);

    const updated = project.completeTask(taskId);
    const saved = await this.repoPort.save(updated);

    await this.eventPublisher.publishEvent("project.task.completed", {
      projectId: saved.id,
      taskId,
      progress: saved.progress,
      status: saved.status,
    });

    return saved;
  }

  public async getProjects(companyId: string): Promise<ProjectDomain[]> {
    return this.repoPort.findByCompany(companyId);
  }
}
