'use client';

/**
 * The Editing Nexus - Video Editor Dashboard
 * Componente de interfaz profesional para control híbrido
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  executeFullEditWorkflow,
  processUserCommand,
  getVideoProject,
  approveVersion,
  completeProject,
  deleteVideoProject,
  getAgentLogs
} from './actions';

// ============================================
// COMPONENTES DE LA INTERFAZ
// ============================================

interface Project {
  id: string;
  name: string;
  status: string;
  outputFormat: string;
  platform: string;
  style: string;
  duration: number;
  timeline?: any[];
  colorGrade?: any;
  textOverlays?: any[];
  versions?: any[];
  metadata?: any;
}

interface Props {
  projectId: string;
  companyId: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function VideoEditorDashboard({ projectId, companyId }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<{ cmd: string; result: string; agent?: string; time: Date }[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'color' | 'audio' | 'text' | 'commands'>('timeline');

  // Cargar proyecto inicial
  useEffect(() => {
    loadProject();
    loadLogs();
  }, [projectId]);

  const loadProject = async () => {
    const { success, project: p } = await getVideoProject(projectId);
    if (success && p) {
      setProject(p);
    }
  };

  const loadLogs = async () => {
    const { success, logs: l } = await getAgentLogs(projectId);
    if (success && l) {
      setLogs(l);
    }
  };

  // ============================================
  // HANDLERS DE ACCIONES
  // ============================================

  const handleExecuteWorkflow = async () => {
    setLoading(true);
    addToHistory('WORKFLOW', 'Iniciando flujo completo de edición...');
    
    const result = await executeFullEditWorkflow(projectId);
    
    if (result.success) {
      addToHistory('WORKFLOW', '✅ Edición completada exitosamente', 'system');
      await loadProject();
      await loadLogs();
    } else {
      addToHistory('WORKFLOW', `❌ Error: ${result.error}`, 'system');
    }
    
    setLoading(false);
  };

  const handleCommand = async () => {
    if (!command.trim()) return;
    
    const cmd = command;
    setCommand('');
    setLoading(true);
    addToHistory(cmd, '⏳ Procesando...');
    
    const result = await processUserCommand(projectId, cmd);
    
    if (result.success) {
      addToHistory(cmd, `✅ Completado por agente ${result.agent || 'auto'}`, result.agent);
      await loadProject();
    } else {
      addToHistory(cmd, `❌ ${result.error}`, 'system');
    }
    
    setLoading(false);
  };

  const handleApproveVersion = async (versionId: string) => {
    await approveVersion(versionId);
    addToHistory('APPROVE', `Versión aprobada`, 'system');
    await loadProject();
  };

  const handleComplete = async () => {
    await completeProject(projectId);
    addToHistory('COMPLETE', 'Proyecto marcado como completado', 'system');
    await loadProject();
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar este proyecto?')) {
      await deleteVideoProject(projectId);
      window.location.href = '/dashboard/video';
    }
  };

  const addToHistory = (cmd: string, result: string, agent?: string) => {
    setHistory(prev => [...prev.slice(-49), { 
      cmd, 
      result, 
      agent, 
      time: new Date() 
    }]);
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex gap-4 mt-2 text-sm opacity-90">
              <span>📐 {project.outputFormat}</span>
              <span>📱 {project.platform}</span>
              <span>🎬 {project.style}</span>
              <span>⏱️ {project.duration}s</span>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* ACCIONES PRINCIPALES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionCard
          title="🚀 Ejecutar IA"
          description="Ejecutar los 4 agentes"
          icon="🚀"
          onClick={handleExecuteWorkflow}
          loading={loading}
          disabled={project.status === 'completed'}
        />
        <ActionCard
          title="📊 Quality Check"
          description="Verificar calidad"
          icon="🔍"
          onClick={() => addToHistory('QC', 'Verificando...', 'system')}
          disabled={!project.timeline}
        />
        <ActionCard
          title="📱 Versiones"
          description="Generar alternativas"
          icon="📱"
          onClick={() => addToHistory('VERSIONS', 'Generando...', 'system')}
          disabled={!project.timeline}
        />
        <ActionCard
          title="✅ Completar"
          description="Marcar como terminado"
          icon="✅"
          onClick={handleComplete}
          disabled={project.status === 'completed'}
        />
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex border-b">
          {['timeline', 'color', 'audio', 'text', 'commands'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-medium capitalize ${
                activeTab === tab 
                  ? 'border-b-2 border-indigo-600 text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'timeline' && '🎬 Timeline'}
              {tab === 'color' && '🎨 Color'}
              {tab === 'audio' && '🔊 Audio'}
              {tab === 'text' && '✏️ Texto'}
              {tab === 'commands' && '💬 Comandos'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB: TIMELINE */}
          {activeTab === 'timeline' && (
            <TimelineTab project={project} />
          )}

          {/* TAB: COLOR */}
          {activeTab === 'color' && (
            <ColorTab project={project} />
          )}

          {/* TAB: AUDIO */}
          {activeTab === 'audio' && (
            <AudioTab project={project} />
          )}

          {/* TAB: TEXT */}
          {activeTab === 'text' && (
            <TextTab project={project} />
          )}

          {/* TAB: COMMANDS */}
          {activeTab === 'commands' && (
            <CommandsTab 
              command={command}
              setCommand={setCommand}
              onExecute={handleCommand}
              loading={loading}
              history={history}
            />
          )}
        </div>
      </div>

      {/* AGENT LOGS */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 text-gray-300 font-mono text-xs overflow-auto max-h-48">
          <h3 className="font-bold text-gray-400 mb-2">📋 Agent Logs</h3>
          {logs.map((log, i) => (
            <div key={i} className="border-b border-gray-800 py-1">{log}</div>
          ))}
        </div>
      )}

      {/* VERSION PREVIEWS */}
      {project.versions && project.versions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-lg mb-4">📱 Versiones Alternativas</h3>
          <div className="grid grid-cols-3 gap-4">
            {project.versions.map((v: any) => (
              <VersionCard 
                key={v.id} 
                version={v} 
                onApprove={() => handleApproveVersion(v.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SEO METADATA */}
      {project.metadata && (
        <SEOMetadataPanel metadata={project.metadata} />
      )}

      {/* DANGER ZONE */}
      <div className="border border-red-200 rounded-xl p-4">
        <h3 className="font-bold text-red-600 mb-2">⚠️ Zona de Peligro</h3>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Eliminar Proyecto
        </button>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTES
// ============================================

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    processing: 'bg-yellow-100 text-yellow-800',
    analyzing: 'bg-blue-100 text-blue-800',
    editing: 'bg-purple-100 text-purple-800',
    review: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${colors[status] || colors.draft}`}>
      {status.toUpperCase()}
    </span>
  );
}

function ActionCard({ 
  title, 
  description, 
  icon, 
  onClick, 
  loading = false, 
  disabled = false 
}: { 
  title: string; description: string; icon: string;
  onClick: () => void; loading?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="bg-white rounded-xl shadow-sm border p-4 text-left hover:shadow-md transition disabled:opacity-50"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-500">{description}</div>
      {loading && <div className="text-xs text-indigo-600 mt-2">⏳ Ejecutando...</div>}
    </button>
  );
}

function TimelineTab({ project }: { project: Project }) {
  const timeline = project.timeline as any[] || [];
  
  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">🎬</div>
        <p>No hay timeline generado</p>
        <p className="text-sm">Ejecuta el workflow de edición para generar el timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((segment: any, i: number) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <span className={`px-3 py-1 rounded text-xs font-bold ${
            segment.type === 'hook' ? 'bg-red-100 text-red-700' :
            segment.type === 'climax' ? 'bg-yellow-100 text-yellow-700' :
            segment.type === 'outro' ? 'bg-gray-100 text-gray-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {segment.type.toUpperCase()}
          </span>
          <span className="flex-1 font-mono text-sm">{segment.clipIds?.join(', ') || 'Sin clips'}</span>
          <span className="text-gray-500">{segment.duration}s</span>
          <span className="text-xs text-gray-400">{segment.transitions?.join(', ')}</span>
        </div>
      ))}
    </div>
  );
}

function ColorTab({ project }: { project: Project }) {
  const colorGrade = project.colorGrade as any;
  
  if (!colorGrade) {
    return <div className="text-center py-8 text-gray-500">No hay color grading aplicado</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <ColorItem label="LUT" value={colorGrade.lut || 'default'} />
      <ColorItem label="Temperatura" value={`${colorGrade.temperature || 5600}K`} />
      <ColorItem label="Contraste" value={colorGrade.contrast || 1} />
      <ColorItem label="Saturación" value={colorGrade.saturation || 1} />
    </div>
  );
}

function ColorItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-mono font-medium">{value}</div>
    </div>
  );
}

function AudioTab({ project }: { project: Project }) {
  const metadata = project.metadata as any;
  const audioMix = metadata?.audioMix;
  
  if (!audioMix) {
    return <div className="text-center py-8 text-gray-500">No hay configuración de audio</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-2xl">🔊</span>
        <div>
          <div className="font-semibold">Master LUFS</div>
          <div className="text-2xl font-mono">{audioMix.masterLUFS || -14}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {(audioMix.layers || []).map((layer: any, i: number) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 capitalize">{layer.track}</div>
            <div className="font-mono">{layer.lufs} LUFS</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextTab({ project }: { project: Project }) {
  const textOverlays = project.textOverlays as any[] || [];
  
  if (textOverlays.length === 0) {
    return <div className="text-center py-8 text-gray-500">No hay overlays de texto</div>;
  }

  return (
    <div className="space-y-2">
      {textOverlays.map((text: any, i: number) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-lg">✏️</span>
          <span className="flex-1">{text.text}</span>
          <span className="text-xs text-gray-500">{text.position}</span>
          <span className="text-xs text-gray-400">{text.startTime}s-{text.startTime + text.duration}s</span>
        </div>
      ))}
    </div>
  );
}

function CommandsTab({ 
  command, 
  setCommand, 
  onExecute, 
  loading, 
  history 
}: { 
  command: string; setCommand: (c: string) => void;
  onExecute: () => void; loading: boolean;
  history: any[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Escribe un comando... (ej: 'Croma, sube saturación')"
          className="flex-1 px-4 py-3 border rounded-lg"
          onKeyDown={(e) => e.key === 'Enter' && !loading && onExecute()}
        />
        <button
          onClick={onExecute}
          disabled={loading || !command.trim()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '⏳' : 'Ejecutar'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUICK_COMMANDS.map(cmd => (
          <button
            key={cmd}
            onClick={() => { setCommand(cmd); }}
            className="px-3 py-2 text-xs bg-gray-100 rounded hover:bg-gray-200 text-left"
          >
            {cmd}
          </button>
        ))}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">📋 Historial</h4>
        <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
          {history.slice().reverse().map((h, i) => (
            <div key={i} className="flex gap-2 py-1 border-b">
              <span className="text-gray-400">$</span>
              <span className="flex-1 truncate">{h.cmd}</span>
              <span className={h.result.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {h.result}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VersionCard({ version, onApprove }: { version: any; onApprove: () => void }) {
  return (
    <div className={`p-4 rounded-lg border ${version.status === 'approved' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">Versión {version.version}</span>
        <span className="text-xs px-2 py-1 rounded bg-gray-100">{version.status}</span>
      </div>
      <div className="font-semibold">{version.name}</div>
      <div className="text-sm text-gray-500 mb-3">{version.description}</div>
      <button
        onClick={onApprove}
        className="w-full py-2 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
      >
        Aprobar
      </button>
    </div>
  );
}

function SEOMetadataPanel({ metadata }: { metadata: any }) {
  if (!metadata) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-bold text-lg mb-4">📝 Metadata Generada</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">SEO Title</div>
          <div className="font-medium">{metadata.seoTitle || 'No generado'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">CTA Sugerido</div>
          <div className="font-medium">{metadata.generatedCTA || 'No generado'}</div>
        </div>
        <div className="col-span-2">
          <div className="text-sm text-gray-500 mb-1">Descripción</div>
          <div className="text-sm">{metadata.seoDescription || 'No generada'}</div>
        </div>
        <div className="col-span-2">
          <div className="text-sm text-gray-500 mb-1">Hashtags</div>
          <div className="flex flex-wrap gap-2">
            {(metadata.generatedHashtags || []).map((tag: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        {metadata.qualityCheck && (
          <div className="col-span-2 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Quality Score</span>
              <span className={`text-2xl font-bold ${metadata.qualityCheck.passed ? 'text-green-600' : 'text-red-600'}`}>
                {metadata.qualityCheck.score}/100
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const QUICK_COMMANDS = [
  'Logos: detecta hook',
  'Croma: aplica LUT luxury',
  'Phonos: normaliza audio',
  'Graphos: añade texto',
  'Haz un match-cut',
  'Satura los dorados',
  'Añade fade al inicio',
  'Texto: EXCLUSIVO'
];

export default VideoEditorDashboard;