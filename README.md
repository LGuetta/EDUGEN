# EDUGEN AI Studio - Zanichelli Demo

EDUGEN AI Studio e una UI React/Vite pensata per trasformare contenuti PDF educativi in:

- storyboard
- immagini di scena
- narrazione audio

Il progetto oggi supporta due percorsi operativi distinti:

- `LIVE n8n`: usa il backend reale
- `Demo mode`: usa un percorso locale deterministico pensato per la presentazione

Questo README descrive lo stato attuale effettivo del progetto. Se qualche documento secondario nel repo descrive iterazioni precedenti, fai riferimento prima a questo file.

## Avvio rapido

Installazione e sviluppo locale:

```bash
npm install
npm run dev
```

Build di produzione:

```bash
npm run build
npm run preview
```

Servizio locale per estrazione testo PDF (richiesto in `LIVE n8n`):

```bash
npm run pdf:extractor
```

## Modalita operative

### LIVE n8n

E il percorso reale end-to-end.

- usa il webhook configurato nelle `Settings`
- usa il PDF caricato come input reale
- invia il contenuto del PDF in base64 al backend
- dipende dai servizi locali corretti
- e la modalita da usare per testare il flusso vero

Per il funzionamento completo servono:

- n8n locale attivo
- servizio locale di estrazione testo PDF attivo
- opzionalmente Voicebox per la generazione audio

### Demo mode

E la modalita locale di presentazione.

- non chiama n8n
- ignora il PDF caricato per la generazione effettiva
- usa un percorso locale deterministico
- e pensata come modalita stabile per la demo cliente

Nel comportamento attuale del progetto, `Demo mode` usa un pacchetto locale predefinito per testo, immagini e audio. Concettualmente non e la stessa cosa di un fallback automatico del backend, ma in pratica oggi coincide con una pipeline locale deterministica completa.

## Caricare PDF reali

La UI supporta gia l'upload di PDF arbitrari.

Il frontend invia al backend:

- `pdfContent`
- `pdfPath`
- `requestId`
- `styleModule`
- `videoPreset`
- `sentAt`
- `uiSource`

Questo funziona bene solo con:

- PDF con testo selezionabile / estraibile

Non sono supportati in questa fase:

- OCR
- PDF scansionati
- PDF composti solo da immagini
- riconoscimento di scrittura manuale

Se il PDF non contiene testo estraibile, il flusso deve fallire in modo esplicito.

### PDF campione

Il pulsante campione nella UI carica un PDF reale utile per testare il flusso di upload senza preparare un file esterno.

Percorso del file campione incluso nel progetto:

- `public/demo/edugen-storia-demo.pdf`

Questo file e un PDF vero con testo estraibile, non un placeholder finto.

## Estrazione testo PDF reale

Per la modalita `LIVE n8n`, il testo del PDF deve essere estratto dal file caricato e non da testo demo hardcoded.

Avvia il servizio locale:

```bash
npm run pdf:extractor
```

Endpoint del servizio:

- `GET http://127.0.0.1:4317/health`
- `POST http://127.0.0.1:4317/extract-pdf-text`

Questo servizio:

- riceve `pdfBase64`
- estrae il testo reale dal PDF
- normalizza il contenuto
- tronca il testo a una dimensione sicura per il prompt
- fallisce in modo esplicito se il testo non e estraibile

Vincoli attuali:

- niente OCR
- se il PDF e vuoto o non contiene testo estraibile, il run deve fermarsi

Documento di supporto:

- `n8n/PDF_TEXT_EXTRACTION_HELPER.md`

## Integrazione n8n

Per la UI normale, usa sempre il webhook di produzione:

- `http://localhost:5678/webhook/edugen-process`

Non usare come path standard:

- `webhook-test`

`webhook-test` va bene solo per test manuali dall'editor di n8n, non per il percorso operativo normale della UI.

La response minima accettata dalla UI deve contenere:

- `success`
- `requestId`
- `mode`
- `data.storyboard.scenes`

Quando la response non rispetta questo contratto, la UI deve bloccare il mapping e trattarla come errore backend.

### Response minima valida

```json
{
  "success": true,
  "requestId": "req_...",
  "mode": "live",
  "data": {
    "storyboard": {
      "title": "string",
      "totalScenes": 6,
      "scenes": []
    }
  },
  "warnings": [],
  "progressTrace": [],
  "logs": []
}
```

Nota pratica:

- alcuni documenti `n8n/*.md` nel repo riflettono patch o iterazioni precedenti
- quando un documento secondario diverge dal comportamento reale dell'app, il README e la fonte da seguire

## Voicebox Audio

Endpoint attuale documentato:

- `http://127.0.0.1:17493/generate`

Payload atteso:

```json
{
  "profile_id": "13bddcc3-62da-4134-b51c-5ece3f20eb94",
  "text": "string",
  "language": "it",
  "seed": 0,
  "model_size": "1.7B",
  "instruct": "string"
}
```

Voice profile attuale:

- `13bddcc3-62da-4134-b51c-5ece3f20eb94`

### Vincolo critico lato browser

Per il browser/UI, `audioPath` deve essere una URL raggiungibile.

Non e sufficiente restituire un path locale Windows come:

- `C:\\Users\\...\\file.wav`

Se Voicebox genera un file locale, quel file deve essere esposto via URL HTTP prima di poter essere:

- riprodotto nella UI
- scaricato dalla UI

## Asset demo / fallback locali

Per la modalita demo locale, i media statici vanno messi qui:

```text
public/
└── assets/
    ├── storia/
    │   ├── scene_01.png ... scene_06.png
    │   └── narration_01.mp3 ... narration_06.mp3
    ├── scienze/
    │   ├── scene_01.png ... scene_06.png
    │   └── narration_01.mp3 ... narration_06.mp3
    └── arte/
        ├── scene_01.png ... scene_06.png
        └── narration_01.mp3 ... narration_06.mp3
```

Perche qui:

- tutto cio che sta in `public/` viene servito direttamente da Vite
- quindi il browser puo leggere path come:
  - `/assets/storia/scene_01.png`
  - `/assets/storia/narration_01.mp3`

Regole operative:

- i nomi devono combaciare esattamente
- usa sempre numerazione a due cifre: `01`-`06`
- ogni stile dovrebbe avere tutti e 6 i file per una demo completamente deterministica
- se manca un file, quella scena puo risultare incompleta in demo mode

## Export

Documenta solo cio che esiste davvero oggi.

### Menu in alto a destra

Esporta:

- `Storyboard JSON`
- `System Log TXT`
- `Session Snapshot`

### Pannello export a destra

Le voci funzionano solo se esiste un artefatto reale dietro.

- alcune opzioni dipendono dal backend
- export video/package richiedono URL reali forniti dalla response backend
- se un artefatto non esiste, il relativo export deve essere considerato non disponibile

Non considerare disponibili:

- export finti
- formati non ancora prodotti davvero
- uno `Storyboard PDF` se l'artefatto reale corrente e JSON

## Contratti runtime

### Frontend -> n8n

Payload attuale:

```json
{
  "requestId": "req_...",
  "pdfContent": "data:application/pdf;base64,...",
  "pdfPath": "file.pdf",
  "styleModule": "storia|scienze|arte",
  "videoPreset": "didattico|narrativo|documentario|flash",
  "sentAt": "ISO",
  "uiSource": "edugen-ui"
}
```

### PDF extractor

Request:

```json
{
  "filename": "file.pdf",
  "pdfBase64": "JVBERi0xLjcK..."
}
```

Success response:

```json
{
  "success": true,
  "filename": "file.pdf",
  "text": "full extracted text...",
  "pageCount": 10,
  "wordCount": 1600,
  "truncated": false,
  "extractionMethod": "real_text_pdf"
}
```

Failure response:

```json
{
  "success": false,
  "error": {
    "code": "PDF_TEXT_EXTRACTION_FAILED",
    "message": "Unable to extract text from the provided PDF"
  }
}
```

### Voicebox

Payload atteso:

```json
{
  "profile_id": "13bddcc3-62da-4134-b51c-5ece3f20eb94",
  "text": "string",
  "language": "it",
  "seed": 0,
  "model_size": "1.7B",
  "instruct": "string"
}
```

## Checklist pre-demo

### Checklist per LIVE n8n

1. Avvia n8n.
2. Avvia `npm run pdf:extractor`.
3. Verifica che il webhook in `Settings` sia:
   - `http://localhost:5678/webhook/edugen-process`
4. Verifica che `Demo mode` sia disattivo.
5. Carica un PDF reale con testo estraibile.
6. Esegui un smoke test completo.
7. Controlla che:
   - le storyboard card si vedano
   - le immagini carichino davvero
   - l'audio compaia solo se il backend restituisce URL usabili dal browser
   - gli export rispondano in modo coerente

### Checklist per Demo mode

1. Verifica che gli asset demo siano presenti in `public/assets/...`.
2. Attiva `Demo mode` da `Settings`.
3. Premi `Generate`.
4. Verifica che la demo locale deterministica compaia correttamente.
5. Usa questa modalita se il backend live diventa instabile o non vuoi dipendere dai servizi locali.

## Troubleshooting

### `pdfContent` empty / `Decoded PDF payload is empty`

Cause tipiche:

- PDF finto o malformato
- body del nodo HTTP n8n configurato male

Azioni:

- carica un PDF reale
- nel nodo HTTP verso il PDF extractor usa `Using Fields Below` per `pdfBase64`, non un JSON fragile costruito a mano

### `requestId mismatch`

Causa tipica:

- il backend ha risposto con un payload di errore o senza `requestId`

Azione:

- assicurati che la response finale di n8n riecheggi `requestId` a livello top-level sia nei successi sia negli errori gestiti

### Immagini non visibili

Causa tipica:

- `imagePath` mancante
- `imagePath` non e una vera URL immagine
- il backend sta restituendo un URL di polling invece del file finale

Azione:

- il backend deve restituire solo URL finali immagine realmente fetchabili dal browser

### Audio non riproducibile

Causa tipica:

- `audioPath` e un path locale filesystem

Azione:

- esponi il file audio via HTTP e restituisci una URL browser-safe

### Voicebox timeout

Causa tipica:

- servizio locale lento
- timeout troppo basso
- troppo parallelismo

Azione:

- alza il timeout
- preferisci elaborazione seriale se necessario

### Confusione tra `webhook` e `webhook-test`

Causa tipica:

- la UI punta al test webhook

Azione:

- per il percorso normale usa sempre `http://localhost:5678/webhook/edugen-process`

## Riferimenti nel repo

Documenti di supporto ancora utili:

- `n8n/PDF_TEXT_EXTRACTION_HELPER.md`
- `n8n/EDUGEN_FLOW_HARDENING.md`

Questi documenti vanno letti come riferimenti implementativi.
Quando divergono dal comportamento effettivo della versione attuale, segui questo README.
