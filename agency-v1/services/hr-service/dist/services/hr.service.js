"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "hr-service");
class HrService {
    /**
     * Obtener empleados por empresa
     */
    static async getEmployees(companyId, department, page = 1, limit = 25) {
        const where = { companyId };
        if (department)
            where.department = department;
        const skip = (page - 1) * limit;
        const [employees, total] = await Promise.all([
            database_1.prisma.employee.findMany({
                where,
                orderBy: { lastName: "asc" },
                take: limit,
                skip,
                include: {
                    benefits: { where: { isActive: true } }
                }
            }),
            database_1.prisma.employee.count({ where })
        ]);
        return { employees, total, page, limit };
    }
    /**
     * Crear empleado con transacción atómica
     */
    static async createEmployee(input) {
        return database_1.prisma.$transaction(async (tx) => {
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
exports.HrService = HrService;
//# sourceMappingURL=hr.service.js.map