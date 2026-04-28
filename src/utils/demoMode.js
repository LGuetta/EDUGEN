// ============================================================================
// DEMO TOPIC REGISTRY
// ----------------------------------------------------------------------------
// Each topic is a self-contained pack used by Demo mode to render a credible
// pipeline output without hitting any backend. The active topic is resolved
// from the uploaded PDF filename (or the Focus Prompt) at generation time.
//
// To add a new topic:
//  1. Add an entry in TOPICS below (id, label, scenes, keywords...)
//  2. Drop the matching assets under `public/assets/<assetBase>/...` using the
//     scene_XX / audio_set_XX naming convention documented in the README.
// ============================================================================

const GRAIN_CYCLE_SCENES = [
  {
    title: "Semina",
    duration: 20,
    narrationScript:
      "Un seme. Piccolo, quasi invisibile. Deposto nella terra a due, tre centimetri di profondità, poi ricoperto di suolo.\n\nÈ ottobre. La seminatrice a file distribuisce 180-200 kg di seme per ettaro. L'operatore regola profondità e spaziatura tra le file.",
  },
  {
    title: "Germinazione",
    duration: 18,
    narrationScript:
      "Dentro il seme, l'embrione si risveglia. Si trasforma, lentamente, in una piccola pianta. La vita comincia al buio.\n\nTemperatura ottimale del suolo: 10-15°C. Umidità controllata. I primi germogli emergono in 7-10 giorni.",
  },
  {
    title: "Levata",
    duration: 18,
    narrationScript:
      "Il germoglio sale verso la luce. Cresce il fusto, si aprono foglie lunghe e strette. La pianta impara a stare in piedi.\n\nÈ gennaio. Il trattore distribuisce azoto: 80-120 kg per ettaro. La concimazione sostiene la crescita del fusto.",
  },
  {
    title: "Spigatura",
    duration: 20,
    narrationScript:
      "Fuoriesce la spiga. Su di essa nascono i fiori, poi i frutti: le cariossidi. Identiche al seme di partenza. Il cerchio si prepara a chiudersi.\n\nÈ maggio. Ogni spiga porta 35-50 cariossidi. Un ettaro coltivato conta fino a 600 spighe per metro quadro.",
  },
  {
    title: "Maturazione",
    duration: 19,
    narrationScript:
      "Le sostanze nutritive migrano dalle foglie alle cariossidi. La spiga si ingrossa, si fa pesante. La pianta ingiallisce: ha dato tutto.\n\nUmidità del chicco: scende al 13-14%. Il tecnico agrario monitora il campo per stabilire il momento ottimale del raccolto.",
  },
];

const ASSICURAZIONI_SCENES = [
  {
    title: "Concetti fondamentali",
    duration: 20,
    narrationScript:
      "L'assicurazione è un contratto con cui un soggetto trasferisce a un altro un rischio economico. Il rischio è incerto, ma la sua gestione no.\n\nDue parti: assicurato e assicuratore. Un premio versato regolarmente. Una promessa di indennizzo in caso di sinistro.",
  },
  {
    title: "Tipi di polizze",
    duration: 19,
    narrationScript:
      "Le polizze si dividono in due grandi famiglie: ramo danni e ramo vita. Le prime coprono perdite materiali, le seconde eventi legati alla persona.\n\nPolizze obbligatorie come l'RC auto convivono con coperture facoltative su casa, salute, viaggi e responsabilità professionale.",
  },
  {
    title: "Calcolo del premio",
    duration: 18,
    narrationScript:
      "Il premio è il prezzo del rischio. Si calcola partendo dalla probabilità dell'evento, dal valore del bene e dalla durata del contratto.\n\nL'attuario applica modelli statistici. Più alto il rischio, più alto il premio: è il principio della mutualità su cui si regge l'intero sistema.",
  },
  {
    title: "Sinistro e risarcimento",
    duration: 20,
    narrationScript:
      "Quando l'evento accade, l'assicurato apre un sinistro. Il perito valuta il danno, l'assicuratore verifica la copertura.\n\nIl risarcimento può essere monetario o in forma specifica. I tempi medi di liquidazione in Italia sono di 30-60 giorni dalla denuncia.",
  },
  {
    title: "Ruolo dell'assicuratore",
    duration: 19,
    narrationScript:
      "L'assicuratore non vende solo protezione: gestisce capitali per garantire i risarcimenti futuri. Le riserve tecniche sono il cuore del bilancio.\n\nVigilanza IVASS, requisiti Solvency II, distribuzione tramite agenti, broker e canali digitali: un settore regolato, complesso, in costante evoluzione.",
  },
];

const GEOGRAFIA_SCENES = [
  {
    title: "Territorio e clima",
    duration: 20,
    narrationScript:
      "Ogni territorio ha una sua impronta climatica: latitudine, altitudine, vicinanza al mare definiscono temperature e precipitazioni.\n\nDalle fasce tropicali alle zone polari, il clima modella il paesaggio e condiziona la vita di chi lo abita.",
  },
  {
    title: "Risorse naturali",
    duration: 19,
    narrationScript:
      "Acqua, suolo, foreste, minerali: le risorse naturali sono la base materiale di ogni economia. Alcune si rinnovano, altre no.\n\nLa loro distribuzione disuguale tra le regioni del pianeta è una delle chiavi di lettura dei rapporti tra gli Stati.",
  },
  {
    title: "Insediamenti urbani",
    duration: 18,
    narrationScript:
      "Più della metà della popolazione mondiale vive in città. Le metropoli concentrano servizi, lavoro, cultura ma anche disuguaglianze.\n\nDal centro storico alle periferie, dalle smart city alle bidonville: l'urbanizzazione racconta come scegliamo di abitare il pianeta.",
  },
  {
    title: "Reti e trasporti",
    duration: 19,
    narrationScript:
      "Strade, ferrovie, porti, rotte aeree, cavi sottomarini: le reti tengono insieme persone, merci e dati su scala planetaria.\n\nUn container parte dalla Cina e attraversa tre oceani in cinque settimane. Un'informazione fa lo stesso percorso in millisecondi.",
  },
  {
    title: "Cambiamenti del paesaggio",
    duration: 20,
    narrationScript:
      "Il paesaggio non è un fondale fisso: cambia con il clima, con l'uso del suolo, con le scelte politiche ed economiche.\n\nDeforestazione, desertificazione, innalzamento dei mari: leggere queste trasformazioni significa capire dove stiamo andando.",
  },
];

const ONU_SCENES = [
  {
    title: "Origini delle Nazioni Unite",
    duration: 20,
    narrationScript:
      "1945. Finita la Seconda guerra mondiale, 51 Stati firmano a San Francisco la Carta delle Nazioni Unite.\n\nL'obiettivo: prevenire un nuovo conflitto globale, promuovere diritti umani, cooperazione economica e sociale. Oggi gli Stati membri sono 193.",
  },
  {
    title: "Struttura e organi principali",
    duration: 19,
    narrationScript:
      "Sei organi principali compongono l'ONU. Assemblea Generale, Consiglio di Sicurezza, Segretariato, Corte Internazionale di Giustizia, Consiglio Economico e Sociale, Consiglio di Amministrazione Fiduciaria.\n\nIl Consiglio di Sicurezza ha cinque membri permanenti con diritto di veto: Stati Uniti, Russia, Cina, Francia, Regno Unito.",
  },
  {
    title: "Missioni di pace",
    duration: 18,
    narrationScript:
      "I caschi blu sono il volto operativo dell'ONU. Dal 1948 oltre 70 missioni in tutto il mondo, da Cipro al Libano, dal Sahara al Congo.\n\nNon impongono la pace: la mantengono dove le parti hanno scelto di fermarsi. Servono mediazione, monitoraggio, ricostruzione.",
  },
  {
    title: "Diritti umani",
    duration: 20,
    narrationScript:
      "1948. La Dichiarazione Universale dei Diritti Umani fissa principi che valgono per ogni persona, ovunque.\n\nDal Consiglio per i Diritti Umani all'Alto Commissariato, l'ONU lavora per trasformare quei principi in pratica quotidiana, contro discriminazioni e abusi.",
  },
  {
    title: "Sviluppo sostenibile",
    duration: 19,
    narrationScript:
      "Agenda 2030: 17 Obiettivi di Sviluppo Sostenibile sottoscritti da tutti gli Stati membri.\n\nFame, povertà, istruzione, parità di genere, clima, lavoro dignitoso: una mappa condivisa per orientare politiche pubbliche e investimenti dei prossimi anni.",
  },
];

function genericInsights(label) {
  return [
    {
      id: `${label}_insight_01`,
      label: "Riferimento didattico coerente",
      description: "Timeline coerente con il focus del documento selezionato.",
    },
    {
      id: `${label}_insight_02`,
      label: "Lessico scolastico strutturato",
      description: "Terminologia accessibile e adatta a contenuti didattici.",
    },
    {
      id: `${label}_insight_03`,
      label: "Indicatori contestualizzati",
      description: "Dati di scenario integrati in forma narrativa e leggibile.",
    },
  ];
}

function withIds(scenes) {
  return scenes.map((scene, index) => ({
    id: `scene_${index + 1}`,
    number: index + 1,
    ...scene,
  }));
}

// Maps the user-selected visual style to the per-topic image subfolder used
// by the new topic packs (assicurazioni / geografia / onu). The client ships
// each scene as `<scene>/illustrazione/` (drawn) and `<scene>/photo/`
// (photographic), so we route acquarello & vettoriale to the illustrative
// set and fotorealistico to the photo set.
function styleToImageSubpath(styleKey) {
  return styleKey === "fotorealistico" ? "photo" : "illustrazione";
}

const TOPICS = {
  "grain-cycle": {
    label: "Ciclo del grano",
    storyboardTitle: "IL CICLO DEL GRANO",
    subject: "Storia",
    language: "Italiano",
    complexity: "Medium",
    keywords: [
      "grano",
      "semina",
      "raccolta",
      "ciclo del grano",
      "agricolt",
      "cereale",
      "spiga",
      "germinaz",
    ],
    scenes: withIds(GRAIN_CYCLE_SCENES),
    archiveInsights: [
      {
        id: "grain_insight_01",
        label: "Riferimento agricolo di lungo periodo",
        description: "Timeline agronomica coerente con il focus selezionato.",
      },
      {
        id: "grain_insight_02",
        label: "Lessico scolastico strutturato",
        description: "Terminologia accessibile e adatta a contenuti didattici.",
      },
      {
        id: "grain_insight_03",
        label: "Indicatori tecnici contestualizzati",
        description: "Dati di campo integrati in forma narrativa e leggibile.",
      },
    ],
    // Per-style assets: the entire folder name changes with the style.
    // Layout: /assets/{style}/scene_XX/variant_YY.png — no extra subpath.
    getAssetBase: (styleKey) => styleKey,
    getImageSubpath: () => null,
    getVideoUrl: (styleKey) => `/assets/${styleKey}/video_demo.mp4`,
  },
  assicurazioni: {
    label: "Assicurazioni",
    storyboardTitle: "PRINCIPI ASSICURATIVI",
    subject: "Diritto / Economia",
    language: "Italiano",
    complexity: "Medium",
    keywords: ["assicur", "polizza", "sinistro", "premio", "risarcim", "ramo danni", "ramo vita"],
    scenes: withIds(ASSICURAZIONI_SCENES),
    archiveInsights: genericInsights("assicurazioni"),
    // Per-topic root, with style-driven image subfolder.
    // Layout: /assets/assicurazioni/scene_XX/{illustrazione|photo}/variant_YY.png
    getAssetBase: () => "assicurazioni",
    getImageSubpath: styleToImageSubpath,
    getVideoUrl: () => "/assets/assicurazioni/video_demo.mp4",
  },
  geografia: {
    label: "Geografia",
    storyboardTitle: "PAESAGGI E POPOLAMENTO",
    subject: "Geografia",
    language: "Italiano",
    complexity: "Low",
    keywords: ["geografia", "clima", "territorio", "paesaggio", "urban", "trasport", "risorse natural"],
    scenes: withIds(GEOGRAFIA_SCENES),
    archiveInsights: genericInsights("geografia"),
    getAssetBase: () => "geografia",
    getImageSubpath: styleToImageSubpath,
    getVideoUrl: () => "/assets/geografia/video_demo.mp4",
  },
  onu: {
    label: "Nazioni Unite",
    storyboardTitle: "LE NAZIONI UNITE",
    subject: "Storia / Educazione civica",
    language: "Italiano",
    complexity: "Medium",
    keywords: ["onu", "nazioni unite", "united nations", "consiglio di sicurezza", "diritti umani", "agenda 2030"],
    scenes: withIds(ONU_SCENES),
    archiveInsights: genericInsights("onu"),
    getAssetBase: () => "onu",
    getImageSubpath: styleToImageSubpath,
    getVideoUrl: () => "/assets/onu/video_demo.mp4",
  },
};

const DEFAULT_TOPIC = "grain-cycle";
const DEMO_IMAGE_VARIANTS = ["variant_01", "variant_02", "variant_03", "variant_04"];
const DEMO_AUDIO_SETS = ["audio_set_01", "audio_set_02", "audio_set_03", "audio_set_04", "audio_set_05"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg"];
const AUDIO_EXTENSIONS = ["mp3", "MP3"];

export const STYLE_LABELS = {
  acquarello: "Illustrato",
  vettoriale: "Vettoriale",
  fotorealistico: "Fotorealistico",
};

export const DEMO_TOPIC_KEYS = Object.keys(TOPICS);

function matchTopicByKeywords(text) {
  const normalized = String(text || "").toLowerCase();
  if (!normalized.trim()) return null;
  for (const [topicKey, topic] of Object.entries(TOPICS)) {
    if (topic.keywords.some((keyword) => normalized.includes(keyword))) {
      return topicKey;
    }
  }
  return null;
}

// Resolve a demo topic from any combination of file name and focus prompt.
// Filename wins when both match different topics — it's the most explicit
// signal a demo presenter has.
export function resolveDemoTopic({ fileName = "", customPrompt = "" } = {}) {
  const fromFile = matchTopicByKeywords(fileName);
  if (fromFile) return fromFile;
  const fromPrompt = matchTopicByKeywords(customPrompt);
  if (fromPrompt) return fromPrompt;
  return DEFAULT_TOPIC;
}

// Back-compat export. Older code (and external callers if any) used this name.
export function resolveDemoTheme(customPrompt) {
  return resolveDemoTopic({ customPrompt });
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

function buildImageCandidates(assetBase, imageSubpath, sceneNumber, preferredVariant) {
  const sceneKey = `scene_${String(sceneNumber).padStart(2, "0")}`;
  const preferredOrder = [preferredVariant, ...DEMO_IMAGE_VARIANTS.filter((variant) => variant !== preferredVariant)];
  const folderPath = imageSubpath
    ? `${assetBase}/${sceneKey}/${imageSubpath}`
    : `${assetBase}/${sceneKey}`;
  return preferredOrder.flatMap((variant) =>
    IMAGE_EXTENSIONS.map((ext) => `/assets/${folderPath}/${variant}.${ext}`),
  );
}

function buildAudioCandidates(assetBase, sceneNumber, preferredSet) {
  const fileName = `narration_${String(sceneNumber).padStart(2, "0")}`;
  const preferredOrder = [preferredSet, ...DEMO_AUDIO_SETS.filter((setName) => setName !== preferredSet)];
  return preferredOrder.flatMap((setName) =>
    AUDIO_EXTENSIONS.map((ext) => `/assets/${assetBase}/${setName}/${fileName}.${ext}`),
  );
}

export function createDemoPackage({
  styleKey,
  customPrompt,
  fileName,
  topicKey,
  mediaHistory,
  demoRunCount = 0,
}) {
  const resolvedTopicKey = topicKey && TOPICS[topicKey]
    ? topicKey
    : resolveDemoTopic({ fileName, customPrompt });
  const topic = TOPICS[resolvedTopicKey] || TOPICS[DEFAULT_TOPIC];

  const assetBase = topic.getAssetBase(styleKey);
  const imageSubpath = topic.getImageSubpath ? topic.getImageSubpath(styleKey) : null;
  const videoUrl = topic.getVideoUrl ? topic.getVideoUrl(styleKey) : null;

  // The mediaHistory key follows the *asset folder + image subpath* so that
  // audio rotation history doesn't bleed across topics that share a folder,
  // and image-variant history is style-aware where styles share a topic.
  const historyKey = imageSubpath ? `${assetBase}:${imageSubpath}` : assetBase;
  const nextHistory = { ...(mediaHistory || {}) };
  const folderHistory = nextHistory[historyKey] || {};

  // Image variant: toggles deterministically between variant_01 (even runs)
  // and variant_02 (odd runs). Every regen visibly switches all images at
  // once for a clear "regenerated" feel.
  const selectedVariant = demoRunCount % 2 === 0 ? "variant_01" : "variant_02";

  // Audio set: pool-based rotation so each regen uses a different voice take.
  const audioHistory = folderHistory.audio || { usedSets: [], lastSet: null };
  const audioSelection = nextFromPool(DEMO_AUDIO_SETS, audioHistory.usedSets, audioHistory.lastSet);
  const selectedAudioSet = audioSelection.selected;

  const scenes = topic.scenes.map((scene) => ({
    ...scene,
    imageVariant: selectedVariant,
    imageUrl: buildImageCandidates(assetBase, imageSubpath, scene.number, selectedVariant)[0],
    imageSources: buildImageCandidates(assetBase, imageSubpath, scene.number, selectedVariant),
    audioSet: selectedAudioSet,
    audioPath: buildAudioCandidates(assetBase, scene.number, selectedAudioSet)[0],
    audioSources: buildAudioCandidates(assetBase, scene.number, selectedAudioSet),
  }));

  folderHistory.audio = {
    usedSets: audioSelection.nextUsed,
    lastSet: selectedAudioSet,
  };
  nextHistory[historyKey] = folderHistory;

  return {
    themeKey: resolvedTopicKey,
    themeLabel: topic.label,
    documentAnalysis: {
      subject: topic.subject,
      language: topic.language,
      complexity: topic.complexity,
    },
    archiveInsights: topic.archiveInsights,
    scenes,
    storyboard: {
      title: topic.storyboardTitle,
      totalScenes: scenes.length,
      totalDuration: scenes.reduce((total, scene) => total + scene.duration, 0),
      scenes,
    },
    videoUrl,
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
