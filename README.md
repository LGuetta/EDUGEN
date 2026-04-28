# EDUGEN AI Studio - Zanichelli Demo

EDUGEN AI Studio e una UI React/Vite pensata per trasformare contenuti PDF educativi in:

- storyboard
- immagini di scena
- narrazione audio
- output video demo

Il progetto oggi supporta due percorsi distinti:

- `LIVE n8n`: usa il backend reale
- `Demo mode`: usa un percorso locale deterministico pensato per la presentazione

Questo README descrive il comportamento attuale effettivo del progetto. Se altri documenti nel repo divergono, fai riferimento prima a questo file.

## Avvio rapido

```bash
npm install
npm run dev
```

Build e preview locale:

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
- invia al backend il contenuto del PDF in base64
- dipende dai servizi locali corretti
- e la modalita da usare per testare il flusso reale

Per il funzionamento completo servono:

- n8n locale attivo
- servizio locale di estrazione testo PDF attivo
- opzionalmente Voicebox per l'audio

### Demo mode

E il percorso locale di presentazione.

- non chiama n8n
- non chiama servizi esterni
- ignora il PDF caricato per la generazione effettiva
- usa un pacchetto demo locale deterministico
- e pensata come modalita stabile per la presentazione cliente

Nello stato attuale del progetto, `Demo mode` coincide con una pipeline locale completa e controllata:

- 5 scene coerenti
- immagini locali con varianti
- audio locale con set multipli
- video demo locale
- log plausibili
- timeline artificiale credibile

### Topic dinamici (pacchetti contenuti)

Il pacchetto demo non e' piu' un singolo tema fisso: la UI risolve un **topic** in base al nome del PDF caricato (e in alternativa al Focus Prompt) e usa scene, titoli, narrazioni e cartelle asset specifiche per quel topic.

Topic supportati (vedi `src/utils/demoMode.js`):

- `grain-cycle` -> default, "Il ciclo del grano"
- `assicurazioni` -> "Principi assicurativi"
- `geografia` -> "Paesaggi e popolamento"
- `onu` -> "Le Nazioni Unite"

Aggiungere un topic = aggiungere una entry in `TOPICS` (con keyword di riconoscimento, scene, narrazioni) e creare le cartelle asset corrispondenti sotto `public/assets/{topic}/`.

### Differenza pratica

- `LIVE n8n`: elabora davvero il PDF caricato
- `Demo mode`: simula un'elaborazione credibile ma usa asset e contenuti locali controllati

## Caricare PDF reali

La UI supporta gia l'upload di PDF arbitrari.

Il frontend invia al backend:

- `requestId`
- `pdfContent`
- `pdfPath`
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

La UI include un PDF campione reale per test rapidi del flusso di upload.

Percorso:

- `public/demo/edugen-storia-demo.pdf`

Questo file e un PDF vero con testo estraibile, non un placeholder.

## Focus Prompt (demo)

In `Demo mode`, il pannello sinistro include un blocco `FOCUS PROMPT`.

Serve a simulare un filtro di focus sul contenuto del PDF.

Esempio:

- `Concentrati solo sul ciclo del grano`

Nel percorso demo:

- non fa NLP reale sul PDF
- orienta il tema demo in base a keyword
- oggi il tema demo base e `grain-cycle`

Questo campo esiste per rendere la demo piu credibile, non per il parsing reale del documento.

## Archivio Vivo (demo)

`Archivio Vivo` e un blocco demo che simula il futuro supporto RAG.

Nel percorso demo:

- appare nel pannello analisi
- mostra stato `Connesso`
- aggiunge riferimenti contestuali coerenti
- influenza la percezione del risultato e dei log

Attualmente e una simulazione UI controllata, non un'integrazione documentale reale.

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

Documento di supporto:

- `n8n/PDF_TEXT_EXTRACTION_HELPER.md`

## Integrazione n8n

Per la UI normale usa sempre il webhook di produzione:

- `http://localhost:5678/webhook/edugen-process`

Non usare come path standard:

- `webhook-test`

`webhook-test` va bene solo per test manuali dall'editor di n8n, non per il percorso operativo normale della UI.

La response minima accettata dalla UI deve contenere:

- `success`
- `requestId`
- `mode`
- `data.storyboard.scenes`

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

Per la UI, `audioPath` deve essere una URL raggiungibile dal browser.

Non e sufficiente restituire un path locale Windows come:

- `C:\\Users\\...\\file.wav`

Se Voicebox genera un file locale, quel file deve essere esposto via URL HTTP prima di poter essere:

- riprodotto nella UI
- scaricato dalla UI

## Asset demo locali

Gli asset demo stanno dentro `public/assets/` e seguono naming rigoroso.

In `Demo mode` esistono due tipologie di pacchetto asset, scelte automaticamente in base al PDF caricato:

- **pacchetto per stile** (storico, solo `grain-cycle`): rendering diversi per ogni stile visivo.
- **pacchetto per topic** (nuovi pack: `assicurazioni`, `geografia`, `onu`): rendering unico per topic, lo stile UI rimane selezionabile ma le immagini non cambiano.

### Risoluzione del topic

Il topic viene scelto dal nome del PDF caricato (in alternativa dal Focus Prompt). Le keyword sono in `src/utils/demoMode.js` -> `TOPICS[*].keywords`. Esempi:

- `agricoltura_red.pdf` -> `grain-cycle` (default)
- `assicurazioni_capitolo_03.pdf` -> `assicurazioni`
- `geografia_keynote.pdf` -> `geografia`
- `manuale_onu_2024.pdf` -> `onu`
- nome non riconosciuto -> `grain-cycle`

### Immagini demo

Per `grain-cycle` (cartella per stile, niente sotto-cartella per stile interna):

```text
public/assets/{style}/
  scene_01/
    variant_01.png
    variant_02.png
    variant_03.png
    variant_04.png
  scene_02/...
  ...
  scene_05/...
```

Per gli altri topic (cartella per topic, con sotto-cartella per stile dentro la scena):

```text
public/assets/{topic}/
  scene_01/
    illustrazione/
      variant_01.png
      variant_02.png
      variant_03.png
      variant_04.png
    photo/
      variant_01.png
      variant_02.png
      variant_03.png
      variant_04.png
  scene_02/...
  ...
  scene_05/...
```

Dove `{topic}` e' uno tra `assicurazioni`, `geografia`, `onu`.

Mapping stile -> sotto-cartella:

- `acquarello`, `vettoriale` -> `illustrazione/`
- `fotorealistico` -> `photo/`

Regole:

- 5 scene per pacchetto
- fino a 4 varianti per scena (la rigenerazione alterna `variant_01` e `variant_02`; le altre sono usate solo se presenti)
- usa sempre due cifre: `01`-`05`
- usa sempre `variant_01`-`variant_04`
- se mancano file, la UI prova in ordine `.png` -> `.jpg` -> `.jpeg` e poi le altre varianti

### Audio demo

Per `grain-cycle` (per stile):

```text
public/assets/{style}/
  audio_set_01/
    narration_01.mp3
    narration_02.mp3
    narration_03.mp3
    narration_04.mp3
    narration_05.mp3
  audio_set_02/
  ...
  audio_set_05/
```

Per gli altri topic (per topic):

```text
public/assets/{topic}/
  audio_set_01/
    narration_01.mp3
    ...
    narration_05.mp3
  ...
  audio_set_05/
```

Regole:

- 5 set audio per pacchetto
- ogni set contiene 5 tracce
- tutte le scene di un run demo usano lo stesso `audio_set_*`
- anche qui usa sempre due cifre: `01`-`05`
- estensioni accettate: `.mp3` o `.MP3`

### Video demo

Per ogni topic e' previsto un singolo video sintetico:

```text
public/assets/{topic}/video_demo.mp4
```

Per `grain-cycle` resta la layout per stile gia' esistente:

```text
public/assets/{style}/video_demo.mp4
```

Se il file non esiste, la UI degrada in modo silenzioso (il pannello video resta vuoto).

### Mapping per asset consegnati dal cliente

Il cliente consegna pacchetti con questa forma (esempio `onu`):

```text
onu/
  onu/
    01/
      ILLUSTRAZIONE/   <- una o piu' immagini illustrate
      PHOTO/           <- una o piu' immagini fotografiche
    02/  ...
    03/  ...
    04/  ...
    05/  ...
    AUDIO/             <- 5 narrazioni (una per scena)
    photomovie_onu.mp4 <- video sintetico del topic
    photomovie_onu_ita.txt
```

Mapping nel repo (per topic):

| Origine cliente (esempio `onu`)                              | Destinazione nel repo                                                 |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `onu/onu/01/ILLUSTRAZIONE/<img1>`                            | `public/assets/onu/scene_01/illustrazione/variant_01.png`            |
| `onu/onu/01/ILLUSTRAZIONE/<img2>` (se presente)              | `public/assets/onu/scene_01/illustrazione/variant_02.png`            |
| `onu/onu/01/PHOTO/<img1>`                                    | `public/assets/onu/scene_01/photo/variant_01.png`                    |
| `onu/onu/01/PHOTO/<img2>` (se presente)                      | `public/assets/onu/scene_01/photo/variant_02.png`                    |
| `onu/onu/02/ILLUSTRAZIONE/...`                               | `public/assets/onu/scene_02/illustrazione/...`                       |
| (idem per `03`, `04`, `05`)                                  |                                                                       |
| `onu/onu/AUDIO/<scena1>.mp3`                                 | `public/assets/onu/audio_set_01/narration_01.mp3`                    |
| `onu/onu/AUDIO/<scena2>.mp3`                                 | `public/assets/onu/audio_set_01/narration_02.mp3`                    |
| (idem per `narration_03..05.mp3` nello stesso set)           |                                                                       |
| `onu/onu/photomovie_onu.mp4`                                 | `public/assets/onu/video_demo.mp4`                                   |
| `onu/onu/photomovie_onu_ita.txt`                             | (opzionale) `demo_assets/voice_scripts/markdown/onu_pack_01.md`      |

Stesso pattern per `assicurazioni/` (sorgente: `assicurazioni/ASSICURAZIONI/...`) e `geografia/` (sorgente: `geografia_keynote/...`).

#### Suggerimenti pratici

- **Drag & drop diretto da Windows Explorer**: rinomina la cartella `ILLUSTRAZIONE` in `illustrazione` (minuscolo) e `PHOTO` in `photo`, poi sposta tutto dentro la `scene_XX` corrispondente del repo. I file dentro vanno rinominati `variant_01.png`, `variant_02.png`, ecc.
- **AUDIO**: ogni file della cartella AUDIO va rinominato `narration_01.mp3` ... `narration_05.mp3` e messo dentro `audio_set_01/`.
- **Rotazione audio nelle rigenerazioni**: per dare la sensazione di "regen" duplica la cartella `audio_set_01/` in `audio_set_02..05/`. La UI ruota su 5 set per evitare ripetizioni immediate.
- **video_demo.mp4**: rinomina `photomovie_<topic>.mp4` -> `video_demo.mp4` e mettilo nella radice del topic. Il file `_ita.txt` non serve all'app, e' solo riferimento per il team voce.

### Video demo

Per ogni stile:

```text
public/assets/{style}/video_demo.mp4
```

Esempi validi:

- `public/assets/storia/video_demo.mp4`
- `public/assets/scienze/video_demo.mp4`
- `public/assets/arte/video_demo.mp4`

### Perche questa cartella

Tutto cio che sta in `public/` viene servito direttamente da Vite.

Quindi il browser puo leggere URL come:

- `/assets/storia/scene_01/variant_02.png`
- `/assets/storia/audio_set_03/narration_01.mp3`
- `/assets/storia/video_demo.mp4`

Se un asset manca, la UI deve degradare in modo controllato, ma la demo ideale richiede che il set sia completo.

## Rigenerazione in Demo mode

In `Demo mode`, il pulsante di rigenerazione cambia solo i media.

Resta invariato:

- testo delle scene
- ordine delle scene
- titoli
- script
- tema demo attivo

Cambia:

- variante immagine per scena
- set audio del run
- output video locale (se previsto di aggiornarlo)
- piccoli dettagli di log/percezione

### Regole di randomizzazione

- Immagini: non riusare subito la variante appena usata per la stessa scena
- Audio: non riusare subito l'ultimo `audio_set_*` appena usato per quello stile
- Quando il pool e esaurito, viene resettato evitando la ripetizione immediata dell'ultimo elemento

## Output video demo

Nel pannello destro esiste un blocco `VIDEO OUTPUT`.

In `Demo mode`:

- usa `public/assets/{style}/video_demo.mp4`
- e parte del pacchetto demo finale
- puo essere visualizzato e scaricato

Non e una generazione video reale. E un output locale coerente con lo stile selezionato.

## Export

Documenta solo cio che esiste davvero oggi.

### Menu in alto a destra

Esporta:

- `Storyboard JSON`
- `System Log TXT`
- `Session Snapshot`

### Pannello export a destra

Formati attuali:

- `Storyboard JSON`
- `Audio MP3`
- `Video MP4`
- `Full Package`

Regole:

- `Storyboard JSON` scarica un JSON reale
- `Audio MP3` funziona solo se esiste almeno una traccia disponibile
- `Video MP4` funziona se esiste un file video reale (backend o demo locale)
- `Full Package` resta disabilitato finche non esiste un artefatto reale

Non viene dichiarato nessun export PDF che non esista davvero.

## Script voce (deliverable)

Il repo contiene una cartella dedicata ai pack di script da consegnare al team voce:

```text
demo_assets/
  voice_scripts/
    markdown/
    json/
```

File previsti:

```text
demo_assets/voice_scripts/
  markdown/
    grain_cycle_pack_01.md
    grain_cycle_pack_02.md
    grain_cycle_pack_03.md
    grain_cycle_pack_04.md
    grain_cycle_pack_05.md
  json/
    grain_cycle_pack_01.json
    grain_cycle_pack_02.json
    grain_cycle_pack_03.json
    grain_cycle_pack_04.json
    grain_cycle_pack_05.json
```

Ogni pack contiene:

- 6 scene
- contenuto completo sul tema `ciclo del grano`
- testo realmente diverso dagli altri pack
- doppio formato:
  - `.md` per lettura/approvazione
  - `.json` per uso tecnico

Questi file non sono asset runtime del browser: sono materiale operativo interno da consegnare al team voce.

## Checklist pre-demo

### Se usi LIVE n8n

1. Avvia n8n
2. Avvia `npm run pdf:extractor`
3. Verifica che il webhook nelle `Settings` sia corretto
4. Assicurati che `Demo mode` sia disattivata
5. Carica un PDF reale con testo selezionabile
6. Esegui un run di test
7. Controlla:
   - storyboard visibile
   - immagini caricate
   - audio presente solo se il backend restituisce URL validi
   - export coerenti

### Se usi Demo mode

1. Verifica che gli asset demo siano presenti in `public/assets/...`
2. Attiva `Demo mode` dalle `Settings`
3. Inserisci opzionalmente un `Focus Prompt`
4. Premi `Generate`
5. Controlla:
   - 5 scene
   - immagini presenti
   - audio presenti
   - video demo presente
   - log credibili
6. Se il percorso live non e stabile, usa questa modalita per la presentazione

## Troubleshooting

### `pdfContent` vuoto / `Decoded PDF payload is empty`

Cause tipiche:

- input PDF finto o non valido
- configurazione errata del body nel nodo HTTP di n8n

Azione:

- carica un PDF reale
- nel nodo HTTP n8n usa `Using Fields Below` per inviare `pdfBase64`

### `requestId mismatch`

Causa:

- il backend non sta restituendo la response finale corretta
- oppure manca `requestId` top-level

Azione:

- assicurati che la response finale di n8n includa `requestId` top-level

### Immagini non visibili

Causa:

- `imagePath` mancante
- oppure URL non realmente fetchabile

Azione:

- il backend deve restituire URL finali immagine reali
- non usare URL di polling o path non serviti dal browser

### Audio non riproducibile

Causa:

- `audioPath` e un path di filesystem locale

Azione:

- esporre i file audio via URL HTTP
- restituire alla UI una URL browser-safe

### Voicebox timeout

Causa:

- servizio locale lento
- timeout troppo basso
- concorrenza troppo alta

Azione:

- alzare il timeout
- preferire elaborazione seriale

### Confusione tra `webhook` e `webhook-test`

Causa:

- la UI punta al path di test di n8n

Azione:

- per il percorso normale usa sempre:
  - `http://localhost:5678/webhook/edugen-process`

## Contratti runtime rilevanti

### Frontend -> n8n

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

### Helper PDF extractor

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

## Riferimenti utili nel repo

Documenti secondari ancora utili come supporto tecnico:

- `n8n/PDF_TEXT_EXTRACTION_HELPER.md`
- `n8n/EDUGEN_FLOW_HARDENING.md`

Usali come riferimento implementativo. Se divergono dal comportamento attuale dell'app, fai fede prima a questo README.
