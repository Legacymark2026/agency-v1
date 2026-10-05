/**
 * Centralized Policy Engine — Domain Models & Rule Evaluation Algorithms (PDP Core)
 * Strictly conforms to XACML 3.0 / ABAC (Attribute-Based Access Control) & Zero-Trust
 */

export type PolicyEffect = "ALLOW" | "DENY";
export type CombiningAlgorithm = "DENY_OVERRIDES" | "ALLOW_OVERRIDES" | "FIRST_APPLICABLE";

export interface SubjectAttributes {
  id: string;
  role: string;
  roles?: string[];
  tenantId?: string;
  companyId?: string;
  department?: string;
  clearanceLevel?: number;
  isMfaVerified?: boolean;
}

export interface ResourceAttributes {
  type: string; // e.g. 'INVOICE', 'TRANSACTION', 'PAYROLL', 'CLIENT_PII', 'POS_ORDER', 'SYSTEM'
  id?: string;
  tenantId?: string;
  companyId?: string;
  amount?: number;
  classification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  status?: string;
  ownerId?: string;
  metadata?: Record<string, any>;
}

export interface EnvironmentContext {
  currentTime?: Date;
  ipAddress?: string;
  isOffHours?: boolean;
  riskScore?: number;
  originatingService?: string;
  deviceFingerprint?: string;
  isDeviceFlaggedAbuser?: boolean;
}


export interface EvaluationRequest {
  subject: SubjectAttributes;
  action: string; // e.g. 'READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EMIT_DIAN', 'EXPORT'
  resource: ResourceAttributes;
  context?: EnvironmentContext;
}

export interface PolicyRule {
  id: string;
  name: string;
  effect: PolicyEffect;
  condition: (req: EvaluationRequest) => boolean;
  description: string;
  obligation?: string;
}

export interface Policy {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  combiningAlgorithm: CombiningAlgorithm;
  target?: {
    actions?: string[];
    resourceTypes?: string[];
  };
  rules: PolicyRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationResponse {
  decision: "PERMIT" | "DENY" | "NOT_APPLICABLE";
  matchingPolicies: string[];
  reasons: string[];
  obligations: string[];
  evaluationDurationMs: number;
  timestamp: string;
}

export class PolicyDecisionPoint {
  /**
   * Evaluates an authorization request against a set of policies
   */
  static evaluate(request: EvaluationRequest, policies: Policy[]): EvaluationResponse {
    const startTime = performance.now();
    const activePolicies = policies.filter(p => p.isActive);

    const matchingPolicies: string[] = [];
    const reasons: string[] = [];
    const obligations: string[] = [];

    let overallDecision: "PERMIT" | "DENY" | "NOT_APPLICABLE" = "NOT_APPLICABLE";

    for (const policy of activePolicies) {
      // Check Target match (actions, resourceTypes)
      if (policy.target?.actions && !policy.target.actions.includes("*") && !policy.target.actions.includes(request.action)) {
        continue;
      }
      if (policy.target?.resourceTypes && !policy.target.resourceTypes.includes("*") && !policy.target.resourceTypes.includes(request.resource.type)) {
        continue;
      }

      let policyHasDeny = false;
      let policyHasAllow = false;

      for (const rule of policy.rules) {
        try {
          const conditionPassed = rule.condition(request);
          if (conditionPassed) {
            matchingPolicies.push(`${policy.code}:${rule.id}`);
            if (rule.obligation) obligations.push(rule.obligation);

            if (rule.effect === "DENY") {
              policyHasDeny = true;
              reasons.push(`[DENY by ${policy.code}] ${rule.description}`);
              if (policy.combiningAlgorithm === "DENY_OVERRIDES" || policy.combiningAlgorithm === "FIRST_APPLICABLE") {
                break;
              }
            } else if (rule.effect === "ALLOW") {
              policyHasAllow = true;
              reasons.push(`[ALLOW by ${policy.code}] ${rule.description}`);
              if (policy.combiningAlgorithm === "FIRST_APPLICABLE") {
                break;
              }
            }
          }
        } catch (err: any) {
          policyHasDeny = true;
          reasons.push(`[DENY on Rule Error in ${policy.code}] ${err.message}`);
        }
      }

      // Apply Combining Algorithm per policy
      if (policy.combiningAlgorithm === "DENY_OVERRIDES") {
        if (policyHasDeny) {
          overallDecision = "DENY";
          break; // Zero-Trust Deny Overrides stops evaluation
        } else if (policyHasAllow) {
          overallDecision = "PERMIT";
        }
      } else if (policy.combiningAlgorithm === "ALLOW_OVERRIDES") {
        if (policyHasAllow) {
          overallDecision = "PERMIT";
        } else if (policyHasDeny) {
          overallDecision = "DENY";
        }
      } else if (policy.combiningAlgorithm === "FIRST_APPLICABLE") {
        if (policyHasDeny) {
          overallDecision = "DENY";
          break;
        } else if (policyHasAllow) {
          overallDecision = "PERMIT";
          break;
        }
      }
    }

    // Default Zero-Trust close: If no policy explicitly PERMITs, default to DENY
    if (overallDecision === "NOT_APPLICABLE") {
      overallDecision = "DENY";
      reasons.push("Zero-Trust Default Deny: No explicit policy granted access.");
    }

    const duration = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      decision: overallDecision,
      matchingPolicies,
      reasons,
      obligations: Array.from(new Set(obligations)),
      evaluationDurationMs: duration,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generates Built-in Enterprise Policies
   */
  static getBuiltinEnterprisePolicies(): Policy[] {
    const now = new Date();
    return [
      // 1. TENANT ISOLATION POLICY (P-001)
      {
        id: "pol-001",
        code: "POL_TENANT_ISOLATION",
        name: "Aislamiento Estricto Multi-Inquilino (Zero Leakage)",
        description: "Deniega automáticamente cualquier acceso a recursos pertenecientes a otra compañía salvo para SUPER_ADMIN.",
        version: "1.0.0",
        isActive: true,
        combiningAlgorithm: "DENY_OVERRIDES",
        target: { actions: ["*"], resourceTypes: ["*"] },
        rules: [
          {
            id: "R-001",
            name: "Cross-Tenant Access Denial",
            effect: "DENY",
            condition: (req) => {
              const resTenant = req.resource.tenantId || req.resource.companyId;
              const subTenant = req.subject.tenantId || req.subject.companyId;
              const isSuperAdmin = req.subject.role === "SUPER_ADMIN" || req.subject.roles?.includes("SUPER_ADMIN");
              if (!resTenant || !subTenant) return false;
              return resTenant !== subTenant && !isSuperAdmin;
            },
            description: "Violación de frontera de tenant detectada. El usuario no pertenece a la compañía del recurso.",
            obligation: "SECURITY_ALERT_CROSS_TENANT_ATTEMPT"
          }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 2. HIGH VALUE FINANCE DUAL-CONTROL (P-002)
      {
        id: "pol-002",
        code: "POL_HIGH_VALUE_FINANCE",
        name: "Control Dual de Operaciones Financieras de Alto Monto",
        description: "Exige rol SUPER_ADMIN o DIRECTOR DE FINANZAS para operaciones mayores a 10M COP con obligación de segundo factor.",
        version: "1.0.0",
        isActive: true,
        combiningAlgorithm: "DENY_OVERRIDES",
        target: { actions: ["APPROVE", "PAY", "TRANSFER", "DELETE"], resourceTypes: ["TRANSACTION", "INVOICE", "PAYROLL"] },
        rules: [
          {
            id: "R-002",
            name: "High Value Finance Authorization",
            effect: "DENY",
            condition: (req) => {
              const amount = req.resource.amount || 0;
              const isPrivileged = ["SUPER_ADMIN", "ADMIN", "FINANCE_DIRECTOR"].includes(req.subject.role);
              return amount > 10000000 && !isPrivileged;
            },
            description: "Monto superior a $10,000,000 COP requiere autorización ejecutiva o rol financiero avanzado.",
            obligation: "DUAL_APPROVAL_REQUIRED"
          },
          {
            id: "R-003",
            name: "High Value MFA Step-Up Obligation",
            effect: "ALLOW",
            condition: (req) => {
              const amount = req.resource.amount || 0;
              const isPrivileged = ["SUPER_ADMIN", "ADMIN", "FINANCE_DIRECTOR"].includes(req.subject.role);
              return amount > 10000000 && isPrivileged;
            },
            description: "Autorizado para rol financiero con requerimiento de MFA step-up.",
            obligation: "MFA_STEP_UP_REQUIRED"
          }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 3. DIAN STATUTORY EMISSION (P-003)
      {
        id: "pol-003",
        code: "POL_DIAN_STATUTORY",
        name: "Política de Emisión Estatutaria DIAN & RADIAN",
        description: "Solo roles autorizados pueden invocar transmisión fiscal SOAP a la DIAN o emitir eventos RADIAN.",
        version: "1.0.0",
        isActive: true,
        combiningAlgorithm: "DENY_OVERRIDES",
        target: { actions: ["EMIT_DIAN", "SEND_RADIAN", "EMIT_CREDIT_NOTE"], resourceTypes: ["INVOICE"] },
        rules: [
          {
            id: "R-004",
            name: "DIAN Emission Role Guard",
            effect: "DENY",
            condition: (req) => {
              const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BILLING_MANAGER"];
              return !allowedRoles.includes(req.subject.role);
            },
            description: "Rol no facultado para emitir documentos con validez tributaria o comercial ante la DIAN.",
            obligation: "AUDIT_LOG_STATUTORY_DENIAL"
          },
          {
            id: "R-005",
            name: "DIAN Emission Permission",
            effect: "ALLOW",
            condition: (req) => {
              const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BILLING_MANAGER"];
              return allowedRoles.includes(req.subject.role);
            },
            description: "Emisión tributaria DIAN validada y autorizada."
          }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 4. PII DATA GOVERNANCE POLICY (P-004)
      {
        id: "pol-004",
        code: "POL_PII_DATA_GOVERNANCE",
        name: "Gobernanza de Datos Personales (Habeas Data & PII)",
        description: "Regula el acceso y exportación masiva de datos sensibles de clientes.",
        version: "1.0.0",
        isActive: true,
        combiningAlgorithm: "DENY_OVERRIDES",
        target: { actions: ["EXPORT", "MASS_READ"], resourceTypes: ["CLIENT_PII", "PAYROLL"] },
        rules: [
          {
            id: "R-006",
            name: "Mass PII Export Restriction",
            effect: "DENY",
            condition: (req) => {
              return !["SUPER_ADMIN", "ADMIN", "DATA_PROTECTION_OFFICER"].includes(req.subject.role);
            },
            description: "Exportación masiva de PII restringida conforme a Ley 1581 de 2012.",
            obligation: "AUDIT_LOG_MANDATORY"
          },
          {
            id: "R-007",
            name: "Mass PII Export Authorization",
            effect: "ALLOW",
            condition: (req) => {
              return ["SUPER_ADMIN", "ADMIN", "DATA_PROTECTION_OFFICER"].includes(req.subject.role);
            },
            description: "Exportación autorizada con registro forense obligatorio.",
            obligation: "AUDIT_LOG_MANDATORY"
          }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 5. STANDARD RBAC FALLBACK (P-005)
      {
        id: "pol-005",
        code: "POL_STANDARD_RBAC",
        name: "Matriz Estándar de Acceso por Roles (RBAC Base)",
        description: "Garantiza acceso estándar de lectura y escritura operativa según el rol asignado.",
        version: "1.0.0",
        isActive: true,
        combiningAlgorithm: "ALLOW_OVERRIDES",
        target: { actions: ["READ", "WRITE", "CREATE", "UPDATE", "LIST"], resourceTypes: ["*"] },
        rules: [
          {
            id: "R-008",
            name: "SuperAdmin Universal Permit",
            effect: "ALLOW",
            condition: (req) => req.subject.role === "SUPER_ADMIN",
            description: "Acceso global concedido por perfil SuperAdmin."
          },
          {
            id: "R-009",
            name: "Tenant Admin Permit",
            effect: "ALLOW",
            condition: (req) => req.subject.role === "ADMIN",
            description: "Acceso concedido para administrador de tenant."
          },
          {
            id: "R-010",
            name: "Operational User Standard Read",
            effect: "ALLOW",
            condition: (req) => ["READ", "LIST"].includes(req.action) && ["USER", "COLLABORATOR", "MEMBER"].includes(req.subject.role),
            description: "Lectura concedida a usuario operativo."
          }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 6. FREE TRIAL ABUSE PREVENTION (POL_FREE_TRIAL_ABUSE_PREVENTION)
      {
        id: "pol-006",
        code: "POL_FREE_TRIAL_ABUSE_PREVENTION",
        name: "Prevención de Abuso de Pruebas Gratuitas por Device Fingerprint",
        description: "Deniega automáticamente operaciones de mutación o consumo de cómputo a dispositivos señalados por colisión de hardware en Free Trial.",
        version: "1.0.0",
        isActive: true,
        combiningAlgorithm: "DENY_OVERRIDES",
        target: { actions: ["CREATE", "UPDATE", "EXECUTE", "EMIT_DIAN", "AI_INFERENCE"], resourceTypes: ["*"] },
        rules: [
          {
            id: "R-011",
            name: "Trial Abuser Device Hard Deny",
            effect: "DENY",
            condition: (req) => {
              if (req.subject.role === "SUPER_ADMIN") return false;
              return Boolean(req.context?.isDeviceFlaggedAbuser);
            },
            description: "Dispositivo de hardware bloqueado por abuso recurrente de Free Trials.",
            obligation: "UPGRADE_SUBSCRIPTION_REQUIRED"
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ];
  }
}

