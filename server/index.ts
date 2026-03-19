import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { checkDatabaseConnection, closeDatabasePool } from "./db";
import { env, isProduction } from "./config";

const app = express();
const httpServer = createServer(app);
const startedAt = Date.now();

app.disable("x-powered-by");

if (isProduction) {
  app.set("trust proxy", 1);
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function originIsAllowed(origin?: string): boolean {
  if (!origin) return true;
  return env.CORS_ALLOWED_ORIGINS.includes(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && originIsAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-csrf-token",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.append("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    if (origin && !originIsAllowed(origin)) {
      return res.status(403).json({ message: "Origin not allowed" });
    }

    return res.sendStatus(204);
  }

  return next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.get("/health", async (_req, res) => {
  const dbStatus = await checkDatabaseConnection();
  const healthy = dbStatus.ok;

  res
    .status(healthy ? 200 : 503)
    .json({
      status: healthy ? "ok" : "degraded",
      service: "adaptive-business-suite-backend",
      environment: env.NODE_ENV,
      database: healthy ? "up" : "down",
      aiProvider: env.AI_PROVIDER,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    });
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

async function shutdown(signal: string) {
  log(`received ${signal}, closing server`, "shutdown");

  httpServer.close(async (serverError) => {
    if (serverError) {
      console.error("[shutdown] HTTP server close failed:", serverError);
    }

    try {
      await closeDatabasePool();
    } catch (dbError) {
      console.error("[shutdown] database pool close failed:", dbError);
    } finally {
      process.exit(serverError ? 1 : 0);
    }
  });
}

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

async function startServer() {
  const dbStatus = await checkDatabaseConnection();
  if (!dbStatus.ok) {
    throw dbStatus.error;
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err?.code === "EBADCSRFTOKEN") {
      if (res.headersSent) {
        return next(err);
      }

      return res
        .status(403)
        .json({ message: "Invalid or missing CSRF token" });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(
      {
        port: env.PORT,
        host: env.HOST,
      },
      resolve,
    );
  });

  log(`serving on ${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
}

startServer().catch(async (error) => {
  console.error("[startup] failed to boot:", error);

  try {
    await closeDatabasePool();
  } catch (dbError) {
    console.error("[startup] failed to close database pool:", dbError);
  }

  process.exit(1);
});
