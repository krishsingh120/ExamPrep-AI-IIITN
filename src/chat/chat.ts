import { routeQuery } from "../agents/router";
import { retrieveAgent } from "../agents/retriever";
import { calculateWeightage } from "../agents/weightage";
import { predictAgent } from "../agents/predictor";
import { doubtSolverAgent } from "../agents/doubtSolver";
import { getCache, setCache, acquireLock, releaseLock } from "../cache/redis";
import { saveChat } from "../db/chatHistory";

export async function processChat(sessionId: string, question: string): Promise<string> {
  const cacheKey = `ans:${sessionId}:${question}`;
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
    // 3. Route Query
    const route = await routeQuery(question);
    
    // 4. Agent Execution (Simple Routing)
    let answer = "";
    
    if (route.intent === "predict" && route.subject) {
      // Predictor internally calls weightage
      answer = await predictAgent(route.subject);
    } else if (route.intent === "weightage" && route.subject) {
      const weightage = await calculateWeightage(route.subject);
      answer = weightage.length > 0
        ? `Here is the topic weightage for ${route.subject}:\n${weightage.map(w => `- ${w.topic}: ${w.count}`).join("\n")}`
        : `No PYQ data found for ${route.subject}.`;
    } else if (route.intent === "doubt") {
      answer = await doubtSolverAgent(question, route.subject);
    } else {
      // Default to retriever
      answer = await retrieveAgent(question, route.subject);
    }

    // 5. Cache the final answer
    await setCache(cacheKey, answer, 3600);

    // 6. Save Chat History
    // Fire and forget
    saveChat(sessionId, [
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ]).catch(console.error);

    return answer;
  } catch (error) {
    console.error("[Chat] Error processing chat:", error);
    return "Sorry, I encountered an error while processing your request.";
  } finally {
    await releaseLock(lockKey);
  }
}
