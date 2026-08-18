import dotenv from "dotenv";
import path from "path";

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ─── Helper ───────────────────────────────────────────────────────────────────

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[Config] Missing required environment variable: ${key}\n` +
        `  → Copy .env.example to .env and fill in the value.`
    );
  }
  return value.trim();
}

function optional(key: string, defaultValue: string): string {
  return (process.env[key] || defaultValue).trim();
}

function optionalInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ─── Config Object ────────────────────────────────────────────────────────────

export const config = {
  // Server
  port: optionalInt("PORT", 3001),
  nodeEnv: optional("NODE_ENV", "development"),
  isDev: optional("NODE_ENV", "development") === "development",

  // LLM
  groq: {
    apiKey: required("GROQ_API_KEY"),
    model: optional("GROQ_MODEL", "llama-3.3-70b-versatile"),
  },

  // LangSmith tracing (optional — gracefully degraded if missing)
  langsmith: {
    enabled: optional("LANGCHAIN_TRACING_V2", "false") === "true",
    apiKey: process.env.LANGCHAIN_API_KEY || "",
    project: optional("LANGCHAIN_PROJECT", "examprep-ai"),
  },

  // Redis
  redis: {
    url: optional("REDIS_URL", "redis://localhost:6379"),
    ttl: {
      answers: optionalInt("CACHE_TTL_ANSWERS", 3600),       // 1 hour
      weightage: optionalInt("CACHE_TTL_WEIGHTAGE", 86400),  // 24 hours
      predictions: optionalInt("CACHE_TTL_PREDICTIONS", 86400),
    },
  },

  // MongoDB
  mongodb: {
    uri: optional("MONGODB_URI", "mongodb://localhost:27017/examprep-ai"),
  },

  // Qdrant
  qdrant: {
    url: optional("QDRANT_URL", "http://localhost:6333"),
    apiKey: process.env.QDRANT_API_KEY || undefined,
    collection: optional("QDRANT_COLLECTION", "examprep_docs"),
  },

  // Application
  app: {
    subjects: optional("SUBJECTS", "DBMS,CN,OS,DSA,TOC,CD")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    ragTopK: optionalInt("RAG_TOP_K", 5),
  },
} as const;

export type Config = typeof config;
