import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { useAppStore } from "../store/appStore";

const parsePDFMock = vi.fn();
const processDocumentMock = vi.fn();
const testConnectionMock = vi.fn();

vi.mock("../hooks/usePDFParser", () => ({
  usePDFParser: () => ({
    parsePDF: parsePDFMock,
  }),
}));

vi.mock("../hooks/useN8nPipeline", () => ({
  useN8nPipeline: () => ({
    processDocument: processDocumentMock,
    testConnection: testConnectionMock,
    isLoading: false,
    error: null,
  }),
}));

function resetStore() {
  const state = useAppStore.getState();
  state.clearPdf();
  state.setSelectedStyle("storia");
  state.setSelectedVideoPreset("didattico");
  state.setDemoMode(false);
  state.setDemoScenario("fast-success");
  state.setWarnings([]);
  state.setIntegrationSettings({
    webhookUrl: "http://localhost:5678/webhook/edugen-process",
    requestTimeoutMs: 60000,
  });
  state.setLastRequestPayload(null);
  state.setLastResponsePayload(null);
}

function makeSuccessResponse(requestId, overrides = {}) {
  return {
    success: true,
    requestId,
    mode: "live",
    data: {
      storyboard: {
        title: "Storyboard",
        totalScenes: 2,
        totalDuration: 40,
        scenes: [
          {
            sceneNumber: 1,
            title: "Prima scena",
            narrationScript: "Testo scena 1 completo.",
            imagePath: "https://example.com/scene-1.png",
            audioPath: "https://example.com/scene-1.wav",
            duration: 20,
          },
          {
            sceneNumber: 2,
            title: "Seconda scena",
            narrationScript: "Testo scena 2 completo.",
            imagePath: "https://example.com/scene-2.png",
            audioPath: "https://example.com/scene-2.wav",
            duration: 20,
          },
        ],
      },
    },
    logs: [{ time: "12:00:00", type: "success", message: "ok" }],
    warnings: [],
    progressTrace: [
      { stage: "input", status: "complete" },
      { stage: "parsing", status: "complete" },
      { stage: "llm", status: "complete" },
      { stage: "style", status: "complete" },
      { stage: "voice", status: "complete" },
      { stage: "image", status: "complete" },
      { stage: "output", status: "complete" },
    ],
    ...overrides,
  };
}

describe("App success flow", () => {
  beforeEach(() => {
    resetStore();
    parsePDFMock.mockReset();
    processDocumentMock.mockReset();
    testConnectionMock.mockReset();
    parsePDFMock.mockImplementation(async (file) => ({
      file,
      name: file.name,
      pages: 8,
      words: 1524,
      size: 73,
      preview: "blob:pdf-preview",
      subject: "Storia",
      language: "Italiano",
      complexity: "Medium",
    }));
    testConnectionMock.mockResolvedValue({
      state: "success",
      message: "Reachable (200) · servizio confermato",
    });
  });

  it("uses updated settings for the next request and renders storyboard output", async () => {
    const user = userEvent.setup();
    processDocumentMock.mockImplementation(async (payload) => makeSuccessResponse(payload.requestId));

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Usa PDF demo/i }));
    await screen.findByText(/Ready for analysis/i);

    await user.click(screen.getByRole("button", { name: /settings/i }));
    const urlInput = screen.getByDisplayValue("http://localhost:5678/webhook/edugen-process");
    await user.clear(urlInput);
    await user.type(urlInput, "http://localhost:5678/webhook/custom");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await user.click(screen.getByRole("button", { name: /^generate$/i }));

    await screen.findByText(/2 scenes generated/i);
    expect(processDocumentMock).toHaveBeenCalledTimes(1);
    expect(processDocumentMock.mock.calls[0][1]).toMatchObject({
      webhookUrl: "http://localhost:5678/webhook/custom",
      timeoutMs: 60000,
    });

    await user.click(screen.getByRole("button", { name: /seconda scena/i }));
    expect(screen.getByText(/Testo scena 2 completo\./i)).toBeTruthy();
  });

  it("exports session data when output is available", async () => {
    const user = userEvent.setup();
    const anchorClickSpy = vi
      .spyOn(window.HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    processDocumentMock.mockImplementation(async (payload) => makeSuccessResponse(payload.requestId));

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Usa PDF demo/i }));
    await screen.findByText(/Ready for analysis/i);
    await user.click(screen.getByRole("button", { name: /^generate$/i }));
    await screen.findByText(/2 scenes generated/i);

    await user.click(screen.getByRole("button", { name: /^download$/i }));
    await user.click(screen.getByRole("button", { name: /Session Snapshot/i }));

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalled();
    });

    anchorClickSpy.mockRestore();
  });
});
