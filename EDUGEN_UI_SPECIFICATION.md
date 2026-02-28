# EDUGEN AI STUDIO - UI Development Specification
## Demo Sistema AI per Trasformazione Contenuti Editoriali

---

## 1. PROJECT OVERVIEW

### Obiettivo
Creare un'interfaccia web professionale "enterprise-grade" per una demo che mostra la trasformazione automatica di contenuti editoriali (PDF) in output multimediali (storyboard + voce narrante).

### Target
Presentazione a dirigenti Zanichelli (editore scolastico italiano). L'UI deve impressionare, comunicare sofisticazione tecnica, e sembrare un prodotto quasi finito (non un prototipo).

### Stack Tecnologico
- **Framework:** React 18+ con Vite
- **Styling:** Tailwind CSS (dark theme)
- **Animazioni:** Framer Motion
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **PDF Preview:** react-pdf o pdf.js

---

## 2. DESIGN SYSTEM

### Color Palette (Dark Theme)
```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0f;      /* Main background */
  --bg-secondary: #12121a;    /* Panel backgrounds */
  --bg-tertiary: #1a1a28;     /* Cards, elevated elements */
  --bg-hover: #242438;        /* Hover states */
  
  /* Borders */
  --border-primary: #2a2a3e;
  --border-accent: #3b3b5c;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a0a0b8;
  --text-muted: #6b6b80;
  
  /* Accents */
  --accent-primary: #6366f1;   /* Indigo - main actions */
  --accent-secondary: #8b5cf6; /* Purple - secondary */
  --accent-success: #22c55e;   /* Green - success states */
  --accent-warning: #f59e0b;   /* Amber - warnings */
  --accent-info: #3b82f6;      /* Blue - info */
  
  /* Pipeline Node Colors */
  --node-parsing: #3b82f6;     /* Blue */
  --node-llm: #8b5cf6;         /* Purple */
  --node-style: #ec4899;       /* Pink */
  --node-image: #f59e0b;       /* Amber */
  --node-voice: #22c55e;       /* Green */
  --node-output: #06b6d4;      /* Cyan */
}
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Sizes */
--text-xs: 0.75rem;    /* 12px - labels, captions */
--text-sm: 0.875rem;   /* 14px - secondary text */
--text-base: 1rem;     /* 16px - body text */
--text-lg: 1.125rem;   /* 18px - subtitles */
--text-xl: 1.25rem;    /* 20px - section headers */
--text-2xl: 1.5rem;    /* 24px - panel titles */
--text-3xl: 1.875rem;  /* 30px - main title */
```

### Spacing & Layout
```css
/* Border Radius */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;

/* Shadows (subtle, dark theme appropriate) */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
```

---

## 3. LAYOUT STRUCTURE

### Main Layout (3-Panel + Header + Footer)
```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (height: 60px)                                               │
├───────────────┬────────────────────────────┬────────────────────────┤
│               │                            │                        │
│ LEFT PANEL    │    CENTER PANEL            │   RIGHT PANEL          │
│ (width: 300px)│    (flex: 1)               │   (width: 340px)       │
│               │                            │                        │
│ - PDF Upload  │    - Pipeline Visualizer   │   - Storyboard Grid    │
│ - Metadata    │    - Animated Flow Graph   │   - Audio Player       │
│ - Style Engine│                            │   - Export Options     │
│ - Generate Btn│                            │                        │
│               │                            │                        │
├───────────────┴────────────────────────────┴────────────────────────┤
│ TERMINAL / LOG (height: 180px, collapsible)                         │
├─────────────────────────────────────────────────────────────────────┤
│ STATS BAR (height: 48px)                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. COMPONENT SPECIFICATIONS

### 4.1 Header Component
```jsx
// Location: src/components/Header.jsx
// Height: 60px
// Background: var(--bg-secondary)
// Border-bottom: 1px solid var(--border-primary)

Features:
- Logo/App name: "EDUGEN AI Studio" (left aligned)
- Status indicator: Dot + text ("Ready" / "Processing" / "Complete")
- Action buttons (right): Settings icon, Export dropdown
```

### 4.2 Left Panel - Input Section

#### 4.2.1 PDF Uploader
```jsx
// Location: src/components/InputPanel/PDFUploader.jsx

Features:
- Drag & drop zone (dashed border, icon centered)
- States: empty, hover, uploading, uploaded
- When uploaded: show PDF thumbnail/preview
- File info: name, pages, size
- "Remove" button to clear

Visual:
┌─────────────────────────┐
│     ┌───────────┐       │
│     │  📄 PDF   │       │  ← Empty state with icon
│     │   icon    │       │
│     └───────────┘       │
│                         │
│  Drag PDF here or       │
│  [Browse Files]         │
└─────────────────────────┘

When uploaded:
┌─────────────────────────┐
│ ┌─────┐                 │
│ │ PDF │ ciclo_grano.pdf │
│ │thumb│ 12 pages • 2.4MB│
│ └─────┘         [✕]     │
└─────────────────────────┘
```

#### 4.2.2 Metadata Display
```jsx
// Location: src/components/InputPanel/Metadata.jsx

Features:
- Extracted info display (appears after PDF upload)
- Animated entrance
- Fields: Pages, Words, Subject (auto-detected), Language

Visual:
┌─────────────────────────┐
│ DOCUMENT ANALYSIS       │
├─────────────────────────┤
│ Pages        12         │
│ Words        2,450      │
│ Subject      Storia     │  ← Auto-detected badge
│ Language     Italiano   │
│ Complexity   Medium     │
└─────────────────────────┘
```

#### 4.2.3 Style Engine Selector
```jsx
// Location: src/components/InputPanel/StyleEngine.jsx

Features:
- Radio button group with visual previews
- Each option shows mini thumbnail of style
- "Custom LoRA" option (disabled/coming soon)
- Tooltip on hover explaining each style

Options:
1. Storia (acquerello/mappa antica)
2. Scienze (vettoriale/flat design)
3. Arte (fotografico/realistico)
4. Custom LoRA [disabled]

Visual:
┌─────────────────────────┐
│ STYLE ENGINE            │
│ LoRA Adapters           │
├─────────────────────────┤
│ ◉ ┌────┐ Storia         │
│   │ 🎨 │ Acquerello,    │
│   └────┘ mappe antiche  │
│                         │
│ ○ ┌────┐ Scienze        │
│   │ 📐 │ Vettoriale,    │
│   └────┘ flat design    │
│                         │
│ ○ ┌────┐ Arte           │
│   │ 📷 │ Fotografico,   │
│   └────┘ realistico     │
│                         │
│ ○ ┌────┐ Custom LoRA    │
│   │ ⚙️ │ Coming soon    │
│   └────┘                │
└─────────────────────────┘
```

#### 4.2.4 Generate Button
```jsx
// Location: src/components/InputPanel/GenerateButton.jsx

Features:
- Large, prominent button
- Disabled state when no PDF uploaded
- Loading state with spinner during processing
- Pulsing glow animation when ready

States:
- Disabled: gray, no interaction
- Ready: accent color, subtle glow pulse
- Processing: spinner, "Generating..." text
- Complete: checkmark, "Complete!" text

Visual:
┌─────────────────────────┐
│                         │
│   [    GENERATE    ]    │  ← Full width, accent color
│                         │
└─────────────────────────┘
```

### 4.3 Center Panel - Pipeline Visualizer

```jsx
// Location: src/components/PipelineVisualizer/FlowGraph.jsx

Features:
- SVG-based animated flow graph
- Nodes connected by animated paths
- Nodes light up sequentially during processing
- Data flow animation (dots traveling along paths)
- Zoom controls (optional)

Node Types:
1. INPUT (PDF icon)
2. PARSING (document icon)
3. LLM ANALYSIS (brain icon)
4. STYLE ENGINE (palette icon) - with LoRA badge
5. IMAGE GENERATION (image icon)
6. VOICE SYNTHESIS (microphone icon)
7. OUTPUT (package icon)

Layout (vertical flow with branches):
```
        ┌──────────┐
        │  INPUT   │
        │   PDF    │
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │ PARSING  │
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │   LLM    │
        │ ANALYSIS │
        └────┬─────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐  ┌──────────┐
│  STYLE   │  │  VOICE   │
│  ENGINE  │  │ SYNTHESIS│
│ (LoRA)   │  │          │
└────┬─────┘  └────┬─────┘
     │             │
     ▼             │
┌──────────┐       │
│  IMAGE   │       │
│   GEN    │       │
└────┬─────┘       │
     │             │
     └──────┬──────┘
            │
            ▼
       ┌──────────┐
       │  OUTPUT  │
       │ STORYBOARD│
       └──────────┘
```

Node States:
- Idle: dim, gray border
- Active: glowing, pulsing, colored border
- Complete: solid color, checkmark badge
- Error: red border, warning icon

Animations:
- Nodes pulse when active (scale 1.0 → 1.05 → 1.0)
- Glow effect using box-shadow
- Paths animate with dashed stroke-dashoffset
- Small dots travel along paths during data transfer
```

### 4.4 Right Panel - Output Section

#### 4.4.1 Storyboard Grid
```jsx
// Location: src/components/OutputPanel/Storyboard.jsx

Features:
- Grid of generated scene cards (2 columns)
- Each card: thumbnail + scene number + title
- Click to expand/preview
- Skeleton loading state during generation
- Cards animate in sequentially

Visual:
┌─────────────────────────────┐
│ STORYBOARD                  │
│ 6 scenes generated          │
├─────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ │
│ │   IMG 1   │ │   IMG 2   │ │
│ │           │ │           │ │
│ ├───────────┤ ├───────────┤ │
│ │ 1. Semina │ │ 2. Germin.│ │
│ └───────────┘ └───────────┘ │
│ ┌───────────┐ ┌───────────┐ │
│ │   IMG 3   │ │   IMG 4   │ │
│ │           │ │           │ │
│ ├───────────┤ ├───────────┤ │
│ │ 3. Levata │ │ 4. Spigat.│ │
│ └───────────┘ └───────────┘ │
└─────────────────────────────┘
```

#### 4.4.2 Audio Player
```jsx
// Location: src/components/OutputPanel/AudioPlayer.jsx

Features:
- Custom styled audio player
- Waveform visualization (optional)
- Play/pause, progress bar, time display
- Volume control
- Download button

Visual:
┌─────────────────────────────┐
│ NARRAZIONE                  │
├─────────────────────────────┤
│                             │
│  ▶  ━━━━━━━━━●━━━━  2:34   │
│                      /4:12  │
│                             │
│  🔊 ━━━━━━━━━━━━━━   [⬇]   │
└─────────────────────────────┘
```

#### 4.4.3 Export Options
```jsx
// Location: src/components/OutputPanel/ExportOptions.jsx

Features:
- Checklist of export formats
- Download buttons per format
- "Download All" button
- File size estimates

Visual:
┌─────────────────────────────┐
│ EXPORT                      │
├─────────────────────────────┤
│ ☑ Storyboard PDF    [⬇]    │
│   ~2.4 MB                   │
│ ☑ Audio MP3         [⬇]    │
│   ~4.1 MB                   │
│ ☐ Video MP4         [⬇]    │
│   ~24 MB                    │
│ ☐ Full Package      [⬇]    │
│   ~32 MB                    │
│                             │
│ [    DOWNLOAD ALL    ]      │
└─────────────────────────────┘
```

### 4.5 Terminal / Live Log

```jsx
// Location: src/components/Terminal/LiveLog.jsx

Features:
- Auto-scrolling log entries
- Timestamp + icon + message format
- Color-coded by type (info, success, warning, error)
- Collapsible (toggle button)
- Monospace font
- Max height with scroll

Visual:
┌─────────────────────────────────────────────────────────────────────┐
│ SYSTEM LOG                                              [−] [Clear] │
├─────────────────────────────────────────────────────────────────────┤
│ [10:23:45] ✓ PDF loaded: ciclo_grano.pdf (12 pages)                │
│ [10:23:46] ⚙ Extracting text content...                            │
│ [10:23:47] ✓ Extracted 2,450 words from 12 pages                   │
│ [10:23:48] 🧠 Starting LLM analysis...                              │
│ [10:23:52] ✓ Identified 6 scenes for storyboard                    │
│ [10:23:53] 🎨 Loading Style Engine: "Storia" LoRA adapter           │
│ [10:23:55] 🖼 Generating scene 1/6...                               │
│ [10:24:01] ✓ Scene 1 complete                                      │
│ [10:24:02] 🖼 Generating scene 2/6...                               │
│ [10:24:08] ✓ Scene 2 complete                                      │
│ [10:24:09] 🔊 Starting voice synthesis...                          │
│ [10:24:15] ✓ Audio narration generated (4:12)                      │
│ [10:24:16] ✓ Pipeline complete! Ready for export.                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.6 Stats Bar

```jsx
// Location: src/components/StatsBar.jsx

Features:
- Horizontal bar at bottom
- Key metrics display
- Real-time updates during processing

Visual:
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Tokens: 12,450  │  ⏱ Time: 00:01:23  │  🎬 Scenes: 6  │  🎨 Style: Storia  │  ✓ Status: Complete  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. STATE MANAGEMENT

### Application State
```typescript
interface AppState {
  // PDF
  pdf: {
    file: File | null;
    name: string;
    pages: number;
    words: number;
    preview: string | null;
  };
  
  // Analysis
  analysis: {
    subject: string;
    language: string;
    scenes: Scene[];
  };
  
  // Style
  selectedStyle: 'storia' | 'scienze' | 'arte' | 'custom';
  
  // Pipeline
  pipeline: {
    status: 'idle' | 'processing' | 'complete' | 'error';
    currentStep: string;
    progress: number;
    steps: PipelineStep[];
  };
  
  // Output
  output: {
    storyboard: StoryboardScene[];
    audioUrl: string | null;
    audioDuration: number;
  };
  
  // Logs
  logs: LogEntry[];
  
  // Stats
  stats: {
    tokens: number;
    elapsedTime: number;
    scenesGenerated: number;
  };
}
```

---

## 6. N8N INTEGRATION

### Webhook Communication
```javascript
// Location: src/hooks/useN8nPipeline.js

const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/edugen-pipeline';

// Start pipeline
async function startPipeline(pdfFile, style) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);
  formData.append('style', style);
  
  const response = await axios.post(N8N_WEBHOOK_URL, formData);
  return response.data.executionId;
}

// Poll for status (or use WebSocket)
async function checkStatus(executionId) {
  const response = await axios.get(`${N8N_WEBHOOK_URL}/status/${executionId}`);
  return response.data;
}
```

### Expected n8n Response Format
```json
{
  "executionId": "exec_123456",
  "status": "processing",
  "currentStep": "llm_analysis",
  "progress": 45,
  "logs": [
    {"timestamp": "10:23:45", "type": "info", "message": "Starting analysis..."}
  ],
  "result": {
    "scenes": [...],
    "audioUrl": "...",
    "storyboardUrl": "..."
  }
}
```

---

## 7. ANIMATIONS SPECIFICATION

### Framer Motion Variants
```javascript
// Node pulse animation
const nodePulse = {
  idle: { scale: 1, opacity: 0.5 },
  active: { 
    scale: [1, 1.05, 1],
    opacity: 1,
    transition: { 
      scale: { repeat: Infinity, duration: 1.5 },
      opacity: { duration: 0.3 }
    }
  },
  complete: { scale: 1, opacity: 1 }
};

// Card entrance
const cardEntrance = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

// Log entry
const logEntry = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } }
};
```

---

## 8. FILE STRUCTURE

```
src/
├── App.jsx
├── main.jsx
├── index.css                    # Tailwind + custom CSS
│
├── components/
│   ├── Header.jsx
│   │
│   ├── InputPanel/
│   │   ├── index.jsx            # Panel container
│   │   ├── PDFUploader.jsx
│   │   ├── Metadata.jsx
│   │   ├── StyleEngine.jsx
│   │   └── GenerateButton.jsx
│   │
│   ├── PipelineVisualizer/
│   │   ├── index.jsx            # Panel container
│   │   ├── FlowGraph.jsx        # Main SVG graph
│   │   └── PipelineNode.jsx     # Individual node component
│   │
│   ├── OutputPanel/
│   │   ├── index.jsx            # Panel container
│   │   ├── Storyboard.jsx
│   │   ├── SceneCard.jsx
│   │   ├── AudioPlayer.jsx
│   │   └── ExportOptions.jsx
│   │
│   ├── Terminal/
│   │   └── LiveLog.jsx
│   │
│   └── StatsBar.jsx
│
├── hooks/
│   ├── useN8nPipeline.js        # n8n communication
│   ├── usePDFParser.js          # PDF handling
│   └── useAudioPlayer.js        # Audio controls
│
├── store/
│   └── appStore.js              # Zustand or Context
│
├── utils/
│   ├── api.js
│   └── formatters.js
│
└── assets/
    ├── styles/
    │   └── preview-thumbnails/  # Style preview images
    └── icons/
```

---

## 9. DEMO MODE / MOCK DATA

Per la presentazione, implementare una modalità demo che:

1. **Simula il processing** senza chiamare n8n realmente
2. **Usa asset pre-caricati** (immagini, audio)
3. **Timing realistico** per ogni step
4. **Log pre-scriptati** che appaiono in sequenza

```javascript
// src/utils/demoMode.js

const DEMO_TIMELINE = [
  { delay: 0, step: 'upload', log: 'PDF loaded: ciclo_grano.pdf' },
  { delay: 1000, step: 'parsing', log: 'Extracting text content...' },
  { delay: 2000, step: 'parsing_done', log: 'Extracted 2,450 words' },
  { delay: 3000, step: 'llm', log: 'Starting LLM analysis...' },
  { delay: 6000, step: 'llm_done', log: 'Identified 6 scenes' },
  { delay: 7000, step: 'style', log: 'Loading LoRA adapter: Storia' },
  { delay: 8000, step: 'image_1', log: 'Generating scene 1/6...' },
  // ... etc
];
```

---

## 10. RESPONSIVE BEHAVIOR

Per la demo su schermo grande (presentazione):
- Layout ottimizzato per 1920x1080
- No mobile responsive necessario
- Pannelli a larghezza fissa

---

## 11. QUICK START COMMANDS

```bash
# Create project
npm create vite@latest edugen-demo -- --template react
cd edugen-demo

# Install dependencies
npm install tailwindcss postcss autoprefixer
npm install framer-motion lucide-react axios
npm install @react-pdf-viewer/core @react-pdf-viewer/default-layout
npm install zustand  # for state management

# Init Tailwind
npx tailwindcss init -p

# Start dev server
npm run dev
```

---

## 12. PRIORITÀ IMPLEMENTAZIONE

### Fase 1 (Giorno 1)
1. Setup progetto + Tailwind dark theme
2. Layout 3 pannelli + Header + Stats bar
3. PDF Uploader funzionante
4. Style Engine selector

### Fase 2 (Giorno 2)
5. Pipeline Visualizer (SVG statico prima, poi animato)
6. Terminal/Log component
7. Generate button con stati

### Fase 3 (Giorno 3)
8. Storyboard grid con cards
9. Audio player
10. Export options
11. Demo mode con mock data

### Fase 4 (Giorno 4)
12. Animazioni e polish
13. Integrazione n8n webhook
14. Testing e bug fixing

---

## NOTE FINALI

- L'obiettivo è impressionare dirigenti non tecnici
- Ogni animazione deve essere fluida (60fps)
- I log devono sembrare "reali" e tecnici
- Il flow graph è il pezzo centrale - deve essere visivamente striking
- Dark theme è essenziale per look "tech/enterprise"
