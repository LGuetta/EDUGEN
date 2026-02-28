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

describe("App failure and degraded paths", () => {
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
      content: "data:application/pdf;base64,VEVTVA==",
      preview: "blob:pdf-preview",
      subject: "Storia",
      language: "Italiano",
      complexity: "Medium",
    }));
  });

  it("ignores duplicate generate clicks while a request is in flight", async () => {
    const user = userEvent.setup();
    let resolveRequest;
    processDocumentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Usa PDF campione/i }));
    await screen.findByText(/Ready for analysis/i);

    const generateButton = screen.getByRole("button", { name: /^generate$/i });
    await user.click(generateButton);
    await user.click(generateButton);

    expect(processDocumentMock).toHaveBeenCalledTimes(1);

    resolveRequest({
      success: true,
      requestId: processDocumentMock.mock.calls[0][0].requestId,
      mode: "live",
      data: {
        storyboard: {
          title: "Storyboard",
          totalScenes: 1,
          totalDuration: 20,
          scenes: [
            {
              sceneNumber: 1,
              title: "Uno",
              narrationScript: "Script",
              imagePath: "https://example.com/scene-1.png",
              audioPath: "https://example.com/scene-1.wav",
              duration: 20,
            },
          ],
        },
      },
      warnings: [],
      progressTrace: "bad-trace",
    });

    await screen.findByText(/1 scenes generated/i);
  });

  it("fails safely on requestId mismatch", async () => {
    const user = userEvent.setup();
    processDocumentMock.mockImplementation(async (payload) => ({
      success: true,
      requestId: `${payload.requestId}_mismatch`,
      mode: "live",
      data: {
        storyboard: {
          title: "Storyboard",
          totalScenes: 1,
          totalDuration: 20,
          scenes: [
            {
              sceneNumber: 1,
              title: "Uno",
              narrationScript: "Script",
              imagePath: "https://example.com/scene-1.png",
              audioPath: "https://example.com/scene-1.wav",
              duration: 20,
            },
          ],
        },
      },
      warnings: [],
    }));

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Usa PDF campione/i }));
    await screen.findByText(/Ready for analysis/i);
    await user.click(screen.getByRole("button", { name: /^generate$/i }));

    await waitFor(() => {
      expect(screen.getByText(/requestId mismatch/i)).toBeTruthy();
    });
  });
});
