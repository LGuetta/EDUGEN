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
  normalizeInboundWarnings,
  isValidProgressTrace,
  validateN8nResponseShape,
} from "./utils/contract";
import { createDemoNarrationUrl, createDemoStoryboard, STYLE_LABELS } from "./utils/demoMode";
import { titleCase } from "./utils/formatters";

const STEP_LABELS = {
  input: "PDF Input",
  parsing: "Parse request",
  llm: "Analisi LLM",
  parallel: "Style + Voice in parallelo",
  image: "Generazione immagini",
  output: "Aggregate output",
};

const SYNTHETIC_STAGE_SEQUENCE = [
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

const TRACE_STAGE_META = {
  input: { complete: [], active: ["input"], progress: 8, label: "PDF Input" },
  parsing: { complete: ["input"], active: ["parsing"], progress: 18, label: "Parse request" },
  llm: { complete: ["input", "parsing"], active: ["llm"], progress: 34, label: "Analisi LLM" },
  style: {
    complete: ["input", "parsing", "llm"],
    active: ["style", "voice"],
    progress: 56,
    label: "Style + Voice in parallelo",
  },
  voice: {
    complete: ["input", "parsing", "llm"],
    active: ["style", "voice"],
    progress: 56,
    label: "Style + Voice in parallelo",
  },
  image: {
    complete: ["input", "parsing", "llm", "style", "voice"],
    active: ["image"],
    progress: 76,
    label: "Generazione immagini",
  },
  output: {
    complete: ["input", "parsing", "llm", "style", "voice", "image"],
    active: ["output"],
    progress: 90,
    label: "Aggregate output",
  },
};

function sleep(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

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

function createFallbackWarning(sceneNumber, code, message, severity = "warning") {
  return {
    id: `${code}_${sceneNumber}_${Math.random().toString(16).slice(2, 7)}`,
    code,
    message,
    sceneNumber,
    severity,
    source: "ui-fallback",
  };
}

function dedupeWarnings(warnings) {
  const seen = new Set();
  return warnings.filter((warning) => {
    const key = `${warning.code}|${warning.sceneNumber || "na"}|${warning.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
      warnings.push(
        createFallbackWarning(
          sceneNumber,
          "SCENE_TITLE_MISSING",
          `Scene ${sceneNumber} missing title, using fallback label.`,
        ),
      );
    }
    if (!hasNarration) {
      warnings.push(
        createFallbackWarning(
          sceneNumber,
          "SCENE_SCRIPT_MISSING",
          `Scene ${sceneNumber} missing narrationScript, using placeholder copy.`,
        ),
      );
    }
    if (!hasImage) {
      warnings.push(
        createFallbackWarning(
          sceneNumber,
          "SCENE_IMAGE_MISSING",
          `Scene ${sceneNumber} missing imagePath, using generated placeholder.`,
        ),
      );
    }
    if (!hasAudio) {
      warnings.push(
        createFallbackWarning(
          sceneNumber,
          "SCENE_AUDIO_MISSING",
          resolvedAudioPath
            ? `Scene ${sceneNumber} missing audioPath, using fallback audio.`
            : `Scene ${sceneNumber} missing audioPath, no audio available.`,
        ),
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

function buildDemoProgressTrace() {
  return [
    { stage: "input", status: "complete", time: "17:23:45" },
    { stage: "parsing", status: "complete", time: "17:23:46" },
    { stage: "llm", status: "complete", time: "17:23:47" },
    { stage: "style", status: "complete", time: "17:23:48" },
    { stage: "voice", status: "complete", time: "17:23:49" },
    { stage: "image", status: "complete", time: "17:23:50" },
    { stage: "output", status: "complete", time: "17:23:51" },
  ];
}

function buildDemoResponse(selectedStyle, pdfName, requestId, demoScenario) {
  const demoScenes = createDemoStoryboard(selectedStyle);
  const demoAudioUrl = createDemoNarrationUrl();
  const warnings = [];
  const scenes = demoScenes.map((scene) => {
    if (demoScenario === "degraded-media" && scene.number % 2 === 0) {
      warnings.push({
        code: "SCENE_AUDIO_MISSING",
        message: `Scene ${scene.number} missing audioPath`,
        sceneNumber: scene.number,
        severity: "warning",
      });
      warnings.push({
        code: "SCENE_IMAGE_MISSING",
        message: `Scene ${scene.number} missing imagePath`,
        sceneNumber: scene.number,
        severity: "warning",
      });
    }

    return {
      sceneNumber: scene.number,
      title: scene.title,
      narrationScript: `Script demo scena ${scene.number} per ${pdfName}. Contenuto narrativo generato a scopo di presentazione.`,
      imagePath:
        demoScenario === "degraded-media" && scene.number % 2 === 0 ? "" : scene.imageUrl,
      audioPath:
        demoScenario === "degraded-media" && scene.number % 2 === 0 ? "" : demoAudioUrl,
      duration: 20,
    };
  });

  return {
    success: true,
    requestId,
    mode: "demo",
    data: {
      storyboard: {
        title: "Storyboard Demo",
        totalScenes: scenes.length,
        totalDuration: scenes.length * 20,
        scenes,
      },
    },
    warnings,
    logs: [
      {
        time: new Date().toLocaleTimeString("it-IT", { hour12: false }),
        type: "info",
        message: "Modalità demo locale attiva.",
      },
    ],
    progressTrace: buildDemoProgressTrace(),
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

function guessExtensionFromUrl(url, fallback = "bin") {
  if (!url) return fallback;
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const lastSegment = pathname.split("/").pop() || "";
    const dotIndex = lastSegment.lastIndexOf(".");
    if (dotIndex >= 0 && dotIndex < lastSegment.length - 1) {
      return lastSegment.slice(dotIndex + 1).toLowerCase();
    }
  } catch {
    return fallback;
  }
  return fallback;
}

async function downloadUrlFile(url, filename) {
  if (!url) {
    throw new Error("URL di download mancante");
  }

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    return;
  } catch {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.download = filename;
    anchor.click();
  }
}

export default function App() {
  const {
    pdf,
    analysis,
    selectedStyle,
    selectedVideoPreset,
    pipeline,
    output,
    warnings,
    logs,
    stats,
    isLogCollapsed,
    demoMode,
    demoScenario,
    integrationSettings,
    lastRequestPayload,
    lastResponsePayload,
    setPdf,
    clearPdf,
    setAnalysis,
    setSelectedStyle,
    setSelectedVideoPreset,
    setWarnings,
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
    setDemoScenario,
    setIntegrationSettings,
    setLastRequestPayload,
    setLastResponsePayload,
  } = useAppStore();

  const { parsePDF } = usePDFParser();
  const { processDocument, testConnection } = useN8nPipeline();

  const animationIntervalRef = useRef(null);
  const generatedAudioRef = useRef(null);
  const activeStageRef = useRef(SYNTHETIC_STAGE_SEQUENCE[0]);
  const requestInFlightRef = useRef(false);
  const activeRequestIdRef = useRef(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const styleLabel = STYLE_LABELS[selectedStyle] || "Storia";
  const statusLabel = useMemo(() => titleCase(pipeline.status), [pipeline.status]);
  const resolvedIntegrationSettings = useMemo(
    () => ({
      webhookUrl: integrationSettings.webhookUrl || DEFAULT_WEBHOOK_URL,
      requestTimeoutMs:
        integrationSettings.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS,
    }),
    [integrationSettings.webhookUrl, integrationSettings.requestTimeoutMs],
  );

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

  const applyVisualStage = (stage) => {
    activeStageRef.current = stage;
    setStepStates(toStateMap(stage));
    setCurrentStep(STEP_LABELS[stage.id] || stage.label || "Processing");
    setProgress(Math.min(stage.progress, 90));
  };

  const startPipelineAnimation = () => {
    stopPipelineAnimation();
    let stageIndex = 0;
    applyVisualStage(SYNTHETIC_STAGE_SEQUENCE[stageIndex]);

    animationIntervalRef.current = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, SYNTHETIC_STAGE_SEQUENCE.length - 1);
      applyVisualStage(SYNTHETIC_STAGE_SEQUENCE[stageIndex]);
    }, 1400);
  };

  const applyBackendProgressTrace = async (trace) => {
    if (!isValidProgressTrace(trace)) return false;

    stopPipelineAnimation();

    for (const entry of trace) {
      const meta = TRACE_STAGE_META[entry.stage];
      if (!meta) continue;

      const stage = {
        id: entry.stage,
        complete: meta.complete,
        active: entry.status === "error" ? meta.active : meta.active,
        progress: meta.progress,
        label: meta.label,
      };

      if (entry.status === "complete") {
        const completeIds = Array.from(new Set([...meta.complete, entry.stage]));
        activeStageRef.current = { ...stage, complete: completeIds, active: [] };
        setStepStates(toStateMap({ ...stage, complete: completeIds, active: [] }));
        setCurrentStep(meta.label);
        setProgress(Math.min(meta.progress, 90));
      } else if (entry.status === "error") {
        const errorMap = toStateMap(stage);
        meta.active.forEach((id) => {
          errorMap[id] = "error";
        });
        activeStageRef.current = stage;
        setStepStates(errorMap);
        setCurrentStep(meta.label);
        setProgress(Math.min(meta.progress, 90));
      } else {
        applyVisualStage(stage);
      }

      await sleep(140);
    }

    return true;
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
        content: parsed.content,
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
    setWarnings([]);
    resetElapsedTime();
    setPipelineStatus("processing");
    setCurrentStep("Invio richiesta n8n");
    setProgress(4);
    setStepStates({ input: "active" });

    const requestPayload = buildN8nPayload({
      pdfPath: pdf.name,
      pdfContent: pdf.content,
      styleModule: selectedStyle,
      videoPreset: selectedVideoPreset,
    });
    requestInFlightRef.current = true;
    activeRequestIdRef.current = requestPayload.requestId;
    setLastRequestPayload(requestPayload);
    setLastResponsePayload(null);

    appendLog("info", `Richiesta accodata. requestId=${requestPayload.requestId}`);

    appendLog(
      "info",
      `Invio payload a n8n requestId=${requestPayload.requestId} style=${requestPayload.styleModule} videoPreset=${requestPayload.videoPreset}`,
    );

    startPipelineAnimation();
    let responsePayload = null;

    try {
      let response;
      if (demoMode) {
        if (demoScenario === "slow-success") {
          await sleep(1800);
        }
        response = buildDemoResponse(
          selectedStyle,
          pdf.name,
          requestPayload.requestId,
          demoScenario,
        );
      } else {
        response = await processDocument(requestPayload, {
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
      }

      responsePayload = response;
      setLastResponsePayload(response);

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

      const responseRequestId = response?.requestId || null;
      if (responseRequestId !== requestPayload.requestId) {
        throw new Error(
          `requestId mismatch: atteso ${requestPayload.requestId}, ricevuto ${responseRequestId}`,
        );
      }
      appendLog("info", `Response associata correttamente a requestId=${responseRequestId}`);
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
      const inboundWarnings = normalizeInboundWarnings(response?.warnings);

      const storyboardData = response?.data?.storyboard;
      const rawScenes = storyboardData?.scenes || [];
      const fallbackAudioUrl = response?.demoAudioUrl || null;
      const {
        scenes,
        warnings: fallbackWarnings,
        playableAudioCount,
      } = normalizeBackendScenes(rawScenes, selectedStyle, fallbackAudioUrl);
      if (!scenes.length) {
        throw new Error("Nessuna scena ricevuta dal backend.");
      }
      const mergedWarnings = dedupeWarnings([...inboundWarnings, ...fallbackWarnings]);
      setWarnings(mergedWarnings);
      mergedWarnings.forEach((warning) => appendLog(warning.severity, warning.message));
      if (!playableAudioCount) {
        appendLog("warning", "Nessuna traccia audio riproducibile ricevuta dal backend.");
      }

      const battute = computeBattute(scenes);
      const totalDuration =
        storyboardData?.totalDuration || Math.max(1, Math.round((battute / 900) * 60));

      if (isValidProgressTrace(response?.progressTrace)) {
        await applyBackendProgressTrace(response.progressTrace);
      }

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
      setWarnings([]);
      if (!responsePayload) {
        setLastResponsePayload({
          requestId: requestPayload.requestId,
          mode: demoMode ? "demo" : "live",
          error: getErrorMessage(error),
        });
      }
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
    setDemoScenario(nextSettings.demoScenario || "fast-success");
    appendLog(
      "info",
      `Settings salvati. DemoMode=${nextSettings.demoMode ? "ON" : "OFF"} Scenario=${nextSettings.demoScenario || "fast-success"} Timeout=${nextSettings.requestTimeoutMs}ms Webhook=${nextSettings.webhookUrl}`,
    );
  };

  const handleTestConnection = async (settings) =>
    testConnection({
      webhookUrl: settings.webhookUrl,
      timeoutMs: settings.requestTimeoutMs,
    });

  const handleExport = (kind) => {
    const exportUrls = lastResponsePayload?.data?.exports || {};
    const firstPlayableAudio =
      output.storyboard.find((scene) => scene.audioPath)?.audioPath || output.audioUrl || null;

    if (kind === "storyboard") {
      downloadTextFile(
        "edugen-storyboard.json",
        JSON.stringify(output.storyboard, null, 2),
        "application/json;charset=utf-8",
      );
    }
    if (kind === "audio") {
      if (!firstPlayableAudio) {
        appendLog("warning", "Nessun file audio disponibile per il download.");
      } else {
        void downloadUrlFile(
          firstPlayableAudio,
          `edugen-narration.${guessExtensionFromUrl(firstPlayableAudio, "mp3")}`,
        ).catch((error) => {
          appendLog("error", `Download audio fallito: ${getErrorMessage(error)}`);
        });
      }
    }
    if (kind === "video") {
      if (!exportUrls.videoUrl) {
        appendLog("warning", "Il backend non ha fornito un export video.");
      } else {
        void downloadUrlFile(
          exportUrls.videoUrl,
          `edugen-video.${guessExtensionFromUrl(exportUrls.videoUrl, "mp4")}`,
        ).catch((error) => {
          appendLog("error", `Download video fallito: ${getErrorMessage(error)}`);
        });
      }
    }
    if (kind === "package") {
      if (!exportUrls.packageUrl) {
        appendLog("warning", "Il backend non ha fornito un export package.");
      } else {
        void downloadUrlFile(
          exportUrls.packageUrl,
          `edugen-package.${guessExtensionFromUrl(exportUrls.packageUrl, "zip")}`,
        ).catch((error) => {
          appendLog("error", `Download package fallito: ${getErrorMessage(error)}`);
        });
      }
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
            pdf: { name: pdf.name, pages: pdf.pages, words: pdf.words, size: pdf.size },
            analysis,
            selectedStyle,
            selectedVideoPreset,
            demoMode,
            demoScenario,
            integrationSettings,
            warnings,
            pipeline: {
              status: pipeline.status,
              currentStep: pipeline.currentStep,
              progress: pipeline.progress,
            },
            stats,
            lastRequestPayload,
            lastResponsePayload,
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
    if (kind === "all") {
      return;
    }
    setIsExportMenuOpen(false);
  };

  const handlePanelExport = (kind, selectedKinds = []) => {
    if (kind !== "all") {
      handleExport(kind);
      return;
    }

    selectedKinds.forEach((selectedKind, index) => {
      window.setTimeout(() => {
        handleExport(selectedKind);
      }, index * 180);
    });
  };

  const exportAvailability = useMemo(
    () => ({
      storyboard: output.storyboard.length > 0,
      audio: Boolean(
        output.audioUrl || output.storyboard.some((scene) => scene.audioPath),
      ),
      video: Boolean(lastResponsePayload?.data?.exports?.videoUrl),
      package: Boolean(lastResponsePayload?.data?.exports?.packageUrl),
    }),
    [lastResponsePayload, output.audioUrl, output.storyboard],
  );

  return (
    <div className="relative flex h-full flex-col">
      <Header
        status={pipeline.status}
        runtimeMode={demoMode ? "demo" : "live"}
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
        demoScenario={demoScenario}
        integrationSettings={resolvedIntegrationSettings}
        onSave={handleSaveSettings}
        onTestConnection={handleTestConnection}
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
              warnings={warnings}
              exportAvailability={exportAvailability}
              onExport={handlePanelExport}
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
