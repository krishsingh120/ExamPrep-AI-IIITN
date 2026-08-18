import { Router, Request, Response } from "express";
import { config } from "../config/env";

export const subjectsRouter = Router();

// Subject metadata — will be derived from ingested document metadata in Phase 2+
// For now, this is the canonical list for IIITN exam prep
const SUBJECT_DETAILS: Record<
  string,
  { name: string; fullName: string; semester: number }
> = {
  DBMS: {
    name: "DBMS",
    fullName: "Database Management Systems",
    semester: 4,
  },
  CN: {
    name: "CN",
    fullName: "Computer Networks",
    semester: 5,
  },
  OS: {
    name: "OS",
    fullName: "Operating Systems",
    semester: 4,
  },
  DSA: {
    name: "DSA",
    fullName: "Data Structures & Algorithms",
    semester: 3,
  },
  TOC: {
    name: "TOC",
    fullName: "Theory of Computation",
    semester: 5,
  },
  CD: {
    name: "CD",
    fullName: "Compiler Design",
    semester: 6,
  },
};

// GET /api/v1/subjects
// Returns the list of subjects configured for this deployment.
// The `SUBJECTS` env var controls which subjects are active.
subjectsRouter.get("/subjects", (_req: Request, res: Response) => {
  const subjects = config.app.subjects
    .map((code) => SUBJECT_DETAILS[code] || { name: code, fullName: code, semester: 0 })
    .filter(Boolean);

  res.status(200).json({
    success: true,
    count: subjects.length,
    subjects,
  });
});
