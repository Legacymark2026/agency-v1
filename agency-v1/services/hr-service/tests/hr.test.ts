import { describe, it, expect } from "vitest";
import { HrUseCases } from "../src/core/usecases/hr.usecases";
import { EmployeeDomain } from "../src/core/domain/hr.domain";
import { IHrRepositoryPort, IHrEventPublisherPort } from "../src/core/ports/hr.ports";

describe("HR Service — Hexagonal Architecture 5.0", () => {
  it("registers employee and computes statutory Colombian payroll deductions", async () => {
    const store = new Map<string, EmployeeDomain>();
    const published: any[] = [];

    const mockRepo: IHrRepositoryPort = {
      save: async (e) => { store.set(e.id, e); return e; },
      findById: async (id) => store.get(id) || null,
      findByCompany: async () => [],
    };

    const mockPub: IHrEventPublisherPort = {
      publishEvent: async (topic, event) => { published.push({ topic, event }); },
    };

    const useCases = new HrUseCases(mockRepo, mockPub);

    const emp = await useCases.registerEmployee({
      companyId: "comp-1",
      fullName: "Laura Gómez",
      email: "laura@empresa.com",
      baseSalary: 2500000,
    });

    expect(emp.id).toBeDefined();
    expect(published.some(e => e.topic === "hr.employee.registered")).toBe(true);

    const payroll = await useCases.generatePayroll(emp.id, 4);
    expect(payroll.healthDeduction).toBe(100000); // 4%
    expect(payroll.pensionDeduction).toBe(100000); // 4%
    expect(payroll.transportAllowance).toBe(162000); // transport allowance applied
    expect(payroll.netPay).toBeGreaterThan(2000000);
    expect(published.some(e => e.topic === "hr.payroll.calculated")).toBe(true);
  });
});
