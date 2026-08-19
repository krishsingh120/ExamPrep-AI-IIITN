import { ChatGroq } from "@langchain/groq";
import { config } from "../config/env";
import { calculateWeightage } from "./weightage";

export async function predictAgent(subject: string) {
  // 1. Get weightage data
  const weightage = await calculateWeightage(subject);

  if (weightage.length === 0) {
    return "I don't have enough PYQ data to make predictions for this subject.";
  }

  // 2. Prepare data for the LLM
  const weightageText = weightage
    .map((w) => `- ${w.topic}: ${w.count} times`)
    .join("\n");

  // 3. Generate prediction
  const model = new ChatGroq({
    apiKey: config.groq.apiKey,
    model: config.groq.model,
  });

  const systemPrompt = `You are an ExamPrep AI predictor for IIIT Nagpur.
Based on the historical PYQ frequency data provided below, predict the most important topics the student should focus on.
Clearly state that these are trend-based predictions and NOT guaranteed exam questions.
Be concise and actionable.

PYQ Frequency Data for ${subject}:
${weightageText}`;

  const response = await model.invoke([
    ["system", systemPrompt],
    ["human", "What should I study for my upcoming exam?"],
  ]);

  return response.content as string;
}
