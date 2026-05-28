"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  createAssignmentRule, 
  updateAssignmentRule, 
  deleteAssignmentRule, 
  reorderAssignmentRules 
} from "@/actions/crm-assignment";
import { 
  Plus, X, Trash2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, 
  Settings, User, Users, ClipboardList, Check 
} from "lucide-react";

interface Rule {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  conditions: any; // string or JSON array
  assignedUserId: string | null;
  teamId: string | null;
  roundRobinEnabled: boolean;
}

interface TeamOption {
  id: string;
  name: string;
}

interface AgentOption {
  id: string;
  name: string;
}

interface Props {
  initialRules: any[];
  companyId: string;
  teams: TeamOption[];
  agents: AgentOption[];
}

const FIELDS = [
  { value: "source", label: "Fuente del Lead" },
  { value: "country", label: "País" },
  { value: "city", label: "Ciudad" },
  { value: "utmSource", label: "UTM Source" },
  { value: "utmMedium", label: "UTM Medium" },
  { value: "utmCampaign", label: "UTM Campaign" },
  { value: "custom", label: "Campo Personalizado (Formulario)" },
];

const OPERATORS = [
  { value: "EQUALS", label: "Es igual a" },
  { value: "CONTAINS", label: "Contiene" },
  { value: "STARTS_WITH", label: "Empieza con" },
  { value: "ENDS_WITH", label: "Termina con" },
];

export function AssignmentRulesClient({ initialRules, companyId, teams, agents }: Props) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [ruleName, setRuleName] = useState("");
  const [conditions, setConditions] = useState<{ field: string; customField?: string; operator: string; value: string }[]>([
    { field: "source", operator: "EQUALS", value: "" }
  ]);
  const [assignType, setAssignType] = useState<"DIRECT" | "ROUND_ROBIN">("ROUND_ROBIN");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [teamId, setTeamId] = useState(""); // "" means company-wide round-robin if ROUND_ROBIN is active
  const [editRuleId, setEditRuleId] = useState<string | null>(null);

  const resetForm = () => {
    setRuleName("");
    setConditions([{ field: "source", operator: "EQUALS", value: "" }]);
    setAssignType("ROUND_ROBIN");
    setAssignedUserId("");
    setTeamId("");
    setEditRuleId(null);
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { field: "source", operator: "EQUALS", value: "" }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, key: string, val: string) => {
    setConditions(conditions.map((c, i) => i === index ? { ...c, [key]: val } : c));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    setSaving(true);
    const parsedConditions = conditions.map(c => ({
      field: c.field === "custom" ? (c.customField || "") : c.field,
      operator: c.operator,
      value: c.value
    })).filter(c => c.field.trim() !== "");

    const ruleData = {
      name: ruleName,
      conditions: parsedConditions,
      roundRobinEnabled: assignType === "ROUND_ROBIN",
      assignedUserId: assignType === "DIRECT" ? assignedUserId : null,
      teamId: assignType === "ROUND_ROBIN" && teamId !== "" ? teamId : null,
    };

    let result;
    if (editRuleId) {
      result = await updateAssignmentRule(editRuleId, ruleData);
    } else {
      result = await createAssignmentRule(companyId, ruleData);
    }

    setSaving(false);
    if (result.success) {
      setShowCreate(false);
      resetForm();
      router.refresh();
      // Optimistic state update helper
      if (!editRuleId && result.rule) {
        setRules([...rules, result.rule as any]);
      } else if (editRuleId && result.rule) {
        setRules(rules.map(r => r.id === editRuleId ? (result.rule as any) : r));
      }
    }
  };

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, isActive: !currentStatus } : r));
    await updateAssignmentRule(ruleId, { isActive: !currentStatus } as any);
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta regla?")) return;
    setRules(rules.filter(r => r.id !== ruleId));
    await deleteAssignmentRule(ruleId);
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= rules.length) return;

    const updatedRules = [...rules];
    const temp = updatedRules[index];
    updatedRules[index] = updatedRules[nextIndex];
    updatedRules[nextIndex] = temp;

    setRules(updatedRules);
    await reorderAssignmentRules(companyId, updatedRules.map(r => r.id));
  };

  const handleOpenEdit = (rule: Rule) => {
    setEditRuleId(rule.id);
    setRuleName(rule.name);
    
    const condList: any[] = typeof rule.conditions === "string" 
      ? JSON.parse(rule.conditions) 
      : (rule.conditions || []);

    const mappedConditions = condList.map((c: any) => {
      const isPredefined = FIELDS.some(f => f.value === c.field);
      return {
        field: isPredefined ? c.field : "custom",
        customField: isPredefined ? undefined : c.field,
        operator: c.operator,
        value: c.value
      };
    });

    setConditions(mappedConditions.length > 0 ? mappedConditions : [{ field: "source", operator: "EQUALS", value: "" }]);
    setAssignType(rule.roundRobinEnabled ? "ROUND_ROBIN" : "DIRECT");
    setAssignedUserId(rule.assignedUserId || "");
    setTeamId(rule.teamId || "");
    setShowCreate(true);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-500" /> Reglas de Enrutamiento configuradas
        </h2>
        <button 
          onClick={() => { resetForm(); setShowCreate(true); }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus className="w-4 h-4" /> Crear Nueva Regla
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider w-16">Orden</th>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Regla</th>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Condiciones</th>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Asignación</th>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider w-24">Estado</th>
              <th className="px-5 py-3 w-32" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((rule, idx) => {
              const condList: any[] = typeof rule.conditions === "string" 
                ? JSON.parse(rule.conditions) 
                : (rule.conditions || []);

              return (
                <tr key={rule.id} className={`hover:bg-slate-50/50 transition-colors ${!rule.isActive ? "opacity-60" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 items-center">
                      <button 
                        onClick={() => handleMove(idx, "up")} 
                        disabled={idx === 0} 
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleMove(idx, "down")} 
                        disabled={idx === rules.length - 1} 
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900 text-sm">{rule.name}</div>
                    <span className="text-xs text-slate-400 font-mono">Prioridad #{idx + 1}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {condList.map((cond: any, cidx: number) => (
                        <div key={cidx} className="flex items-center gap-1 bg-slate-100 border border-slate-200/50 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium">
                          <span className="font-semibold text-indigo-700 font-mono">{cond.field}</span>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">{cond.operator}</span>
                          <span className="bg-white border border-slate-150 px-1.5 py-0.2 rounded font-semibold text-slate-800">
                            {cond.value}
                          </span>
                        </div>
                      ))}
                      {condList.length === 0 && (
                        <span className="text-xs text-slate-400 italic">Sin condiciones (Asignación Directa)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {rule.roundRobinEnabled ? (
                      <div className="flex items-center gap-2 text-sm text-indigo-700 font-semibold bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-1.5 w-fit">
                        <Users className="w-4 h-4" />
                        <span>
                          {rule.teamId 
                            ? `Round-Robin: ${teams.find(t => t.id === rule.teamId)?.name || "Equipo"}` 
                            : "Round-Robin: Todos los agentes"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold bg-slate-100 border border-slate-200/50 rounded-xl px-3 py-1.5 w-fit">
                        <User className="w-4 h-4" />
                        <span>
                          Asignación directa: {agents.find(a => a.id === rule.assignedUserId)?.name || "Agente"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleToggle(rule.id, rule.isActive)} className="transition-colors">
                      {rule.isActive ? (
                        <ToggleRight className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => handleOpenEdit(rule)} 
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-xs font-bold"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(rule.id)} 
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm italic">
                  No hay reglas configuradas aún. Todos los leads entrantes se distribuirán en cola global rotativa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fallback Details */}
      <div className="bg-slate-100 border border-slate-200/50 rounded-2xl p-5 text-sm text-slate-600 flex justify-between items-center">
        <div>
          <span className="font-bold text-slate-800 block">Regla Global de Fallback</span>
          Cualquier Lead que no coincida con las condiciones anteriores se enrutará equitativamente en cola Round-Robin entre todos los agentes de la organización.
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 font-semibold text-slate-800 text-xs shadow-sm">
          Distribuido Activo
        </div>
      </div>

      {/* Editor Modal */}
      {showCreate && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                {editRuleId ? "Editar Regla de Asignación" : "Nueva Regla de Asignación"}
              </h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Nombre de la regla *</label>
                <input 
                  value={ruleName} 
                  onChange={(e) => setRuleName(e.target.value)} 
                  required 
                  placeholder="Ej: Leads de Meta" 
                  className={inputCls} 
                />
              </div>

              {/* Conditions Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600">Si el lead cumple las condiciones (AND):</label>
                  <button 
                    type="button" 
                    onClick={handleAddCondition} 
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Agregar Condición
                  </button>
                </div>

                <div className="space-y-2">
                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <div className="flex-1 space-y-1.5">
                        <select 
                          value={cond.field} 
                          onChange={(e) => handleConditionChange(idx, "field", e.target.value)} 
                          className="w-full text-xs font-semibold bg-transparent border-0 focus:ring-0 p-0 text-slate-800"
                        >
                          {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        {cond.field === "custom" && (
                          <input 
                            value={cond.customField || ""} 
                            onChange={(e) => handleConditionChange(idx, "customField", e.target.value)} 
                            placeholder="Nombre del campo" 
                            className="w-full border-b border-slate-200 text-xs py-0.5 focus:outline-none focus:border-indigo-500 bg-transparent text-slate-800" 
                          />
                        )}
                      </div>

                      <select 
                        value={cond.operator} 
                        onChange={(e) => handleConditionChange(idx, "operator", e.target.value)} 
                        className="w-32 text-xs bg-transparent border-0 focus:ring-0 p-0 text-slate-500"
                      >
                        {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                      </select>

                      <input 
                        value={cond.value} 
                        onChange={(e) => handleConditionChange(idx, "value", e.target.value)} 
                        required
                        placeholder="Valor..." 
                        className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-xs text-slate-800 border-b border-slate-200 py-0.5 focus:border-indigo-500" 
                      />

                      <button 
                        type="button" 
                        onClick={() => handleRemoveCondition(idx)} 
                        disabled={conditions.length === 1}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment Target Option */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-600 block">Entonces asignar de la siguiente manera:</label>
                
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-between p-4 border rounded-2xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <div className="text-left">
                        <span className="text-sm font-bold text-slate-800 block">Round-Robin</span>
                        <span className="text-xs text-slate-400">Distribución rotativa equitativa</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="assignType" 
                      value="ROUND_ROBIN" 
                      checked={assignType === "ROUND_ROBIN"} 
                      onChange={() => setAssignType("ROUND_ROBIN")} 
                      className="text-indigo-600 focus:ring-indigo-400"
                    />
                  </label>

                  <label className="flex-1 flex items-center justify-between p-4 border rounded-2xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-slate-500" />
                      <div className="text-left">
                        <span className="text-sm font-bold text-slate-800 block">Directo</span>
                        <span className="text-xs text-slate-400">A un agente específico</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="assignType" 
                      value="DIRECT" 
                      checked={assignType === "DIRECT"} 
                      onChange={() => setAssignType("DIRECT")} 
                      className="text-indigo-600 focus:ring-indigo-400"
                    />
                  </label>
                </div>

                {assignType === "ROUND_ROBIN" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Distribuir entre el equipo:</label>
                    <select 
                      value={teamId} 
                      onChange={(e) => setTeamId(e.target.value)} 
                      className={inputCls}
                    >
                      <option value="">Todos los agentes activos de la organización</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Selecciona el agente *</label>
                    <select 
                      value={assignedUserId} 
                      onChange={(e) => setAssignedUserId(e.target.value)} 
                      required 
                      className={inputCls}
                    >
                      <option value="" disabled>Selecciona un agente...</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)} 
                  className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? "Guardando…" : <>Guardar Regla <Check className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
