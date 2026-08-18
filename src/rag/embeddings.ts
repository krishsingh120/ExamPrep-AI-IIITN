let pipelinePromise: any | null = null;

async function getPipeline() {
  if (!pipelinePromise) {
    // Dynamic import to prevent loading the heavy library on application startup
    const { pipeline } = await import("@xenova/transformers");
    pipelinePromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return pipelinePromise;
}

export async function createEmbeddings(documents: string[]): Promise<number[][]> {
  const pipe = await getPipeline();
  const results: number[][] = [];

  for (const doc of documents) {
    const output = await pipe(doc, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data));
  }

  return results;
}

export async function createQueryEmbedding(query: string): Promise<number[]> {
  const pipe = await getPipeline();
  const output = await pipe(query, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
