'use client';

import { useState, useEffect } from 'react';
import { Bot, Wrench, Sparkles, Cpu, Play, RefreshCw, Layers, Zap, MessageSquare, Plus, Check } from 'lucide-react';
import { getAvailableAgentTools, getAgentPresets, runAgentExecution } from '@/actions/agent-hub';
import { toast } from 'sonner';

export function AgentHubDashboard() {
  const [activeTab, setActiveTab] = useState<'AGENTS' | 'TOOLS' | 'PRESETS' | 'PLAYGROUND'>('AGENTS');
  const [tools, setTools] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Playground state
  const [testAgentId, setTestAgentId] = useState('sales-executive');
  const [testMessage, setTestMessage] = useState('¿Puedes cotizarme 2 licencias de Plan Enterprise y buscar clientes en el CRM?');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [toolsRes, presetsRes] = await Promise.all([
        getAvailableAgentTools(),
        getAgentPresets()
      ]);

      if (toolsRes?.success && Array.isArray(toolsRes.tools)) {
        setTools(toolsRes.tools);
      }
      if (presetsRes?.success && Array.isArray(presetsRes.presets)) {
        setPresets(presetsRes.presets);
        setCategories(presetsRes.categories || []);
      }
    } catch {
      toast.error('Error al cargar datos del Hub de Agentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestExecution = async () => {
    if (!testMessage.trim()) return;
    setExecuting(true);
    setTestResponse(null);
    try {
      const res = await runAgentExecution(testAgentId, testMessage);
      if (res?.success) {
        setTestResponse(res);
        toast.success('Ejecución de agente completada');
      } else {
        toast.error(res?.error || 'Error durante la ejecución del agente');
      }
    } catch {
      toast.error('Error al conectar con ai-engine');
    } finally {
      setExecuting(false);
    }
  };

  const filteredPresets = selectedCategory === 'Todos'
    ? presets
    : presets.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6 p-6 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-teal-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-teal-400">
              <Bot className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              Hub Central de Agentes Especializados (v2.0 Enterprise)
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">Multi-Agent Swarm</span>
            </h2>
            <p className="text-xs text-slate-400">Orquestación de agentes autónomos, herramientas en tiempo real y memoria semántica</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sincronizar Hub</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('AGENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'AGENTS' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Agentes Activos ({presets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PRESETS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'PRESETS' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Galería Marketplace</span>
        </button>

        <button
          onClick={() => setActiveTab('TOOLS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'TOOLS' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Herramientas (Tool Calling) ({tools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PLAYGROUND')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'PLAYGROUND' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Playground de Pruebas</span>
        </button>
      </div>

      {/* TAB 1: PRESETS MARKETPLACE */}
      {(activeTab === 'PRESETS' || activeTab === 'AGENTS') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === cat ? 'bg-slate-700 text-white border border-teal-500/40' : 'bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => (
              <div key={preset.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-teal-500/40 transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-teal-400 border border-slate-700">
                      {preset.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white">{preset.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Herramientas:</span>
                    <span className="text-slate-300 font-bold">{preset.tools?.length || 0} vinculadas</span>
                  </div>
                  <button
                    onClick={() => {
                      setTestAgentId(preset.id);
                      setActiveTab('PLAYGROUND');
                      toast.success(`Agente '${preset.name}' seleccionado para pruebas`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-teal-600 transition-all border border-slate-700"
                  >
                    <Zap className="w-3.5 h-3.5 text-teal-400" />
                    <span>Probar en Playground</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TOOLS (TOOL CALLING) */}
      {activeTab === 'TOOLS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div key={tool.name} className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-teal-400">
                  <Wrench className="w-4 h-4" />
                  <span>{tool.name}</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">Ejecutable</span>
              </div>
              <p className="text-xs text-slate-300">{tool.description}</p>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Parámetros:</span>
                <pre className="text-teal-300/90 whitespace-pre-wrap">{JSON.stringify(tool.parameters, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PLAYGROUND */}
      {activeTab === 'PLAYGROUND' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              Entrada de Prueba para el Agente
            </h4>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Seleccionar Agente:</label>
              <select
                value={testAgentId}
                onChange={(e) => setTestAgentId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold outline-none focus:border-teal-500/50"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name} ({p.role})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Mensaje / Prompt del Usuario:</label>
              <textarea
                rows={4}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-teal-500/50"
              />
            </div>

            <button
              onClick={handleTestExecution}
              disabled={executing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-teal-500/20"
            >
              <Play className={`w-4 h-4 ${executing ? 'animate-spin' : ''}`} />
              <span>{executing ? 'Ejecutando Agente con Herramientas...' : 'Ejecutar Agente'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              Respuesta & Trazabilidad de Herramientas
            </h4>

            {testResponse ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/30 text-xs text-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-teal-400 block uppercase">Respuesta Generada:</span>
                  <p className="leading-relaxed">{testResponse.response}</p>
                </div>

                {testResponse.toolResult && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-2 uppercase">
                      <Wrench className="w-3.5 h-3.5" />
                      Herramienta Ejecutada ({testResponse.toolResult.toolName}):
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto">
                      {JSON.stringify(testResponse.toolResult.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 flex items-center justify-center text-xs text-slate-500">
                Presiona "Ejecutar Agente" para ver la respuesta y las herramientas activadas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
