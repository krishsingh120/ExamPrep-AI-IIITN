import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { subjectsRouter } from "./routes/subjects.routes";

export function createApp() {
  const app = express();

  // ─── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());

  // ─── CORS ──────────────────────────────────────────────────────────────────
  // In dev, allow all origins. In production, restrict to the deployed frontend.
  const allowedOrigins =
    config.isDev
      ? ["http://localhost:5173", "http://localhost:3000"]
      : (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (config.isDev || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // ─── Body Parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // ─── Routes ────────────────────────────────────────────────────────────────
  app.use("/api/v1", healthRouter);
  app.use("/api/v1", subjectsRouter);

  // Chat routes will be mounted in Phase 4+
  // app.use("/api/v1", chatRouter);

  // ─── 404 ───────────────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
    });
  });

  // ─── Global Error Handler ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[App Error]", err.message);
    res.status(500).json({
      success: false,
      error: config.isDev ? err.message : "Internal server error",
    });
  });

  return app;
}
