import { config } from "./config/env";
import { createApp } from "./app";

async function main() {
  try {
    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`\n🚀 ExamPrep AI Backend`);
      console.log(`   Env:    ${config.nodeEnv}`);
      console.log(`   Port:   http://localhost:${config.port}`);
      console.log(`   Health: http://localhost:${config.port}/api/v1/health\n`);
    });

    // ─── Graceful Shutdown ─────────────────────────────────────────────────
    const shutdown = (signal: string) => {
      console.log(`\n[Server] Received ${signal} — shutting down gracefully...`);
      server.close(() => {
        console.log("[Server] HTTP server closed.");
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown stalls
      setTimeout(() => {
        console.error("[Server] Forced exit after timeout.");
        process.exit(1);
      }, 10_000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // ─── Unhandled Rejections ──────────────────────────────────────────────
    process.on("unhandledRejection", (reason, promise) => {
      console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
      // Don't crash in dev; crash in production so the process manager restarts
      if (!config.isDev) process.exit(1);
    });

    process.on("uncaughtException", (err) => {
      console.error("[Server] Uncaught Exception:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("[Server] Failed to start:", err);
    process.exit(1);
  }
}

main();
