import { ChatGroq } from "@langchain/groq";
import { config } from "../config/env";
import { searchVectorStore } from "../rag/qdrant";
import { createQueryEmbedding } from "../rag/embeddings";

export async function doubtSolverAgent(question: string, subject?: string) {
  // 1. Generate query embedding
  const queryVector = await createQueryEmbedding(question);

  // 2. Search Qdrant
  const filters = subject ? { subject } : undefined;
  const docs = await searchVectorStore(queryVector, config.ragTopK, filters);

  const context = docs.length > 0
    ? docs.map((doc, i) => `[Source ${i + 1}: ${doc.metadata.source}]\n${doc.content}`).join("\n\n")
    : "No highly relevant course material was found, but answer based on general knowledge if appropriate.";

  // 3. Generate answer
  const model = new ChatGroq({
    apiKey: config.groq.apiKey,
    model: config.groq.model,
  });

  const systemPrompt = `You are an expert ExamPrep AI tutor for IIIT Nagpur.
A student has a conceptual doubt or problem to solve.
Explain the concept clearly, step-by-step.
Use the provided course context if relevant, and cite sources using [Source X].
If the context doesn't fully answer the question, you may supplement with your own knowledge but keep it focused on the subject.

Context:
${context}`;

  const response = await model.invoke([
    ["system", systemPrompt],
    ["human", question],
  ]);

  return response.content as string;
}
