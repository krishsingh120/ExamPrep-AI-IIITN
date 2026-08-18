import { createQueryEmbedding } from "../src/rag/embeddings";
import { searchVectorStore, RetrievalFilter } from "../src/rag/qdrant";

async function main() {
  const query = process.argv[2] || "normalization 3NF example";
  const limit = parseInt(process.argv[3] || "3", 10);
  const categoryArg = process.argv[4] as any; // e.g. pyq, lecture_slide, class_note, syllabus

  console.log("=== ExamPrep AI RAG Retrieval Tester ===");
  console.log(`Query:     "${query}"`);
  console.log(`Limit:     ${limit}`);
  
  const filters: RetrievalFilter = {};
  if (categoryArg) {
    filters.category = categoryArg;
    console.log(`Filter:    category = "${categoryArg}"`);
  }
  console.log("========================================\n");

  try {
    console.log("[Test] Generating embedding for query...");
    const queryVector = await createQueryEmbedding(query);

    console.log("[Test] Searching vector database...");
    const results = await searchVectorStore(queryVector, limit, filters);

    console.log(`[Test] Found ${results.length} matching documents:\n`);

    results.forEach((res, idx) => {
      console.log(`--- Match #${idx + 1} (Score: ${res.score.toFixed(4)}) ---`);
      console.log(`Source:   ${res.metadata.source}`);
      console.log(`Category: ${res.metadata.category}`);
      console.log(`Subject:  ${res.metadata.subject} (Sem: ${res.metadata.semester})`);
      if (res.metadata.unit) console.log(`Unit:     ${res.metadata.unit}`);
      if (res.metadata.topic) console.log(`Topic:    ${res.metadata.topic}`);
      if (res.metadata.year) console.log(`Year:     ${res.metadata.year}`);
      console.log(`Content:`);
      console.log(`"${res.content}"`);
      console.log("-".repeat(45) + "\n");
    });

  } catch (err: any) {
    console.error("[Test] Search failed:", err.message);
    process.exit(1);
  }
}

main();
