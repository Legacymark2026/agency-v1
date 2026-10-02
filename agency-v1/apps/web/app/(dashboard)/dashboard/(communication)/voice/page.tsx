'use client';

import { useState, useEffect } from 'react';
import { Mic, Volume2, Sparkles, Plus, Play, RefreshCw, AudioWaveform, FileAudio, Settings, Layers } from 'lucide-react';
import { VoiceDictationButton } from '@/components/voice/VoiceDictationButton';
import { VoiceNotePlayer } from '@/components/voice/VoiceNotePlayer';
import { synthesizeVoiceAction, createVoiceProfileAction, getCompanyVoiceProfilesAction } from '@/actions/voicebox-actions';
import { toast } from 'sonner';

export default function VoiceStudioPage() {
  const [companyId] = useState('demo-company-id');
  const [activeTab, setActiveTab] = useState<'tts' | 'dictation' | 'cloning'>('tts');

  // TTS Form state
  const [ttsText, setTtsText] = useState('¡Hola! Bienvenido a la plataforma Agency v1. Este es un ejemplo de síntesis de voz con inteligencia artificial y emociones [chuckle].');
  const [selectedEngine, setSelectedEngine] = useState<'kokoro' | 'qwen3' | 'chatterbox_turbo'>('kokoro');
  const [selectedEffects, setSelectedEffects] = useState<'robotic' | 'radio' | 'echo_chamber' | 'deep_voice' | 'studio_clean' | undefined>(undefined);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  // Dictation Notes state
  const [notesHistory, setNotesHistory] = useState<Array<{ id: string; transcript: string; rawTranscript?: string; timestamp: string }>>([
    {
      id: 'note_1',
      transcript: 'El cliente solicita un ajuste en la campaña publicitaria de Facebook Ads para aumentar la conversión un 15%.',
      rawTranscript: 'Eh, bueno... el cliente solicita, este... un ajuste en la campaña de Facebook Ads para aumentar la conversión un 15%.',
      timestamp: 'Hace 10 minutos',
    },
  ]);

  // Voice Profiles state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const res = await getCompanyVoiceProfilesAction(companyId);
    if (res.success && res.profiles) {
      setProfiles(res.profiles);
    }
  };

  const handleSynthesize = async () => {
    if (!ttsText.trim()) return toast.error('Ingresa un texto para sintetizar');

    setIsSynthesizing(true);
    let fullText = ttsText;
    if (selectedEmotion && !fullText.includes(selectedEmotion)) {
      fullText = `${selectedEmotion} ${fullText}`;
    }

    try {
      const res = await synthesizeVoiceAction({
        text: fullText,
        companyId,
        engine: selectedEngine,
        effectsPreset: selectedEffects,
      });

      if (res.success && res.audioUrl) {
        setGeneratedAudioUrl(res.audioUrl);
        toast.success(`Voz generada exitosamente con motor ${res.engineUsed}`);
      } else {
        toast.error('Error al generar la voz');
      }
    } catch (err) {
      toast.error('Ocurrió un error al procesar el audio');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDictationComplete = (transcript: string) => {
    const newNote = {
      id: `note_${Date.now()}`,
      transcript,
      timestamp: 'Ahora mismo',
    };
    setNotesHistory([newNote, ...notesHistory]);
    toast.success('Nota dictada y depurada con LLM guardada');
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName || !sampleFile) {
      return toast.error('Ingresa un nombre y selecciona un archivo de audio');
    }

    setIsCloning(true);
    try {
      const formData = new FormData();
      formData.append('companyId', companyId);
      formData.append('name', newProfileName);
      formData.append('description', newProfileDesc);
      formData.append('sample', sampleFile);

      const res = await createVoiceProfileAction(formData);
      if (res.success && res.profile) {
        toast.success('¡Perfil de Voz clonado con éxito!');
        setNewProfileName('');
        setNewProfileDesc('');
        setSampleFile(null);
        loadProfiles();
      } else {
        toast.error('Error al clonar la voz');
      }
    } catch (err) {
      toast.error('Ocurrió un error en el servidor');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <AudioWaveform className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Voicebox AI Studio</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Estudio de voz local, privado y autónomo: Sintetizador TTS, Clonación de Voz Zero-Shot y Dictado Inteligente con Whisper.
          </p>
        </div>

        {/* Tabs switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('tts')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'tts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4 inline-block mr-1.5" />
            Síntesis TTS
          </button>
          <button
            onClick={() => setActiveTab('dictation')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'dictation' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4 inline-block mr-1.5" />
            Dictado & CRM
          </button>
          <button
            onClick={() => setActiveTab('cloning')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'cloning' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 inline-block mr-1.5" />
            Clonación de Voz
          </button>
        </div>
      </div>

      {/* TAB 1: SINTESIS DE VOZ TTS */}
      {activeTab === 'tts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Texto del Guion o Mensaje de Agente
              </label>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                rows={5}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
                placeholder="Escribe el texto a locutar..."
              />
            </div>

            {/* Quick Emotions */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Etiquetas Expresivas / Emociones Inline
              </label>
              <div className="flex flex-wrap gap-2">
                {['[laugh]', '[sigh]', '[gasp]', '[chuckle]', '[cough]'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedEmotion(tag);
                      setTtsText((prev) => `${tag} ${prev}`);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                      selectedEmotion === tag
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Config controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Motor TTS</label>
                <select
                  value={selectedEngine}
                  onChange={(e: any) => setSelectedEngine(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm"
                >
                  <option value="kokoro">Kokoro TTS (Ligero & Rápido)</option>
                  <option value="qwen3">Qwen3-TTS (Alta Precisión)</option>
                  <option value="chatterbox_turbo">Chatterbox Turbo (Expresivo & Emocional)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Preset de Efectos DSP (Pedalboard)</label>
                <select
                  value={selectedEffects || ''}
                  onChange={(e: any) => setSelectedEffects(e.target.value || undefined)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm"
                >
                  <option value="">Sin Efectos (Voz Limpia)</option>
                  <option value="studio_clean">Estudio Profesional (-14 LUFS)</option>
                  <option value="radio">Radio FM / Podcast</option>
                  <option value="robotic">Robótico / Cyberpunk</option>
                  <option value="echo_chamber">Cámara de Eco</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sintetizando Audio con Voicebox...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Generar Locución de Voz</span>
                </>
              )}
            </button>
          </div>

          {/* Audio Output Player */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileAudio className="w-5 h-5 text-indigo-400" />
              Resultado de Locución
            </h3>

            {generatedAudioUrl ? (
              <div className="space-y-4">
                <VoiceNotePlayer
                  audioUrl={generatedAudioUrl}
                  transcript={ttsText}
                  authorName={`Motor: ${selectedEngine}`}
                  createdAt="Recién generado"
                />
              </div>
            ) : (
              <div className="h-64 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center">
                <Volume2 className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-sm text-slate-400 font-medium">No se ha generado audio aún</p>
                <p className="text-xs text-slate-600 mt-1">Haz clic en &quot;Generar Locución&quot; para escuchar la sintesis de voz.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DICTADO Y CRM */}
      {activeTab === 'dictation' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Dictado Inteligente para Notas del CRM</h3>
              <p className="text-sm text-slate-400">
                Graba minutas de reuniones o detalles de clientes. Whisper transcribirá el audio y el LLM refinará automáticamente las muletillas.
              </p>
            </div>

            <VoiceDictationButton
              companyId={companyId}
              onTranscriptComplete={handleDictationComplete}
            />
          </div>

          {/* Notes list */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-200">Historial de Notas Dictadas</h3>
            {notesHistory.map((note) => (
              <VoiceNotePlayer
                key={note.id}
                audioUrl="https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg"
                transcript={note.transcript}
                rawTranscript={note.rawTranscript}
                authorName="Dictado por Usuario (CRM)"
                createdAt={note.timestamp}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLONACION DE VOZ DE MARCA */}
      {activeTab === 'cloning' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateProfile} className="lg:col-span-1 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Clonar Nueva Voz de Marca
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de la Voz</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Ej. Carlos - Director de Ventas"
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
              <input
                type="text"
                value={newProfileDesc}
                onChange={(e) => setNewProfileDesc(e.target.value)}
                placeholder="Voz institucional para mensajes de WhatsApp"
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Muestra de Audio (WAV/MP3)</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setSampleFile(e.target.files?.[0] || null)}
                className="w-full p-2 text-xs text-slate-400 bg-slate-950 rounded-lg border border-slate-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isCloning}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isCloning ? 'Clonando Voz en Voicebox...' : 'Guardar Perfil de Voz'}
            </button>
          </form>

          {/* List of profiles */}
          <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Voces de Marca Registradas
            </h3>

            {profiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                        {p.engine}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{p.description || 'Sin descripción'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                No hay perfiles de voz registrados para esta agencia aún.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
