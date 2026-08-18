import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config/env";
import { v4 as uuidv4 } from "uuid";

// Singleton Qdrant client instance
let qdrantClient: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
  }
  return qdrantClient;
}

/**
 * Ensures Qdrant collection exists. If not, creates it.
 * Vector dimension is 384 for Xenova/all-MiniLM-L6-v2.
 */
export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  const collectionName = config.qdrant.collection;

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (!exists) {
      console.log(`[Qdrant] Collection "${collectionName}" does not exist. Creating...`);
      await client.createCollection(collectionName, {
        vectors: {
          size: 384, // dimension for Xenova/all-MiniLM-L6-v2
          distance: "Cosine",
        },
      });
      console.log(`[Qdrant] Collection "${collectionName}" created successfully.`);
    }
  } catch (err: any) {
    console.error(`[Qdrant] Failed to check/create collection:`, err.message);
    throw err;
  }
}

export interface IngestDocument {
  content: string;
  metadata: {
    subject: string;
    semester: number;
    category: "syllabus" | "pyq" | "lecture_slide" | "class_note";
    source: string;
    unit?: string;
    topic?: string;
    year?: number;
    page?: number;
    documentId?: string;
  };
}

/**
 * Upserts a batch of documents and their pre-computed embeddings into Qdrant.
 */
export async function upsertDocuments(
  documents: IngestDocument[],
  embeddings: number[][]
): Promise<void> {
  const client = getQdrantClient();
  const collectionName = config.qdrant.collection;

  if (documents.length !== embeddings.length) {
    throw new Error("[Qdrant] Document count does not match embedding count.");
  }

  const points = documents.map((doc, idx) => {
    // Generate UUID if not provided in metadata
    const id = doc.metadata.documentId || uuidv4();
    return {
      id,
      vector: embeddings[idx],
      payload: {
        content: doc.content,
        ...doc.metadata,
        documentId: id, // Ensure id matches
      },
    };
  });

  try {
    await client.upsert(collectionName, {
      wait: true,
      points,
    });
    console.log(`[Qdrant] Successfully upserted ${points.length} vectors.`);
  } catch (err: any) {
    console.error(`[Qdrant] Failed to upsert vectors:`, err.message);
    throw err;
  }
}

export interface RetrievalFilter {
  subject?: string;
  category?: "syllabus" | "pyq" | "lecture_slide" | "class_note";
  unit?: string;
  topic?: string;
}

/**
 * Searches Qdrant using query vector and filters
 */
export async function searchVectorStore(
  queryVector: number[],
  limit = 5,
  filters?: RetrievalFilter
) {
  const client = getQdrantClient();
  const collectionName = config.qdrant.collection;

  const mustFilters: any[] = [];

  if (filters) {
    if (filters.subject) {
      mustFilters.push({ key: "subject", match: { value: filters.subject } });
    }
    if (filters.category) {
      mustFilters.push({ key: "category", match: { value: filters.category } });
    }
    if (filters.unit) {
      mustFilters.push({ key: "unit", match: { value: filters.unit } });
    }
    if (filters.topic) {
      mustFilters.push({ key: "topic", match: { value: filters.topic } });
    }
  }

  try {
    const response = await client.search(collectionName, {
      vector: queryVector,
      limit,
      filter: mustFilters.length > 0 ? { must: mustFilters } : undefined,
      with_payload: true,
    });

    return response.map((result) => ({
      score: result.score,
      content: (result.payload?.content as string) || "",
      metadata: {
        subject: result.payload?.subject as string,
        semester: result.payload?.semester as number,
        unit: result.payload?.unit as string | undefined,
        topic: result.payload?.topic as string | undefined,
        category: result.payload?.category as "syllabus" | "pyq" | "lecture_slide" | "class_note",
        year: result.payload?.year as number | undefined,
        source: result.payload?.source as string,
        documentId: (result.payload?.documentId || result.id) as string,
      },
    }));
  } catch (err: any) {
    console.error(`[Qdrant] Search failed:`, err.message);
    throw err;
  }
}
