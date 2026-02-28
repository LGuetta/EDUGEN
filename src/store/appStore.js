import { create } from "zustand";

const STEP_DEFINITIONS = [
  { id: "input", label: "Input PDF" },
  { id: "parsing", label: "Parsing" },
  { id: "llm", label: "LLM Analysis" },
  { id: "style", label: "Style Engine" },
  { id: "image", label: "Image Generation" },
  { id: "voice", label: "Voice Synthesis" },
  { id: "output", label: "Output" },
];

const createInitialSteps = () =>
  STEP_DEFINITIONS.map((step) => ({ ...step, state: "idle" }));

const defaultAnalysis = {
  subject: "In attesa",
  language: "Italiano",
  complexity: "N/A",
  scenes: [],
};

const defaultOutput = {
  storyboard: [],
  audioUrl: null,
  audioDuration: 0,
};

const defaultStats = {
  tokens: 0,
  elapsedTime: 0,
  scenesGenerated: 0,
  battute: 0,
};

const defaultIntegrationSettings = {
  webhookUrl: "http://localhost:5678/webhook/edugen-process",
  requestTimeoutMs: 60000,
};

export const useAppStore = create((set) => ({
  pdf: {
    file: null,
    name: "",
    pages: 0,
    words: 0,
    size: 0,
    preview: null,
  },
  analysis: defaultAnalysis,
  selectedStyle: "storia",
  selectedVideoPreset: "didattico",
  pipeline: {
    status: "idle",
    currentStep: "In attesa",
    progress: 0,
    steps: createInitialSteps(),
  },
  output: defaultOutput,
  logs: [],
  stats: defaultStats,
  isLogCollapsed: false,
  demoMode: false,
  integrationSettings: defaultIntegrationSettings,
  executionId: null,

  setPdf: (pdf) => set({ pdf }),
  clearPdf: () =>
    set({
      pdf: { file: null, name: "", pages: 0, words: 0, size: 0, preview: null },
      analysis: defaultAnalysis,
      output: defaultOutput,
      pipeline: {
        status: "idle",
        currentStep: "In attesa",
        progress: 0,
        steps: createInitialSteps(),
      },
      stats: defaultStats,
      logs: [],
    }),
  setAnalysis: (analysis) => set({ analysis }),
  setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
  setSelectedVideoPreset: (selectedVideoPreset) => set({ selectedVideoPreset }),
  setPipelineStatus: (status) =>
    set((state) => ({
      pipeline: { ...state.pipeline, status },
    })),
  setCurrentStep: (currentStep) =>
    set((state) => ({
      pipeline: { ...state.pipeline, currentStep },
    })),
  setProgress: (progress) =>
    set((state) => ({
      pipeline: { ...state.pipeline, progress },
    })),
  setStepState: (stepId, stepState) =>
    set((state) => ({
      pipeline: {
        ...state.pipeline,
        steps: state.pipeline.steps.map((step) =>
          step.id === stepId ? { ...step, state: stepState } : step,
        ),
      },
    })),
  setStepStates: (steps) =>
    set((state) => ({
      pipeline: {
        ...state.pipeline,
        steps: state.pipeline.steps.map((step) => ({
          ...step,
          state: steps[step.id] || step.state,
        })),
      },
    })),
  appendLog: (type, message, timestampOverride = null) =>
    set((state) => {
      const timestamp =
        timestampOverride ||
        new Date().toLocaleTimeString("it-IT", {
          hour12: false,
        });
      return {
        logs: [
          ...state.logs,
          {
            id: `${Date.now()}_${Math.random().toString(16).slice(2, 7)}`,
            timestamp,
            type,
            message,
          },
        ],
      };
    }),
  appendLogs: (entries) =>
    set((state) => ({
      logs: [
        ...state.logs,
        ...entries.map((entry) => ({
          id: `${Date.now()}_${Math.random().toString(16).slice(2, 7)}`,
          timestamp:
            entry.time ||
            new Date().toLocaleTimeString("it-IT", {
              hour12: false,
            }),
          type: entry.type || "info",
          message: entry.message || "",
        })),
      ],
    })),
  clearLogs: () => set({ logs: [] }),
  toggleLogCollapsed: () => set((state) => ({ isLogCollapsed: !state.isLogCollapsed })),
  setOutput: (output) => set({ output }),
  setStats: (statsUpdate) =>
    set((state) => ({
      stats: { ...state.stats, ...statsUpdate },
    })),
  resetElapsedTime: () =>
    set((state) => ({
      stats: { ...state.stats, elapsedTime: 0 },
    })),
  incrementElapsedTime: () =>
    set((state) => ({
      stats: { ...state.stats, elapsedTime: state.stats.elapsedTime + 1 },
    })),
  setDemoMode: (demoMode) => set({ demoMode }),
  setIntegrationSettings: (integrationUpdate) =>
    set((state) => ({
      integrationSettings: {
        ...state.integrationSettings,
        ...integrationUpdate,
      },
    })),
  setExecutionId: (executionId) => set({ executionId }),
  resetPipelineRun: () =>
    set({
      pipeline: {
        status: "idle",
        currentStep: "In attesa",
        progress: 0,
        steps: createInitialSteps(),
      },
      output: defaultOutput,
      logs: [],
      stats: defaultStats,
    }),
}));
