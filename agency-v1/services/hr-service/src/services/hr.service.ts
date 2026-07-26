import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "hr-service");

export interface CreateEmployeeInput {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  salary?: number;
}

export class HrService {
  /**
   * Obtener empleados por empresa
   */
  static async getEmployees(companyId: string, department?: string, page = 1, limit = 25) {
    const where: Record<string, unknown> = { companyId };
    if (department) where.department = department;

    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { lastName: "asc" },
        take: limit,
        skip,
        include: {
          benefits: { where: { isActive: true } }
        }
      }),
      prisma.employee.count({ where })
    ]);

    return { employees, total, page, limit };
  }

  /**
   * Crear empleado con transacción atómica
   */
  static async createEmployee(input: CreateEmployeeInput) {
    return prisma.$transaction(async (tx: any) => {
      const employee = await tx.employee.create({
        data: {
          companyId: input.companyId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          jobTitle: input.jobTitle || "Staff",
          department: input.department || "General",
          salary: input.salary || 0,
          isActive: true
        }
      });

      await eventBus.publish("employee.created", {
        employeeId: employee.id,
        companyId: employee.companyId,
        email: employee.email,
        timestamp: new Date().toISOString()
      });

      return employee;
    });
  }
}
