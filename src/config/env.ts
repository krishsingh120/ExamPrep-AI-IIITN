import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",

  // LLM
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  },

  // LangSmith tracing
  langsmith: {
    enabled: process.env.LANGCHAIN_TRACING_V2 === "true",
    apiKey: process.env.LANGCHAIN_API_KEY || "",
    project: process.env.LANGCHAIN_PROJECT || "examprep-ai",
  },

  // Redis
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  redisTtl: {
    answers: Number(process.env.CACHE_TTL_ANSWERS) || 3600,
    weightage: Number(process.env.CACHE_TTL_WEIGHTAGE) || 86400,
    predictions: Number(process.env.CACHE_TTL_PREDICTIONS) || 86400,
  },

  // MongoDB
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/examprep-ai",

  // Qdrant
  qdrant: {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
    collection: process.env.QDRANT_COLLECTION || "examprep_docs",
  },

  // App settings
  subjects: (process.env.SUBJECTS || "DBMS,CN,OS,DSA,TOC,CD")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  ragTopK: Number(process.env.RAG_TOP_K) || 5,
};
