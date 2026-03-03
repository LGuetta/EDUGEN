const DEMO_SCENE_TITLES = [
  "Semina",
  "Germinazione",
  "Levata",
  "Spigatura",
  "Maturazione",
];

const DEMO_SCENE_SCRIPTS = [
  "Un seme. Piccolo, quasi invisibile. Deposto nella terra a due, tre centimetri di profondità, poi ricoperto di suolo.\n\nÈ ottobre. La seminatrice a file distribuisce 180-200 kg di seme per ettaro. L'operatore regola profondità e spaziatura tra le file.",
  "Dentro il seme, l'embrione si risveglia. Si trasforma, lentamente, in una piccola pianta. La vita comincia al buio.\n\nTemperatura ottimale del suolo: 10-15°C. Umidità controllata. I primi germogli emergono in 7-10 giorni.",
  "Il germoglio sale verso la luce. Cresce il fusto, si aprono foglie lunghe e strette. La pianta impara a stare in piedi.\n\nÈ gennaio. Il trattore distribuisce azoto: 80-120 kg per ettaro. La concimazione sostiene la crescita del fusto.",
  "Fuoriesce la spiga. Su di essa nascono i fiori, poi i frutti: le cariossidi. Identiche al seme di partenza. Il cerchio si prepara a chiudersi.\n\nÈ maggio. Ogni spiga porta 35-50 cariossidi. Un ettaro coltivato conta fino a 600 spighe per metro quadro.",
  "Le sostanze nutritive migrano dalle foglie alle cariossidi. La spiga si ingrossa, si fa pesante. La pianta ingiallisce: ha dato tutto.\n\nUmidità del chicco: scende al 13-14%. Il tecnico agrario monitora il campo per stabilire il momento ottimale del raccolto.",
];

const DEMO_THEMES = {
  "grain-cycle": {
    label: "Ciclo del grano",
    subject: "Storia",
    language: "Italiano",
    complexity: "Medium",
    scenes: DEMO_SCENE_TITLES.map((title, index) => ({
      id: `scene_${index + 1}`,
      number: index + 1,
      title,
      narrationScript: DEMO_SCENE_SCRIPTS[index],
      duration: [20, 18, 18, 20, 19][index],
    })),
    archiveInsights: [
      {
        id: "insight_01",
        label: "Riferimento agricolo di lungo periodo",
        description: "Timeline agronomica coerente con il focus selezionato.",
      },
      {
        id: "insight_02",
        label: "Lessico scolastico strutturato",
        description: "Terminologia accessibile e adatta a contenuti didattici.",
      },
      {
        id: "insight_03",
        label: "Indicatori tecnici contestualizzati",
        description: "Dati di campo integrati in forma narrativa e leggibile.",
      },
    ],
  },
};

const DEFAULT_THEME = "grain-cycle";
const DEMO_IMAGE_VARIANTS = ["variant_01", "variant_02", "variant_03", "variant_04"];
const DEMO_AUDIO_SETS = ["audio_set_01", "audio_set_02", "audio_set_03", "audio_set_04", "audio_set_05"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg"];
const AUDIO_EXTENSIONS = ["mp3", "MP3"];

export const STYLE_LABELS = {
  acquarello: "Acquarello",
  vettoriale: "Vettoriale",
  fotorealistico: "Fotorealistico",
};

export function resolveDemoTheme(customPrompt) {
  const normalized = String(customPrompt || "").toLowerCase();
  if (normalized.includes("grano") || normalized.includes("semina") || normalized.includes("raccolta") || normalized.includes("ciclo del grano")) {
    return DEFAULT_THEME;
  }
  return DEFAULT_THEME;
}

function nextFromPool(allValues, usedValues, lastValue) {
  const used = new Set(usedValues || []);
  const available = allValues.filter((value) => !used.has(value));
  const pool = available.length > 0 ? available : allValues.filter((value) => value !== lastValue);
  const effectivePool = pool.length > 0 ? pool : allValues;
  const selected = effectivePool[Math.floor(Math.random() * effectivePool.length)];
  const nextUsed = available.length > 0 ? [...used, selected] : [selected];
  return { selected, nextUsed };
}

function buildImageCandidates(styleKey, sceneNumber, preferredVariant) {
  const sceneKey = `scene_${String(sceneNumber).padStart(2, "0")}`;
  const preferredOrder = [preferredVariant, ...DEMO_IMAGE_VARIANTS.filter((variant) => variant !== preferredVariant)];
  return preferredOrder.flatMap((variant) => IMAGE_EXTENSIONS.map((ext) => `/assets/${styleKey}/${sceneKey}/${variant}.${ext}`));
}

function buildAudioCandidates(styleKey, sceneNumber, preferredSet) {
  const fileName = `narration_${String(sceneNumber).padStart(2, "0")}`;
  const preferredOrder = [preferredSet, ...DEMO_AUDIO_SETS.filter((setName) => setName !== preferredSet)];
  return preferredOrder.flatMap((setName) => AUDIO_EXTENSIONS.map((ext) => `/assets/${styleKey}/${setName}/${fileName}.${ext}`));
}

export function createDemoPackage({ styleKey, customPrompt, mediaHistory, demoRunCount = 0 }) {
  const themeKey = resolveDemoTheme(customPrompt);
  const theme = DEMO_THEMES[themeKey];
  const nextHistory = { ...(mediaHistory || {}) };
  const styleHistory = nextHistory[styleKey] || {};

  // Image variant: toggles deterministically between variant_01 (even runs) and variant_02 (odd runs).
  // This makes every single Regen visibly switch all images at once, giving a clear "regenerated" feel.
  const selectedVariant = demoRunCount % 2 === 0 ? "variant_01" : "variant_02";

  // Audio set: pool-based rotation so each regen uses a different voice take.
  const audioHistory = styleHistory.audio || { usedSets: [], lastSet: null };
  const audioSelection = nextFromPool(DEMO_AUDIO_SETS, audioHistory.usedSets, audioHistory.lastSet);
  const selectedAudioSet = audioSelection.selected;

  const scenes = theme.scenes.map((scene) => ({
    ...scene,
    imageVariant: selectedVariant,
    imageUrl: buildImageCandidates(styleKey, scene.number, selectedVariant)[0],
    imageSources: buildImageCandidates(styleKey, scene.number, selectedVariant),
    audioSet: selectedAudioSet,
    audioPath: buildAudioCandidates(styleKey, scene.number, selectedAudioSet)[0],
    audioSources: buildAudioCandidates(styleKey, scene.number, selectedAudioSet),
  }));

  styleHistory.audio = {
    usedSets: audioSelection.nextUsed,
    lastSet: selectedAudioSet,
  };
  nextHistory[styleKey] = styleHistory;

  return {
    themeKey,
    themeLabel: theme.label,
    documentAnalysis: {
      subject: theme.subject,
      language: theme.language,
      complexity: theme.complexity,
    },
    archiveInsights: theme.archiveInsights,
    scenes,
    storyboard: {
      title: "IL CICLO DEL GRANO",
      totalScenes: scenes.length,
      totalDuration: scenes.reduce((total, scene) => total + scene.duration, 0),
      scenes,
    },
    videoUrl: null,
    updatedMediaHistory: nextHistory,
  };
}

// Nominal duration used internally. App.jsx reads the last entry's `delay` and scales
// all deltas proportionally to match the user-configured demo duration (demoDurationSeconds).
const NOMINAL_MS = 12000;

const TIMELINE_STEPS = [
  { stepId: "input", currentStep: "PDF Input", type: "info", message: "PDF ricevuto. Dimensione: 1.5 MB · 8 pagine rilevate. Avvio estrazione testo." },
  { stepId: "parsing", currentStep: "Parse request", type: "info", message: "Struttura documento analizzata. Identificati 3 blocchi tematici principali. Token raw: 3.841." },
  { stepId: "llm", currentStep: "Analisi LLM", type: "info", message: "GPT-4o completato. Segmentazione in 5 scene. Token totali: 1.847 (prompt: 1.203 · completion: 644).", tokens: 1847 },
  { stepId: "archive", currentStep: "Archivio Vivo", type: "info", message: "[BYPASS] Archivio Vivo in fase di test — modulo disattivato per questa sessione.", archiveOnly: true },
  { stepId: "style", currentStep: "Style prompt", type: "info", message: "Prompt visivo costruito. Stile selezionato applicato. Seed: 4827193. Negative prompt: 12 token." },
  { stepId: "lora", currentStep: "LoRA select", type: "info", message: "Checkpoint LoRA caricato (zanichelli-v2.safetensors · 4.1 GB). Peso applicato: 0.82." },
  { stepId: "controlnet", currentStep: "ControlNet", type: "info", message: "ControlNet depth attivo. Mappa di profondità generata per 5 composizioni. Soglia: 0.65." },
  { stepId: "image", currentStep: "Generazione immagini", type: "success", message: "Image gen completata. 5/5 scene · 512×512 px · 28 step DDIM · CFG 7.5. Tempo medio: 4.2 s/imm.", scenesGenerated: 5 },
  { stepId: "voice", currentStep: "Voice synth", type: "success", message: "TTS completato. Set audio selezionato. 5 tracce validate (MP3 · 128 kbps · 44.1 kHz)." },
  { stepId: "video", currentStep: "Video compose", type: "info", message: "Composizione video in corso. Frame rate: 24 fps · Risoluzione: 1920×1080 · Codec: H.264." },
  { stepId: "output", currentStep: "Aggregate output", type: "success", message: "Pipeline completata. Package pronto: 5 scene · storyboard JSON · audio · video preview disponibile.", isFinal: true },
];

export function buildDemoTimeline({ includeArchive = true } = {}) {
  const steps = TIMELINE_STEPS.filter((step) => includeArchive || !step.archiveOnly);
  const slice = NOMINAL_MS / steps.length;
  let elapsed = 0;

  return steps.map((step, index) => {
    elapsed += Math.round(slice + (index % 2 === 0 ? slice * 0.08 : -slice * 0.05));
    const isLast = index === steps.length - 1;

    // Build stepStates: previous steps complete, current active (or complete if last)
    const stepStates = {};
    for (let j = 0; j < index; j++) {
      stepStates[steps[j].stepId] = "complete";
    }
    stepStates[step.stepId] = isLast ? "complete" : "active";

    return {
      ...step,
      delay: Math.min(elapsed, NOMINAL_MS),
      stepStates,
      progress: Math.min(96, Math.round(((index + 1) / steps.length) * 100)),
      isFinal: Boolean(step.isFinal),
    };
  });
}
