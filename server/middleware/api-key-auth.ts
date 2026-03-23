import { Request, Response, NextFunction } from "express";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { db } from "../db";
import { apiKeys } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

/** Generate a new API key: returns { key, keyHash, prefix } */
export async function generateApiKey(): Promise<{
  key: string;
  keyHash: string;
  prefix: string;
}> {
  const key = `abs_${randomBytes(32).toString("hex")}`;
  const prefix = key.slice(0, 12);
  const hash = (
    (await scryptAsync(key, "api-key-salt", 64)) as Buffer
  ).toString("hex");
  return { key, keyHash: hash, prefix };
}

/** Hash a raw API key for comparison */
export async function hashApiKey(key: string): Promise<string> {
  return (
    (await scryptAsync(key, "api-key-salt", 64)) as Buffer
  ).toString("hex");
}

/** Middleware: checks Authorization: Bearer <key> header */
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // If already authenticated via session, skip
  if (req.session?.userId) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer abs_")) return next();

  try {
    const key = authHeader.slice(7);
    const hash = (
      (await scryptAsync(key, "api-key-salt", 64)) as Buffer
    ).toString("hex");

    // Find matching key that hasn't expired
    const [found] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, hash), gt(apiKeys.expiresAt, new Date())))
      .limit(1);

    if (!found) return res.status(401).json({ message: "Invalid API key" });

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, found.id));

    // Attach userId to session-like object
    (req as any).apiKeyUserId = found.userId;
    if (!req.session) (req as any).session = {};
    req.session.userId = found.userId;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid API key" });
  }
}
