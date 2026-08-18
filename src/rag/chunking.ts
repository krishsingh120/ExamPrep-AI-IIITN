import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { IngestDocument } from "./qdrant";

/**
 * Syllabus Chunking: Splits by Unit boundary (e.g. Unit 1, Unit I, Unit-1, etc.)
 */
export function chunkSyllabus(text: string, baseMetadata: any): IngestDocument[] {
  // Regex to match "Unit 1", "Unit I", "UNIT - 1", "Unit-I", etc. at the start of a line
  const unitRegex = /^(?:Unit\s*[-–:]*\s*([0-9IVX]+)|UNIT\s*[-–:]*\s*([0-9IVX]+))/mi;
  const lines = text.split(/\r?\n/);
  const chunks: IngestDocument[] = [];

  let currentUnitName = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const match = line.match(unitRegex);
    if (match) {
      // Save previous chunk
      if (currentContent.length > 0) {
        chunks.push({
          content: currentContent.join("\n").trim(),
          metadata: {
            ...baseMetadata,
            unit: currentUnitName || "General",
            category: "syllabus",
          },
        });
      }
      currentUnitName = `Unit ${(match[1] || match[2]).trim()}`;
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Push the final chunk
  if (currentContent.length > 0) {
    chunks.push({
      content: currentContent.join("\n").trim(),
      metadata: {
        ...baseMetadata,
        unit: currentUnitName || "General",
        category: "syllabus",
      },
    });
  }

  return chunks.filter((c) => c.content.length > 50);
}

/**
 * PYQ Chunking:
 * - If JSON: expects an array of structured questions. Returns 1 document per question.
 * - If Text: splits by question markers (e.g. Q1, Q2, Question 1)
 */
export function chunkPYQ(text: string, baseMetadata: any): IngestDocument[] {
  // Try parsing as JSON first (recommended structured format)
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.map((item: any, idx) => {
        const questionText = typeof item === "string" ? item : item.question || item.content || JSON.stringify(item);
        return {
          content: questionText.trim(),
          metadata: {
            ...baseMetadata,
            unit: item.unit || undefined,
            topic: item.topic || undefined,
            year: item.year || baseMetadata.year,
            category: "pyq",
            source: baseMetadata.source,
          },
        };
      });
    }
  } catch {
    // If not JSON, fall back to regex splitting on question markers (e.g., Q1., Q2., Question 1:)
  }

  // Fallback text splitting
  const qRegex = /^(?:Q(?:uestion)?\s*[-–\.:]*\s*\d+)/mi;
  const lines = text.split(/\r?\n/);
  const chunks: IngestDocument[] = [];

  let currentQuestionNum = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const match = line.match(qRegex);
    if (match) {
      if (currentContent.length > 0) {
        chunks.push({
          content: currentContent.join("\n").trim(),
          metadata: {
            ...baseMetadata,
            category: "pyq",
          },
        });
      }
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    chunks.push({
      content: currentContent.join("\n").trim(),
      metadata: {
        ...baseMetadata,
        category: "pyq",
      },
    });
  }

  return chunks.filter((c) => c.content.length > 20);
}

/**
 * PPT / Slide Chunking:
 * Page breaks or form-feed (\f) separate slides in PDF extracts.
 * One slide = one document.
 */
export function chunkSlides(text: string, baseMetadata: any): IngestDocument[] {
  // Split by form feed \f or common slide delimiters like --- or page boundaries
  const rawSlides = text.split(/(?:\f|--- Slide \d+ ---|=== Page \d+ ===)/);
  const chunks: IngestDocument[] = [];

  rawSlides.forEach((slideText, idx) => {
    const cleanContent = slideText.trim();
    if (cleanContent.length > 30) {
      // Try to extract Unit number from slide content if present (e.g. "Unit 3: Normalization")
      const unitMatch = cleanContent.match(/Unit\s*([0-9IVX]+)/i);
      const unit = unitMatch ? `Unit ${unitMatch[1].trim()}` : baseMetadata.unit;

      chunks.push({
        content: cleanContent,
        metadata: {
          ...baseMetadata,
          unit,
          page: idx + 1,
          category: "lecture_slide",
        },
      });
    }
  });

  return chunks;
}

/**
 * Class Notes Chunking:
 * Splits notes using RecursiveCharacterTextSplitter into logical paragraph chunks.
 */
export async function chunkClassNotes(text: string, baseMetadata: any): Promise<IngestDocument[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  const rawChunks = await splitter.splitText(text);

  return rawChunks.map((chunkText) => ({
    content: chunkText.trim(),
    metadata: {
      ...baseMetadata,
      category: "class_note",
    },
  }));
}
