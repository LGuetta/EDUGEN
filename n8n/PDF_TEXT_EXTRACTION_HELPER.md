# EDUGEN n8n Patch: Real PDF Text Extraction

This patch replaces the current demo/fallback `3. PDF Parser` behavior with real text extraction from the uploaded PDF.

Scope:

- supports text-based PDFs only
- no OCR
- if no extractable text exists, the workflow should fail clearly

## Why This Patch Is Needed

The frontend already sends:

- `pdfContent` (base64 data URL)
- `pdfPath`
- `requestId`

So arbitrary PDF upload already works in the UI.

The current blocker is the n8n parser step still using demo text instead of the uploaded document content.

## Local Helper Service

Run the helper service from the project root:

```bash
npm run pdf:extractor
```

Default endpoints:

- `GET http://127.0.0.1:4317/health`
- `POST http://127.0.0.1:4317/extract-pdf-text`

## Replace `3. PDF Parser`

Replace the current code-based parser node with an `HTTP Request` node.

### Node Type

- `HTTP Request`

### Method

- `POST`

### URL

- `http://127.0.0.1:4317/extract-pdf-text`

### Send Body

- `JSON`

### Request JSON

```json
{
  "filename": "={{ $json.pdfPath }}",
  "pdfBase64": "={{ $json.pdfContent }}"
}
```

### Timeout

- `60000 ms`

### Continue On Fail

- `false`

If this step fails, stop the workflow and return a real extraction error. Do not silently fall back to demo text.

## Add `3.1 Normalize Extracted Text`

Add a `Code` node after the HTTP extractor and before `4. LLM Analysis`.

### Mode

- `Run Once for All Items`

### Code

```javascript
const source = $('2. Parse Request').first().json;
const extraction = $input.first().json;

if (!extraction.success) {
  throw new Error(
    extraction?.error?.message || 'PDF text extraction failed'
  );
}

const extractedText = String(extraction.text || '').trim();

if (!extractedText) {
  throw new Error('PDF contains no extractable text');
}

return {
  json: {
    ...source,
    extractedText,
    pageCount: Number(extraction.pageCount || 0),
    wordCount: Number(extraction.wordCount || 0),
    truncated: Boolean(extraction.truncated),
    extractionMethod: extraction.extractionMethod || 'real_text_pdf'
  }
};
```

## Update `4. LLM Analysis`

Keep the node, but ensure the input text comes from:

- `{{ $json.extractedText }}`

If you later want tighter control over token size, add truncation in `3.1 Normalize Extracted Text`, not in the UI.

## Failure Rules

If extraction fails:

- return `success: false`
- include the original `requestId`
- stop the workflow before the LLM step

If extracted text is empty:

- fail explicitly with `PDF contains no extractable text`

That is the correct behavior for scanned/image-only PDFs until OCR is added.

## Expected Helper Service Contract

### Request

```json
{
  "filename": "file.pdf",
  "pdfBase64": "JVBERi0xLjcK..."
}
```

### Success Response

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

### Failure Response

```json
{
  "success": false,
  "error": {
    "code": "PDF_TEXT_EXTRACTION_FAILED",
    "message": "Unable to extract text from the provided PDF"
  }
}
```
