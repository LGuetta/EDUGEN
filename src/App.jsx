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
import {
  createDemoPackage,
  buildDemoTimeline,
  STYLE_LABELS,
} from "./utils/demoMode";
import { titleCase } from "./utils/formatters";

const STEP_LABELS = {
  input: "PDF Input",
  parsing: "Parse request",
  llm: "Analisi LLM",
  archive: "Archivio Vivo",
  style: "Style prompt",
  lora: "LoRA select",
  controlnet: "ControlNet",
  image: "Generazione immagini",
  voice: "Voice synth",
  video: "Video compose",
  output: "Aggregate output",
};

const SYNTHETIC_STAGE_SEQUENCE = [
  { id: "input", complete: [], active: ["input"], progress: 8 },
  { id: "parsing", complete: ["input"], active: ["parsing"], progress: 18 },
  { id: "llm", complete: ["input", "parsing"], active: ["llm"], progress: 28 },
  { id: "archive", complete: ["input", "parsing", "llm"], active: ["archive"], progress: 38 },
  { id: "style", complete: ["input", "parsing", "llm", "archive"], active: ["style"], progress: 48 },
  { id: "lora", complete: ["input", "parsing", "llm", "archive", "style"], active: ["lora"], progress: 58 },
  {
    id: "controlnet",
    complete: ["input", "parsing", "llm", "archive", "style", "lora"],
    active: ["controlnet"],
    progress: 68,
  },
  {
    id: "image",
    complete: ["input", "parsing", "llm", "archive", "style", "lora", "controlnet"],
    active: ["image"],
    progress: 78,
  },
  {
    id: "voice",
    complete: [
      "input",
      "parsing",
      "llm",
      "archive",
      "style",
      "lora",
      "controlnet",
      "image",
    ],
    active: ["voice"],
    progress: 84,
  },
  {
    id: "video",
    complete: [
      "input",
      "parsing",
      "llm",
      "archive",
      "style",
      "lora",
      "controlnet",
      "image",
      "voice",
    ],
    active: ["video"],
    progress: 90,
  },
  {
    id: "output",
    complete: [
      "input",
      "parsing",
      "llm",
      "archive",
      "style",
      "lora",
      "controlnet",
      "image",
      "voice",
      "video",
    ],
    active: ["output"],
    progress: 96,
  },
];

const TRACE_STAGE_META = {
  input: { complete: [], active: ["input"], progress: 8, label: "PDF Input" },
  parsing: { complete: ["input"], active: ["parsing"], progress: 18, label: "Parse request" },
  llm: { complete: ["input", "parsing"], active: ["llm"], progress: 28, label: "Analisi LLM" },
  archive: {
    complete: ["input", "parsing", "llm"],
    active: ["archive"],
    progress: 38,
    label: "Archivio Vivo",
  },
  style: {
    complete: ["input", "parsing", "llm", "archive"],
    active: ["style"],
    progress: 48,
    label: "Style prompt",
  },
  lora: {
    complete: ["input", "parsing", "llm", "archive", "style"],
    active: ["lora"],
    progress: 58,
    label: "LoRA select",
  },
  controlnet: {
    complete: ["input", "parsing", "llm", "archive", "style", "lora"],
    active: ["controlnet"],
    progress: 68,
    label: "ControlNet",
  },
  image: {
    complete: ["input", "parsing", "llm", "archive", "style", "lora", "controlnet"],
    active: ["image"],
    progress: 78,
    label: "Generazione immagini",
  },
  voice: {
    complete: ["input", "parsing", "llm", "archive", "style", "lora", "controlnet", "image"],
    active: ["voice"],
    progress: 84,
    label: "Voice synth",
  },
  video: {
    complete: [
      "input",
      "parsing",
      "llm",
      "archive",
      "style",
      "lora",
      "controlnet",
      "image",
      "voice",
    ],
    active: ["video"],
    progress: 90,
    label: "Video compose",
  },
  output: {
    complete: [
      "input",
      "parsing",
      "llm",
      "archive",
      "style",
      "lora",
      "controlnet",
      "image",
      "voice",
      "video",
    ],
    active: ["output"],
    progress: 96,
    label: "Aggregate output",
  },
};

function sleep(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

async function resolveExistingMediaSource(sources = []) {
  const uniqueSources = [...new Set((sources || []).filter(Boolean))];

  for (const source of uniqueSources) {
    if (typeof source !== "string" || !source.trim()) continue;

    if (source.startsWith("data:")) {
      return source;
    }

    try {
      const response = await fetch(source, { method: "GET", cache: "no-store" });
      if (response.ok) {
        return source;
      }
    } catch {
      // Ignore missing assets and keep probing the remaining candidates.
    }
  }

  return null;
}

async function resolveDemoPackageMedia(demoPackage) {
  const scenes = await Promise.all(
    demoPackage.scenes.map(async (scene) => {
      const resolvedImage = await resolveExistingMediaSource(scene.imageSources);
      const imageSources = resolvedImage
        ? [resolvedImage, ...(scene.imageSources || []).filter((source) => source !== resolvedImage)]
        : scene.imageSources || [];
      const resolvedAudio = await resolveExistingMediaSource(scene.audioSources);
      const audioSources = resolvedAudio
        ? [resolvedAudio, ...(scene.audioSources || []).filter((source) => source !== resolvedAudio)]
        : scene.audioSources || [];

      return {
        ...scene,
        imageUrl: resolvedImage || scene.fallbackImageUrl || scene.imageUrl,
        imageSources,
        audioPath: resolvedAudio || scene.audioPath || null,
        audioDownloadUrl: resolvedAudio || scene.audioDownloadUrl || scene.audioPath || null,
        preferredAudioPath: resolvedAudio || scene.preferredAudioPath || null,
        audioSources,
      };
    }),
  );

  return {
    ...demoPackage,
    scenes,
  };
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
    archive: "complete",
    style: "complete",
    lora: "complete",
    controlnet: "complete",
    image: "complete",
    voice: "complete",
    video: "complete",
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

function buildStaticFallbackImageSources(style, sceneNumber) {
  const sceneSlug = `scene_${String(sceneNumber).padStart(2, "0")}`;
  return [
    `/assets/${style}/${sceneSlug}.png`,
    `/assets/${style}/${sceneSlug}.jpg`,
    `/assets/${style}/${sceneSlug}.jpeg`,
  ];
}

function normalizeBackendScenes(rawScenes, style, fallbackAudioUrl) {
  const fallback = Array.from({ length: rawScenes.length || 6 }, (_, index) => ({
    number: index + 1,
    imageUrl: buildStaticFallbackImageSources(style, index + 1)[0],
    imageSources: buildStaticFallbackImageSources(style, index + 1),
  }));
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
    const resolvedImagePath = hasImage ? scene.imagePath : fallbackScene.imageUrl;
    const imageSources = Array.isArray(scene.imageSources) && scene.imageSources.length
      ? scene.imageSources
      : [resolvedImagePath, ...(fallbackScene.imageSources || []).filter((source) => source !== resolvedImagePath)].filter(Boolean);
    const audioSources = Array.isArray(scene.audioSources) && scene.audioSources.length
      ? scene.audioSources
      : [resolvedAudioPath].filter(Boolean);

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
      imageUrl: resolvedImagePath,
      imageSources,
      fallbackImageUrl: scene.fallbackImageUrl || fallbackScene.imageUrl || null,
      audioPath: resolvedAudioPath,
      audioSources,
      audioDownloadUrl: scene.audioDownloadUrl || resolvedAudioPath,
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
    { stage: "archive", status: "complete", time: "17:23:48" },
    { stage: "style", status: "complete", time: "17:23:49" },
    { stage: "lora", status: "complete", time: "17:23:50" },
    { stage: "controlnet", status: "complete", time: "17:23:51" },
    { stage: "image", status: "complete", time: "17:23:52" },
    { stage: "voice", status: "complete", time: "17:23:53" },
    { stage: "video", status: "complete", time: "17:23:54" },
    { stage: "output", status: "complete", time: "17:23:55" },
  ];
}

function buildDemoResponse(requestId, demoPackage) {
  const scenes = demoPackage.scenes.map((scene) => ({
    sceneNumber: scene.number,
    title: scene.title,
    narrationScript: scene.narrationScript,
    imagePath: scene.imageUrl,
    imageSources: scene.imageSources,
    fallbackImageUrl: scene.fallbackImageUrl,
    audioPath: scene.preferredAudioPath || scene.audioPath,
    audioSources: scene.audioSources,
    audioDownloadUrl: scene.audioDownloadUrl,
    duration: scene.duration,
  }));
  return {
    success: true,
    requestId,
    mode: "demo",
    data: {
      storyboard: {
        title: demoPackage.themeLabel,
        totalScenes: scenes.length,
        totalDuration: scenes.reduce((total, scene) => total + scene.duration, 0),
        scenes,
      },
      videoUrl: demoPackage.videoUrl,
      videoPosterUrl: demoPackage.videoPosterUrl,
    },
    warnings: [],
    logs: [],
    progressTrace: buildDemoProgressTrace(),
  };
}

function createBundledDemoPdfBlob() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 425 >>
stream
BT
/F1 14 Tf
50 800 Td
(EDUGEN Demo PDF - Storia) Tj
1 0 0 1 50 772 Tm
(Titolo: La nascita dei comuni medievali) Tj
1 0 0 1 50 744 Tm
(Nel XII secolo molte citta italiane iniziarono a organizzarsi in comuni autonomi.) Tj
1 0 0 1 50 716 Tm
(I cittadini piu influenti crearono istituzioni locali, magistrature e statuti.) Tj
1 0 0 1 50 688 Tm
(Questo documento serve a testare il parser PDF reale della demo.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
787
%%EOF`;

  return new Blob([content], { type: "application/pdf" });
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
    customPrompt,
    archiveInsights,
    pipeline,
    output,
    warnings,
    logs,
    stats,
    isLogCollapsed,
    demoMode,
    demoScenario,
    demoDurationSeconds,
    demoMediaHistory,
    demoRunCount,
    integrationSettings,
    lastRequestPayload,
    lastResponsePayload,
    setPdf,
    clearPdf,
    setAnalysis,
    setSelectedStyle,
    setSelectedVideoPreset,
    setCustomPrompt,
    setArchiveInsights,
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
    setDemoDurationSeconds,
    setDemoMediaHistory,
    incrementDemoRunCount,
    resetDemoRunCount,
    setLastDemoTheme,
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

  const styleLabel = STYLE_LABELS[selectedStyle] || "Acquarello";

  // Reset run count on style change so variant alternation restarts from variant_01
  const handleStyleChange = (newStyle) => {
    setSelectedStyle(newStyle);
    resetDemoRunCount();
  };
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

  const replayDemoTimeline = async (pdfName, demoPackage) => {
    stopPipelineAnimation();

    const timeline = buildDemoTimeline({
      fileName: pdfName,
      styleLabel,
      sceneCount: demoPackage.scenes.length,
      themeLabel: demoPackage.themeLabel,
      customPrompt,
      includeArchive: true,
    });
    const nominalDuration = Math.max(timeline.at(-1)?.delay || 1, 1);
    const targetDurationMs = Math.max(8000, Math.min(180000, Number(demoDurationSeconds || 12) * 1000));
    const speedMultiplier = targetDurationMs / nominalDuration;
    let previousDelay = 0;

    for (const entry of timeline) {
      const delta = Math.max(140, Math.round((entry.delay - previousDelay) * speedMultiplier));
      previousDelay = entry.delay;
      await sleep(delta);

      if (!requestInFlightRef.current || activeRequestIdRef.current === null) {
        return;
      }

      if (!entry.isFinal) {
        appendLog(entry.type, entry.message);
      }
      if (entry.currentStep) {
        setCurrentStep(entry.currentStep);
      }
      if (entry.stepStates) {
        setStepStates(entry.stepStates);
      }
      if (typeof entry.progress === "number") {
        setProgress(Math.min(entry.progress, 96));
      }
      if (typeof entry.tokens === "number" || typeof entry.scenesGenerated === "number") {
        setStats({
          tokens: typeof entry.tokens === "number" ? entry.tokens : 0,
          scenesGenerated:
            typeof entry.scenesGenerated === "number" ? entry.scenesGenerated : 0,
          battute: stats.battute,
        });
      }
    }
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
    setCurrentStep("Preparazione pipeline");
    setProgress(4);
    setStepStates({ input: "active" });
    if (!demoMode) {
      setArchiveInsights([]);
    }

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

    if (!demoMode) {
      appendLog(
        "info",
        `Invio payload a n8n requestId=${requestPayload.requestId} style=${requestPayload.styleModule} videoPreset=${requestPayload.videoPreset}`,
      );
      startPipelineAnimation();
    }
    let responsePayload = null;

    try {
      let response;
      if (demoMode) {
        const rawDemoPackage = createDemoPackage({
          styleKey: selectedStyle,
          customPrompt,
          mediaHistory: demoMediaHistory,
          demoRunCount,
        });
        const demoPackage = await resolveDemoPackageMedia(rawDemoPackage);
        setArchiveInsights(demoPackage.archiveInsights);
        setDemoMediaHistory(demoPackage.updatedMediaHistory);
        setLastDemoTheme(demoPackage.themeKey);
        incrementDemoRunCount();
        await replayDemoTimeline(pdf.name, demoPackage);
        response = buildDemoResponse(requestPayload.requestId, demoPackage);
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

      const inboundLogs = normalizeInboundLogs(response?.logs);
      if (inboundLogs.length) {
        appendLogs(inboundLogs);
      }
      const inboundWarnings = normalizeInboundWarnings(response?.warnings);

      const storyboardData = response?.data?.storyboard;
      const rawScenes = storyboardData?.scenes || [];
      const fallbackAudioUrl = null;
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
        videoUrl: response?.data?.videoUrl || null,
        videoPosterUrl: response?.data?.videoPosterUrl || null,
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
    try {
      let blob = null;

      try {
        const response = await fetch("/demo/edugen-storia-demo.pdf");
        if (response.ok) {
          blob = await response.blob();
        }
      } catch {
        blob = null;
      }

      if (!blob) {
        blob = createBundledDemoPdfBlob();
      }

      const demoFile = new File([blob], "edugen-storia-demo.pdf", {
        type: "application/pdf",
        lastModified: Date.now(),
      });

      await handleFilePicked(demoFile);
    } catch (error) {
      appendLog(
        "error",
        `Impossibile caricare il PDF campione: ${error instanceof Error ? error.message : "errore sconosciuto"}`,
      );
    }
  };

  const handleSaveSettings = (nextSettings) => {
    setIntegrationSettings({
      webhookUrl: nextSettings.webhookUrl,
      requestTimeoutMs: nextSettings.requestTimeoutMs,
    });
    setDemoMode(Boolean(nextSettings.demoMode));
    setDemoScenario(nextSettings.demoScenario || "fast-success");
    setDemoDurationSeconds(nextSettings.demoDurationSeconds || 12);
    appendLog(
      "info",
      `Impostazioni aggiornate. Timeout=${nextSettings.requestTimeoutMs}ms Webhook=${nextSettings.webhookUrl} Demo=${nextSettings.demoDurationSeconds || 12}s`,
    );
  };

  const handleTestConnection = async (settings) =>
    testConnection({
      webhookUrl: settings.webhookUrl,
      timeoutMs: settings.requestTimeoutMs,
    });

  const handleExport = (kind, options = {}) => {
    if (kind === "all") {
      (options.kinds || []).forEach((selectedKind, index) => {
        window.setTimeout(() => {
          handleExport(selectedKind, options);
        }, index * 180);
      });
      return;
    }

    const exportUrls = lastResponsePayload?.data?.exports || {};
    const selectedSceneAudio =
      options.selectedScene?.audioDownloadUrl || options.selectedScene?.audioPath || null;
    const firstPlayableAudio =
      output.storyboard.find((scene) => scene.audioDownloadUrl || scene.audioPath)?.audioDownloadUrl ||
      output.storyboard.find((scene) => scene.audioDownloadUrl || scene.audioPath)?.audioPath ||
      output.audioUrl ||
      null;
    const resolvedAudioUrl = selectedSceneAudio || firstPlayableAudio;
    const resolvedVideoUrl = exportUrls.videoUrl || output.videoUrl || null;

    if (kind === "storyboard") {
      downloadTextFile(
        "edugen-storyboard.json",
        JSON.stringify(output.storyboard, null, 2),
        "application/json;charset=utf-8",
      );
    }
    if (kind === "audio") {
      if (!resolvedAudioUrl) {
        appendLog("warning", "Nessun file audio disponibile per il download.");
      } else {
        void downloadUrlFile(
          resolvedAudioUrl,
          `edugen-narration.${guessExtensionFromUrl(resolvedAudioUrl, "mp3")}`,
        ).catch((error) => {
          appendLog("error", `Download audio fallito: ${getErrorMessage(error)}`);
        });
      }
    }
    if (kind === "video") {
      if (!resolvedVideoUrl) {
        appendLog("warning", "Il backend non ha fornito un export video.");
      } else {
        void downloadUrlFile(
          resolvedVideoUrl,
          `edugen-video.${guessExtensionFromUrl(resolvedVideoUrl, "mp4")}`,
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
    setIsExportMenuOpen(false);
  };

  const exportAvailability = useMemo(
    () => ({
      storyboard: output.storyboard.length > 0,
      audio: Boolean(
        output.audioUrl ||
        output.storyboard.some((scene) => scene.audioPath || scene.audioDownloadUrl),
      ),
      video: Boolean(lastResponsePayload?.data?.exports?.videoUrl || output.videoUrl),
      package: Boolean(lastResponsePayload?.data?.exports?.packageUrl),
    }),
    [lastResponsePayload, output.audioUrl, output.storyboard, output.videoUrl],
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
        demoDurationSeconds={demoDurationSeconds}
        integrationSettings={resolvedIntegrationSettings}
        onSave={handleSaveSettings}
        onTestConnection={handleTestConnection}
      />

      <div className="mx-auto h-[calc(100%-60px)] w-full max-w-[1920px] px-4 pb-3 pt-4">
        <div
          className={`grid h-full gap-3 ${isLogCollapsed
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
              customPrompt={customPrompt}
              archiveInsights={archiveInsights}
              onStyleChange={handleStyleChange}
              onVideoPresetChange={setSelectedVideoPreset}
              onCustomPromptChange={setCustomPrompt}
              onFilePicked={handleFilePicked}
              onUseDemoPdf={handleUseDemoPdf}
              onRemoveFile={handleRemoveFile}
              onGenerate={handleGenerate}
              pipelineStatus={pipeline.status}
              progress={pipeline.progress}
              demoMode={demoMode}
            />
            <PipelineVisualizer
              steps={pipeline.steps}
              currentStep={pipeline.currentStep}
              progress={pipeline.progress}
            />
            <OutputPanel
              scenes={output.storyboard}
              audioUrl={output.audioUrl}
              videoUrl={output.videoUrl}
              videoPosterUrl={output.videoPosterUrl}
              loading={pipeline.status === "processing"}
              warnings={warnings}
              archiveInsights={archiveInsights}
              exportAvailability={exportAvailability}
              onExport={handleExport}
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
