import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { IngestDocument } from "./qdrant";

export function chunkSyllabus(text: string, baseMetadata: any): IngestDocument[] {
  const units = text.split(/(?=Unit\s+\d+)/i);

  return units
    .filter((unit) => unit.trim())
    .map((unit, index) => ({
      content: unit.trim(),
      metadata: {
        ...baseMetadata,
        category: "syllabus",
        unit: `Unit ${index + 1}`,
      },
    }));
}

export function chunkPYQ(text: string, baseMetadata: any): IngestDocument[] {
  const questions = text.split(/Q\d+[\.:]/);

  return questions
    .filter((question) => question.trim())
    .map((question) => ({
      content: question.trim(),
      metadata: {
        ...baseMetadata,
        category: "pyq",
      },
    }));
}

export function chunkSlides(text: string, baseMetadata: any): IngestDocument[] {
  return text
    .split("\f")
    .filter((slide) => slide.trim())
    .map((slide, index) => ({
      content: slide.trim(),
      metadata: {
        ...baseMetadata,
        category: "lecture_slide",
        page: index + 1,
      },
    }));
}

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
