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

## Estrazione testo PDF reale

Per supportare PDF arbitrari (solo PDF con testo selezionabile), avvia anche il servizio locale di estrazione:

```bash
npm run pdf:extractor
```

Endpoint locale:

- `http://127.0.0.1:4317/health`
- `http://127.0.0.1:4317/extract-pdf-text`

Request attesa:

```json
{
  "filename": "documento.pdf",
  "pdfBase64": "JVBERi0xLjcK..."
}
```

Response di successo:

```json
{
  "success": true,
  "filename": "documento.pdf",
  "text": "testo estratto...",
  "pageCount": 12,
  "wordCount": 1845,
  "truncated": false,
  "extractionMethod": "real_text_pdf"
}
```

Note:

- Il servizio tronca il testo a `16000` caratteri di default per tenere prevedibile il prompt LLM.
- Niente OCR: PDF scansionati o solo immagine devono fallire in modo esplicito.
- In n8n, il nodo `3. PDF Parser` va sostituito con una `HTTP Request` verso questo servizio.

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
2. Avvia il servizio PDF locale con `npm run pdf:extractor` e verifica `http://127.0.0.1:4317/health`.
3. Apri la UI e controlla da `Settings`:
   - webhook corretto
   - timeout adeguato (`60000 ms` consigliato)
   - `Demo mode` impostato intenzionalmente
4. Carica un PDF demo e lancia un `Generate` di smoke test.
5. Verifica:
   - log popolato
   - storyboard renderizzato
   - audio selezionabile/riproducibile
   - export funzionante
6. Se n8n non risponde durante la demo, attiva `Demo mode` da `Settings` e rilancia il flusso.
