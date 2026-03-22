import { eq, desc, and, gt, count } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  modules,
  chatMessages,
  vehicles,
  customers,
  bookings,
  maintenanceRecords,
  tasks,
  notes,
  actionHistory,
  assistantMemory,
  workspaces,
  notifications,
  automations,
  inspections,
  type User,
  type InsertUser,
  type Module,
  type InsertModule,
  type ChatMessage,
  type InsertChatMessage,
  type Vehicle,
  type InsertVehicle,
  type Customer,
  type InsertCustomer,
  type Booking,
  type InsertBooking,
  type MaintenanceRecord,
  type InsertMaintenance,
  type Task,
  type InsertTask,
  type Note,
  type InsertNote,
  type ActionHistory,
  type InsertAction,
  type AssistantMemoryRecord,
  type InsertMemory,
  type Workspace,
  type InsertWorkspace,
  type Notification,
  type InsertNotification,
  type Automation,
  type InsertAutomation,
  type Inspection,
  type InsertInspection,
} from "@shared/schema";

export interface PaginationParams {
  limit: number;
  offset: number;
}

export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 200;

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const limit = Math.min(
    Math.max(1, Number(query.limit) || DEFAULT_PAGE_LIMIT),
    MAX_PAGE_LIMIT,
  );
  const offset = Math.max(0, Number(query.offset) || 0);
  return { limit, offset };
}

export interface SyncPayload {
  vehicles: Vehicle[];
  customers: Customer[];
  bookings: Booking[];
  maintenance: MaintenanceRecord[];
  tasks: Task[];
  notes: Note[];
  modules: Module[];
  chatMessages: ChatMessage[];
  notifications: Notification[];
  inspections: Inspection[];
  lastSyncTimestamp: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: string,
    updates: Partial<InsertUser>,
  ): Promise<User | undefined>;

  getWorkspacesByOwner(ownerId: string): Promise<Workspace[]>;
  createWorkspace(ws: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(
    id: string,
    updates: Partial<InsertWorkspace>,
  ): Promise<Workspace | undefined>;

  getModulesByUser(userId: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(
    id: string,
    userId: string,
    updates: Partial<InsertModule>,
  ): Promise<Module | undefined>;
  deleteModule(id: string, userId: string): Promise<void>;
  deleteAllModulesByUser(userId: string): Promise<void>;

  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;

  getVehicles(userId: string, pagination?: PaginationParams): Promise<Vehicle[]>;
  getVehicle(id: string, userId: string): Promise<Vehicle | undefined>;
  createVehicle(v: InsertVehicle): Promise<Vehicle>;
  updateVehicle(
    id: string,
    userId: string,
    updates: Partial<InsertVehicle>,
  ): Promise<Vehicle | undefined>;
  deleteVehicle(id: string, userId: string): Promise<void>;

  getCustomers(userId: string, pagination?: PaginationParams): Promise<Customer[]>;
  getCustomer(id: string, userId: string): Promise<Customer | undefined>;
  createCustomer(c: InsertCustomer): Promise<Customer>;
  updateCustomer(
    id: string,
    userId: string,
    updates: Partial<InsertCustomer>,
  ): Promise<Customer | undefined>;
  deleteCustomer(id: string, userId: string): Promise<void>;

  getBookings(userId: string, pagination?: PaginationParams): Promise<Booking[]>;
  getBooking(id: string, userId: string): Promise<Booking | undefined>;
  createBooking(b: InsertBooking): Promise<Booking>;
  updateBooking(
    id: string,
    userId: string,
    updates: Partial<InsertBooking>,
  ): Promise<Booking | undefined>;
  deleteBooking(id: string, userId: string): Promise<void>;

  getMaintenanceRecords(userId: string, pagination?: PaginationParams): Promise<MaintenanceRecord[]>;
  createMaintenance(m: InsertMaintenance): Promise<MaintenanceRecord>;
  updateMaintenance(
    id: string,
    userId: string,
    updates: Partial<InsertMaintenance>,
  ): Promise<MaintenanceRecord | undefined>;
  deleteMaintenance(id: string, userId: string): Promise<void>;

  getTasks(userId: string, pagination?: PaginationParams): Promise<Task[]>;
  createTask(t: InsertTask): Promise<Task>;
  updateTask(
    id: string,
    userId: string,
    updates: Partial<InsertTask>,
  ): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<void>;

  getNotes(userId: string, pagination?: PaginationParams): Promise<Note[]>;
  createNote(n: InsertNote): Promise<Note>;
  updateNote(
    id: string,
    userId: string,
    updates: Partial<InsertNote>,
  ): Promise<Note | undefined>;
  deleteNote(id: string, userId: string): Promise<void>;

  getActions(userId: string, limit?: number): Promise<ActionHistory[]>;
  createAction(a: InsertAction): Promise<ActionHistory>;
  updateActionStatus(id: string, userId: string, status: string): Promise<void>;

  getMemory(userId: string): Promise<AssistantMemoryRecord[]>;
  setMemory(
    userId: string,
    key: string,
    value: string,
    category?: string,
  ): Promise<AssistantMemoryRecord>;

  getNotifications(userId: string, pagination?: PaginationParams): Promise<Notification[]>;
  createNotification(n: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  getAutomations(userId: string, pagination?: PaginationParams): Promise<Automation[]>;
  createAutomation(a: InsertAutomation): Promise<Automation>;
  updateAutomation(
    id: string,
    userId: string,
    updates: Partial<InsertAutomation>,
  ): Promise<Automation | undefined>;

  getInspections(userId: string, pagination?: PaginationParams): Promise<Inspection[]>;
  getInspection(id: string, userId: string): Promise<Inspection | undefined>;
  createInspection(i: InsertInspection): Promise<Inspection>;
  updateInspection(
    id: string,
    userId: string,
    updates: Partial<InsertInspection>,
  ): Promise<Inspection | undefined>;

  getSyncData(userId: string, since: Date): Promise<SyncPayload>;
}

export class DatabaseStorage implements IStorage {
  private async isPrivileged(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.role === "admin" || user?.role === "operator";
  }

  async getUser(id: string) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  }
  async getUserByUsername(username: string) {
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return u;
  }
  async createUser(data: InsertUser) {
    const [u] = await db.insert(users).values(data).returning();
    return u;
  }
  async updateUser(id: string, updates: Partial<InsertUser>) {
    const [u] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return u;
  }

  async getWorkspacesByOwner(ownerId: string) {
    return db.select().from(workspaces).where(eq(workspaces.ownerId, ownerId));
  }
  async createWorkspace(ws: InsertWorkspace) {
    const [w] = await db.insert(workspaces).values(ws).returning();
    return w;
  }
  async updateWorkspace(id: string, updates: Partial<InsertWorkspace>) {
    const [w] = await db
      .update(workspaces)
      .set(updates)
      .where(eq(workspaces.id, id))
      .returning();
    return w;
  }

  async getModulesByUser(userId: string) {
    return db.select().from(modules).where(eq(modules.userId, userId));
  }
  async createModule(module: InsertModule) {
    const [m] = await db.insert(modules).values(module).returning();
    return m;
  }
  async updateModule(id: string, userId: string, updates: Partial<InsertModule>) {
    const [m] = await db
      .update(modules)
      .set(updates)
      .where(and(eq(modules.id, id), eq(modules.userId, userId)))
      .returning();
    return m;
  }
  async deleteModule(id: string, userId: string) {
    await db.delete(modules).where(and(eq(modules.id, id), eq(modules.userId, userId)));
  }
  async deleteAllModulesByUser(userId: string) {
    await db.delete(modules).where(eq(modules.userId, userId));
  }

  async getChatMessages(userId: string, limit = 100) {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
  }
  async createChatMessage(msg: InsertChatMessage) {
    const [m] = await db.insert(chatMessages).values(msg).returning();
    return m;
  }

  async getVehicles(userId: string, pagination?: PaginationParams) {
    let query = db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, userId));
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset) as typeof query;
    }
    const res = await query;
    const privileged = await this.isPrivileged(userId);
    if (!privileged) {
      return res.map(
        ({ dailyRate: _dr, ...rest }) => ({ ...rest, dailyRate: null as string | null }),
      );
    }
    return res;
  }
  async getVehicle(id: string, userId: string) {
    const [v] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
    if (v && !(await this.isPrivileged(userId))) {
      return { ...v, dailyRate: null as string | null };
    }
    return v;
  }
  async createVehicle(v: InsertVehicle) {
    const [created] = await db.insert(vehicles).values(v).returning();
    return created;
  }
  async updateVehicle(id: string, userId: string, updates: Partial<InsertVehicle>) {
    const [v] = await db
      .update(vehicles)
      .set(updates)
      .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)))
      .returning();
    return v;
  }
  async deleteVehicle(id: string, userId: string) {
    await db.delete(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
  }

  async getCustomers(userId: string, pagination?: PaginationParams) {
    let query = db.select().from(customers).where(eq(customers.userId, userId));
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset) as typeof query;
    }
    return query;
  }
  async getCustomer(id: string, userId: string) {
    const [c] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)));
    return c;
  }
  async createCustomer(c: InsertCustomer) {
    const [created] = await db.insert(customers).values(c).returning();
    return created;
  }
  async updateCustomer(id: string, userId: string, updates: Partial<InsertCustomer>) {
    const [c] = await db
      .update(customers)
      .set(updates)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .returning();
    return c;
  }
  async deleteCustomer(id: string, userId: string) {
    await db.delete(customers).where(and(eq(customers.id, id), eq(customers.userId, userId)));
  }

  async getBookings(userId: string, pagination?: PaginationParams) {
    let query = db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset) as typeof query;
    }
    const res = await query;
    const privileged = await this.isPrivileged(userId);
    if (!privileged) {
      return res.map(
        ({ totalAmount, deposit, ...rest }) =>
          ({ ...rest, totalAmount: null as string | null, deposit: null as string | null }),
      );
    }
    return res;
  }
  async getBooking(id: string, userId: string) {
    const [b] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
    if (b && !(await this.isPrivileged(userId))) {
      return { ...b, totalAmount: null as string | null, deposit: null as string | null };
    }
    return b;
  }
  async createBooking(b: InsertBooking) {
    const [created] = await db.insert(bookings).values(b).returning();
    return created;
  }
  async updateBooking(id: string, userId: string, updates: Partial<InsertBooking>) {
    const [b] = await db
      .update(bookings)
      .set(updates)
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)))
      .returning();
    return b;
  }
  async deleteBooking(id: string, userId: string) {
    await db.delete(bookings).where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
  }

  async getMaintenanceRecords(userId: string, pagination?: PaginationParams) {
    let query = db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.userId, userId))
      .orderBy(desc(maintenanceRecords.createdAt));
    const { limit, offset } = pagination ?? { limit: DEFAULT_PAGE_LIMIT, offset: 0 };
    query = query.limit(limit).offset(offset) as typeof query;
    return query;
  }
  async createMaintenance(m: InsertMaintenance) {
    const [created] = await db.insert(maintenanceRecords).values(m).returning();
    return created;
  }
  async updateMaintenance(id: string, userId: string, updates: Partial<InsertMaintenance>) {
    const [m] = await db
      .update(maintenanceRecords)
      .set(updates)
      .where(and(eq(maintenanceRecords.id, id), eq(maintenanceRecords.userId, userId)))
      .returning();
    return m;
  }
  async deleteMaintenance(id: string, userId: string) {
    await db.delete(maintenanceRecords).where(
      and(eq(maintenanceRecords.id, id), eq(maintenanceRecords.userId, userId)),
    );
  }

  async getTasks(userId: string, pagination?: PaginationParams) {
    let query = db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset) as typeof query;
    }
    return query;
  }
  async createTask(t: InsertTask) {
    const [created] = await db.insert(tasks).values(t).returning();
    return created;
  }
  async updateTask(id: string, userId: string, updates: Partial<InsertTask>) {
    const [t] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return t;
  }
  async deleteTask(id: string, userId: string) {
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  async getNotes(userId: string, pagination?: PaginationParams) {
    let query = db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset) as typeof query;
    }
    return query;
  }
  async createNote(n: InsertNote) {
    const [created] = await db.insert(notes).values(n).returning();
    return created;
  }
  async updateNote(id: string, userId: string, updates: Partial<InsertNote>) {
    const [n] = await db
      .update(notes)
      .set(updates)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    return n;
  }
  async deleteNote(id: string, userId: string) {
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
  }

  async getActions(userId: string, limit = 50) {
    return db
      .select()
      .from(actionHistory)
      .where(eq(actionHistory.userId, userId))
      .orderBy(desc(actionHistory.createdAt))
      .limit(limit);
  }
  async createAction(a: InsertAction) {
    const [created] = await db.insert(actionHistory).values(a).returning();
    return created;
  }
  async updateActionStatus(id: string, userId: string, status: string) {
    await db
      .update(actionHistory)
      .set({ status })
      .where(and(eq(actionHistory.id, id), eq(actionHistory.userId, userId)));
  }

  async getMemory(userId: string) {
    return db
      .select()
      .from(assistantMemory)
      .where(eq(assistantMemory.userId, userId));
  }
  async setMemory(
    userId: string,
    key: string,
    value: string,
    category = "general",
  ) {
    const existing = await db
      .select()
      .from(assistantMemory)
      .where(
        and(eq(assistantMemory.userId, userId), eq(assistantMemory.key, key)),
      );
    if (existing.length > 0) {
      const [updated] = await db
        .update(assistantMemory)
        .set({ value, category, updatedAt: new Date() })
        .where(eq(assistantMemory.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(assistantMemory)
      .values({ userId, key, value, category })
      .returning();
    return created;
  }

  async getNotifications(userId: string, pagination?: PaginationParams) {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    const { limit, offset } = pagination ?? { limit: DEFAULT_PAGE_LIMIT, offset: 0 };
    query = query.limit(limit).offset(offset) as typeof query;
    return query;
  }
  async createNotification(n: InsertNotification) {
    const [created] = await db.insert(notifications).values(n).returning();
    return created;
  }
  async markNotificationRead(id: string, userId: string) {
    await db
      .update(notifications)
      .set({ read: true, updatedAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }
  async markAllNotificationsRead(userId: string) {
    await db
      .update(notifications)
      .set({ read: true, updatedAt: new Date() })
      .where(eq(notifications.userId, userId));
  }

  async getAutomations(userId: string, pagination?: PaginationParams) {
    let query = db.select().from(automations).where(eq(automations.userId, userId));
    const { limit, offset } = pagination ?? { limit: DEFAULT_PAGE_LIMIT, offset: 0 };
    query = query.limit(limit).offset(offset) as typeof query;
    return query;
  }
  async createAutomation(a: InsertAutomation) {
    const [created] = await db.insert(automations).values(a).returning();
    return created;
  }
  async updateAutomation(id: string, userId: string, updates: Partial<InsertAutomation>) {
    const [u] = await db
      .update(automations)
      .set(updates)
      .where(and(eq(automations.id, id), eq(automations.userId, userId)))
      .returning();
    return u;
  }

  async getInspections(userId: string, pagination?: PaginationParams) {
    let query = db
      .select()
      .from(inspections)
      .where(eq(inspections.userId, userId))
      .orderBy(desc(inspections.createdAt));
    const { limit, offset } = pagination ?? { limit: DEFAULT_PAGE_LIMIT, offset: 0 };
    query = query.limit(limit).offset(offset) as typeof query;
    return query;
  }
  async getInspection(id: string, userId: string) {
    const [i] = await db
      .select()
      .from(inspections)
      .where(and(eq(inspections.id, id), eq(inspections.userId, userId)));
    return i;
  }
  async createInspection(i: InsertInspection) {
    const [created] = await db.insert(inspections).values(i).returning();
    return created;
  }
  async updateInspection(id: string, userId: string, updates: Partial<InsertInspection>) {
    const [u] = await db
      .update(inspections)
      .set(updates)
      .where(and(eq(inspections.id, id), eq(inspections.userId, userId)))
      .returning();
    return u;
  }

  async getSyncData(userId: string, since: Date): Promise<SyncPayload> {
    const [
      vehicleSync,
      customerSync,
      bookingSync,
      maintenanceSync,
      taskSync,
      noteSync,
      moduleSync,
      chatSync,
      notificationSync,
      inspectionSync,
    ] = await Promise.all([
      this.getVehicles(userId), // Using local methods to respect RBAC
      db
        .select()
        .from(customers)
        .where(
          and(eq(customers.userId, userId), gt(customers.updatedAt, since)),
        ),
      this.getBookings(userId), // Using local methods to respect RBAC
      db
        .select()
        .from(maintenanceRecords)
        .where(
          and(
            eq(maintenanceRecords.userId, userId),
            gt(maintenanceRecords.updatedAt, since),
          ),
        ),
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.userId, userId), gt(tasks.updatedAt, since))),
      db
        .select()
        .from(notes)
        .where(and(eq(notes.userId, userId), gt(notes.updatedAt, since))),
      db
        .select()
        .from(modules)
        .where(and(eq(modules.userId, userId), gt(modules.updatedAt, since))),
      db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.userId, userId),
            gt(chatMessages.updatedAt, since),
          ),
        ),
      db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            gt(notifications.updatedAt, since),
          ),
        ),
      db
        .select()
        .from(inspections)
        .where(
          and(eq(inspections.userId, userId), gt(inspections.updatedAt, since)),
        ),
    ]);

    return {
      vehicles: vehicleSync,
      customers: customerSync,
      bookings: bookingSync,
      maintenance: maintenanceSync,
      tasks: taskSync,
      notes: noteSync,
      modules: moduleSync,
      chatMessages: chatSync,
      notifications: notificationSync,
      inspections: inspectionSync,
      lastSyncTimestamp: new Date().toISOString(),
    };
  }
}

export const storage = new DatabaseStorage();
