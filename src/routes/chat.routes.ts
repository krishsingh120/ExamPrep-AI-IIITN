import { Router, Request, Response } from "express";
import { processChat } from "../chat/chat";
import { getHistory } from "../db/chatHistory";

export const chatRouter = Router();

chatRouter.post("/chat", async (req: Request, res: Response): Promise<any> => {
  const { sessionId, subject, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({
      success: false,
      error: "sessionId and message are required",
    });
  }

  try {
    const answer = await processChat(sessionId, message, subject);
    res.status(200).json({
      success: true,
      answer,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

chatRouter.get("/chat/:sessionId", async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  try {
    const messages = await getHistory(sessionId);
    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
