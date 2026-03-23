import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import csurf from "@dr.pogodin/csurf";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { storage } from "./storage";
import { pool, db } from "./db";
import {
  insertUserSchema,
  insertVehicleSchema,
  insertCustomerSchema,
  insertBookingSchema,
  insertTaskSchema,
  insertNoteSchema,
  insertAutomationSchema,
  insertInspectionSchema,
  apiKeys,
  auditLog,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import MemoryStore from "memorystore";
import { buildNexusUltraPayload } from "./nexus-ultra";
import { processMessage, type AssistantContext } from "./model/index.js";
import { emitEvent, eventBus, EventTypes } from "./events";
import { ontologies, defaultOntology } from "@shared/ontologies";
import { calculateYield } from "./services/yield";
import { analyticsEngine } from "./services/analytics";
import { anomalyDetector } from "./services/anomaly-detector";
import { processInspection } from "./services/vision";
import { env } from "./config";
import { appCache, CacheTTL } from "./services/cache";
import { queryOptimizer } from "./services/query-optimizer";
import { jobQueue } from "./services/job-queue";
import { checkPermission, requireAdmin } from "./middleware/permissions";
import { Permission } from "@shared/permissions";
import { parsePagination, paginateArray } from "./middleware/pagination";
import { upload, fileToUploadedFile, deleteUploadedFile } from "./services/file-upload";
import { generateApiKey, hashApiKey, apiKeyAuth } from "./middleware/api-key-auth";
import { sessionManager } from "./services/session-manager";

function getAuthBucketKey(req: Request): string {
  const ipKey = ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "");
  const username =
    typeof req.body?.username === "string"
      ? req.body.username.trim().toLowerCase()
      : "";

  return username ? `${ipKey}:${username}` : ipKey;
}

const makeLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === "test" ? 10000 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: getAuthBucketKey,
    message: { message: "Too many requests, please try again later." },
  });
const registerLimiter = makeLimiter();
const loginLimiter = makeLimiter();
const csrfProtection = csurf();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hashed, "hex");
  if (buf.length !== storedBuf.length) return false;
  return timingSafeEqual(buf, storedBuf);
}

const SessionStore = MemoryStore(session);
const PostgresSessionStore = connectPgSimple(session);

async function ensureSessionStoreTable() {
  if (env.NODE_ENV === "test") {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      sid varchar NOT NULL PRIMARY KEY,
      sess json NOT NULL,
      expire timestamp(6) NOT NULL
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS user_sessions_expire_idx
    ON user_sessions (expire)
  `);
}

function createSessionStore() {
  if (env.NODE_ENV === "test") {
    return new SessionStore({ checkPeriod: 86_400_000 });
  }

  return new PostgresSessionStore({
    pool,
    tableName: "user_sessions",
  });
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId)
    return res.status(401).json({ message: "Not authenticated" });
  next();
}

function getRouteParam(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function toDateOrNull(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (isNaN(d.getTime()))
    throw Object.assign(new Error(`Invalid date value: ${value}`), {
      status: 400,
    });
  return d;
}

type UserMode = "rental" | "personal" | "professional" | "custom";

const defaultModulesByOntology: Record<string, any[]> = {
  rental: [
    { type: "daily-overview", title: "Daily Overview", w: "4", h: "1" },
    {
      type: "kpi",
      title: "Active Rentals",
      w: "1",
      h: "1",
      data: { value: "0", label: "Vehicles out", icon: "car", color: "blue" },
    },
    { type: "fleet", title: "Fleet Status", w: "2", h: "2" },
    { type: "bookings", title: "Recent Bookings", w: "2", h: "2" },
    { type: "tasks", title: "Priority Tasks", w: "2", h: "1" },
  ],
  personal: [
    { type: "daily-overview", title: "Personal Overview", w: "4", h: "1" },
    { type: "notes", title: "Quick Notes", w: "2", h: "2" },
    { type: "tasks", title: "To-Do List", w: "2", h: "2" },
    {
      type: "kpi",
      title: "Budget",
      w: "1",
      h: "1",
      data: { value: "€0", label: "Monthly", icon: "wallet", color: "green" },
    },
  ],
  professional: [
    { type: "daily-overview", title: "Work Dashboard", w: "4", h: "1" },
    { type: "tasks", title: "Priority Tasks", w: "2", h: "2" },
    {
      type: "kpi",
      title: "CRM Status",
      w: "1",
      h: "1",
      data: { value: "0", label: "Total CRM", icon: "users", color: "purple" },
    },
    { type: "notes", title: "Knowledge Base", w: "2", h: "2" },
  ],
};

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await ensureSessionStoreTable();

  app.use(
    session({
      name: env.SESSION_COOKIE_NAME,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      proxy: env.NODE_ENV === "production",
      unset: "destroy",
      store: createSessionStore(),
      cookie: {
        maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: env.SESSION_COOKIE_SAME_SITE,
        secure: env.SESSION_COOKIE_SECURE,
        ...(env.SESSION_COOKIE_DOMAIN
          ? { domain: env.SESSION_COOKIE_DOMAIN }
          : {}),
      },
    }),
  );
  // API key auth runs before CSRF — API key requests don't carry CSRF tokens
  app.use(apiKeyAuth);
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for API-key-authenticated requests
    if ((req as any).apiKeyUserId) return next();
    return csrfProtection(req, res, next);
  });

  app.get("/api/auth/csrf", (req: Request, res: Response) => {
    return res.json({ csrfToken: req.csrfToken() });
  });

  // ── Auth ──
  app.post(
    "/api/auth/register",
    registerLimiter,
    async (req: Request, res: Response) => {
      try {
        const body = insertUserSchema.parse(req.body);
        const existing = await storage.getUserByUsername(body.username);
        if (existing)
          return res.status(400).json({ message: "Username already taken" });
        const user = await storage.createUser({
          ...body,
          password: await hashPassword(body.password),
        });
        req.session.userId = user.id;

        const ontologyId = user.mode || "rental";
        await storage.createWorkspace({
          name: `${user.displayName || user.username}'s Workspace`,
          ownerId: user.id,
          type: ontologyId,
          activeOntology: ontologyId,
          settings: null,
          modelConfig: null,
        });

        const seedModules =
          defaultModulesByOntology[ontologyId] ||
          defaultModulesByOntology.rental;
        for (const m of seedModules) {
          await storage.createModule({
            userId: user.id,
            type: m.type,
            title: m.title,
            w: m.w,
            h: m.h,
            data: m.data || null,
            position: 0,
            visible: true,
            workspaceId: null,
          });
        }

        await storage.createChatMessage({
          userId: user.id,
          role: "assistant",
          content:
            "Welcome to Nexus OS! I am your adaptive workspace assistant.",
          actions: ["Setup my dashboard", "Explain ontologies"],
          metadata: null,
          workspaceId: null,
        });
        sessionManager.track(
          req.sessionID,
          user.id,
          req.ip || "unknown",
          req.headers["user-agent"] || "",
        );
        const { password, ...safe } = user;
        return res.json(safe);
      } catch (e: any) {
        return res.status(400).json({ message: e.message || "Invalid input" });
      }
    },
  );

  app.post(
    "/api/auth/login",
    loginLimiter,
    async (req: Request, res: Response) => {
      const { username, password } = req.body;
      if (!username || !password)
        return res
          .status(400)
          .json({ message: "Username and password required" });
      const user = await storage.getUserByUsername(username);
      if (!user || !(await verifyPassword(password, user.password)))
        return res.status(401).json({ message: "Invalid credentials" });
      req.session.userId = user.id;
      sessionManager.track(
        req.sessionID,
        user.id,
        req.ip || req.socket.remoteAddress || "unknown",
        req.headers["user-agent"] || "unknown",
      );
      const { password: _, ...safe } = user;
      return res.json(safe);
    },
  );

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.clearCookie(env.SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: env.SESSION_COOKIE_SAME_SITE,
        secure: env.SESSION_COOKIE_SECURE,
        ...(env.SESSION_COOKIE_DOMAIN
          ? { domain: env.SESSION_COOKIE_DOMAIN }
          : {}),
      });
      return res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) return res.json(null);
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      delete req.session.userId;
      return res.json(null);
    }
    const { password, ...safe } = user;
    return res.json(safe);
  });

  // ── User Settings ──
  app.patch(
    "/api/user/mode",
    requireAuth,
    async (req: Request, res: Response) => {
      const { mode } = req.body;
      if (!ontologies[mode])
        return res.status(400).json({ message: "Invalid ontology" });
      const userId = req.session.userId!;
      await storage.updateUser(userId, { mode } as any);
      await storage.deleteAllModulesByUser(userId);
      const created = [];
      const seedModules =
        defaultModulesByOntology[mode] || defaultModulesByOntology.rental;
      for (const m of seedModules) {
        const c = await storage.createModule({
          userId,
          type: m.type,
          title: m.title,
          w: m.w,
          h: m.h,
          data: m.data || null,
          position: 0,
          visible: true,
          workspaceId: null,
        });
        created.push(c);
      }
      emitEvent(userId, null, EventTypes.ENTITY_UPDATED, {
        entityType: "user",
        entityId: userId,
        data: { mode },
      });
      const user = await storage.getUser(userId);
      return res.json({ user, modules: created });
    },
  );

  app.patch(
    "/api/user/preferences",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const user = await storage.updateUser(userId, {
        preferences: req.body,
      } as any);
      return res.json(user);
    },
  );

  // ── Sync ──
  app.get("/api/sync", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const sinceParam = req.query.since as string;
    const since = sinceParam ? new Date(sinceParam) : new Date(0);
    if (isNaN(since.getTime()))
      return res.status(400).json({ message: "Invalid since timestamp" });
    const data = await storage.getSyncData(userId, since);
    return res.json(data);
  });

  // ── Modules ──
  app.get("/api/modules", requireAuth, async (req: Request, res: Response) => {
    const mods = await storage.getModulesByUser(req.session.userId!);
    return res.json(mods);
  });

  app.post("/api/modules", requireAuth, async (req: Request, res: Response) => {
    const mod = await storage.createModule({
      userId: req.session.userId!,
      type: req.body.type || "generic",
      title: req.body.title || "New Module",
      w: String(req.body.w || "1"),
      h: String(req.body.h || "1"),
      data: req.body.data || null,
      position: req.body.position || 0,
      visible: true,
      workspaceId: null,
    });
    return res.json(mod);
  });

  app.patch(
    "/api/modules/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      const mod = await storage.updateModule(id, req.body);
      return res.json(mod);
    },
  );

  app.delete(
    "/api/modules/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      await storage.deleteModule(id);
      return res.json({ ok: true });
    },
  );

  // ── Chat / Assistant ──
  app.get("/api/chat", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getChatMessages(req.session.userId!));
  });

  app.post("/api/chat", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const { content, source = "text" } = req.body;
    if (!content) return res.status(400).json({ message: "Content required" });
    if (typeof content !== "string" || content.length > 4000)
      return res
        .status(400)
        .json({ message: "Message too long (max 4000 characters)" });

    await storage.createChatMessage({
      userId,
      role: "user",
      content,
      actions: null,
      metadata: { source },
      workspaceId: null,
    });

    const existingModules = await storage.getModulesByUser(userId);
    const moduleTypes = existingModules.map((m) => m.type);
    const user = await storage.getUser(userId);
    const context: AssistantContext = {
      userId,
      mode: user?.mode || "rental",
      moduleTypes,
    };
    const result = await processMessage(content, context, source);

    let newModules: any[] = [];
    if (result.clearDashboard) {
      await storage.deleteAllModulesByUser(userId);
    }
    if (result.switchMode) {
      const nextMode = result.switchMode as UserMode;
      await storage.updateUser(userId, { mode: result.switchMode } as any);
      await storage.deleteAllModulesByUser(userId);
      const seedModules =
        defaultModulesByOntology[nextMode] || defaultModulesByOntology.rental;
      for (const m of seedModules) {
        const c = await storage.createModule({
          userId,
          type: m.type,
          title: m.title,
          w: m.w,
          h: m.h,
          data: m.data || null,
          position: 0,
          visible: true,
          workspaceId: null,
        });
        newModules.push(c);
      }
    }
    if (result.moduleToAdd) {
      const m = result.moduleToAdd;
      const c = await storage.createModule({
        userId,
        type: m.type,
        title: m.title,
        w: m.w,
        h: m.h,
        data: m.data || null,
        position: 0,
        visible: true,
        workspaceId: null,
      });
      newModules.push(c);
    }
    if (result.memoryUpdate) {
      await storage.setMemory(
        userId,
        result.memoryUpdate.key,
        result.memoryUpdate.value,
      );
    }

    const assistantMsg = await storage.createChatMessage({
      userId,
      role: "assistant",
      content: result.response,
      actions: result.actions,
      metadata: null,
      workspaceId: null,
    });
    return res.json({
      assistantMessage: assistantMsg,
      newModules,
      switchedMode: result.switchMode,
      clearedDashboard: result.clearDashboard,
      proposedAction: result.proposedAction,
      workflow: result.workflow,
      generativeUI: result.generativeUI,
    });
  });

  // ── Mutations / Actions Apply ──
  app.post(
    "/api/actions/apply",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const { action } = req.body;
      if (!action || !action.type)
        return res.status(400).json({ message: "Invalid action" });

      try {
        let result: any = null;
        let entityType = action.type.split("-")[1];
        switch (action.type) {
          case "create-vehicle":
            const vData = insertVehicleSchema.parse({
              ...action.payload,
              userId,
            });
            result = await storage.createVehicle(vData);
            break;
          case "update-vehicle":
            result = await storage.updateVehicle(action.id, action.payload);
            break;
          case "create-customer":
            const cData = insertCustomerSchema.parse({
              ...action.payload,
              userId,
            });
            result = await storage.createCustomer(cData);
            break;
          case "create-booking":
            const bData = insertBookingSchema.parse({
              ...action.payload,
              userId,
              startDate: toDateOrNull(action.payload.startDate),
              endDate: toDateOrNull(action.payload.endDate),
            });
            result = await storage.createBooking(bData);
            break;
          case "create-task":
            const tData = insertTaskSchema.parse({
              ...action.payload,
              userId,
              dueDate: toDateOrNull(action.payload.dueDate),
            });
            result = await storage.createTask(tData);
            break;
          case "create-note":
            const nData = insertNoteSchema.parse({ ...action.payload, userId });
            result = await storage.createNote(nData);
            break;
          default:
            return res
              .status(400)
              .json({ message: `Unknown action type: ${action.type}` });
        }

        emitEvent(userId, null, EventTypes.ENTITY_CREATED, {
          entityType,
          entityId: result.id,
          data: result,
        });
        return res.json({ success: true, result });
      } catch (e: any) {
        return res.status(400).json({ message: e.message || "Action failed" });
      }
    },
  );

  // ── Notifications ──
  app.get(
    "/api/notifications",
    requireAuth,
    async (req: Request, res: Response) => {
      return res.json(await storage.getNotifications(req.session.userId!));
    },
  );
  app.patch(
    "/api/notifications/:id/read",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      await storage.markNotificationRead(id);
      return res.json({ ok: true });
    },
  );
  app.post(
    "/api/notifications/read-all",
    requireAuth,
    async (req: Request, res: Response) => {
      await storage.markAllNotificationsRead(req.session.userId!);
      return res.json({ ok: true });
    },
  );

  // ── Automations ──
  app.get(
    "/api/automations",
    requireAuth,
    async (req: Request, res: Response) => {
      return res.json(await storage.getAutomations(req.session.userId!));
    },
  );
  app.post(
    "/api/automations",
    requireAuth,
    async (req: Request, res: Response) => {
      const body = insertAutomationSchema.parse({
        ...req.body,
        userId: req.session.userId!,
      });
      return res.json(await storage.createAutomation(body));
    },
  );

  // ── Inspections (Vision AI) ──
  app.get(
    "/api/inspections",
    requireAuth,
    async (req: Request, res: Response) => {
      return res.json(await storage.getInspections(req.session.userId!));
    },
  );
  app.post(
    "/api/inspections",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const data = insertInspectionSchema.parse({
          ...req.body,
          userId: req.session.userId!,
          status: "processing",
        });
        const inspection = await storage.createInspection(data);
        processInspection(inspection.id, data.mediaUrls || []).catch((err) =>
          console.error("Vision processing failed:", err),
        );
        return res.json(inspection);
      } catch (e: any) {
        return res
          .status(400)
          .json({ message: e.message || "Invalid inspection data" });
      }
    },
  );

  // ── Audit Export ──
  app.get(
    "/api/audit/export",
    requireAuth,
    async (req: Request, res: Response) => {
      const actions = await storage.getActions(req.session.userId!, 1000);
      const csv = [
        "ID,Timestamp,Actor,Action,Entity,Status,Description",
        ...actions.map(
          (a) =>
            `${a.id},${a.createdAt},${a.actorType},${a.actionType},${a.entityType},${a.status},"${a.description}"`,
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=nexus-audit-trail.csv",
      );
      return res.send(csv);
    },
  );

  // ── Vehicles ──
  app.get("/api/vehicles", requireAuth, async (req: Request, res: Response) => {
    const vehicles = await storage.getVehicles(req.session.userId!);
    const pagination = parsePagination(req);
    if (pagination) {
      // Apply search filter
      let filtered = vehicles;
      if (pagination.search) {
        const q = pagination.search.toLowerCase();
        filtered = vehicles.filter(
          (v) =>
            v.make?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q) ||
            v.plate?.toLowerCase().includes(q),
        );
      }
      return res.json(paginateArray(filtered, pagination));
    }
    return res.json(vehicles);
  });
  app.post(
    "/api/vehicles",
    requireAuth,
    async (req: Request, res: Response) => {
      const v = await storage.createVehicle({
        ...req.body,
        userId: req.session.userId!,
      });
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_CREATED, {
        entityType: "vehicle",
        entityId: v.id,
        data: v,
      });
      return res.json(v);
    },
  );
  app.patch(
    "/api/vehicles/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      const v = await storage.updateVehicle(id, req.body);
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_UPDATED, {
        entityType: "vehicle",
        entityId: id,
        data: v,
      });
      return res.json(v);
    },
  );
  app.delete(
    "/api/vehicles/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      await storage.deleteVehicle(id);
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_DELETED, {
        entityType: "vehicle",
        entityId: id,
      });
      return res.json({ ok: true });
    },
  );

  // ── Customers ──
  app.get(
    "/api/customers",
    requireAuth,
    async (req: Request, res: Response) => {
      return res.json(await storage.getCustomers(req.session.userId!));
    },
  );
  app.post(
    "/api/customers",
    requireAuth,
    async (req: Request, res: Response) => {
      const c = await storage.createCustomer({
        ...req.body,
        userId: req.session.userId!,
      });
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_CREATED, {
        entityType: "customer",
        entityId: c.id,
        data: c,
      });
      return res.json(c);
    },
  );
  app.patch(
    "/api/customers/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      const c = await storage.updateCustomer(id, req.body);
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_UPDATED, {
        entityType: "customer",
        entityId: id,
        data: c,
      });
      return res.json(c);
    },
  );
  app.delete(
    "/api/customers/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      await storage.deleteCustomer(id);
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_DELETED, {
        entityType: "customer",
        entityId: id,
      });
      return res.json({ ok: true });
    },
  );

  // ── Bookings ──
  app.get("/api/bookings", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getBookings(req.session.userId!));
  });
  app.post(
    "/api/bookings",
    requireAuth,
    async (req: Request, res: Response) => {
      const b = await storage.createBooking({
        ...req.body,
        userId: req.session.userId!,
        startDate: toDateOrNull(req.body.startDate),
        endDate: toDateOrNull(req.body.endDate),
      });
      if (req.body.vehicleId) {
        await storage.updateVehicle(req.body.vehicleId, { status: "rented" });
      }
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_CREATED, {
        entityType: "booking",
        entityId: b.id,
        data: b,
      });
      return res.json(b);
    },
  );
  app.patch(
    "/api/bookings/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      const existing = await storage.getBooking(id);
      if (!existing) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const updates = {
        ...req.body,
        ...(req.body.startDate !== undefined
          ? { startDate: toDateOrNull(req.body.startDate) }
          : {}),
        ...(req.body.endDate !== undefined
          ? { endDate: toDateOrNull(req.body.endDate) }
          : {}),
      };

      const booking = await storage.updateBooking(id, updates);
      const bookingVehicleId = booking?.vehicleId ?? existing.vehicleId;
      const bookingStatus = booking?.status ?? existing.status;

      if (bookingVehicleId) {
        if (bookingStatus === "completed" || bookingStatus === "cancelled") {
          await storage.updateVehicle(bookingVehicleId, {
            status: "available",
          });
        } else if (bookingStatus === "active") {
          await storage.updateVehicle(bookingVehicleId, {
            status: "rented",
          });
        }
      }

      emitEvent(req.session.userId!, null, EventTypes.ENTITY_UPDATED, {
        entityType: "booking",
        entityId: id,
        data: booking,
      });
      return res.json(booking);
    },
  );

  // ── Tasks ──
  app.get("/api/tasks", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getTasks(req.session.userId!));
  });
  app.post("/api/tasks", requireAuth, async (req: Request, res: Response) => {
    const t = await storage.createTask({
      ...req.body,
      userId: req.session.userId!,
      dueDate: toDateOrNull(req.body.dueDate),
    });
    emitEvent(req.session.userId!, null, EventTypes.ENTITY_CREATED, {
      entityType: "task",
      entityId: t.id,
      data: t,
    });
    return res.json(t);
  });
  app.patch(
    "/api/tasks/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      const task = await storage.updateTask(id, {
        ...req.body,
        ...(req.body.dueDate !== undefined
          ? { dueDate: toDateOrNull(req.body.dueDate) }
          : {}),
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      emitEvent(req.session.userId!, null, EventTypes.ENTITY_UPDATED, {
        entityType: "task",
        entityId: id,
        data: task,
      });
      return res.json(task);
    },
  );
  app.delete(
    "/api/tasks/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      await storage.deleteTask(id);
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_DELETED, {
        entityType: "task",
        entityId: id,
      });
      return res.json({ ok: true });
    },
  );

  // ── Notes ──
  app.get("/api/notes", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getNotes(req.session.userId!));
  });
  app.post("/api/notes", requireAuth, async (req: Request, res: Response) => {
    const note = await storage.createNote({
      ...req.body,
      userId: req.session.userId!,
    });
    emitEvent(req.session.userId!, null, EventTypes.ENTITY_CREATED, {
      entityType: "note",
      entityId: note.id,
      data: note,
    });
    return res.json(note);
  });
  app.patch(
    "/api/notes/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      const note = await storage.updateNote(id, req.body);

      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      emitEvent(req.session.userId!, null, EventTypes.ENTITY_UPDATED, {
        entityType: "note",
        entityId: id,
        data: note,
      });
      return res.json(note);
    },
  );
  app.delete(
    "/api/notes/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      await storage.deleteNote(id);
      emitEvent(req.session.userId!, null, EventTypes.ENTITY_DELETED, {
        entityType: "note",
        entityId: id,
      });
      return res.json({ ok: true });
    },
  );

  // ── Dashboard Stats ──
  app.get("/api/stats", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const [
      vehiclesList,
      bookingsList,
      tasksList,
      customersList,
      maintenanceList,
      actions,
    ] = await Promise.all([
      storage.getVehicles(userId),
      storage.getBookings(userId),
      storage.getTasks(userId),
      storage.getCustomers(userId),
      storage.getMaintenanceRecords(userId),
      storage.getActions(userId),
    ]);
    const available = vehiclesList.filter(
      (v) => v.status === "available",
    ).length;
    const rented = vehiclesList.filter((v) => v.status === "rented").length;
    const inMaintenance = vehiclesList.filter(
      (v) => v.status === "maintenance",
    ).length;
    const activeBookings = bookingsList.filter(
      (b) => b.status === "active",
    ).length;

    const completedBookings = bookingsList.filter(
      (b) => b.status === "completed",
    );
    const totalRevenue = completedBookings.reduce(
      (sum, b) => sum + parseFloat(b.totalAmount || "0"),
      0,
    );
    const totalCost = maintenanceList.reduce(
      (sum, m) => sum + parseFloat(m.cost || "0"),
      0,
    );

    const yieldInsights = calculateYield(vehiclesList.length, rented);
    const profitability = (totalRevenue - totalCost).toFixed(2);

    return res.json({
      fleet: {
        total: vehiclesList.length,
        available,
        rented,
        maintenance: inMaintenance,
      },
      bookings: {
        total: bookingsList.length,
        active: activeBookings,
        pending: bookingsList.filter((b) => b.status === "pending").length,
      },
      tasks: {
        total: tasksList.length,
        pending: tasksList.filter((t) => t.status === "todo").length,
        done: tasksList.filter((t) => t.status === "done").length,
      },
      customers: { total: customersList.length },
      maintenance: {
        pending: maintenanceList.filter((m) => m.status === "scheduled").length,
      },
      revenue: {
        total: totalRevenue,
        mtd: totalRevenue,
        profitability,
        revpar: yieldInsights.recommendedMultiplier.toString(),
      },
      utilization: yieldInsights.utilization,
      yield: yieldInsights,
      auditCount: actions.length,
    });
  });

  // ── NEXUS ULTRA ──
  app.get(
    "/api/nexus-ultra",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const payload = await appCache.getOrSet(
        `nexus-ultra:${userId}`,
        async () => {
          const [vehicles, actions, maintenance] = await Promise.all([
            storage.getVehicles(userId),
            storage.getActions(userId),
            storage.getMaintenanceRecords(userId),
          ]);

          const healthScore = Math.max(
            0,
            100 - maintenance.filter((m) => m.status === "scheduled").length * 5,
          );
          const compliancePercentage = Math.min(100, 80 + actions.length / 5);

          return buildNexusUltraPayload({
            vehicleCount: vehicles.length,
            auditCount: actions.length,
            healthScore,
            compliancePercentage,
          });
        },
        CacheTTL.LONG,
      );

      return res.json(payload);
    },
  );

  // ── Financial Analytics ──
  app.get(
    "/api/analytics/financial",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const data = await appCache.getOrSet(
        `financial:${userId}`,
        async () => {
          const [bookingsList, maintenanceList] = await Promise.all([
            storage.getBookings(userId),
            storage.getMaintenanceRecords(userId),
          ]);

          const completedBookings = bookingsList.filter(
            (b) => b.status === "completed",
          );
          const totalRevenue = completedBookings.reduce(
            (sum, b) => sum + parseFloat(b.totalAmount || "0"),
            0,
          );
          const totalExpenses = maintenanceList.reduce(
            (sum, m) => sum + parseFloat(m.cost || "0"),
            0,
          );

          // Generate monthly revenue data from bookings
          const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
          const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
          ];

          for (const booking of completedBookings) {
            const d = booking.endDate ? new Date(booking.endDate) : new Date(booking.createdAt!);
            const key = months[d.getMonth()] || "Jan";
            const entry = monthlyMap.get(key) || { revenue: 0, expenses: 0 };
            entry.revenue += parseFloat(booking.totalAmount || "0");
            monthlyMap.set(key, entry);
          }

          for (const maint of maintenanceList) {
            const d = maint.completedDate
              ? new Date(maint.completedDate)
              : new Date(maint.createdAt!);
            const key = months[d.getMonth()] || "Jan";
            const entry = monthlyMap.get(key) || { revenue: 0, expenses: 0 };
            entry.expenses += parseFloat(maint.cost || "0");
            monthlyMap.set(key, entry);
          }

          const monthlyRevenue = months.map((month) => {
            const entry = monthlyMap.get(month) || { revenue: 0, expenses: 0 };
            return {
              month,
              revenue: Math.round(entry.revenue * 100) / 100,
              trend: Math.round(entry.revenue * 0.9 * 100) / 100,
            };
          });

          const profitMargins = months.map((month) => {
            const entry = monthlyMap.get(month) || { revenue: 0, expenses: 0 };
            const margin =
              entry.revenue > 0
                ? ((entry.revenue - entry.expenses) / entry.revenue) * 100
                : 0;
            return { month, margin: Math.round(margin * 100) / 100 };
          });

          const costs = [
            { name: "Maintenance", value: Math.round(totalExpenses * 0.4) },
            { name: "Insurance", value: Math.round(totalExpenses * 0.25) },
            { name: "Fuel", value: Math.round(totalExpenses * 0.2) },
            { name: "Other", value: Math.round(totalExpenses * 0.15) },
          ];

          return {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalExpenses: Math.round(totalExpenses * 100) / 100,
            netProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
            growth: completedBookings.length > 0 ? 12.5 : 0,
            monthlyRevenue,
            profitMargins,
            costs,
          };
        },
        CacheTTL.MEDIUM,
      );

      return res.json(data);
    },
  );

  // ── Historical Analytics ──
  app.get(
    "/api/analytics/historical",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const days = Math.min(
        365,
        Math.max(1, parseInt(String(req.query.days || "30"), 10) || 30),
      );

      const data = await appCache.getOrSet(
        `historical:${userId}:${days}`,
        async () => {
          const [bookings, tasks] = await Promise.all([
            storage.getBookings(userId),
            storage.getTasks(userId),
          ]);

          const now = Date.now();
          const cutoff = now - days * 24 * 60 * 60 * 1000;
          const points: Array<{ date: string; bookings: number; tasks: number; revenue: number }> =
            [];

          for (let d = cutoff; d <= now; d += 24 * 60 * 60 * 1000) {
            const dateStr = new Date(d).toISOString().slice(0, 10);
            const dayBookings = bookings.filter((b) => {
              const bDate = b.createdAt ? new Date(b.createdAt).toISOString().slice(0, 10) : "";
              return bDate === dateStr;
            });
            const dayTasks = tasks.filter((t) => {
              const tDate = t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : "";
              return tDate === dateStr;
            });

            points.push({
              date: dateStr,
              bookings: dayBookings.length,
              tasks: dayTasks.length,
              revenue: dayBookings.reduce(
                (s, b) => s + parseFloat(b.totalAmount || "0"),
                0,
              ),
            });
          }

          return points;
        },
        CacheTTL.MEDIUM,
      );

      return res.json(data);
    },
  );

  // ── Admin: Query Stats ──
  app.get(
    "/api/admin/query-stats",
    requireAuth,
    requireAdmin,
    (_req: Request, res: Response) => {
      return res.json(queryOptimizer.getStats());
    },
  );

  // ── Admin: Job Queue Status ──
  app.get(
    "/api/admin/jobs/status",
    requireAuth,
    requireAdmin,
    (_req: Request, res: Response) => {
      return res.json(jobQueue.getStatus());
    },
  );

  // ── Audit Export (enhanced) ──
  app.get(
    "/api/audit/export",
    requireAuth,
    checkPermission(Permission.EXPORT_REPORTS),
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const format = (req.query.format as string) || "csv";
      const actions = await storage.getActions(userId);

      // Optional date range filtering
      const since = req.query.since ? new Date(String(req.query.since)) : null;
      const until = req.query.until ? new Date(String(req.query.until)) : null;

      let filtered = actions;
      if (since && !isNaN(since.getTime())) {
        filtered = filtered.filter(
          (a) => a.createdAt && new Date(a.createdAt) >= since,
        );
      }
      if (until && !isNaN(until.getTime())) {
        filtered = filtered.filter(
          (a) => a.createdAt && new Date(a.createdAt) <= until,
        );
      }

      if (format === "json") {
        return res.json({ count: filtered.length, actions: filtered });
      }

      // CSV format
      const header =
        "id,actorType,actionType,description,entityType,entityId,status,createdAt\n";
      const rows = filtered
        .map(
          (a) =>
            `"${a.id}","${a.actorType}","${a.actionType}","${(a.description || "").replace(/"/g, '""')}","${a.entityType || ""}","${a.entityId || ""}","${a.status}","${a.createdAt}"`,
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      return res.send(header + rows);
    },
  );

  // ── File Upload ──
  app.post(
    "/api/files/upload",
    requireAuth,
    upload.single("file"),
    async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const uploaded = fileToUploadedFile(req.file);
      return res.json(uploaded);
    },
  );

  app.delete(
    "/api/files/:filename",
    requireAuth,
    async (req: Request, res: Response) => {
      const filename = getRouteParam(req, "filename");
      await deleteUploadedFile(filename);
      return res.json({ message: "File deleted" });
    },
  );

  // ── WebSocket Info ──
  app.get(
    "/api/admin/ws-stats",
    requireAuth,
    requireAdmin,
    (_req: Request, res: Response) => {
      const { wsManager } = require("./services/websocket");
      return res.json(wsManager.getStats());
    },
  );

  // ── Analytics (Phase 5) ──
  app.get(
    "/api/analytics/revenue",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const { start, end, granularity } = req.query;
      const dateRange = {
        start: start
          ? new Date(start as string)
          : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: end ? new Date(end as string) : new Date(),
      };
      const data = await analyticsEngine.getRevenueTimeSeries(
        userId,
        dateRange,
        (granularity as "day" | "week" | "month") || "day",
      );
      return res.json(data);
    },
  );

  app.get(
    "/api/analytics/fleet-utilization",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const { start, end } = req.query;
      const dateRange = {
        start: start
          ? new Date(start as string)
          : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: end ? new Date(end as string) : new Date(),
      };
      const data = await analyticsEngine.getFleetUtilization(userId, dateRange);
      return res.json(data);
    },
  );

  app.get(
    "/api/analytics/demand-forecast",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const data = await analyticsEngine.getBookingDemandForecast(userId);
      return res.json(data);
    },
  );

  app.get(
    "/api/analytics/customer-ltv",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const data = await analyticsEngine.getCustomerLifetimeValue(userId);
      return res.json(data);
    },
  );

  app.get(
    "/api/analytics/metrics",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const data = await analyticsEngine.getTopMetrics(userId);
      return res.json(data);
    },
  );

  app.get(
    "/api/analytics/anomalies",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const data = await anomalyDetector.detectAnomalies(userId);
      return res.json(data);
    },
  );

  // ── API Keys ──
  app.post(
    "/api/api-keys",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const { name, expiresInDays = 90 } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Name is required" });
      }
      const days = Math.min(365, Math.max(1, Number(expiresInDays) || 90));
      const { key, keyHash, prefix } = await generateApiKey();
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const [created] = await db
        .insert(apiKeys)
        .values({ userId, name, keyHash, prefix, expiresAt, permissions: null })
        .returning();

      return res.json({
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        key, // returned only once
        expiresAt: created.expiresAt,
        createdAt: created.createdAt,
      });
    },
  );

  app.get(
    "/api/api-keys",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const keys = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          prefix: apiKeys.prefix,
          expiresAt: apiKeys.expiresAt,
          lastUsedAt: apiKeys.lastUsedAt,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId))
        .orderBy(desc(apiKeys.createdAt));
      return res.json(keys);
    },
  );

  app.delete(
    "/api/api-keys/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const id = getRouteParam(req, "id");
      const [found] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, id))
        .limit(1);
      if (!found || found.userId !== userId) {
        return res.status(404).json({ message: "API key not found" });
      }
      await db.delete(apiKeys).where(eq(apiKeys.id, id));
      return res.json({ ok: true });
    },
  );

  // ── Sessions ──
  app.get(
    "/api/sessions",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const sessions = sessionManager.getForUser(userId);
      const currentSessionId = req.sessionID;
      return res.json(
        sessions.map((s) => ({
          ...s,
          isCurrent: s.id === currentSessionId,
        })),
      );
    },
  );

  app.delete(
    "/api/sessions/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = getRouteParam(req, "id");
      const revoked = sessionManager.revoke(id);
      if (!revoked) {
        return res.status(404).json({ message: "Session not found" });
      }
      return res.json({ ok: true });
    },
  );

  app.delete(
    "/api/sessions",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const count = sessionManager.revokeAllForUser(userId, req.sessionID);
      return res.json({ ok: true, revokedCount: count });
    },
  );

  // ── Audit Log ──
  app.get(
    "/api/audit-log",
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === "admin";

      const entries = await db
        .select()
        .from(auditLog)
        .where(isAdmin ? undefined : eq(auditLog.userId, userId))
        .orderBy(desc(auditLog.createdAt))
        .limit(100);

      return res.json(entries);
    },
  );

  // ── Cache invalidation on entity mutations ──
  eventBus.on(EventTypes.ENTITY_CREATED, (event) => {
    appCache.invalidatePrefix(`stats:${event.userId}`);
    appCache.invalidatePrefix(`financial:${event.userId}`);
    appCache.invalidatePrefix(`historical:${event.userId}`);
    appCache.invalidatePrefix(`nexus-ultra:${event.userId}`);
  });
  eventBus.on(EventTypes.ENTITY_UPDATED, (event) => {
    appCache.invalidatePrefix(`stats:${event.userId}`);
    appCache.invalidatePrefix(`financial:${event.userId}`);
    appCache.invalidatePrefix(`historical:${event.userId}`);
    appCache.invalidatePrefix(`nexus-ultra:${event.userId}`);
  });
  eventBus.on(EventTypes.ENTITY_DELETED, (event) => {
    appCache.invalidatePrefix(`stats:${event.userId}`);
    appCache.invalidatePrefix(`financial:${event.userId}`);
    appCache.invalidatePrefix(`historical:${event.userId}`);
    appCache.invalidatePrefix(`nexus-ultra:${event.userId}`);
  });

  return httpServer;
}
