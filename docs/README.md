# Knowledge Base / Document Store

This directory holds the raw documents that are ingested into the Qdrant vector database.

## Directory Structure

```
docs/
├── syllabus/         ← IIITN official syllabus documents (PDF, text)
├── pyq/              ← Previous Year Question papers (PDF, structured JSON)
├── slides/           ← Faculty lecture PPT/PDF slides
└── notes/            ← Class notes (PDF, text)
```

## Important Rules

- Do NOT commit large PDF/binary files to Git — use `.gitignore`
- Add your local documents here before running `npm run ingest`
- Each document should be placed in the correct category folder
- The ingest script reads these folders and attaches metadata automatically

## Supported Formats (Phase 2)

- PDF → PyPDF / pdf-parse
- PPTX → mammoth or custom PPTX loader
- TXT / MD → Direct text loading
- JSON → Structured PYQ format

## Gitignore Note

Large files (PDFs, PPTs) are not committed. Only the directory structure is tracked.
Add your own documents locally for ingestion.
