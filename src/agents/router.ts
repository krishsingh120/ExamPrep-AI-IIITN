import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { config } from "../config/env";

export type Agent = "retriever" | "weightage" | "predictor" | "doubt_solver";

const routeSchema = z.object({
  intent: z.enum(["doubt", "weightage", "predict", "general"]),
  subject: z.string().optional().describe("The subject code, e.g., DBMS, CN, OS, DSA, TOC, CD"),
  topic: z.string().optional().describe("The specific topic or concept being asked about"),
  requiredAgents: z.array(z.enum(["retriever", "weightage", "predictor", "doubt_solver"]))
    .describe("List of agents needed to fulfill the request"),
});

export async function routeQuery(question: string) {
  const model = new ChatGroq({
    apiKey: config.groq.apiKey,
    model: config.groq.model,
    temperature: 0,
  });

  const structuredModel = model.withStructuredOutput(routeSchema as any, {
    name: "route_query",
  });

  const systemPrompt = `You are a query router for an ExamPrep AI assistant at IIIT Nagpur.
Your job is to analyze the student's question and determine the intent, subject, topic, and required agents.

Available Agents:
- "retriever": Use this to fetch factual information from the course syllabus, PYQs, slides, or class notes.
- "weightage": Use this when the student asks about the frequency or importance of a topic in PYQs.
- "predictor": Use this when the student asks for likely exam questions or predictions.
- "doubt_solver": Use this when the student asks a conceptual doubt that requires step-by-step explanation.

Valid Subjects: ${config.subjects.join(", ")}

Respond with the structured JSON exactly as defined.`;

  const response = await structuredModel.invoke([
    ["system", systemPrompt],
    ["human", question],
  ]);

  return response;
}
