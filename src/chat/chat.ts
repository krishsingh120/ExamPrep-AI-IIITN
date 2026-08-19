import crypto from "crypto";
import { routeQuery } from "../agents/router";
import { retrieveAgent } from "../agents/retriever";
import { calculateWeightage } from "../agents/weightage";
import { predictAgent } from "../agents/predictor";
import { doubtSolverAgent } from "../agents/doubtSolver";
import { generateResponse } from "../agents/responseGenerator";
import { getCache, setCache, acquireLock, releaseLock } from "../cache/redis";
import { saveChat, getHistory } from "../db/chatHistory";

function normalizeQuery(query: string, subject?: string): string {
  const cleaned = query.toLowerCase().trim().replace(/\s+/g, " ");
  const hash = crypto.createHash("md5").update(cleaned).digest("hex");
  return `ans:${subject || "general"}:${hash}`;
}

export async function processChat(sessionId: string, question: string, requestedSubject?: string): Promise<string> {
  const cacheKey = normalizeQuery(question, requestedSubject);
  const lockKey = `lock:${sessionId}`;

  // 1. Check Cache
  const cachedAnswer = await getCache<string>(cacheKey);
  if (cachedAnswer) {
    return cachedAnswer;
  }

  // 2. Request Deduplication Lock
  const locked = await acquireLock(lockKey);
  if (!locked) {
    return "Please wait, I'm already processing your previous request.";
  }

  try {
    // 3. Fetch History
    const history = await getHistory(sessionId);
    // Limit history to last 5 messages to save tokens
    const recentHistory = history.slice(-5);

    // 4. Route Query
    const route = await routeQuery(question);
    // Use requested subject if router didn't pick one up, or prioritize router's subject
    const subject = route.subject || requestedSubject;

    // 5. Concurrent Agent Execution
    const agentTasks: Promise<string>[] = [];

    for (const agent of route.requiredAgents) {
      if (agent === "retriever") {
        agentTasks.push(retrieveAgent(question, subject, recentHistory).then(res => `[Retriever Results]:\n${res}`));
      } else if (agent === "doubt_solver") {
        agentTasks.push(doubtSolverAgent(question, subject, recentHistory).then(res => `[Doubt Solver Results]:\n${res}`));
      } else if (agent === "weightage") {
        agentTasks.push(calculateWeightage(subject || "").then(w => {
          if (w.length === 0) return "[Weightage Results]: No PYQ data found.";
          return `[Weightage Results]:\n${w.map(x => `- ${x.topic}: ${x.count}`).join("\n")}`;
        }));
      } else if (agent === "predictor") {
        agentTasks.push(predictAgent(subject || "").then(res => `[Predictor Results]:\n${res}`));
      }
    }

    if (agentTasks.length === 0) {
      agentTasks.push(retrieveAgent(question, subject, recentHistory).then(res => `[Retriever Results]:\n${res}`));
    }

    const results = await Promise.all(agentTasks);
    const combinedResults = results.join("\n\n");

    // 6. Response Generation
    const finalAnswer = await generateResponse(question, recentHistory, combinedResults);

    // 7. Cache the final answer
    await setCache(cacheKey, finalAnswer, 3600);

    // 8. Save Chat History
    saveChat(sessionId, [
      { role: "user", content: question },
      { role: "assistant", content: finalAnswer },
    ]).catch(console.error);

    return finalAnswer;
  } catch (error) {
    console.error("[Chat] Error processing chat:", error);
    return "Sorry, I encountered an error while processing your request.";
  } finally {
    await releaseLock(lockKey);
  }
}
