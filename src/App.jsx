import { useEffect, useMemo, useRef, useState } from "react";
import ExportMenu from "./components/ExportMenu";
import Header from "./components/Header";
import InputPanel from "./components/InputPanel";
import OutputPanel from "./components/OutputPanel";
import PipelineVisualizer from "./components/PipelineVisualizer";
import SettingsModal from "./components/SettingsModal";
import StatsBar from "./components/StatsBar";
import LiveLog from "./components/Terminal/LiveLog";
import { useN8nPipeline } from "./hooks/useN8nPipeline";
import { usePDFParser } from "./hooks/usePDFParser";
import { useAppStore } from "./store/appStore";
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_WEBHOOK_URL,
  buildN8nPayload,
  normalizeInboundLogs,
  validateN8nResponseShape,
} from "./utils/contract";
import { createDemoNarrationUrl, createDemoStoryboard, STYLE_LABELS } from "./utils/demoMode";
import { titleCase } from "./utils/formatters";

const STEP_LABELS = {
  input: "PDF Input",
  parsing: "Parsing contenuto",
  llm: "Analisi LLM",
  parallel: "Style + Voice in parallelo",
  image: "Generazione immagini",
  output: "Aggregazione output",
};

const PARALLEL_STAGES = [
  { id: "input", complete: [], active: ["input"], progress: 8 },
  { id: "parsing", complete: ["input"], active: ["parsing"], progress: 18 },
  { id: "llm", complete: ["input", "parsing"], active: ["llm"], progress: 34 },
  { id: "parallel", complete: ["input", "parsing", "llm"], active: ["style", "voice"], progress: 56 },
  { id: "image", complete: ["input", "parsing", "llm", "voice", "style"], active: ["image"], progress: 76 },
  {
    id: "output",
    complete: ["input", "parsing", "llm", "voice", "style", "image"],
    active: ["output"],
    progress: 90,
  },
];

function computeBattute(scenes) {
  return scenes.reduce((total, scene) => total + (scene.narrationScript?.length || 0), 0);
}

function getErrorMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return "Errore backend non specificato";
}

function completeMap() {
  return {
    input: "complete",
    parsing: "complete",
    llm: "complete",
    style: "complete",
    image: "complete",
    voice: "complete",
    output: "complete",
  };
}

function toStateMap(stage) {
  const map = {};
  stage.complete.forEach((id) => {
    map[id] = "complete";
  });
  stage.active.forEach((id) => {
    map[id] = "active";
  });
  return map;
}

function normalizeBackendScenes(rawScenes, style, fallbackAudioUrl) {
  const fallback = createDemoStoryboard(style);
  const warnings = [];
  let playableAudioCount = 0;

  const scenes = rawScenes.map((scene, index) => {
    const fallbackScene = fallback[index % fallback.length];
    const sceneNumber = Number.isFinite(scene.sceneNumber) ? scene.sceneNumber : index + 1;
    const hasTitle = typeof scene.title === "string" && scene.title.trim().length > 0;
    const hasNarration =
      typeof scene.narrationScript === "string" && scene.narrationScript.trim().length > 0;
    const hasImage = typeof scene.imagePath === "string" && scene.imagePath.trim().length > 0;
    const hasAudio = typeof scene.audioPath === "string" && scene.audioPath.trim().length > 0;
    const resolvedAudioPath = scene.audioPath || fallbackAudioUrl || null;

    if (!hasTitle) {
      warnings.push(`Scene ${sceneNumber} missing title, using fallback label.`);
    }
    if (!hasNarration) {
      warnings.push(`Scene ${sceneNumber} missing narrationScript, using placeholder copy.`);
    }
    if (!hasImage) {
      warnings.push(`Scene ${sceneNumber} missing imagePath, using generated placeholder.`);
    }
    if (!hasAudio) {
      warnings.push(
        resolvedAudioPath
          ? `Scene ${sceneNumber} missing audioPath, using fallback audio.`
          : `Scene ${sceneNumber} missing audioPath, no audio available.`,
      );
    }
    if (resolvedAudioPath) {
      playableAudioCount += 1;
    }

    return {
      id: `scene_${sceneNumber}`,
      number: sceneNumber,
      title: hasTitle ? scene.title.trim() : `Scene ${sceneNumber}`,
      narrationScript:
        hasNarration
          ? scene.narrationScript
          : "Narrazione in elaborazione. Questo testo verrà aggiornato dal backend.",
      imageUrl: hasImage ? scene.imagePath : fallbackScene.imageUrl,
      audioPath: resolvedAudioPath,
      duration: Number(scene.duration) > 0 ? Number(scene.duration) : 20,
    };
  });

  return {
    scenes,
    warnings,
    playableAudioCount,
  };
}

function buildDemoResponse(selectedStyle, pdfName, requestId) {
  const demoScenes = createDemoStoryboard(selectedStyle);
  const demoAudioUrl = createDemoNarrationUrl();
  const scenes = demoScenes.map((scene) => ({
    sceneNumber: scene.number,
    title: scene.title,
    narrationScript: `Script demo scena ${scene.number} per ${pdfName}. Contenuto narrativo generato a scopo di presentazione.`,
    imagePath: scene.imageUrl,
    audioPath: demoAudioUrl,
    duration: 20,
  }));

  return {
    success: true,
    requestId,
    data: {
      storyboard: {
        title: "Storyboard Demo",
        totalScenes: scenes.length,
        totalDuration: scenes.length * 20,
        scenes,
      },
    },
    logs: [
      {
        time: new Date().toLocaleTimeString("it-IT", { hour12: false }),
        type: "info",
        message: "Modalità demo locale attiva.",
      },
    ],
    demoAudioUrl,
  };
}

function downloadTextFile(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const {
    pdf,
    analysis,
    selectedStyle,
    selectedVideoPreset,
    pipeline,
    output,
    logs,
    stats,
    isLogCollapsed,
    demoMode,
    integrationSettings,
    setPdf,
    clearPdf,
    setAnalysis,
    setSelectedStyle,
    setSelectedVideoPreset,
    setPipelineStatus,
    setCurrentStep,
    setProgress,
    setStepStates,
    appendLog,
    appendLogs,
    clearLogs,
    toggleLogCollapsed,
    setOutput,
    setStats,
    resetElapsedTime,
    incrementElapsedTime,
    resetPipelineRun,
    setDemoMode,
    setIntegrationSettings,
  } = useAppStore();

  const { parsePDF } = usePDFParser();
  const { processDocument } = useN8nPipeline();

  const animationIntervalRef = useRef(null);
  const generatedAudioRef = useRef(null);
  const activeStageRef = useRef(PARALLEL_STAGES[0]);
  const requestInFlightRef = useRef(false);
  const activeRequestIdRef = useRef(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const styleLabel = STYLE_LABELS[selectedStyle] || "Storia";
  const statusLabel = useMemo(() => titleCase(pipeline.status), [pipeline.status]);

  useEffect(() => {
    if (pipeline.status !== "processing") return undefined;
    const timerId = window.setInterval(() => incrementElapsedTime(), 1000);
    return () => window.clearInterval(timerId);
  }, [pipeline.status, incrementElapsedTime]);

  useEffect(() => {
    if (!isExportMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!(event.target instanceof Element)) return;
      if (
        event.target.closest("[data-export-menu]") ||
        event.target.closest("[data-export-toggle]")
      ) {
        return;
      }
      setIsExportMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsExportMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExportMenuOpen]);

  useEffect(
    () => () => {
      if (animationIntervalRef.current) window.clearInterval(animationIntervalRef.current);
      if (generatedAudioRef.current) URL.revokeObjectURL(generatedAudioRef.current);
      requestInFlightRef.current = false;
      activeRequestIdRef.current = null;
      if (pdf.preview) URL.revokeObjectURL(pdf.preview);
    },
    [pdf.preview],
  );

  const stopPipelineAnimation = () => {
    if (animationIntervalRef.current) {
      window.clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
  };

  const startPipelineAnimation = () => {
    stopPipelineAnimation();
    let stageIndex = 0;
    const applyStage = (index) => {
      const stage = PARALLEL_STAGES[index];
      activeStageRef.current = stage;
      setStepStates(toStateMap(stage));
      setCurrentStep(STEP_LABELS[stage.id]);
      setProgress(stage.progress);
    };
    applyStage(stageIndex);

    animationIntervalRef.current = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, PARALLEL_STAGES.length - 1);
      applyStage(stageIndex);
    }, 1400);
  };

  const handleFilePicked = async (file) => {
    const isPdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      appendLog("warning", "Formato non valido. Carica un file PDF.");
      return;
    }

    try {
      if (pdf.preview) URL.revokeObjectURL(pdf.preview);
      const parsed = await parsePDF(file);
      setPdf({
        file: parsed.file,
        name: parsed.name,
        pages: parsed.pages,
        words: parsed.words,
        size: parsed.size,
        preview: parsed.preview,
      });
      setAnalysis({
        subject: parsed.subject,
        language: parsed.language,
        complexity: parsed.complexity,
        scenes: [],
      });
      resetPipelineRun();
      setPipelineStatus("idle");
      setCurrentStep("Pronto per generazione");
      setProgress(0);
      setStepStates({ input: "complete" });
      appendLog("success", `PDF loaded: ${parsed.name} (${parsed.pages} pages)`);
    } catch {
      appendLog("error", "Impossibile analizzare il PDF.");
    }
  };

  const handleRemoveFile = () => {
    stopPipelineAnimation();
    activeRequestIdRef.current = null;
    requestInFlightRef.current = false;
    if (generatedAudioRef.current) {
      URL.revokeObjectURL(generatedAudioRef.current);
      generatedAudioRef.current = null;
    }
    if (pdf.preview) URL.revokeObjectURL(pdf.preview);
    clearPdf();
    appendLog("info", "Input cleared.");
  };

  const handleGenerate = async () => {
    if (!pdf.file || pipeline.status === "processing" || requestInFlightRef.current) return;

    stopPipelineAnimation();
    if (generatedAudioRef.current) {
      URL.revokeObjectURL(generatedAudioRef.current);
      generatedAudioRef.current = null;
    }

    resetPipelineRun();
    resetElapsedTime();
    setPipelineStatus("processing");
    setCurrentStep("Invio richiesta n8n");
    setProgress(4);
    setStepStates({ input: "active" });

    const requestPayload = buildN8nPayload({
      pdfPath: pdf.name,
      styleModule: selectedStyle,
      videoPreset: selectedVideoPreset,
    });
    requestInFlightRef.current = true;
    activeRequestIdRef.current = requestPayload.requestId;

    appendLog("info", `Richiesta accodata. requestId=${requestPayload.requestId}`);

    appendLog(
      "info",
      `Invio payload a n8n requestId=${requestPayload.requestId} style=${requestPayload.styleModule} videoPreset=${requestPayload.videoPreset}`,
    );

    startPipelineAnimation();

    try {
      const response = demoMode
        ? buildDemoResponse(selectedStyle, pdf.name, requestPayload.requestId)
        : await processDocument(requestPayload, {
            webhookUrl: integrationSettings.webhookUrl,
            timeoutMs: integrationSettings.requestTimeoutMs,
            onAttempt: ({ attempt, totalAttempts, retrying, webhookUrl, timeoutMs }) => {
              if (retrying) {
                appendLog(
                  "warning",
                  `Retry ${attempt}/${totalAttempts} verso ${webhookUrl} (timeout ${timeoutMs}ms)`,
                );
                return;
              }
              appendLog(
                "info",
                `Richiesta inviata a ${webhookUrl} (timeout ${timeoutMs}ms)`,
              );
            },
            onResponse: ({ status, attempt }) => {
              appendLog("info", `Response ricevuta da n8n (HTTP ${status}, attempt ${attempt})`);
            },
          });

      if (demoMode) {
        appendLog("info", "Demo mode attivo: webhook bypass, uso response locale deterministica.");
      }

      if (activeRequestIdRef.current !== requestPayload.requestId) {
        return;
      }

      stopPipelineAnimation();

      if (response?.success === false) {
        throw new Error(response?.message || "Il backend ha risposto con success=false");
      }

      const responseRequestId = response?.requestId || response?.data?.requestId || null;
      if (responseRequestId && responseRequestId !== requestPayload.requestId) {
        throw new Error(
          `requestId mismatch: atteso ${requestPayload.requestId}, ricevuto ${responseRequestId}`,
        );
      }
      appendLog(
        "info",
        responseRequestId
          ? `Response associata correttamente a requestId=${responseRequestId}`
          : `Response senza requestId echo: associata alla richiesta attiva ${requestPayload.requestId}`,
      );
      appendLog("info", "Validazione response in corso...");

      const validation = validateN8nResponseShape(response);
      if (!validation.valid) {
        throw new Error(`Contratto response non valido: ${validation.errors.join(" | ")}`);
      }
      appendLog("success", "Validazione response completata.");

      if (response?.demoAudioUrl) {
        generatedAudioRef.current = response.demoAudioUrl;
      }

      const inboundLogs = normalizeInboundLogs(response?.logs);
      if (inboundLogs.length) {
        appendLogs(inboundLogs);
      }

      const storyboardData = response?.data?.storyboard;
      const rawScenes = storyboardData?.scenes || [];
      const fallbackAudioUrl = response?.demoAudioUrl || null;
      const {
        scenes,
        warnings,
        playableAudioCount,
      } = normalizeBackendScenes(rawScenes, selectedStyle, fallbackAudioUrl);
      if (!scenes.length) {
        throw new Error("Nessuna scena ricevuta dal backend.");
      }
      warnings.forEach((message) => appendLog("warning", message));
      if (!playableAudioCount) {
        appendLog("warning", "Nessuna traccia audio riproducibile ricevuta dal backend.");
      }

      const battute = computeBattute(scenes);
      const totalDuration =
        storyboardData?.totalDuration || Math.max(1, Math.round((battute / 900) * 60));

      setOutput({
        storyboard: scenes,
        audioUrl: scenes[0]?.audioPath || null,
        audioDuration: totalDuration,
      });
      setAnalysis({ ...analysis, scenes });
      setStats({
        tokens: Math.max(pdf.words * 2, stats.tokens),
        scenesGenerated: scenes.length,
        battute,
      });
      setPipelineStatus("complete");
      setCurrentStep("Completato");
      setProgress(100);
      setStepStates(completeMap());
      appendLog("success", `Pipeline completa. Scene generate: ${scenes.length}`);
    } catch (error) {
      if (activeRequestIdRef.current !== requestPayload.requestId) {
        return;
      }
      stopPipelineAnimation();
      const stage = activeStageRef.current;
      const errorMap = toStateMap(stage);
      (stage.active || []).forEach((id) => {
        errorMap[id] = "error";
      });
      setPipelineStatus("error");
      setCurrentStep("Errore backend");
      setStepStates(errorMap);
      appendLog("error", `Errore pipeline: ${getErrorMessage(error)}`);
    } finally {
      if (activeRequestIdRef.current === requestPayload.requestId) {
        activeRequestIdRef.current = null;
        requestInFlightRef.current = false;
      }
    }
  };

  const handleUseDemoPdf = async () => {
    const demoBlob = new Blob(
      ["%PDF-1.4\n% EDUGEN demo placeholder\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"],
      { type: "application/pdf" },
    );
    const demoFile = new File([demoBlob], "capitolo_storia_demo.pdf", {
      type: "application/pdf",
      lastModified: Date.now(),
    });
    await handleFilePicked(demoFile);
  };

  const handleSaveSettings = (nextSettings) => {
    setIntegrationSettings({
      webhookUrl: nextSettings.webhookUrl,
      requestTimeoutMs: nextSettings.requestTimeoutMs,
    });
    setDemoMode(Boolean(nextSettings.demoMode));
    appendLog(
      "info",
      `Settings salvati. DemoMode=${nextSettings.demoMode ? "ON" : "OFF"} Timeout=${nextSettings.requestTimeoutMs}ms Webhook=${nextSettings.webhookUrl}`,
    );
  };

  const handleExport = (kind) => {
    if (kind === "storyboard") {
      downloadTextFile(
        "edugen-storyboard.json",
        JSON.stringify(output.storyboard, null, 2),
        "application/json;charset=utf-8",
      );
    }
    if (kind === "logs") {
      const text = logs.map((entry) => `[${entry.timestamp}] ${entry.type.toUpperCase()} ${entry.message}`).join("\n");
      downloadTextFile("edugen-system-log.txt", text || "No logs");
    }
    if (kind === "session") {
      downloadTextFile(
        "edugen-session.json",
        JSON.stringify(
          {
            pdf: { name: pdf.name, pages: pdf.pages, words: pdf.words },
            analysis,
            selectedStyle,
            selectedVideoPreset,
            demoMode,
            integrationSettings,
            pipeline: {
              status: pipeline.status,
              currentStep: pipeline.currentStep,
              progress: pipeline.progress,
            },
            stats,
            storyboardScenes: output.storyboard.length,
            hasPlayableAudio: Boolean(output.audioUrl || output.storyboard.some((scene) => scene.audioPath)),
            logCount: logs.length,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        "application/json;charset=utf-8",
      );
    }
    setIsExportMenuOpen(false);
  };

  return (
    <div className="relative flex h-full flex-col">
      <Header
        status={pipeline.status}
        onOpenSettings={() => {
          setIsExportMenuOpen(false);
          setIsSettingsOpen(true);
        }}
        onToggleExportMenu={() => setIsExportMenuOpen((prev) => !prev)}
        isExportMenuOpen={isExportMenuOpen}
        canExport={Boolean(output.storyboard.length || logs.length)}
      />
      <ExportMenu open={isExportMenuOpen} onExport={handleExport} />
      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        demoMode={demoMode}
        integrationSettings={{
          webhookUrl: integrationSettings.webhookUrl || DEFAULT_WEBHOOK_URL,
          requestTimeoutMs:
            integrationSettings.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS,
        }}
        onSave={handleSaveSettings}
      />

      <div className="mx-auto h-[calc(100%-60px)] w-full max-w-[1920px] px-4 pb-3 pt-4">
        <div
          className={`grid h-full gap-3 ${
            isLogCollapsed
              ? "grid-rows-[minmax(0,1fr)_40px_48px]"
              : "grid-rows-[minmax(0,1fr)_180px_48px]"
          }`}
        >
          <main className="grid min-h-0 grid-cols-[300px_1fr_340px] gap-4">
            <InputPanel
              pdf={pdf}
              analysis={analysis}
              selectedStyle={selectedStyle}
              selectedVideoPreset={selectedVideoPreset}
              onStyleChange={setSelectedStyle}
              onVideoPresetChange={setSelectedVideoPreset}
              onFilePicked={handleFilePicked}
              onUseDemoPdf={handleUseDemoPdf}
              onRemoveFile={handleRemoveFile}
              onGenerate={handleGenerate}
              pipelineStatus={pipeline.status}
              progress={pipeline.progress}
            />
            <PipelineVisualizer
              steps={pipeline.steps}
              currentStep={pipeline.currentStep}
              progress={pipeline.progress}
            />
            <OutputPanel
              scenes={output.storyboard}
              audioUrl={output.audioUrl}
              loading={pipeline.status === "processing"}
            />
          </main>

          <LiveLog
            logs={logs}
            collapsed={isLogCollapsed}
            onToggle={toggleLogCollapsed}
            onClear={clearLogs}
          />

          <StatsBar stats={stats} styleLabel={styleLabel} status={statusLabel} />
        </div>
      </div>
    </div>
  );
}
