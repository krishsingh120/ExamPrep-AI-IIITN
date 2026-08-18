import { Router, Request, Response } from "express";

export const healthRouter = Router();

// GET /api/v1/health
// Returns the current service status. Each service connection status is
// reported individually so that we can identify which component is unhealthy.
// Connections will be upgraded to real status checks in later phases when
// Redis, MongoDB, and Qdrant clients are initialized.
healthRouter.get("/health", (_req: Request, res: Response) => {
  const status = {
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    services: {
      // These will be wired to real connection checks in Phase 2+
      mongodb: "not_initialized",
      redis: "not_initialized",
      qdrant: "not_initialized",
    },
  };

  res.status(200).json(status);
});
