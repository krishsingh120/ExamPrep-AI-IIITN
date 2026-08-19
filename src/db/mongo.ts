import mongoose from "mongoose";
import { config } from "../config/env";

export async function connectMongo() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("[MongoDB] Connected successfully");
  } catch (err) {
    console.error("[MongoDB] Connection error:", err);
    throw err;
  }
}
