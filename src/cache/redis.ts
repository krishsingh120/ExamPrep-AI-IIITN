import Redis from "ioredis";
import { config } from "../config/env";

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => {
  console.error("[Redis Error]", err.message);
});

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`[Redis] Error getting cache for key ${key}`, err);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error(`[Redis] Error setting cache for key ${key}`, err);
  }
}

export async function acquireLock(key: string, ttlSeconds: number = 10): Promise<boolean> {
  try {
    const result = await redis.set(`lock:${key}`, "locked", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch (err) {
    console.error(`[Redis] Error acquiring lock for key ${key}`, err);
    return false;
  }
}

export async function releaseLock(key: string): Promise<void> {
  try {
    await redis.del(`lock:${key}`);
  } catch (err) {
    console.error(`[Redis] Error releasing lock for key ${key}`, err);
  }
}
