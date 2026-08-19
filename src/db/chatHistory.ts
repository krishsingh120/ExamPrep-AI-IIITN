import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    messages: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export async function saveChat(sessionId: string, messages: { role: string; content: string }[]) {
  try {
    await ChatHistory.findOneAndUpdate(
      { sessionId },
      { $push: { messages: { $each: messages } } },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("[MongoDB] Error saving chat history:", err);
  }
}

export async function getHistory(sessionId: string) {
  try {
    const chat = await ChatHistory.findOne({ sessionId }).lean();
    return chat ? chat.messages : [];
  } catch (err) {
    console.error("[MongoDB] Error getting chat history:", err);
    return [];
  }
}
