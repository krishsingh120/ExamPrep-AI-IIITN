import fs from "fs/promises";
import path from "path";
import { TransformersEmbeddings } from "../src/rag/embeddings";
import { ensureCollection, upsertDocuments, IngestDocument } from "../src/rag/qdrant";
import { chunkSyllabus, chunkPYQ, chunkSlides, chunkClassNotes } from "../src/rag/chunking";

// Maps subjects to semesters canonically
const SUBJECT_SEMESTER_MAP: Record<string, number> = {
  DBMS: 4,
  CN: 5,
  OS: 4,
  DSA: 3,
  TOC: 5,
  CD: 6,
};

async function parsePdf(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  // pdf-parse doesn't have native types, use require to avoid TS compile issues
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(fileBuffer);
  return data.text;
}

async function ingestFile(
  filePath: string,
  category: "syllabus" | "pyq" | "lecture_slide" | "class_note",
  embeddingsEngine: TransformersEmbeddings
) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  console.log(`[Ingest] Processing file: ${fileName} (${category})`);

  // Parse filename metadata
  // Format expectation: {SUBJECT}_{details}.{ext}
  const parts = fileName.split("_");
  const subject = parts[0].toUpperCase();
  const semester = SUBJECT_SEMESTER_MAP[subject] || 4;

  const baseMetadata = {
    subject,
    semester,
    source: fileName,
    category,
  };

  let fileContent = "";
  if (ext === ".pdf") {
    fileContent = await parsePdf(filePath);
  } else if (ext === ".json" || ext === ".txt" || ext === ".md") {
    fileContent = await fs.readFile(filePath, "utf-8");
  } else {
    console.warn(`[Ingest] Unsupported file format: ${ext} for ${fileName}. Skipping.`);
    return;
  }

  // Chunk documents based on category
  let documents: IngestDocument[] = [];
  if (category === "syllabus") {
    documents = chunkSyllabus(fileContent, baseMetadata);
  } else if (category === "pyq") {
    // Check if filename contains year (e.g. DBMS_2024_pyq.json)
    const yearMatch = fileName.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;
    documents = chunkPYQ(fileContent, { ...baseMetadata, year });
  } else if (category === "lecture_slide") {
    // Try to parse unit info from name (e.g. DBMS_Unit3_Normalization_slides.pdf)
    const unitMatch = fileName.match(/Unit\s*([0-9IVX]+)/i);
    const unit = unitMatch ? `Unit ${unitMatch[1].trim()}` : undefined;
    documents = chunkSlides(fileContent, { ...baseMetadata, unit });
  } else if (category === "class_note") {
    const unitMatch = fileName.match(/Unit\s*([0-9IVX]+)/i);
    const unit = unitMatch ? `Unit ${unitMatch[1].trim()}` : undefined;
    documents = await chunkClassNotes(fileContent, { ...baseMetadata, unit });
  }

  if (documents.length === 0) {
    console.log(`[Ingest] No chunks generated for ${fileName}. Skipping.`);
    return;
  }

  console.log(`[Ingest] Generated ${documents.length} chunks for ${fileName}. Embedding...`);

  // Generate embeddings
  const texts = documents.map((doc) => doc.content);
  const embeddings = await embeddingsEngine.embedDocuments(texts);

  // Upsert into Qdrant
  await upsertDocuments(documents, embeddings);
  console.log(`[Ingest] Successfully ingested ${fileName}.\n`);
}

async function main() {
  console.log("=== ExamPrep AI Ingestion System ===\n");

  const startTime = Date.now();
  const embeddingsEngine = new TransformersEmbeddings();

  try {
    // Ensure Qdrant is up and the collection is created
    await ensureCollection();

    const docsRoot = path.join(__dirname, "../docs");

    const categories: Record<string, "syllabus" | "pyq" | "lecture_slide" | "class_note"> = {
      syllabus: "syllabus",
      pyq: "pyq",
      slides: "lecture_slide",
      notes: "class_note",
    };

    let totalIngested = 0;

    for (const [folderName, category] of Object.entries(categories)) {
      const folderPath = path.join(docsRoot, folderName);
      try {
        const files = await fs.readdir(folderPath);

        for (const file of files) {
          if (file === ".gitkeep" || file === "README.md" || file.startsWith(".")) {
            continue;
          }

          const filePath = path.join(folderPath, file);
          await ingestFile(filePath, category, embeddingsEngine);
          totalIngested++;
        }
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.warn(`[Ingest] Directory docs/${folderName} not found. Skipping.`);
        } else {
          console.error(`[Ingest] Error reading directory docs/${folderName}:`, err.message);
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`=== Ingestion Completed in ${duration}s. Total files: ${totalIngested} ===`);
  } catch (err: any) {
    console.error("\n[Ingest] Ingestion failed:", err.message);
    process.exit(1);
  }
}

// Check if run directly
if (require.main === module) {
  main();
}
export { main as runIngest };
