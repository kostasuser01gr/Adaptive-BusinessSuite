import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { env } from "./config";

const spaFallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "test" ? 10_000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many page requests, please try again later." },
});

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.get("/{*path}", spaFallbackLimiter, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
