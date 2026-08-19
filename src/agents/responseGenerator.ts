import { ChatGroq } from "@langchain/groq";
import { config } from "../config/env";

export async function generateResponse(
  question: string,
  history: { role: string; content: string }[],
  agentResults: string
) {
  const model = new ChatGroq({
    apiKey: config.groq.apiKey,
    model: config.groq.model,
  });

  const systemPrompt = `You are ExamPrep AI, an expert exam preparation assistant for IIIT Nagpur students.
You have been provided with raw data and results from various specialized agents (e.g., retriever, doubt_solver, weightage, predictor) in the "Agent Results" section.

Your job is to:
1. Synthesize this information into a clear, concise, and exam-focused final answer.
2. If multiple agents provided information (e.g., an explanation + PYQ frequency), combine them smoothly.
3. Preserve useful evidence and attach citations exactly as provided in the agent results (e.g., [Source X]).
4. Avoid unsupported claims or hallucinating information not present in the agent results.
5. If the agent results say they couldn't find information, tell the student clearly.

Agent Results:
${agentResults}
`;

  const messages = [
    ["system", systemPrompt],
    ...history.map((msg) => [msg.role, msg.content]),
    ["human", question],
  ];

  // @ts-ignore
  const response = await model.invoke(messages);

  return response.content as string;
}
