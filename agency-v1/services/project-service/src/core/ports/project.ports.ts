/**
 * Project Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ProjectDomain, TaskItem } from "../domain/project.domain";

export interface CreateProjectDTO {
  companyId: string;
  name: string;
  description?: string;
  budget?: number;
}

export interface IProjectUseCases {
  createProject(dto: CreateProjectDTO): Promise<ProjectDomain>;
  addTask(projectId: string, title: string): Promise<ProjectDomain>;
  completeTask(projectId: string, taskId: string): Promise<ProjectDomain>;
  getProjects(companyId: string): Promise<ProjectDomain[]>;
}

export interface IProjectRepositoryPort {
  save(project: ProjectDomain): Promise<ProjectDomain>;
  findById(id: string): Promise<ProjectDomain | null>;
  findByCompany(companyId: string): Promise<ProjectDomain[]>;
}

export interface IProjectEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
