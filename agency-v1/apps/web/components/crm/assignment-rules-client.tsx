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

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25 transition-all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-teal-400" /> Reglas de Enrutamiento configuradas
        </h2>
        <button 
          onClick={() => { resetForm(); setShowCreate(true); }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-teal-500/10 cursor-pointer font-black"
        >
          <Plus className="w-4 h-4" /> Crear Nueva Regla
        </button>
      </div>

      {/* Rules Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden" style={{ background: 'var(--ds-surface)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--ds-border)', background: 'rgba(15,23,42,0.6)' }}>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider w-16 font-mono">Orden</th>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider font-mono">Regla</th>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider font-mono">Condiciones</th>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider font-mono">Asignación</th>
              <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider w-24 font-mono">Estado</th>
              <th className="px-5 py-3 w-32" />
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--ds-border)' }}>
            {rules.map((rule, idx) => {
              const condList: any[] = typeof rule.conditions === "string" 
                ? JSON.parse(rule.conditions) 
                : (rule.conditions || []);

              return (
                <tr key={rule.id} className={`hover:bg-slate-900/20 transition-colors ${!rule.isActive ? "opacity-50" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 items-center">
                      <button 
                        onClick={() => handleMove(idx, "up")} 
                        disabled={idx === 0} 
                        className="text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleMove(idx, "down")} 
                        disabled={idx === rules.length - 1} 
                        className="text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-200 text-sm">{rule.name}</div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Prioridad #{idx + 1}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {condList.map((cond: any, cidx: number) => (
                        <div key={cidx} className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-medium">
                          <span className="font-semibold text-teal-400 font-mono">{cond.field}</span>
                          <span className="text-slate-500 text-[10px] uppercase font-bold font-mono">{cond.operator}</span>
                          <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-200">
                            {cond.value}
                          </span>
                        </div>
                      ))}
                      {condList.length === 0 && (
                        <span className="text-xs text-slate-500 italic">Sin condiciones (Asignación Directa)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {rule.roundRobinEnabled ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-1.5 w-fit">
                        <Users className="w-4 h-4" />
                        <span>
                          {rule.teamId 
                            ? `Round-Robin: ${teams.find(t => t.id === rule.teamId)?.name || "Equipo"}` 
                            : "Round-Robin: Todos los agentes"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 w-fit">
                        <User className="w-4 h-4" />
                        <span>
                          Asignación directa: {agents.find(a => a.id === rule.assignedUserId)?.name || "Agente"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleToggle(rule.id, rule.isActive)} className="transition-colors cursor-pointer">
                      {rule.isActive ? (
                        <ToggleRight className="w-7 h-7 text-teal-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-700" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => handleOpenEdit(rule)} 
                        className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-900/60 transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(rule.id)} 
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-450 hover:bg-slate-900/60 transition-all cursor-pointer"
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
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-sm italic">
                  No hay reglas configuradas aún. Todos los leads entrantes se distribuirán en cola global rotativa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fallback Details */}
      <div className="ds-section flex justify-between items-center flex-wrap gap-4" style={{ borderColor: 'var(--ds-border-glow)', background: 'var(--ds-teal-dim)' }}>
        <div>
          <span className="font-bold text-slate-200 block mb-1 font-mono uppercase tracking-wider text-xs">Regla Global de Fallback</span>
          <p className="text-slate-400 text-xs leading-relaxed">
            Cualquier Lead que no coincida con las condiciones anteriores se enrutará equitativamente en cola Round-Robin entre todos los agentes de la organización.
          </p>
        </div>
        <div className="ds-badge ds-badge-teal py-1.5 px-3.5">
          Distribuido Activo
        </div>
      </div>

      {/* Editor Modal */}
      {showCreate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm" 
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div 
            className="relative z-10 rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ 
              background: 'rgba(15,20,35,0.98)', 
              border: '1px solid rgba(30,41,59,0.9)', 
              boxShadow: '0 0 60px rgba(0,0,0,0.6)' 
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-400" />
                {editRuleId ? "Editar Regla de Asignación" : "Nueva Regla de Asignación"}
              </h2>
              <button onClick={() => setShowCreate(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500 hover:text-slate-350 transition-colors" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Nombre de la regla *</label>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-mono text-xs text-slate-500 uppercase tracking-widest">Si el lead cumple las condiciones (AND):</label>
                  <button 
                    type="button" 
                    onClick={handleAddCondition} 
                    className="text-xs font-bold font-mono text-teal-400 hover:text-teal-350 uppercase tracking-wider cursor-pointer"
                  >
                    + Agregar Condición
                  </button>
                </div>

                <div className="space-y-2">
                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <select 
                          value={cond.field} 
                          onChange={(e) => handleConditionChange(idx, "field", e.target.value)} 
                          className="w-full text-xs font-semibold bg-transparent border-0 focus:ring-0 p-0 text-slate-200 cursor-pointer"
                        >
                          {FIELDS.map(f => <option key={f.value} value={f.value} className="bg-slate-950 text-white">{f.label}</option>)}
                        </select>
                        {cond.field === "custom" && (
                          <input 
                            value={cond.customField || ""} 
                            onChange={(e) => handleConditionChange(idx, "customField", e.target.value)} 
                            placeholder="Nombre del campo" 
                            className="w-full border-b border-slate-800 text-xs py-0.5 focus:outline-none focus:border-teal-500 bg-transparent text-slate-200" 
                          />
                        )}
                      </div>

                      <select 
                        value={cond.operator} 
                        onChange={(e) => handleConditionChange(idx, "operator", e.target.value)} 
                        className="w-28 text-xs bg-transparent border-0 focus:ring-0 p-0 text-slate-400 cursor-pointer"
                      >
                        {OPERATORS.map(op => <option key={op.value} value={op.value} className="bg-slate-950 text-white">{op.label}</option>)}
                      </select>

                      <input 
                        value={cond.value} 
                        onChange={(e) => handleConditionChange(idx, "value", e.target.value)} 
                        required
                        placeholder="Valor..." 
                        className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-xs text-slate-250 border-b border-slate-800 py-0.5 focus:border-teal-500" 
                      />

                      <button 
                        type="button" 
                        onClick={() => handleRemoveCondition(idx)} 
                        disabled={conditions.length === 1}
                        className="text-slate-500 hover:text-rose-450 disabled:opacity-30 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment Target Option */}
              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Entonces asignar de la siguiente manera:</label>
                
                <div className="flex gap-4">
                  <label 
                    className={`flex-1 flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                      assignType === "ROUND_ROBIN" 
                        ? "border-teal-500/50 bg-teal-500/5 text-teal-400" 
                        : "border-slate-800 bg-slate-950/50 hover:bg-slate-900/60 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`w-5 h-5 ${assignType === "ROUND_ROBIN" ? "text-teal-400" : "text-slate-500"}`} />
                      <div className="text-left">
                        <span className="text-xs font-black font-mono uppercase tracking-wider block text-slate-200">Round-Robin</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Distribución rotativa</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="assignType" 
                      value="ROUND_ROBIN" 
                      checked={assignType === "ROUND_ROBIN"} 
                      onChange={() => setAssignType("ROUND_ROBIN")} 
                      className="text-teal-500 focus:ring-teal-400"
                    />
                  </label>

                  <label 
                    className={`flex-1 flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                      assignType === "DIRECT" 
                        ? "border-teal-500/50 bg-teal-500/5 text-teal-400" 
                        : "border-slate-800 bg-slate-950/50 hover:bg-slate-900/60 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className={`w-5 h-5 ${assignType === "DIRECT" ? "text-teal-400" : "text-slate-500"}`} />
                      <div className="text-left">
                        <span className="text-xs font-black font-mono uppercase tracking-wider block text-slate-200">Directo</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">A agente específico</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="assignType" 
                      value="DIRECT" 
                      checked={assignType === "DIRECT"} 
                      onChange={() => setAssignType("DIRECT")} 
                      className="text-teal-500 focus:ring-teal-400"
                    />
                  </label>
                </div>

                {assignType === "ROUND_ROBIN" ? (
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Distribuir entre el equipo:</label>
                    <select 
                      value={teamId} 
                      onChange={(e) => setTeamId(e.target.value)} 
                      className={inputCls}
                    >
                      <option value="" className="bg-slate-950 text-slate-400">Todos los agentes activos de la organización</option>
                      {teams.map(t => <option key={t.id} value={t.id} className="bg-slate-950 text-white">{t.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Selecciona el agente *</label>
                    <select 
                      value={assignedUserId} 
                      onChange={(e) => setAssignedUserId(e.target.value)} 
                      required 
                      className={inputCls}
                    >
                      <option value="" disabled className="bg-slate-950 text-slate-450">Selecciona un agente...</option>
                      {agents.map(a => <option key={a.id} value={a.id} className="bg-slate-950 text-white">{a.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)} 
                  className="flex-1 py-3 rounded-xl border border-slate-850 text-slate-400 font-mono font-bold text-xs uppercase tracking-wider hover:border-slate-700 hover:text-white transition-all bg-slate-900/40 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-teal-500/15 font-black cursor-pointer"
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
