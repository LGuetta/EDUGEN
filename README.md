# EDUGEN AI Studio - Zanichelli Demo

Demo UI React/Vite per simulare la trasformazione di contenuti PDF in storyboard + narrazione audio.

## Avvio

```bash
npm install
npm run dev
```

Build produzione:

```bash
npm run build
npm run preview
```

## Cosa include

- Layout enterprise dark: Header, 3 pannelli, terminal log, stats bar.
- Upload PDF con metadati auto-estratti.
- Selettore Style Engine (Storia/Scienze/Arte + Custom disabled).
- Pipeline visualizer con nodi e connessioni animate.
- Demo mode con timeline realistica, log sequenziali e progressivo avanzamento.
- Output panel con storyboard cards, player audio custom e opzioni export.
- Hook n8n pronti (`useN8nPipeline`) con fallback automatico a demo mode.

## Note tecniche

- La demo è ottimizzata per presentazione desktop (1920x1080).
- `demoMode` è attivo di default nello store (`src/store/appStore.js`).
- Per collegare n8n reale, impostare `demoMode: false` e adattare endpoint/response.
