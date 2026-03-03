const STYLE_PRESETS = {
  storia: {
    label: "Storia",
    palette: ["#d97706", "#facc15", "#0f766e"],
    sceneTitles: [
      "Contesto storico",
      "Cause principali",
      "Snodo narrativo",
      "Evoluzione degli eventi",
      "Conseguenze",
      "Sintesi finale",
    ],
  },
  scienze: {
    label: "Scienze",
    palette: ["#0284c7", "#22c55e", "#facc15"],
    sceneTitles: [
      "Ipotesi iniziale",
      "Setup sperimentale",
      "Osservazione",
      "Analisi dati",
      "Risultati",
      "Conclusioni",
    ],
  },
  arte: {
    label: "Arte",
    palette: ["#be185d", "#f97316", "#8b5cf6"],
    sceneTitles: [
      "Introduzione opera",
      "Composizione",
      "Uso della luce",
      "Dettagli simbolici",
      "Contesto culturale",
      "Lettura critica",
    ],
  },
};

const FALLBACK_STYLE = STYLE_PRESETS.storia;
const DEMO_THEMES = {
  "grain-cycle": {
    label: "Ciclo del grano",
    logsFocus: "ciclo del grano",
    archiveInsights: [
      {
        id: "archive_1",
        label: "Riferimento agricolo di lungo periodo",
        description: "Timeline agronomica coerente con il focus selezionato.",
      },
      {
        id: "archive_2",
        label: "Lessico scolastico Zanichelli",
        description: "Tono e terminologia orientati a una spiegazione didattica.",
      },
      {
        id: "archive_3",
        label: "Suggerimento iconografico archivistico",
        description: "Supporto visuale orientato a semina, crescita e raccolta.",
      },
    ],
    scenes: [
      {
        number: 1,
        title: "Semina",
        narrationScript:
          "Il ciclo del grano inizia con la semina. I chicchi vengono deposti nel terreno e ricoperti con cura, così da creare le condizioni ideali per la nascita della pianta.",
      },
      {
        number: 2,
        title: "Germinazione",
        narrationScript:
          "Dopo l'assorbimento dell'acqua, il seme si apre e compare il primo germoglio. È la fase in cui la vita della nuova pianta diventa visibile e inizia a emergere dal suolo.",
      },
      {
        number: 3,
        title: "Levata",
        narrationScript:
          "La pianta cresce rapidamente, sviluppa il fusto e allunga le foglie. Il campo inizia a riempirsi di steli verdi e il grano entra nella sua fase di crescita attiva.",
      },
      {
        number: 4,
        title: "Spigatura",
        narrationScript:
          "La spiga fuoriesce dal culmo e si forma la struttura che conterrà i futuri chicchi. È il passaggio in cui il raccolto comincia a prendere la sua forma definitiva.",
      },
      {
        number: 5,
        title: "Maturazione",
        narrationScript:
          "Le sostanze nutritive si concentrano nei chicchi e il colore della coltura cambia progressivamente. Il grano passa dal verde al dorato, segno che si avvicina il momento della raccolta.",
      },
      {
        number: 6,
        title: "Raccolta",
        narrationScript:
          "Quando le spighe sono mature, il grano viene raccolto e separato dalla paglia. I chicchi ottenuti diventano la base per la produzione della farina e per nuovi cicli agricoli.",
      },
    ],
  },
};

const DEFAULT_THEME = "grain-cycle";
const IMAGE_VARIANT_COUNT = 4;
const AUDIO_SET_COUNT = 5;
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg"];
const AUDIO_EXTENSIONS = ["mp3", "MP3"];
const AUDIO_SET_CANDIDATES = [1, 2, 3, 4, 5, 6];

function getStylePreset(styleKey) {
  return STYLE_PRESETS[styleKey] || FALLBACK_STYLE;
}

function createSceneDataUrl(sceneNumber, title, colors, variantIndex = 1) {
  const [a, b, c] = colors;
  const accent = [0.1, 0.18, 0.26, 0.34][Math.max(0, Math.min(variantIndex - 1, 3))];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${a}" />
          <stop offset="55%" stop-color="${b}" />
          <stop offset="100%" stop-color="${c}" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="#09090f" />
      <rect x="14" y="14" width="372" height="212" rx="14" fill="url(#bg)" opacity="0.9" />
      <circle cx="332" cy="66" r="44" fill="#ffffff" fill-opacity="${accent}" />
      <path d="M34 170 C96 112, 156 112, 220 170 S338 228, 370 182" fill="none" stroke="#ffffff" stroke-opacity="0.26" stroke-width="5" stroke-linecap="round" />
      <path d="M36 190 C100 132, 156 132, 220 190 S338 246, 372 204" fill="none" stroke="#111827" stroke-opacity="0.18" stroke-width="16" stroke-linecap="round" />
      <rect x="34" y="34" width="164" height="18" rx="9" fill="#ffffff" fill-opacity="0.24" />
      <rect x="34" y="64" width="282" height="11" rx="5" fill="#ffffff" fill-opacity="0.16" />
      <rect x="34" y="84" width="228" height="11" rx="5" fill="#ffffff" fill-opacity="0.14" />
      <rect x="34" y="154" width="144" height="38" rx="8" fill="#111827" fill-opacity="0.46" />
      <text x="46" y="177" fill="#ffffff" font-family="Inter, sans-serif" font-size="16" font-weight="700">Scene ${sceneNumber}</text>
      <text x="34" y="126" fill="#ffffff" font-family="Inter, sans-serif" font-size="20" font-weight="700">${title}</text>
      <text x="34" y="212" fill="#ffffff" fill-opacity="0.8" font-family="Inter, sans-serif" font-size="13">Variant ${String(variantIndex).padStart(2, "0")}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function writeWavHeader(view, sampleRate, frames) {
  const bytesPerSample = 2;
  const dataLength = frames * bytesPerSample;
  const writeString = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
}

export function createDemoNarrationUrl(durationSeconds = 12, voiceVariant = 1) {
  const sampleRate = 22050;
  const frames = durationSeconds * sampleRate;
  const buffer = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(buffer);
  writeWavHeader(view, sampleRate, frames);

  const primaryFrequency = 165 + voiceVariant * 18;
  const secondaryFrequency = 250 + voiceVariant * 12;
  const tertiaryFrequency = 340 + voiceVariant * 9;

  for (let index = 0; index < frames; index += 1) {
    const time = index / sampleRate;
    const waveA = Math.sin(2 * Math.PI * primaryFrequency * time) * 0.24;
    const waveB = Math.sin(2 * Math.PI * secondaryFrequency * time) * 0.15;
    const waveC = Math.sin(2 * Math.PI * tertiaryFrequency * time) * 0.07;
    const envelope = Math.sin(Math.PI * (index / frames));
    const value = Math.max(-1, Math.min(1, (waveA + waveB + waveC) * envelope));
    view.setInt16(44 + index * 2, value * 32767, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function buildDemoImagePath(styleKey, sceneNumber, variantIndex) {
  const sceneSlug = `scene_${String(sceneNumber).padStart(2, "0")}`;
  const variantSlug = `variant_${String(variantIndex).padStart(2, "0")}.png`;
  return `/assets/${styleKey}/${sceneSlug}/${variantSlug}`;
}

function buildDemoImageSources(styleKey, sceneNumber, variantIndex) {
  const sceneSlug = `scene_${String(sceneNumber).padStart(2, "0")}`;
  const orderedVariants = [
    variantIndex,
    ...Array.from({ length: IMAGE_VARIANT_COUNT }, (_, index) => index + 1).filter(
      (candidate) => candidate !== variantIndex,
    ),
  ];

  return orderedVariants.flatMap((candidate) => {
    const variantBase = `variant_${String(candidate).padStart(2, "0")}`;
    return IMAGE_EXTENSIONS.map(
      (extension) => `/assets/${styleKey}/${sceneSlug}/${variantBase}.${extension}`,
    );
  });
}

function buildDemoAudioSources(styleKey, audioSetIndex, sceneNumber) {
  const orderedSets = [
    audioSetIndex,
    ...AUDIO_SET_CANDIDATES.filter((candidate) => candidate !== audioSetIndex),
  ];
  const trackBase = `narration_${String(sceneNumber).padStart(2, "0")}`;

  return orderedSets.flatMap((setId) => {
    const setSlug = `audio_set_${String(setId).padStart(2, "0")}`;
    return AUDIO_EXTENSIONS.map(
      (extension) => `/assets/${styleKey}/${setSlug}/${trackBase}.${extension}`,
    );
  });
}

export function getDemoVideoUrl(styleKey) {
  return `/assets/${styleKey}/video_demo.mp4`;
}

function createVideoPosterUrl(styleKey) {
  const style = getStylePreset(styleKey);
  const [a, b, c] = style.palette;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${a}" />
          <stop offset="50%" stop-color="${b}" />
          <stop offset="100%" stop-color="${c}" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="18" fill="#070b16" />
      <rect x="16" y="16" width="608" height="328" rx="16" fill="url(#bg)" opacity="0.92" />
      <circle cx="320" cy="180" r="62" fill="#ffffff" fill-opacity="0.18" />
      <polygon points="300,144 300,216 360,180" fill="#ffffff" fill-opacity="0.85" />
      <text x="34" y="324" fill="#ffffff" font-family="Inter, sans-serif" font-size="22" font-weight="700">Video demo - ${style.label}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getHistoryBucket(mediaHistory, styleKey, themeKey) {
  const bucketKey = `${styleKey}::${themeKey}`;
  return {
    bucketKey,
    bucket: mediaHistory[bucketKey] || {
      scenes: {},
      usedAudioSets: [],
      lastAudioSet: null,
    },
  };
}

function cloneMediaHistory(mediaHistory) {
  return JSON.parse(JSON.stringify(mediaHistory || {}));
}

function selectNextImageVariant(bucket, sceneNumber) {
  const sceneKey = `scene_${String(sceneNumber).padStart(2, "0")}`;
  const sceneHistory = bucket.scenes[sceneKey] || {
    usedImageVariants: [],
    lastImageVariant: null,
  };

  const allVariants = Array.from({ length: IMAGE_VARIANT_COUNT }, (_, index) => index + 1);
  let available = allVariants.filter((variant) => !sceneHistory.usedImageVariants.includes(variant));

  if (!available.length) {
    available = [...allVariants];
    if (sceneHistory.lastImageVariant && available.length > 1) {
      available = available.filter((variant) => variant !== sceneHistory.lastImageVariant);
    }
  }

  const nextVariant = available[Math.floor(Math.random() * available.length)];
  const usedImageVariants = sceneHistory.usedImageVariants.includes(nextVariant)
    ? [nextVariant]
    : [...sceneHistory.usedImageVariants, nextVariant];

  bucket.scenes[sceneKey] = {
    usedImageVariants,
    lastImageVariant: nextVariant,
  };

  return nextVariant;
}

function selectNextAudioSet(bucket) {
  const allSets = Array.from({ length: AUDIO_SET_COUNT }, (_, index) => index + 1);
  let available = allSets.filter((setId) => !bucket.usedAudioSets.includes(setId));

  if (!available.length) {
    available = [...allSets];
    if (bucket.lastAudioSet && available.length > 1) {
      available = available.filter((setId) => setId !== bucket.lastAudioSet);
    }
  }

  const nextSet = available[Math.floor(Math.random() * available.length)];
  bucket.usedAudioSets = bucket.usedAudioSets.includes(nextSet)
    ? [nextSet]
    : [...bucket.usedAudioSets, nextSet];
  bucket.lastAudioSet = nextSet;

  return nextSet;
}

export function resolveDemoTheme(customPrompt = "") {
  const normalized = customPrompt.toLowerCase();
  const grainKeywords = ["grano", "semina", "raccolta", "ciclo del grano"];
  if (!normalized.trim()) return DEFAULT_THEME;
  if (grainKeywords.some((keyword) => normalized.includes(keyword))) {
    return DEFAULT_THEME;
  }
  return DEFAULT_THEME;
}

function createArchiveInsights(themeKey) {
  const theme = DEMO_THEMES[themeKey] || DEMO_THEMES[DEFAULT_THEME];
  return theme.archiveInsights.map((insight) => ({ ...insight }));
}

export function createDemoStoryboard(styleKey = "storia") {
  const style = getStylePreset(styleKey);
  return style.sceneTitles.map((title, index) => ({
    id: `scene_${index + 1}`,
    number: index + 1,
    title,
    imageUrl: createSceneDataUrl(index + 1, title, style.palette, 1),
    fallbackImageUrl: createSceneDataUrl(index + 1, title, style.palette, 1),
  }));
}

export function createFallbackDemoPackage(styleKey = "storia") {
  const style = getStylePreset(styleKey);
  const theme = DEMO_THEMES[DEFAULT_THEME];

  return theme.scenes.map((scene) => ({
    id: `scene_${scene.number}`,
    number: scene.number,
    title: scene.title,
    narrationScript: scene.narrationScript,
    imageUrl: createSceneDataUrl(scene.number, scene.title, style.palette, 1),
    fallbackImageUrl: createSceneDataUrl(scene.number, scene.title, style.palette, 1),
    imageSources: [createSceneDataUrl(scene.number, scene.title, style.palette, 1)],
  }));
}

export function createDemoPackage({
  styleKey = "storia",
  customPrompt = "",
  mediaHistory = {},
  demoRunCount = 0,
}) {
  const themeKey = resolveDemoTheme(customPrompt);
  const theme = DEMO_THEMES[themeKey] || DEMO_THEMES[DEFAULT_THEME];
  const style = getStylePreset(styleKey);
  const nextMediaHistory = cloneMediaHistory(mediaHistory);
  const { bucketKey, bucket } = getHistoryBucket(nextMediaHistory, styleKey, themeKey);
  nextMediaHistory[bucketKey] = bucket;

  const audioSet = selectNextAudioSet(bucket);
  const scenes = theme.scenes.map((scene) => {
    const variantIndex = selectNextImageVariant(bucket, scene.number);
    const fallbackImageUrl = createSceneDataUrl(
      scene.number,
      scene.title,
      style.palette,
      variantIndex,
    );
    const fallbackAudioUrl = createDemoNarrationUrl(
      Math.max(8, Math.round(scene.narrationScript.length / 18)),
      audioSet,
    );
    const imageSources = buildDemoImageSources(styleKey, scene.number, variantIndex);
    const imagePath = imageSources[0];
    const preferredAudioSources = buildDemoAudioSources(styleKey, audioSet, scene.number);
    const preferredAudioPath = preferredAudioSources[0] || null;

    return {
      id: `scene_${scene.number}`,
      number: scene.number,
      title: scene.title,
      narrationScript: scene.narrationScript,
      duration: Math.max(8, Number((scene.narrationScript.length / 18).toFixed(1))),
      imageUrl: imagePath,
      imageSources: [...imageSources, fallbackImageUrl],
      fallbackImageUrl,
      imageVariantKey: `variant_${String(variantIndex).padStart(2, "0")}`,
      audioPath: preferredAudioPath || fallbackAudioUrl,
      audioSources: [...preferredAudioSources, fallbackAudioUrl],
      audioDownloadUrl: preferredAudioPath || fallbackAudioUrl,
      preferredAudioPath,
      audioSetKey: `audio_set_${String(audioSet).padStart(2, "0")}`,
    };
  });

  return {
    themeKey,
    themeLabel: theme.label,
    styleLabel: style.label,
    archiveInsights: createArchiveInsights(themeKey),
    scenes,
    audioSetKey: `audio_set_${String(audioSet).padStart(2, "0")}`,
    videoUrl: null,
    videoPosterUrl: createVideoPosterUrl(styleKey),
    updatedMediaHistory: nextMediaHistory,
    runLabel: `run_${demoRunCount + 1}`,
  };
}

export function buildDemoTimeline({
  fileName,
  styleLabel,
  sceneCount,
  themeLabel,
  customPrompt,
  includeArchive = true,
}) {
  const focusEnabled = Boolean(customPrompt?.trim());
  const timeSeed = Math.random();
  const multiplier = 1 + timeSeed * 0.18;
  const steps = [];
  let cursor = 0;

  const pushStep = (delta, payload) => {
    cursor += Math.round(delta * multiplier);
    steps.push({ delay: cursor, ...payload });
  };

  steps.push({
    delay: 0,
    type: "success",
    message: `PDF caricato: ${fileName}`,
    currentStep: "Acquisizione input",
    progress: 5,
    stepStates: { input: "active" },
    tokens: 520,
  });

  pushStep(950, {
    type: "info",
    message: "Interpretazione struttura: indice, sezioni e ricorrenze lessicali in analisi...",
    currentStep: "Parse request",
    progress: 14,
    stepStates: { input: "complete", parsing: "active" },
    tokens: 2100,
  });

  pushStep(820, {
    type: "info",
    message: "Segmentazione tematica completata: nuclei narrativi prioritari identificati.",
    currentStep: "Parse request",
    progress: 18,
    stepStates: { input: "complete", parsing: "active" },
    tokens: 2760,
  });

  if (focusEnabled) {
    pushStep(900, {
      type: "success",
      message: `Focus semantico applicato: ${customPrompt.trim()}`,
      currentStep: "Analisi LLM",
      progress: 22,
      stepStates: { parsing: "active" },
      tokens: 3340,
    });
  }

  pushStep(1350, {
    type: "info",
    message: `Analisi LLM in corso: correlazione tra contenuto sorgente e focus "${themeLabel.toLowerCase()}".`,
    currentStep: "LLM analysis",
    progress: 32,
    stepStates: { parsing: "complete", llm: "active" },
    tokens: 5820,
  });

  pushStep(900, {
    type: "info",
    message: "Struttura narrativa definita: sequenza scene, ritmo e priorita concettuali allineati.",
    currentStep: "LLM analysis",
    progress: 36,
    stepStates: { parsing: "complete", llm: "active" },
    tokens: 6640,
  });

  if (includeArchive) {
    pushStep(1150, {
      type: "success",
      message: "Archivio Vivo: 3 riferimenti contestuali agganciati e pesati sulla linea narrativa.",
      currentStep: "Archivio Vivo",
      progress: 42,
      stepStates: { llm: "complete", archive: "active" },
      tokens: 7480,
    });
  }

  pushStep(950, {
    type: "info",
    message: `Style prompt ottimizzato per ${styleLabel}: tono, palette e gerarchia visuale definiti.`,
    currentStep: "Style Prompt",
    progress: 50,
    stepStates: { archive: includeArchive ? "complete" : "idle", style: "active" },
    tokens: 8660,
  });

  pushStep(850, {
    type: "info",
    message: "Selezione LoRA e ControlNet: vincoli compositivi e coerenza visiva in definizione.",
    currentStep: "LoRA + ControlNet",
    progress: 58,
    stepStates: { style: "complete", lora: "active", controlnet: "active" },
    tokens: 9440,
  });

  for (let index = 0; index < sceneCount; index += 1) {
    const sceneNumber = index + 1;
    pushStep(780, {
      type: "info",
      message: `Scene ${sceneNumber}/${sceneCount}: composizione visiva, soggetto e variante media consolidati.`,
      currentStep: "Image Gen",
      progress: 62 + Math.round(((sceneNumber - 1) / sceneCount) * 14),
      stepStates: {
        lora: "complete",
        controlnet: "complete",
        image: "active",
      },
      tokens: 10320 + sceneNumber * 620,
      scenesGenerated: sceneNumber,
    });
  }

  pushStep(1120, {
    type: "success",
    message: "Tracce audio selezionate: pacing, enfasi e continuita timbrica verificati.",
    currentStep: "Voice Synth",
    progress: 80,
    stepStates: { image: "complete", voice: "active" },
    tokens: 14640,
    scenesGenerated: sceneCount,
  });

  pushStep(920, {
    type: "info",
    message: "Video output in preparazione (WIP placeholder): timeline di composizione riservata alla presentazione.",
    currentStep: "Video Compose",
    progress: 90,
    stepStates: { voice: "complete", video: "active" },
    tokens: 15420,
    scenesGenerated: sceneCount,
  });

  pushStep(1100, {
    type: "success",
    message: "Pipeline completata: storyboard, media e output finale sincronizzati.",
    currentStep: "Aggregate Output",
    progress: 100,
    stepStates: { video: "complete", output: "complete" },
    tokens: 16120,
    scenesGenerated: sceneCount,
    isFinal: true,
  });

  return steps;
}

export const STYLE_LABELS = {
  storia: "Storia",
  scienze: "Scienze",
  arte: "Arte",
  custom: "Custom LoRA",
};
