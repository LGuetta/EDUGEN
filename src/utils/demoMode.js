const STYLE_PRESETS = {
  storia: {
    label: "Storia",
    palette: ["#4f46e5", "#f59e0b", "#14b8a6"],
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
    palette: ["#0ea5e9", "#22c55e", "#6366f1"],
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
    palette: ["#ec4899", "#f97316", "#8b5cf6"],
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
const DEMO_GRAIN_SCENES = [
  {
    number: 1,
    title: "Semina",
    narrationScript:
      "Il ciclo del grano inizia con la semina. Il seme viene deposto nel terreno e ricoperto con cura per favorire la germinazione.",
  },
  {
    number: 2,
    title: "Germinazione",
    narrationScript:
      "Dopo la semina, il seme assorbe acqua e si apre. Dalla cariosside nasce il primo germoglio che emerge dal terreno.",
  },
  {
    number: 3,
    title: "Levata",
    narrationScript:
      "La giovane pianta cresce e sviluppa il fusto. Le foglie si allungano e il grano inizia a occupare il campo.",
  },
  {
    number: 4,
    title: "Spigatura",
    narrationScript:
      "La spiga si forma e fuoriesce. In questa fase si sviluppano i futuri chicchi che daranno origine al raccolto.",
  },
  {
    number: 5,
    title: "Maturazione",
    narrationScript:
      "Le sostanze nutritive si concentrano nella spiga. I chicchi si ingrossano e il colore del campo diventa dorato.",
  },
  {
    number: 6,
    title: "Raccolta",
    narrationScript:
      "Quando il grano è maturo si passa alla raccolta. I chicchi vengono separati e preparati per la trasformazione in farina.",
  },
];

function createSceneDataUrl(sceneNumber, title, colors) {
  const [a, b, c] = colors;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${a}" />
          <stop offset="55%" stop-color="${b}" />
          <stop offset="100%" stop-color="${c}" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="#09090f" />
      <rect x="14" y="14" width="372" height="192" rx="12" fill="url(#bg)" opacity="0.85" />
      <circle cx="328" cy="64" r="44" fill="#ffffff" fill-opacity="0.12" />
      <rect x="34" y="34" width="160" height="18" rx="9" fill="#ffffff" fill-opacity="0.23" />
      <rect x="34" y="66" width="280" height="10" rx="5" fill="#ffffff" fill-opacity="0.16" />
      <rect x="34" y="86" width="218" height="10" rx="5" fill="#ffffff" fill-opacity="0.16" />
      <rect x="34" y="152" width="118" height="34" rx="6" fill="#111827" fill-opacity="0.46" />
      <text x="44" y="174" fill="#ffffff" font-family="Inter, sans-serif" font-size="16" font-weight="700">Scene ${sceneNumber}</text>
      <text x="34" y="126" fill="#ffffff" font-family="Inter, sans-serif" font-size="18" font-weight="600">${title}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createDemoStoryboard(styleKey = "storia") {
  const style = STYLE_PRESETS[styleKey] || FALLBACK_STYLE;
  return style.sceneTitles.map((title, index) => ({
    id: `scene_${index + 1}`,
    number: index + 1,
    title,
    imageUrl: createSceneDataUrl(index + 1, title, style.palette),
  }));
}

export function createFallbackDemoPackage(styleKey = "storia") {
  const style = STYLE_PRESETS[styleKey] || FALLBACK_STYLE;

  return DEMO_GRAIN_SCENES.map((scene, index) => ({
    id: `scene_${scene.number}`,
    number: scene.number,
    title: scene.title,
    narrationScript: scene.narrationScript,
    imageUrl: createSceneDataUrl(scene.number, scene.title, style.palette),
  }));
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

export function createDemoNarrationUrl(durationSeconds = 14) {
  const sampleRate = 22050;
  const frames = durationSeconds * sampleRate;
  const buffer = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(buffer);
  writeWavHeader(view, sampleRate, frames);

  for (let index = 0; index < frames; index += 1) {
    const time = index / sampleRate;
    const waveA = Math.sin(2 * Math.PI * 215 * time) * 0.25;
    const waveB = Math.sin(2 * Math.PI * 325 * time) * 0.16;
    const waveC = Math.sin(2 * Math.PI * 420 * time) * 0.08;
    const envelope = Math.sin(Math.PI * (index / frames));
    const value = Math.max(-1, Math.min(1, (waveA + waveB + waveC) * envelope));
    view.setInt16(44 + index * 2, value * 32767, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

export function buildDemoTimeline({ fileName, styleLabel, sceneCount }) {
  const base = [
    {
      delay: 0,
      type: "success",
      message: `PDF loaded: ${fileName}`,
      currentStep: "Estrazione testo",
      progress: 6,
      stepStates: { input: "complete", parsing: "active" },
      tokens: 420,
    },
    {
      delay: 900,
      type: "info",
      message: "Extracting text content and semantic chunks...",
      currentStep: "Parsing documento",
      progress: 15,
      stepStates: { parsing: "active" },
      tokens: 1800,
    },
    {
      delay: 2200,
      type: "success",
      message: "Extracted 2,450 words from 12 pages",
      currentStep: "Analisi LLM",
      progress: 28,
      stepStates: { parsing: "complete", llm: "active" },
      tokens: 4100,
    },
    {
      delay: 3600,
      type: "info",
      message: "Starting LLM analysis for scene segmentation...",
      currentStep: "Analisi LLM",
      progress: 38,
      stepStates: { llm: "active" },
      tokens: 6850,
    },
    {
      delay: 5100,
      type: "success",
      message: `Identified ${sceneCount} storyboard scenes`,
      currentStep: "Selezione stile",
      progress: 48,
      stepStates: { llm: "complete", style: "active" },
      tokens: 8900,
    },
    {
      delay: 6100,
      type: "info",
      message: `Loading Style Engine: "${styleLabel}" LoRA adapter`,
      currentStep: "Render immagini",
      progress: 56,
      stepStates: { style: "complete", image: "active" },
      tokens: 10120,
    },
  ];

  const scenes = Array.from({ length: sceneCount }).flatMap((_, index) => {
    const number = index + 1;
    const start = 7400 + index * 1150;
    return [
      {
        delay: start,
        type: "info",
        message: `Generating scene ${number}/${sceneCount}...`,
        currentStep: "Render immagini",
        progress: 56 + Math.round((number / sceneCount) * 20),
        stepStates: { image: "active" },
        tokens: 10120 + number * 760,
        scenesGenerated: number - 1,
      },
      {
        delay: start + 760,
        type: "success",
        message: `Scene ${number} complete`,
        currentStep: "Render immagini",
        progress: 58 + Math.round((number / sceneCount) * 20),
        stepStates: { image: "active" },
        tokens: 10440 + number * 810,
        scenesGenerated: number,
      },
    ];
  });

  const voiceStart = 7600 + sceneCount * 1150;
  const ending = [
    {
      delay: voiceStart,
      type: "info",
      message: "Starting voice synthesis...",
      currentStep: "Sintesi vocale",
      progress: 85,
      stepStates: { image: "complete", voice: "active" },
      tokens: 14680,
      scenesGenerated: sceneCount,
    },
    {
      delay: voiceStart + 2100,
      type: "success",
      message: "Audio narration generated (4:12)",
      currentStep: "Packaging output",
      progress: 94,
      stepStates: { voice: "complete", output: "active" },
      tokens: 15600,
      scenesGenerated: sceneCount,
    },
    {
      delay: voiceStart + 2900,
      type: "success",
      message: "Pipeline complete! Ready for export.",
      currentStep: "Completato",
      progress: 100,
      stepStates: { output: "complete" },
      tokens: 16240,
      scenesGenerated: sceneCount,
      isFinal: true,
    },
  ];

  return [...base, ...scenes, ...ending];
}

export const STYLE_LABELS = {
  storia: "Storia",
  scienze: "Scienze",
  arte: "Arte",
  custom: "Custom LoRA",
};
