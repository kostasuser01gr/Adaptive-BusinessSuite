import { eq, desc, and, gt } from "drizzle-orm";
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
    updates: Partial<InsertModule>,
  ): Promise<Module | undefined>;
  deleteModule(id: string): Promise<void>;
  deleteAllModulesByUser(userId: string): Promise<void>;

  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;

  getVehicles(userId: string): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(v: InsertVehicle): Promise<Vehicle>;
  updateVehicle(
    id: string,
    updates: Partial<InsertVehicle>,
  ): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<void>;

  getCustomers(userId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(c: InsertCustomer): Promise<Customer>;
  updateCustomer(
    id: string,
    updates: Partial<InsertCustomer>,
  ): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<void>;

  getBookings(userId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(b: InsertBooking): Promise<Booking>;
  updateBooking(
    id: string,
    updates: Partial<InsertBooking>,
  ): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<void>;

  getMaintenanceRecords(userId: string): Promise<MaintenanceRecord[]>;
  createMaintenance(m: InsertMaintenance): Promise<MaintenanceRecord>;
  updateMaintenance(
    id: string,
    updates: Partial<InsertMaintenance>,
  ): Promise<MaintenanceRecord | undefined>;

  getTasks(userId: string): Promise<Task[]>;
  createTask(t: InsertTask): Promise<Task>;
  updateTask(
    id: string,
    updates: Partial<InsertTask>,
  ): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  getNotes(userId: string): Promise<Note[]>;
  createNote(n: InsertNote): Promise<Note>;
  updateNote(
    id: string,
    updates: Partial<InsertNote>,
  ): Promise<Note | undefined>;
  deleteNote(id: string): Promise<void>;

  getActions(userId: string, limit?: number): Promise<ActionHistory[]>;
  createAction(a: InsertAction): Promise<ActionHistory>;
  updateActionStatus(id: string, status: string): Promise<void>;

  getMemory(userId: string): Promise<AssistantMemoryRecord[]>;
  setMemory(
    userId: string,
    key: string,
    value: string,
    category?: string,
  ): Promise<AssistantMemoryRecord>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(n: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  getAutomations(userId: string): Promise<Automation[]>;
  createAutomation(a: InsertAutomation): Promise<Automation>;
  updateAutomation(
    id: string,
    updates: Partial<InsertAutomation>,
  ): Promise<Automation | undefined>;

  getInspections(userId: string): Promise<Inspection[]>;
  getInspection(id: string): Promise<Inspection | undefined>;
  createInspection(i: InsertInspection): Promise<Inspection>;
  updateInspection(
    id: string,
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
  async updateModule(id: string, updates: Partial<InsertModule>) {
    const [m] = await db
      .update(modules)
      .set(updates)
      .where(eq(modules.id, id))
      .returning();
    return m;
  }
  async deleteModule(id: string) {
    await db.delete(modules).where(eq(modules.id, id));
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

  async getVehicles(userId: string) {
    const res = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, userId));
    const privileged = await this.isPrivileged(userId);
    if (!privileged) {
      return res.map(
        ({ dailyRate, ...rest }) => ({ ...rest, dailyRate: null }) as any,
      );
    }
    return res;
  }
  async getVehicle(id: string) {
    const [v] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (v && !(await this.isPrivileged(v.userId))) {
      return { ...v, dailyRate: null } as any;
    }
    return v;
  }
  async createVehicle(v: InsertVehicle) {
    const [created] = await db.insert(vehicles).values(v).returning();
    return created;
  }
  async updateVehicle(id: string, updates: Partial<InsertVehicle>) {
    const [v] = await db
      .update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return v;
  }
  async deleteVehicle(id: string) {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async getCustomers(userId: string) {
    return db.select().from(customers).where(eq(customers.userId, userId));
  }
  async getCustomer(id: string) {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }
  async createCustomer(c: InsertCustomer) {
    const [created] = await db.insert(customers).values(c).returning();
    return created;
  }
  async updateCustomer(id: string, updates: Partial<InsertCustomer>) {
    const [c] = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    return c;
  }
  async deleteCustomer(id: string) {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getBookings(userId: string) {
    const res = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
    const privileged = await this.isPrivileged(userId);
    if (!privileged) {
      return res.map(
        ({ totalAmount, deposit, ...rest }) =>
          ({ ...rest, totalAmount: null, deposit: null }) as any,
      );
    }
    return res;
  }
  async getBooking(id: string) {
    const [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    if (b && !(await this.isPrivileged(b.userId))) {
      return { ...b, totalAmount: null, deposit: null } as any;
    }
    return b;
  }
  async createBooking(b: InsertBooking) {
    const [created] = await db.insert(bookings).values(b).returning();
    return created;
  }
  async updateBooking(id: string, updates: Partial<InsertBooking>) {
    const [b] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return b;
  }
  async deleteBooking(id: string) {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async getMaintenanceRecords(userId: string) {
    return db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.userId, userId))
      .orderBy(desc(maintenanceRecords.createdAt));
  }
  async createMaintenance(m: InsertMaintenance) {
    const [created] = await db.insert(maintenanceRecords).values(m).returning();
    return created;
  }
  async updateMaintenance(id: string, updates: Partial<InsertMaintenance>) {
    const [m] = await db
      .update(maintenanceRecords)
      .set(updates)
      .where(eq(maintenanceRecords.id, id))
      .returning();
    return m;
  }

  async getTasks(userId: string) {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }
  async createTask(t: InsertTask) {
    const [created] = await db.insert(tasks).values(t).returning();
    return created;
  }
  async updateTask(id: string, updates: Partial<InsertTask>) {
    const [t] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return t;
  }
  async deleteTask(id: string) {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getNotes(userId: string) {
    return db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
  }
  async createNote(n: InsertNote) {
    const [created] = await db.insert(notes).values(n).returning();
    return created;
  }
  async updateNote(id: string, updates: Partial<InsertNote>) {
    const [n] = await db
      .update(notes)
      .set(updates)
      .where(eq(notes.id, id))
      .returning();
    return n;
  }
  async deleteNote(id: string) {
    await db.delete(notes).where(eq(notes.id, id));
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
  async updateActionStatus(id: string, status: string) {
    await db
      .update(actionHistory)
      .set({ status })
      .where(eq(actionHistory.id, id));
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

  async getNotifications(userId: string) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  async createNotification(n: InsertNotification) {
    const [created] = await db.insert(notifications).values(n).returning();
    return created;
  }
  async markNotificationRead(id: string) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }
  async markAllNotificationsRead(userId: string) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getAutomations(userId: string) {
    return db.select().from(automations).where(eq(automations.userId, userId));
  }
  async createAutomation(a: InsertAutomation) {
    const [created] = await db.insert(automations).values(a).returning();
    return created;
  }
  async updateAutomation(id: string, updates: Partial<InsertAutomation>) {
    const [u] = await db
      .update(automations)
      .set(updates)
      .where(eq(automations.id, id))
      .returning();
    return u;
  }

  async getInspections(userId: string) {
    return db
      .select()
      .from(inspections)
      .where(eq(inspections.userId, userId))
      .orderBy(desc(inspections.createdAt));
  }
  async getInspection(id: string) {
    const [i] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, id));
    return i;
  }
  async createInspection(i: InsertInspection) {
    const [created] = await db.insert(inspections).values(i).returning();
    return created;
  }
  async updateInspection(id: string, updates: Partial<InsertInspection>) {
    const [u] = await db
      .update(inspections)
      .set(updates)
      .where(eq(inspections.id, id))
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
