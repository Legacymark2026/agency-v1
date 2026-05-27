import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type EditAuthor = 'ai' | 'human' | 'merged';
export type EditStatus = 'pending' | 'approved' | 'rejected' | 'applied' | 'conflicted';

export interface ClipEdit {
  id: string;
  clipId: string;
  type: 'cut' | 'speed' | 'color' | 'text' | 'audio' | 'transition' | 'crop' | 'broll';
  author: EditAuthor;
  status: EditStatus;
  confidence: number;
  beforeState: any;
  afterState: any;
  timestamp: number;
  description: string;
  proposalId?: string;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  description: string;
  state: any;
  author: EditAuthor;
  createdAt: number;
  clipCount: number;
  duration: number;
}

export interface PresenceInfo {
  userId: string;
  userName: string;
  userType: 'human' | 'ai';
  editingClip?: string;
  cursorPosition?: number;
  lastActive: number;
  isTyping?: boolean;
}

export interface EditConflict {
  id: string;
  elementId: string;
  elementType: string;
  aiEdit: ClipEdit;
  humanEdit: ClipEdit;
  resolved: boolean;
  resolution?: 'ai' | 'human' | 'merged' | 'discarded';
  timestamp: number;
}

export interface EditorState {
  // Project state
  projectId: string | null;
  sessionId: string | null;
  projectName: string;
  config: any;
  clips: any[];
  audioTracks: any[];
  textOverlays: any[];
  colorGrades: any[];
  speedRamps: any[];
  soundLayers: any[];
  timeline: any;

  // Edit tracking
  edits: ClipEdit[];
  activeEditId: string | null;
  editHistory: ClipEdit[];
  historyIndex: number;
  maxHistorySize: number;

  // Versions
  versions: VersionSnapshot[];
  activeVersionId: string | null;

  // Presence
  presence: PresenceInfo[];
  editLocks: Map<string, string>;

  // Conflicts
  conflicts: EditConflict[];
  unresolvedConflictCount: number;

  // UI state
  selectedClipId: string | null;
  playheadPosition: number;
  isPlaying: boolean;
  zoom: number;
  activePanel: string;
  showProposalReview: boolean;
  showVersionHistory: boolean;
  showConflictResolver: boolean;
  filterByAuthor: EditAuthor | 'all';

  // AI state
  aiWorking: boolean;
  aiCurrentTask: string;
  aiProgress: number;
  aiConfidenceThreshold: number;

  // Actions
  setProjectId: (id: string) => void;
  setSessionId: (id: string) => void;
  setProjectName: (name: string) => void;
  setConfig: (config: any) => void;
  setClips: (clips: any[]) => void;
  setAudioTracks: (tracks: any[]) => void;
  setTextOverlays: (overlays: any[]) => void;
  setColorGrades: (grades: any[]) => void;
  setSpeedRamps: (ramps: any[]) => void;
  setSoundLayers: (layers: any[]) => void;
  setTimeline: (timeline: any) => void;

  // Edit actions
  addEdit: (edit: Omit<ClipEdit, 'id' | 'timestamp'>) => void;
  applyEdit: (editId: string) => void;
  rejectEdit: (editId: string) => void;
  setActiveEdit: (id: string | null) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Versions
  createSnapshot: (name: string, description: string) => void;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  setActiveVersion: (id: string | null) => void;

  // Presence
  updatePresence: (info: PresenceInfo) => void;
  removePresence: (userId: string) => void;
  acquireLock: (clipId: string, userId: string) => boolean;
  releaseLock: (clipId: string, userId: string) => void;

  // Conflicts
  addConflict: (conflict: EditConflict) => void;
  resolveConflict: (conflictId: string, resolution: 'ai' | 'human' | 'merged' | 'discarded') => void;

  // UI
  setSelectedClip: (id: string | null) => void;
  setPlayheadPosition: (pos: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  setActivePanel: (panel: string) => void;
  setShowProposalReview: (show: boolean) => void;
  setShowVersionHistory: (show: boolean) => void;
  setShowConflictResolver: (show: boolean) => void;
  setFilterByAuthor: (author: EditAuthor | 'all') => void;

  // AI
  setAIWorking: (working: boolean) => void;
  setAITask: (task: string) => void;
  setAIProgress: (progress: number) => void;
  setAIConfidenceThreshold: (threshold: number) => void;

  // Remote updates (from WebSocket)
  applyRemoteUpdate: (updates: Partial<EditorState>) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  projectId: null,
  sessionId: null,
  projectName: '',
  config: {},
  clips: [],
  audioTracks: [],
  textOverlays: [],
  colorGrades: [],
  speedRamps: [],
  soundLayers: [],
  timeline: null,

  edits: [],
  activeEditId: null,
  editHistory: [],
  historyIndex: -1,
  maxHistorySize: 50,

  versions: [],
  activeVersionId: null,

  presence: [],
  editLocks: new Map(),

  conflicts: [],
  unresolvedConflictCount: 0,

  selectedClipId: null,
  playheadPosition: 0,
  isPlaying: false,
  zoom: 1,
  activePanel: 'config',
  showProposalReview: false,
  showVersionHistory: false,
  showConflictResolver: false,
  filterByAuthor: 'all' as EditAuthor | 'all',

  aiWorking: false,
  aiCurrentTask: '',
  aiProgress: 0,
  aiConfidenceThreshold: 70,
};

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setProjectId: (id) => set({ projectId: id }),
    setSessionId: (id) => set({ sessionId: id }),
    setProjectName: (name) => set({ projectName: name }),
    setConfig: (config) => set({ config }),
    setClips: (clips) => set({ clips }),
    setAudioTracks: (audioTracks) => set({ audioTracks }),
    setTextOverlays: (textOverlays) => set({ textOverlays }),
    setColorGrades: (colorGrades) => set({ colorGrades }),
    setSpeedRamps: (speedRamps) => set({ speedRamps }),
    setSoundLayers: (soundLayers) => set({ soundLayers }),
    setTimeline: (timeline) => set({ timeline }),

    addEdit: (edit) => {
      const newEdit = {
        ...edit,
        id: `edit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        timestamp: Date.now(),
      };

      set((state) => {
        const newHistory = [
          ...state.editHistory.slice(0, state.historyIndex + 1),
          newEdit,
        ].slice(-state.maxHistorySize);

        return {
          edits: [...state.edits, newEdit],
          editHistory: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },

    applyEdit: (editId) => {
      set((state) => ({
        edits: state.edits.map((e) =>
          e.id === editId ? { ...e, status: 'applied' as EditStatus } : e,
        ),
      }));
    },

    rejectEdit: (editId) => {
      set((state) => ({
        edits: state.edits.map((e) =>
          e.id === editId ? { ...e, status: 'rejected' as EditStatus } : e,
        ),
      }));
    },

    setActiveEdit: (id) => set({ activeEditId: id }),

    undo: () => {
      const state = get();
      if (state.historyIndex < 0) return;

      const edit = state.editHistory[state.historyIndex];
      set({
        clips: edit.beforeState.clips || state.clips,
        audioTracks: edit.beforeState.audioTracks || state.audioTracks,
        textOverlays: edit.beforeState.textOverlays || state.textOverlays,
        colorGrades: edit.beforeState.colorGrades || state.colorGrades,
        historyIndex: state.historyIndex - 1,
      });
    },

    redo: () => {
      const state = get();
      if (state.historyIndex >= state.editHistory.length - 1) return;

      const nextIndex = state.historyIndex + 1;
      const edit = state.editHistory[nextIndex];
      set({
        clips: edit.afterState.clips || state.clips,
        audioTracks: edit.afterState.audioTracks || state.audioTracks,
        textOverlays: edit.afterState.textOverlays || state.textOverlays,
        colorGrades: edit.afterState.colorGrades || state.colorGrades,
        historyIndex: nextIndex,
      });
    },

    canUndo: () => get().historyIndex >= 0,
    canRedo: () => get().historyIndex < get().editHistory.length - 1,

    createSnapshot: (name, description) => {
      const state = get();
      const snapshot: VersionSnapshot = {
        id: `version_${Date.now()}`,
        name,
        description,
        state: {
          clips: state.clips,
          audioTracks: state.audioTracks,
          textOverlays: state.textOverlays,
          colorGrades: state.colorGrades,
          speedRamps: state.speedRamps,
          soundLayers: state.soundLayers,
          timeline: state.timeline,
          config: state.config,
        },
        author: 'human',
        createdAt: Date.now(),
        clipCount: state.clips.length,
        duration: state.timeline?.totalDuration || 0,
      };

      set({
        versions: [...state.versions, snapshot],
        activeVersionId: snapshot.id,
      });
    },

    restoreVersion: (versionId) => {
      const state = get();
      const version = state.versions.find((v) => v.id === versionId);
      if (!version) return;

      set({
        clips: version.state.clips,
        audioTracks: version.state.audioTracks,
        textOverlays: version.state.textOverlays,
        colorGrades: version.state.colorGrades,
        speedRamps: version.state.speedRamps,
        soundLayers: version.state.soundLayers,
        timeline: version.state.timeline,
        config: version.state.config,
        activeVersionId: versionId,
      });
    },

    deleteVersion: (versionId) => {
      set((state) => ({
        versions: state.versions.filter((v) => v.id !== versionId),
        activeVersionId: state.activeVersionId === versionId ? null : state.activeVersionId,
      }));
    },

    setActiveVersion: (id) => set({ activeVersionId: id }),

    updatePresence: (info) => {
      set((state) => {
        const existing = state.presence.findIndex((p) => p.userId === info.userId);
        if (existing >= 0) {
          const updated = [...state.presence];
          updated[existing] = { ...info, lastActive: Date.now() };
          return { presence: updated };
        }
        return { presence: [...state.presence, { ...info, lastActive: Date.now() }] };
      });
    },

    removePresence: (userId) => {
      set((state) => ({
        presence: state.presence.filter((p) => p.userId !== userId),
      }));
    },

    acquireLock: (clipId, userId) => {
      const state = get();
      if (state.editLocks.has(clipId)) return false;

      const newLocks = new Map(state.editLocks);
      newLocks.set(clipId, userId);
      set({ editLocks: newLocks });
      return true;
    },

    releaseLock: (clipId, userId) => {
      const state = get();
      if (state.editLocks.get(clipId) !== userId) return;

      const newLocks = new Map(state.editLocks);
      newLocks.delete(clipId);
      set({ editLocks: newLocks });
    },

    addConflict: (conflict) => {
      set((state) => ({
        conflicts: [...state.conflicts, conflict],
        unresolvedConflictCount: state.unresolvedConflictCount + 1,
      }));
    },

    resolveConflict: (conflictId, resolution) => {
      set((state) => {
        const conflict = state.conflicts.find((c) => c.id === conflictId);
        if (!conflict) return state;

        let mergedState = {};
        if (resolution === 'ai') {
          mergedState = conflict.aiEdit.afterState;
        } else if (resolution === 'human') {
          mergedState = conflict.humanEdit.afterState;
        } else if (resolution === 'merged') {
          mergedState = {
            ...conflict.aiEdit.afterState,
            ...conflict.humanEdit.afterState,
          };
        }

        return {
          conflicts: state.conflicts.map((c) =>
            c.id === conflictId
              ? { ...c, resolved: true, resolution }
              : c,
          ),
          unresolvedConflictCount: state.unresolvedConflictCount - 1,
          ...mergedState,
        };
      });
    },

    setSelectedClip: (id) => set({ selectedClipId: id }),
    setPlayheadPosition: (pos) => set({ playheadPosition: pos }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setZoom: (zoom) => set({ zoom }),
    setActivePanel: (panel) => set({ activePanel: panel }),
    setShowProposalReview: (show) => set({ showProposalReview: show }),
    setShowVersionHistory: (show) => set({ showVersionHistory: show }),
    setShowConflictResolver: (show) => set({ showConflictResolver: show }),
    setFilterByAuthor: (author) => set({ filterByAuthor: author }),

    setAIWorking: (working) => set({ aiWorking: working }),
    setAITask: (task) => set({ aiCurrentTask: task }),
    setAIProgress: (progress) => set({ aiProgress: progress }),
    setAIConfidenceThreshold: (threshold) => set({ aiConfidenceThreshold: threshold }),

    applyRemoteUpdate: (updates) => set(updates),

    reset: () => set(initialState),
  })),
);
