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
- `demoMode` è disattivato di default nello store (`src/store/appStore.js`).
- Per collegare n8n reale, impostare `demoMode: false` e adattare endpoint/response.

## Preflight Demo

Prima di una presentazione:

1. Avvia n8n locale e verifica che il webhook risponda su `http://localhost:5678/webhook/edugen-process`.
2. Apri la UI e controlla da `Settings`:
   - webhook corretto
   - timeout adeguato (`60000 ms` consigliato)
   - `Demo mode` impostato intenzionalmente
3. Carica un PDF demo e lancia un `Generate` di smoke test.
4. Verifica:
   - log popolato
   - storyboard renderizzato
   - audio selezionabile/riproducibile
   - export funzionante
5. Se n8n non risponde durante la demo, attiva `Demo mode` da `Settings` e rilancia il flusso.
