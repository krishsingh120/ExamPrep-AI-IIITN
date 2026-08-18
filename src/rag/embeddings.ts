import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";

export class TransformersEmbeddings extends Embeddings {
  private pipelinePromise: any | null = null;
  private modelName = "Xenova/all-MiniLM-L6-v2";

  constructor(fields?: EmbeddingsParams) {
    super(fields ?? {});
  }

  private async getPipeline() {
    if (!this.pipelinePromise) {
      // Dynamic import to prevent loading the heavy library on application startup
      const { pipeline } = await import("@xenova/transformers");
      this.pipelinePromise = pipeline("feature-extraction", this.modelName);
    }
    return this.pipelinePromise;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const pipe = await this.getPipeline();
    const results: number[][] = [];

    for (const doc of documents) {
      const output = await pipe(doc, { pooling: "mean", normalize: true });
      results.push(Array.from(output.data));
    }

    return results;
  }

  async embedQuery(document: string): Promise<number[]> {
    const pipe = await this.getPipeline();
    const output = await pipe(document, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }
}
