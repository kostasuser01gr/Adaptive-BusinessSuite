import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import MemoryStore from "memorystore";
import { buildNexusUltraPayload } from "./nexus-ultra";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hashed, "hex");
  if (buf.length !== storedBuf.length) return false;
  return timingSafeEqual(buf, storedBuf);
}

const SessionStore = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  next();
}

function getRouteParam(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function toDateOrNull(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value instanceof Date ? value : new Date(String(value));
}

type UserMode = 'rental' | 'personal' | 'professional' | 'custom';

const defaultModules: Record<UserMode, { type: string; title: string; w: string; h: string; data?: any }[]> = {
  rental: [
    { type: 'daily-overview', title: 'Daily Overview', w: '4', h: '1' },
    { type: 'kpi', title: 'Active Rentals', w: '1', h: '1', data: { value: '0', label: 'Vehicles out', icon: 'car', color: 'blue' } },
    { type: 'kpi', title: 'Revenue (MTD)', w: '1', h: '1', data: { value: '€0', label: 'This month', icon: 'euro', color: 'green' } },
    { type: 'kpi', title: 'Fleet Utilization', w: '1', h: '1', data: { value: '0%', label: 'Vehicles in use', icon: 'gauge', color: 'purple' } },
    { type: 'kpi', title: 'Pending Tasks', w: '1', h: '1', data: { value: '0', label: 'Action needed', icon: 'tasks', color: 'orange' } },
    { type: 'fleet', title: 'Fleet Status', w: '2', h: '2' },
    { type: 'bookings', title: 'Recent Bookings', w: '2', h: '2' },
    { type: 'quick-actions', title: 'Quick Actions', w: '2', h: '1' },
    { type: 'tasks', title: 'Priority Tasks', w: '2', h: '1' },
  ],
  personal: [
    { type: 'daily-overview', title: 'Daily Overview', w: '4', h: '1' },
    { type: 'notes', title: 'Quick Notes', w: '2', h: '2' },
    { type: 'tasks', title: 'To-Do List', w: '2', h: '2' },
    { type: 'kpi', title: 'Budget', w: '1', h: '1', data: { value: '€0', label: 'Monthly', icon: 'wallet', color: 'green' } },
    { type: 'kpi', title: 'Habits', w: '1', h: '1', data: { value: '0/5', label: 'Today', icon: 'check', color: 'blue' } },
  ],
  professional: [
    { type: 'daily-overview', title: 'Daily Overview', w: '4', h: '1' },
    { type: 'tasks', title: 'Priority Tasks', w: '2', h: '2' },
    { type: 'kpi', title: 'Active Projects', w: '1', h: '1', data: { value: '0', label: 'In progress', icon: 'briefcase', color: 'blue' } },
    { type: 'kpi', title: 'Contacts', w: '1', h: '1', data: { value: '0', label: 'Total CRM', icon: 'users', color: 'purple' } },
    { type: 'notes', title: 'Meeting Notes', w: '2', h: '2' },
    { type: 'quick-actions', title: 'Quick Actions', w: '2', h: '1' },
  ],
  custom: [],
};

function processAssistantCommand(command: string, context: { mode: string; moduleTypes: string[] }) {
  const cmd = command.toLowerCase();
  const result: any = { response: '', moduleToAdd: null, clearDashboard: false, switchMode: null, actions: null, memoryUpdate: null };

  // Module additions
  const moduleMap: Record<string, { type: string; title: string; w: string; h: string; data?: any }> = {
    'budget': { type: 'budget', title: 'Budget Tracker', w: '2', h: '1' },
    'fleet': { type: 'fleet', title: 'Fleet Overview', w: '2', h: '2' },
    'notes': { type: 'notes', title: 'Quick Notes', w: '2', h: '2' },
    'kpi': { type: 'kpi', title: 'KPI Widget', w: '1', h: '1', data: { value: '0', label: 'New Metric', icon: 'activity', color: 'blue' } },
    'task': { type: 'tasks', title: 'Tasks', w: '2', h: '2' },
    'calendar': { type: 'calendar', title: 'Calendar', w: '2', h: '2' },
    'crm': { type: 'crm', title: 'CRM Contacts', w: '2', h: '1' },
    'contact': { type: 'crm', title: 'CRM Contacts', w: '2', h: '1' },
    'habit': { type: 'habits', title: 'Daily Habits', w: '1', h: '2' },
    'booking': { type: 'bookings', title: 'Bookings', w: '2', h: '2' },
    'maintenance': { type: 'maintenance', title: 'Maintenance Tracker', w: '2', h: '2' },
    'financial': { type: 'financial', title: 'Financial Snapshot', w: '2', h: '1' },
    'quick action': { type: 'quick-actions', title: 'Quick Actions', w: '2', h: '1' },
    'overview': { type: 'daily-overview', title: 'Daily Overview', w: '4', h: '1' },
    'checkin': { type: 'checkin', title: 'Check-In / Check-Out', w: '2', h: '2' },
    'check-in': { type: 'checkin', title: 'Check-In / Check-Out', w: '2', h: '2' },
  };

  if (cmd.includes('add') || cmd.includes('create') || cmd.includes('new')) {
    for (const [keyword, mod] of Object.entries(moduleMap)) {
      if (cmd.includes(keyword)) {
        result.moduleToAdd = mod;
        result.response = `Added "${mod.title}" module to your dashboard.`;
        result.memoryUpdate = { key: `last_added_module`, value: mod.type };
        return result;
      }
    }
  }

  if (cmd.includes('remove all') || cmd.includes('clear') || cmd.includes('reset dashboard')) {
    result.clearDashboard = true;
    result.response = 'Dashboard cleared. Tell me what modules you want and I will build your ideal workspace.';
    return result;
  }

  const modeMap: Record<string, UserMode> = { 'personal': 'personal', 'rental': 'rental', 'car': 'rental', 'professional': 'professional', 'work': 'professional' };
  for (const [keyword, mode] of Object.entries(modeMap)) {
    if (cmd.includes(keyword) && (cmd.includes('switch') || cmd.includes('mode') || cmd.includes('change'))) {
      result.switchMode = mode;
      result.response = `Switched to ${mode} mode. Dashboard has been reconfigured with ${mode} modules.`;
      result.memoryUpdate = { key: 'preferred_mode', value: mode };
      return result;
    }
  }

  // Proactive suggestions based on context
  const suggestions: string[] = [];
  if (context.mode === 'rental') {
    if (!context.moduleTypes.includes('fleet')) suggestions.push('Add Fleet Overview');
    if (!context.moduleTypes.includes('bookings')) suggestions.push('Add Bookings');
    if (!context.moduleTypes.includes('checkin')) suggestions.push('Add Check-In/Out');
    if (!context.moduleTypes.includes('maintenance')) suggestions.push('Add Maintenance Tracker');
  }
  if (!context.moduleTypes.includes('tasks')) suggestions.push('Add Tasks');
  if (!context.moduleTypes.includes('notes')) suggestions.push('Add Notes');

  result.response = `I can customize your workspace in many ways. Try:\n• "Add [module name]" — fleet, bookings, tasks, notes, budget, calendar, CRM, maintenance, check-in, financial, KPI\n• "Switch to [mode]" — rental, personal, professional\n• "Clear dashboard" — start fresh\n\nI can also add custom KPI widgets, quick actions, and more.`;
  result.actions = suggestions.slice(0, 4);
  return result;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(session({
    secret: process.env.SESSION_SECRET ?? (() => { if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production"); return "nexus-dev-only-secret"; })(),
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({ checkPeriod: 86400000 }),
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
  }));

  // ── Auth ──
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const body = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(body.username);
      if (existing) return res.status(400).json({ message: "Username already taken" });
      const user = await storage.createUser({ ...body, password: await hashPassword(body.password) });
      req.session.userId = user.id;

      // Create default workspace
      await storage.createWorkspace({ name: `${user.displayName || user.username}'s Workspace`, ownerId: user.id, type: 'rental', settings: null, modelConfig: null });

      // Seed default modules
      for (const m of defaultModules['rental']) {
        await storage.createModule({ userId: user.id, type: m.type, title: m.title, w: m.w, h: m.h, data: m.data || null, position: 0, visible: true, workspaceId: null });
      }
      await storage.createChatMessage({ userId: user.id, role: 'assistant', content: 'Welcome to Nexus OS! I am your adaptive workspace assistant.\n\nI can help you:\n• Add or remove dashboard modules\n• Switch between Rental, Personal, and Professional modes\n• Customize your workflow\n• Track your fleet, bookings, customers, and more\n\nWhat would you like to set up first?', actions: ['Add Fleet Overview', 'Add Bookings', 'Switch to Personal', 'Add Tasks'], metadata: null, workspaceId: null });
      await storage.setMemory(user.id, 'onboarding_complete', 'false', 'system');

      const { password, ...safe } = user;
      return res.json(safe);
    } catch (e: any) {
      return res.status(400).json({ message: e.message || "Invalid input" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });
    const user = await storage.getUserByUsername(username);
    if (!user || !(await verifyPassword(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
    req.session.userId = user.id;
    const { password: _, ...safe } = user;
    return res.json(safe);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {});
    return res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { password, ...safe } = user;
    return res.json(safe);
  });

  // ── User Settings ──
  app.patch("/api/user/mode", requireAuth, async (req: Request, res: Response) => {
    const { mode } = req.body;
    if (!['rental', 'personal', 'professional', 'custom'].includes(mode)) return res.status(400).json({ message: "Invalid mode" });
    const userId = req.session.userId!;
    await storage.updateUser(userId, { mode } as any);
    await storage.deleteAllModulesByUser(userId);
    const created = [];
    for (const m of defaultModules[mode as UserMode]) {
      const c = await storage.createModule({ userId, type: m.type, title: m.title, w: m.w, h: m.h, data: m.data || null, position: 0, visible: true, workspaceId: null });
      created.push(c);
    }
    await storage.createAction({ userId, actionType: 'mode_switch', description: `Switched to ${mode} mode`, entityType: 'user', entityId: userId, previousState: null, newState: { mode }, status: 'applied' });
    const user = await storage.getUser(userId);
    return res.json({ user, modules: created });
  });

  app.patch("/api/user/preferences", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const user = await storage.updateUser(userId, { preferences: req.body } as any);
    return res.json(user);
  });

  // ── Modules ──
  app.get("/api/modules", requireAuth, async (req: Request, res: Response) => {
    const mods = await storage.getModulesByUser(req.session.userId!);
    return res.json(mods);
  });

  app.post("/api/modules", requireAuth, async (req: Request, res: Response) => {
    const mod = await storage.createModule({
      userId: req.session.userId!, type: req.body.type || 'generic', title: req.body.title || 'New Module',
      w: String(req.body.w || '1'), h: String(req.body.h || '1'), data: req.body.data || null,
      position: req.body.position || 0, visible: true, workspaceId: null,
    });
    return res.json(mod);
  });

  app.patch("/api/modules/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    const mod = await storage.updateModule(id, req.body);
    return res.json(mod);
  });

  app.delete("/api/modules/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    await storage.deleteModule(id);
    return res.json({ ok: true });
  });

  // ── Chat / Assistant ──
  app.get("/api/chat", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getChatMessages(req.session.userId!));
  });

  app.post("/api/chat", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content required" });

    await storage.createChatMessage({ userId, role: 'user', content, actions: null, metadata: null, workspaceId: null });

    const existingModules = await storage.getModulesByUser(userId);
    const moduleTypes = existingModules.map(m => m.type);
    const user = await storage.getUser(userId);
    const result = processAssistantCommand(content, { mode: user?.mode || 'rental', moduleTypes });

    let newModules: any[] = [];
    if (result.clearDashboard) {
      await storage.deleteAllModulesByUser(userId);
      await storage.createAction({ userId, actionType: 'clear_dashboard', description: 'Cleared all modules', entityType: 'dashboard', entityId: userId, previousState: existingModules, newState: null, status: 'applied' });
    }
    if (result.switchMode) {
      const nextMode = result.switchMode as UserMode;
      await storage.updateUser(userId, { mode: result.switchMode } as any);
      await storage.deleteAllModulesByUser(userId);
      for (const m of defaultModules[nextMode]) {
        const c = await storage.createModule({ userId, type: m.type, title: m.title, w: m.w, h: m.h, data: m.data || null, position: 0, visible: true, workspaceId: null });
        newModules.push(c);
      }
    }
    if (result.moduleToAdd) {
      const m = result.moduleToAdd;
      const c = await storage.createModule({ userId, type: m.type, title: m.title, w: m.w, h: m.h, data: m.data || null, position: 0, visible: true, workspaceId: null });
      newModules.push(c);
      await storage.createAction({ userId, actionType: 'add_module', description: `Added ${m.title}`, entityType: 'module', entityId: c.id, previousState: null, newState: c, status: 'applied' });
    }
    if (result.memoryUpdate) {
      await storage.setMemory(userId, result.memoryUpdate.key, result.memoryUpdate.value);
    }

    const assistantMsg = await storage.createChatMessage({ userId, role: 'assistant', content: result.response, actions: result.actions, metadata: null, workspaceId: null });
    return res.json({ assistantMessage: assistantMsg, newModules, switchedMode: result.switchMode, clearedDashboard: result.clearDashboard });
  });

  // ── Vehicles ──
  app.get("/api/vehicles", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getVehicles(req.session.userId!));
  });
  app.post("/api/vehicles", requireAuth, async (req: Request, res: Response) => {
    const v = await storage.createVehicle({ ...req.body, userId: req.session.userId! });
    await storage.createAction({ userId: req.session.userId!, actionType: 'create_vehicle', description: `Added ${req.body.make} ${req.body.model}`, entityType: 'vehicle', entityId: v.id, previousState: null, newState: v, status: 'applied' });
    return res.json(v);
  });
  app.patch("/api/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    const prev = await storage.getVehicle(id);
    const v = await storage.updateVehicle(id, req.body);
    await storage.createAction({ userId: req.session.userId!, actionType: 'update_vehicle', description: `Updated vehicle`, entityType: 'vehicle', entityId: id, previousState: prev, newState: v, status: 'applied' });
    return res.json(v);
  });
  app.delete("/api/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    await storage.deleteVehicle(id);
    return res.json({ ok: true });
  });

  // ── Customers ──
  app.get("/api/customers", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getCustomers(req.session.userId!));
  });
  app.post("/api/customers", requireAuth, async (req: Request, res: Response) => {
    const c = await storage.createCustomer({ ...req.body, userId: req.session.userId! });
    return res.json(c);
  });
  app.patch("/api/customers/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    return res.json(await storage.updateCustomer(id, req.body));
  });
  app.delete("/api/customers/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    await storage.deleteCustomer(id);
    return res.json({ ok: true });
  });

  // ── Bookings ──
  app.get("/api/bookings", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getBookings(req.session.userId!));
  });
  app.post("/api/bookings", requireAuth, async (req: Request, res: Response) => {
    const b = await storage.createBooking({
      ...req.body,
      userId: req.session.userId!,
      startDate: toDateOrNull(req.body.startDate),
      endDate: toDateOrNull(req.body.endDate),
    });
    if (req.body.vehicleId) {
      await storage.updateVehicle(req.body.vehicleId, { status: 'rented' });
    }
    return res.json(b);
  });
  app.patch("/api/bookings/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    const b = await storage.updateBooking(id, {
      ...req.body,
      startDate: toDateOrNull(req.body.startDate),
      endDate: toDateOrNull(req.body.endDate),
    });
    if (req.body.status === 'completed' && b?.vehicleId) {
      await storage.updateVehicle(b.vehicleId, { status: 'available' });
    }
    return res.json(b);
  });

  // ── Maintenance ──
  app.get("/api/maintenance", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getMaintenanceRecords(req.session.userId!));
  });
  app.post("/api/maintenance", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.createMaintenance({
      ...req.body,
      userId: req.session.userId!,
      scheduledDate: toDateOrNull(req.body.scheduledDate),
      completedDate: toDateOrNull(req.body.completedDate),
    }));
  });
  app.patch("/api/maintenance/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    return res.json(await storage.updateMaintenance(id, {
      ...req.body,
      scheduledDate: toDateOrNull(req.body.scheduledDate),
      completedDate: toDateOrNull(req.body.completedDate),
    }));
  });

  // ── Tasks ──
  app.get("/api/tasks", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getTasks(req.session.userId!));
  });
  app.post("/api/tasks", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.createTask({ ...req.body, userId: req.session.userId! }));
  });
  app.patch("/api/tasks/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    return res.json(await storage.updateTask(id, req.body));
  });
  app.delete("/api/tasks/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    await storage.deleteTask(id);
    return res.json({ ok: true });
  });

  // ── Notes ──
  app.get("/api/notes", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getNotes(req.session.userId!));
  });
  app.post("/api/notes", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.createNote({ ...req.body, userId: req.session.userId! }));
  });
  app.patch("/api/notes/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    return res.json(await storage.updateNote(id, req.body));
  });
  app.delete("/api/notes/:id", requireAuth, async (req: Request, res: Response) => {
    const id = getRouteParam(req, "id");
    await storage.deleteNote(id);
    return res.json({ ok: true });
  });

  // ── Action History ──
  app.get("/api/actions", requireAuth, async (req: Request, res: Response) => {
    return res.json(await storage.getActions(req.session.userId!));
  });

  // ── Dashboard Stats ──
  app.get("/api/stats", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const [vehiclesList, bookingsList, tasksList, customersList, maintenanceList] = await Promise.all([
      storage.getVehicles(userId), storage.getBookings(userId),
      storage.getTasks(userId), storage.getCustomers(userId),
      storage.getMaintenanceRecords(userId),
    ]);
    const available = vehiclesList.filter(v => v.status === 'available').length;
    const rented = vehiclesList.filter(v => v.status === 'rented').length;
    const inMaintenance = vehiclesList.filter(v => v.status === 'maintenance').length;
    const activeBookings = bookingsList.filter(b => b.status === 'active').length;
    const pendingTasks = tasksList.filter(t => t.status === 'todo').length;
    const totalRevenue = bookingsList.filter(b => b.status === 'completed').reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);
    const utilization = vehiclesList.length > 0 ? Math.round((rented / vehiclesList.length) * 100) : 0;

    return res.json({
      fleet: { total: vehiclesList.length, available, rented, maintenance: inMaintenance },
      bookings: { total: bookingsList.length, active: activeBookings, pending: bookingsList.filter(b => b.status === 'pending').length },
      tasks: { total: tasksList.length, pending: pendingTasks, done: tasksList.filter(t => t.status === 'done').length },
      customers: { total: customersList.length },
      maintenance: { pending: maintenanceList.filter(m => m.status === 'scheduled').length },
      revenue: { total: totalRevenue, mtd: totalRevenue },
      utilization,
    });
  });

  // ── Model Configuration ──
  app.get("/api/model-config", requireAuth, async (req: Request, res: Response) => {
    const wss = await storage.getWorkspacesByOwner(req.session.userId!);
    if (wss.length > 0) return res.json(wss[0].modelConfig || { provider: 'none', model: '', apiKey: '', capabilities: [] });
    return res.json({ provider: 'none', model: '', apiKey: '', capabilities: [] });
  });

  app.patch("/api/model-config", requireAuth, async (req: Request, res: Response) => {
    const wss = await storage.getWorkspacesByOwner(req.session.userId!);
    if (wss.length > 0) {
      await storage.updateWorkspace(wss[0].id, { modelConfig: req.body });
    }
    return res.json({ ok: true });
  });

  // ── Proactive Suggestions ──
  app.get("/api/suggestions", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const [user, vehiclesList, bookingsList, tasksList, modulesList] = await Promise.all([
      storage.getUser(userId), storage.getVehicles(userId),
      storage.getBookings(userId), storage.getTasks(userId),
      storage.getModulesByUser(userId),
    ]);
    const suggestions: { type: string; title: string; description: string; action: string }[] = [];
    const moduleTypes = modulesList.map(m => m.type);

    if (user?.mode === 'rental') {
      if (vehiclesList.length === 0) suggestions.push({ type: 'setup', title: 'Add your first vehicle', description: 'Start building your fleet to track availability and bookings.', action: 'navigate:/fleet' });
      if (bookingsList.length === 0 && vehiclesList.length > 0) suggestions.push({ type: 'setup', title: 'Create your first booking', description: 'Record a rental to start tracking revenue.', action: 'navigate:/bookings' });
      if (!moduleTypes.includes('checkin')) suggestions.push({ type: 'module', title: 'Add Check-In/Out module', description: 'Quickly process vehicle pickups and returns.', action: 'command:add check-in module' });
      if (!moduleTypes.includes('maintenance')) suggestions.push({ type: 'module', title: 'Add Maintenance Tracker', description: 'Keep your fleet in top condition.', action: 'command:add maintenance module' });
    }
    const overdueTasks = tasksList.filter(t => t.status === 'todo' && t.dueDate && new Date(t.dueDate) < new Date());
    if (overdueTasks.length > 0) suggestions.push({ type: 'alert', title: `${overdueTasks.length} overdue task(s)`, description: 'Review and update your overdue tasks.', action: 'navigate:/tasks' });

    return res.json(suggestions.slice(0, 5));
  });

  // ── NEXUS ULTRA ──
  app.get("/api/nexus-ultra", requireAuth, (_req: Request, res: Response) => {
    return res.json(buildNexusUltraPayload());
  });

  return httpServer;
}
