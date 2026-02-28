import { create } from "zustand";
import { DEFAULT_REQUEST_TIMEOUT_MS, DEFAULT_WEBHOOK_URL } from "../utils/contract";

const STEP_DEFINITIONS = [
  { id: "input", label: "Input PDF" },
  { id: "parsing", label: "Parse Request" },
  { id: "llm", label: "LLM Analysis" },
  { id: "style", label: "Style Prompt" },
  { id: "image", label: "Image Gen" },
  { id: "voice", label: "Voice Synth" },
  { id: "output", label: "Aggregate Output" },
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
  webhookUrl: DEFAULT_WEBHOOK_URL,
  requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
};

export const useAppStore = create((set) => ({
  pdf: {
    file: null,
    name: "",
    pages: 0,
    words: 0,
    size: 0,
    content: "",
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
  warnings: [],
  logs: [],
  stats: defaultStats,
  isLogCollapsed: false,
  demoMode: false,
  demoScenario: "fast-success",
  integrationSettings: defaultIntegrationSettings,
  executionId: null,
  lastRequestPayload: null,
  lastResponsePayload: null,

  setPdf: (pdf) => set({ pdf }),
  clearPdf: () =>
    set({
      pdf: { file: null, name: "", pages: 0, words: 0, size: 0, content: "", preview: null },
      analysis: defaultAnalysis,
      output: defaultOutput,
      pipeline: {
        status: "idle",
        currentStep: "In attesa",
        progress: 0,
        steps: createInitialSteps(),
      },
      stats: defaultStats,
      warnings: [],
      logs: [],
      lastRequestPayload: null,
      lastResponsePayload: null,
    }),
  setAnalysis: (analysis) => set({ analysis }),
  setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
  setSelectedVideoPreset: (selectedVideoPreset) => set({ selectedVideoPreset }),
  setWarnings: (warnings) => set({ warnings }),
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
  setDemoScenario: (demoScenario) => set({ demoScenario }),
  setIntegrationSettings: (integrationUpdate) =>
    set((state) => ({
      integrationSettings: {
        ...state.integrationSettings,
        ...integrationUpdate,
      },
    })),
  setExecutionId: (executionId) => set({ executionId }),
  setLastRequestPayload: (lastRequestPayload) => set({ lastRequestPayload }),
  setLastResponsePayload: (lastResponsePayload) => set({ lastResponsePayload }),
  resetPipelineRun: () =>
    set({
      pipeline: {
        status: "idle",
        currentStep: "In attesa",
        progress: 0,
        steps: createInitialSteps(),
      },
      output: defaultOutput,
      warnings: [],
      logs: [],
      stats: defaultStats,
    }),
}));
