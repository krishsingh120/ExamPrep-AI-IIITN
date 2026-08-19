import { getQdrantClient } from "../rag/qdrant";
import { config } from "../config/env";

export async function calculateWeightage(subject: string) {
  const client = getQdrantClient();
  const collectionName = config.qdrant.collection;

  // Scroll through all PYQs for the subject
  const response = await client.scroll(collectionName, {
    filter: {
      must: [
        { key: "category", match: { value: "pyq" } },
        { key: "subject", match: { value: subject } },
      ],
    },
    limit: 1000,
    with_payload: true,
  });

  const pyqs = response.points;

  const counts: Record<string, number> = {};

  for (const pyq of pyqs) {
    const topic = (pyq.payload?.topic as string) || (pyq.payload?.unit as string) || "Unknown";
    counts[topic] = (counts[topic] || 0) + 1;
  }

  // Sort by count descending
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({ topic, count }));

  return sorted;
}
