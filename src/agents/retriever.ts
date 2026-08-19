import { ChatGroq } from "@langchain/groq";
import { config } from "../config/env";
import { searchVectorStore } from "../rag/qdrant";
import { createQueryEmbedding } from "../rag/embeddings";

export async function retrieveAgent(query: string, subject?: string, history: { role: string; content: string }[] = []) {
  // 1. Generate query embedding
  const queryVector = await createQueryEmbedding(query);

  // 2. Search Qdrant
  const filters = subject ? { subject } : undefined;
  const docs = await searchVectorStore(queryVector, config.ragTopK, filters);

  if (docs.length === 0) {
    return "I couldn't find any relevant information in the course material.";
  }

  // 3. Prepare context
  const context = docs
    .map((doc, i) => `[Source ${i + 1}: ${doc.metadata.source}]\n${doc.content}`)
    .join("\n\n");

  // 4. Generate answer
  const model = new ChatGroq({
    apiKey: config.groq.apiKey,
    model: config.groq.model,
  });

  const systemPrompt = `You are a helpful teaching assistant for ExamPrep AI.
Answer the student's question using ONLY the provided context below.
Cite your sources using the [Source X] labels.

Context:
${context}`;

  const messages = [
    ["system", systemPrompt],
    ...history.map((msg) => [msg.role, msg.content]),
    ["human", query],
  ];

  // @ts-ignore
  const response = await model.invoke(messages);

  return response.content as string;
}
