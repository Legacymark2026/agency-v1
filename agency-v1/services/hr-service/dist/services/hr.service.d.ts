export interface CreateEmployeeInput {
    companyId: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle?: string;
    department?: string;
    salary?: number;
}
export declare class HrService {
    /**
     * Obtener empleados por empresa
     */
    static getEmployees(companyId: string, department?: string, page?: number, limit?: number): Promise<{
        employees: any;
        total: any;
        page: number;
        limit: number;
    }>;
    /**
     * Crear empleado con transacción atómica
     */
    static createEmployee(input: CreateEmployeeInput): Promise<any>;
}
