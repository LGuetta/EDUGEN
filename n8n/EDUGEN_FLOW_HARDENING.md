# EDUGEN n8n Flow Hardening (Serial Flux, Non-Blocking Audio)

This is the correct patch set for the current phase:

- image generation must work for real via Replicate
- audio must not block the run
- the UI must only receive final image URLs, never prediction URLs

The previous fallback-based document is obsolete for this phase because:

- the company images are only style references
- there are no runtime fallback assets yet
- Replicate is currently returning prediction jobs, not finished image files

## Core Rules

1. **Flux runs serially**, one scene at a time
2. **Audio is best effort**, never blocking
3. `urls.get` from Replicate is **not** an image URL
4. A scene is visually valid only if `imagePath` is a final fetchable image URL
5. The UI must not be given fake `imagePath` values

## What Must Change

The current image branch is wrong because it does this:

- create prediction
- immediately treat the prediction response as the final image

That does not work. Replicate first returns a prediction object:

- `status: "starting"` or `status: "processing"`
- `output: null`
- `urls.get`: polling endpoint

You must:

1. create the prediction
2. wait
3. poll `urls.get`
4. repeat until `status === "succeeded"` or timeout
5. only then use `output[0]` as `imagePath`

## Required Workflow Shape

## Keep These Nodes

- `1. Webhook Trigger`
- `2. Parse Request`
- `3. PDF Parser`
- `4. LLM Analysis`
- `5. Process LLM Response`
- `6. Split Scenes`
- `7b. Handle Result`
- `8a. TTS Generate (Voicebox)`
- `8b. Handle TTS`
- `9. Aggregate Results`
- `10. Prepare Response`
- `11. Respond to UI`

## Replace / Add for Image Branch

Remove the current single-shot image branch and replace it with:

- `6.1 Split In Batches`
- `7a. Flux Create Prediction`
- `7a.1 Wait for Flux`
- `7a.2 Flux Poll Prediction`
- `7a.3 Prepare Poll State`
- `7a.4 IF Flux Done?`

## Connection Map

Use this exact wiring:

1. `1. Webhook Trigger` -> `2. Parse Request`
2. `2. Parse Request` -> `3. PDF Parser`
3. `3. PDF Parser` -> `4. LLM Analysis`
4. `4. LLM Analysis` -> `5. Process LLM Response`
5. `5. Process LLM Response` -> `6. Split Scenes`
6. `6. Split Scenes` -> `6.1 Split In Batches`

Image branch:

7. `6.1 Split In Batches` -> `7a. Flux Create Prediction`
8. `7a. Flux Create Prediction` -> `7a.1 Wait for Flux`
9. `7a.1 Wait for Flux` -> `7a.2 Flux Poll Prediction`
10. `7a.2 Flux Poll Prediction` -> `7a.3 Prepare Poll State`
11. `7a.3 Prepare Poll State` -> `7a.4 IF Flux Done?`
12. `7a.4 IF Flux Done?` (true = done) -> `7b. Handle Result`
13. `7a.4 IF Flux Done?` (false = still running) -> `7a.1 Wait for Flux`
14. `7b. Handle Result` -> back into `6.1 Split In Batches` loop

Audio branch:

15. `6. Split Scenes` -> `8a. TTS Generate (Voicebox)`
16. `8a. TTS Generate (Voicebox)` -> `8b. Handle TTS`

Final aggregation:

17. `6.1 Split In Batches` done output -> `9. Aggregate Results`
18. `9. Aggregate Results` -> `10. Prepare Response`
19. `10. Prepare Response` -> `11. Respond to UI`

Important:

- **do not connect `8b. Handle TTS` directly to `9. Aggregate Results`**

`9` must run exactly once, after the image batch loop is fully finished.

It will read the audio results using:

- `$('8b. Handle TTS').all()`

If you wire `8b` directly into `9`, `9` can execute too early or more than once.

## Node Modes

Use these exact Code node modes:

- `6. Split Scenes`: `Run Once for All Items`
- `7a.3 Prepare Poll State`: `Run Once for Each Item`
- `7b. Handle Result`: `Run Once for Each Item`
- `8b. Handle TTS`: `Run Once for Each Item`
- `9. Aggregate Results`: `Run Once for All Items`
- `10. Prepare Response`: `Run Once for All Items`

If you get:

- `Can't use .first() here`

then the node mode is wrong for the code it contains.

## `6. Split Scenes`

Keep it as an expander:

```javascript
const input = $input.first().json;
const scenes = input.storyboard.scenes;
const stylePrompt = input.stylePrompt;
const requestId = $('2. Parse Request').first().json.requestId;

const items = scenes.map((scene) => ({
  json: {
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    narrationScript: scene.narrationScript,
    imagePrompt: `${scene.imagePrompt}, ${stylePrompt}`,
    duration: scene.duration,
    styleModule: input.styleModule,
    requestId,
    pollAttempts: 0
  }
}));

return items;
```

## `6.1 Split In Batches`

### Type
- `Split In Batches`

### Config
- Batch size: `1`

### Role
- feed exactly one scene at a time into the Flux branch
- avoid Replicate `429` rate limiting

## `7a. Flux Create Prediction`

### Type
- `HTTP Request`

### Method
- `POST`

### URL
- `https://api.replicate.com/v1/predictions`

### Critical rule
- **Do not include `wait`**

Replicate already rejected that field in your tests.

### Request body

```json
{
  "model": "black-forest-labs/flux-schnell",
  "input": {
    "prompt": "={{ $json.imagePrompt }}",
    "num_outputs": 1,
    "aspect_ratio": "16:9",
    "output_format": "png"
  }
}
```

### Required behavior
- `continueOnFail: true`

This node returns a prediction object, not the final image.

## `7a.1 Wait for Flux`

### Type
- `Wait`

### Config
- fixed delay: `2 seconds`

This delay is between polling attempts.

## `7a.2 Flux Poll Prediction`

### Type
- `HTTP Request`

### Method
- `GET`

### URL
- `={{ $json.urls.get || $json.pollUrl }}`

### Behavior
- `continueOnFail: true`

This node fetches the current status of the prediction.

## `7a.3 Prepare Poll State`

This node normalizes the polling response and carries scene metadata forward.

```javascript
const source = $('6.1 Split In Batches').item.json;
const response = $input.first().json;

const previousAttempts = Number(source.pollAttempts || 0);
const pollAttempts = previousAttempts + 1;

return {
  json: {
    ...source,
    predictionId: response.id || source.predictionId || null,
    pollUrl: response.urls?.get || source.pollUrl || null,
    status: response.status || 'failed',
    output: response.output || null,
    replicateError: response.error || response.error?.message || null,
    pollAttempts
  }
};
```

## `7a.4 IF Flux Done?`

### Type
- `IF`

### Condition

Treat the scene as **done** if one of these is true:

1. `status === "succeeded"`
2. `status === "failed"`
3. `pollAttempts >= 10`
4. no `pollUrl`

If none of those are true:

- loop back to `7a.1 Wait for Flux`

### Why
- prevents infinite polling
- ensures the workflow terminates cleanly

## `7b. Handle Result`

### Mode
- `Run Once for Each Item`

### Role
- build the final scene output
- only emit a real `imagePath` when the prediction fully succeeded

### Code

```javascript
const input = $input.first().json;

const succeeded =
  input.status === 'succeeded' &&
  Array.isArray(input.output) &&
  Boolean(input.output[0]);

return {
  json: {
    sceneNumber: input.sceneNumber,
    title: input.title,
    narrationScript: input.narrationScript,
    duration: input.duration,
    styleModule: input.styleModule,
    requestId: input.requestId,
    imagePath: succeeded ? input.output[0] : null,
    imageGeneratedReal: succeeded,
    imageProviderStatus: succeeded ? 'live' : 'failed',
    imageError: succeeded
      ? null
      : input.replicateError || `Flux did not finish for scene ${input.sceneNumber}`
  }
};
```

### Critical rule
- never use `urls.get` as `imagePath`

That URL returns prediction JSON, not a PNG.

## `8a. TTS Generate (Voicebox)`

Keep it best effort only.

### Required config
- `continueOnFail: true`

### URL
- `http://127.0.0.1:8000/api/tts`

Use `127.0.0.1`, not `localhost`, to avoid the IPv6 `::1` refusal you already saw.

## `8b. Handle TTS`

### Mode
- `Run Once for Each Item`

### Role
- never fail the workflow because TTS is down
- emit nullable audio output

### Code

```javascript
const source = $('6. Split Scenes').item.json;
const response = $input.first().json;

const hasAudio =
  Boolean(response?.audio_url) ||
  Boolean(response?.output);

return {
  json: {
    sceneNumber: source.sceneNumber,
    requestId: source.requestId,
    audioPath: response?.audio_url || response?.output || null,
    audioGeneratedReal: hasAudio,
    audioProviderStatus: hasAudio ? 'live' : 'unavailable',
    audioError: hasAudio ? null : response?.error?.message || 'TTS unavailable'
  }
};
```

## `9. Aggregate Results`

This node must combine:

- the finished image results from the serial Flux branch
- the best-effort audio results from the audio branch

Since the image branch is now serial and loops, the safest aggregation is:

- read all items from `7b. Handle Result`
- read all items from `8b. Handle TTS`
- merge them in code by `sceneNumber`

### Mode
- `Run Once for All Items`

### Code

```javascript
const imageItems = $('7b. Handle Result').all().map((item) => item.json);
const audioItems = $('8b. Handle TTS').all().map((item) => item.json);
const parseRequest = $('2. Parse Request').first().json;

const audioByScene = new Map(
  audioItems.map((item) => [String(item.sceneNumber), item])
);

const scenes = imageItems
  .map((imageItem) => {
    const audioItem = audioByScene.get(String(imageItem.sceneNumber)) || {};

    return {
      sceneNumber: imageItem.sceneNumber,
      title: imageItem.title,
      narrationScript: imageItem.narrationScript,
      duration: imageItem.duration || 15,
      imagePath: imageItem.imagePath || null,
      audioPath: audioItem.audioPath || null,
      generatedReal: Boolean(imageItem.imageGeneratedReal || audioItem.audioGeneratedReal),
      imageGeneratedReal: Boolean(imageItem.imageGeneratedReal),
      audioGeneratedReal: Boolean(audioItem.audioGeneratedReal),
      imageError: imageItem.imageError || null,
      audioError: audioItem.audioError || null
    };
  })
  .sort((a, b) => a.sceneNumber - b.sceneNumber);

const allImagesReady = scenes.every((scene) => Boolean(scene.imagePath));

return {
  json: {
    requestId: parseRequest.requestId,
    styleModule: parseRequest.styleModule,
    videoPreset: parseRequest.videoPreset,
    allImagesReady,
    storyboard: {
      title: 'Ciclo del Grano',
      totalScenes: scenes.length,
      scenes,
      totalDuration: scenes.reduce((acc, scene) => acc + (scene.duration || 15), 0)
    }
  }
};
```

## `10. Prepare Response`

### Mode
- `Run Once for All Items`

### Policy
- if even one scene is missing `imagePath`, fail the run clearly
- audio can be missing and still be non-fatal

### Code

```javascript
const input = $input.first().json;

const scenes = input.storyboard.scenes || [];
const warnings = [];

for (const scene of scenes) {
  if (!scene.audioGeneratedReal) {
    warnings.push({
      code: 'SCENE_AUDIO_UNAVAILABLE',
      message: `Scene ${scene.sceneNumber} audio unavailable`,
      sceneNumber: scene.sceneNumber,
      severity: 'warning'
    });
  }

  if (!scene.imageGeneratedReal) {
    warnings.push({
      code: 'SCENE_IMAGE_FAILED',
      message: `Scene ${scene.sceneNumber} image generation failed`,
      sceneNumber: scene.sceneNumber,
      severity: 'error'
    });
  }
}

if (!input.allImagesReady) {
  return {
    json: {
      success: false,
      requestId: input.requestId,
      mode: 'live',
      error: {
        code: 'IMAGE_GENERATION_INCOMPLETE',
        message: 'One or more Flux images did not finish successfully'
      },
      warnings,
      logs: [
        {
          time: new Date().toLocaleTimeString('it-IT', { hour12: false }),
          message: 'Image generation incomplete',
          type: 'error'
        }
      ]
    }
  };
}

return {
  json: {
    success: true,
    requestId: input.requestId,
    mode: 'live',
    data: {
      storyboard: input.storyboard,
      metadata: {
        styleModule: input.styleModule,
        videoPreset: input.videoPreset,
        processedAt: new Date().toISOString()
      },
      stats: {
        totalScenes: input.storyboard.totalScenes,
        totalDuration: input.storyboard.totalDuration,
        style: input.styleModule,
        realGeneratedImages: scenes.filter((scene) => scene.imageGeneratedReal).length,
        realGeneratedAudio: scenes.filter((scene) => scene.audioGeneratedReal).length
      }
    },
    warnings,
    progressTrace: [
      { stage: 'input', status: 'complete', time: '00:00:01' },
      { stage: 'parsing', status: 'complete', time: '00:00:03' },
      { stage: 'llm', status: 'complete', time: '00:00:10' },
      { stage: 'style', status: 'complete', time: '00:00:14' },
      { stage: 'voice', status: 'complete', time: '00:00:18' },
      { stage: 'image', status: 'complete', time: '00:00:24' },
      { stage: 'output', status: 'complete', time: '00:00:26' }
    ],
    logs: [
      { time: '00:00:01', message: '✓ PDF caricato', type: 'success' },
      { time: '00:00:03', message: '✓ Testo estratto', type: 'success' },
      { time: '00:00:10', message: '✓ Storyboard generato', type: 'success' },
      { time: '00:00:24', message: '✓ Immagini generate', type: 'success' },
      { time: '00:00:26', message: '✅ Pipeline completata!', type: 'success' }
    ]
  }
};
```

## `11. Respond to UI`

Keep:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

Use the normal production webhook URL in the UI:

- `http://localhost:5678/webhook/edugen-process`

Do not use:

- `webhook-test`

for the live UI demo path.

## Contract Requirements

## Successful run

The UI must receive:

```json
{
  "success": true,
  "requestId": "req_...",
  "mode": "live",
  "data": {
    "storyboard": {
      "totalScenes": 6,
      "scenes": [
        {
          "sceneNumber": 1,
          "imagePath": "https://...",
          "audioPath": null
        }
      ]
    }
  }
}
```

## Failed run

If one or more images never complete, return a valid failure payload:

```json
{
  "success": false,
  "requestId": "req_...",
  "mode": "live",
  "error": {
    "code": "IMAGE_GENERATION_INCOMPLETE",
    "message": "One or more Flux images did not finish successfully"
  },
  "warnings": []
}
```

This is still better than lying to the UI with fake image URLs.

## What “Working” Means

The image branch is truly working only when:

1. `6. Split Scenes` outputs 6 items
2. `6.1 Split In Batches` processes all 6 scenes serially
3. `7a.2 Flux Poll Prediction` reaches `status: "succeeded"` for all 6
4. `7b. Handle Result` emits 6 items with real `output[0]` image URLs
5. `9. Aggregate Results` returns `totalScenes: 6`
6. the UI shows 6 storyboard cards with real images

Audio may still be unavailable without blocking the run.

## Validation Checklist

1. `6. Split Scenes` -> 6 items
2. `7a. Flux Create Prediction` -> one prediction at a time, not 6 parallel requests
3. no more Replicate `429`
4. no use of `urls.get` as `imagePath`
5. `7b` -> 6 items
6. `8b` -> 6 items (with `audioPath: null` allowed)
7. `9` -> `storyboard.totalScenes = 6`
8. UI -> 6 cards

## After This Works

Once Flux is stable:

1. manually save the 6 generated images
2. curate them into future demo fallback packs by style
3. later add a `force fallback` switch for the demo

That gives you:

- a real working image pipeline now
- a deterministic fallback mode later
