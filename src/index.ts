import { config } from "./config/env";
import { app } from "./app";
import { connectMongo } from "./db/mongo";

async function start() {
  await connectMongo();

  const server = app.listen(config.port, () => {
    console.log(`\n🚀 ExamPrep AI Backend`);
    console.log(`   Env:    ${config.nodeEnv}`);
    console.log(`   Port:   http://localhost:${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/api/v1/health\n`);
  });

  // Graceful Shutdown
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
}

start().catch(err => {
  console.error("Failed to start server", err);
  process.exit(1);
});

// Unhandled Rejections / Exceptions
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
  if (!config.isDev) process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught Exception:", err);
  process.exit(1);
});
