import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  boolean,
  integer,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Shared Helper for Sync Metadata ---
const syncMetadata = {
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
};

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  mode: text("mode").notNull().default("rental"),
  role: text("role").notNull().default("operator"), // admin, operator, driver, viewer
  preferences: jsonb("preferences"),
  ...syncMetadata,
});
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const workspaces = pgTable("workspaces", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: varchar("owner_id").notNull(),
  type: text("type").notNull().default("rental"),
  activeOntology: text("active_ontology").notNull().default("rental"),
  settings: jsonb("settings"),
  modelConfig: jsonb("model_config"),
  ...syncMetadata,
});
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

export const modules = pgTable("modules", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  w: text("w").notNull().default("1"),
  h: text("h").notNull().default("1"),
  data: jsonb("data"),
  position: integer("position").default(0),
  visible: boolean("visible").default(true),
  ...syncMetadata,
});
export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  actions: jsonb("actions"),
  metadata: jsonb("metadata"),
  ...syncMetadata,
});
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const vehicles = pgTable("vehicles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  plate: text("plate"),
  color: text("color"),
  status: text("status").notNull().default("available"),
  category: text("category").default("sedan"),
  dailyRate: numeric("daily_rate"),
  mileage: integer("mileage"),
  fuelLevel: integer("fuel_level"),
  notes: text("notes"),
  imageUrl: text("image_url"),
  lastKnownCondition: text("last_known_condition"),
  latestInspectionId: varchar("latest_inspection_id"),
  ...syncMetadata,
});
export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export const customers = pgTable("customers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  idNumber: text("id_number"),
  licenseNumber: text("license_number"),
  address: text("address"),
  notes: text("notes"),
  totalRentals: integer("total_rentals").default(0),
  ...syncMetadata,
});
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export const bookings = pgTable("bookings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  vehicleId: varchar("vehicle_id"),
  customerId: varchar("customer_id"),
  status: text("status").notNull().default("pending"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  totalAmount: numeric("total_amount"),
  dailyRate: numeric("daily_rate"),
  deposit: numeric("deposit"),
  pickupLocation: text("pickup_location"),
  dropoffLocation: text("dropoff_location"),
  mileageStart: integer("mileage_start"),
  mileageEnd: integer("mileage_end"),
  fuelStart: integer("fuel_start"),
  fuelEnd: integer("fuel_end"),
  notes: text("notes"),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, partial, paid
  paymentId: text("payment_id"),
  ...syncMetadata,
});
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  vehicleId: varchar("vehicle_id"),
  type: text("type").notNull(),
  description: text("description"),
  cost: numeric("cost"),
  status: text("status").notNull().default("scheduled"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  ...syncMetadata,
});
export const insertMaintenanceSchema = createInsertSchema(
  maintenanceRecords,
).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  category: text("category"),
  ...syncMetadata,
});
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const notes = pgTable("notes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  title: text("title"),
  content: text("content").notNull(),
  category: text("category"),
  pinned: boolean("pinned").default(false),
  ...syncMetadata,
});
export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export const actionHistory = pgTable("action_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  actorType: text("actor_type").notNull().default("user"), // user, system, ai
  actionType: text("action_type").notNull(),
  description: text("description"),
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  status: text("status").notNull().default("applied"),
  ...syncMetadata,
});
export const insertActionSchema = createInsertSchema(actionHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertAction = z.infer<typeof insertActionSchema>;
export type ActionHistory = typeof actionHistory.$inferSelect;

export const assistantMemory = pgTable("assistant_memory", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  key: text("key").notNull(),
  value: text("value").notNull(),
  category: text("category").default("general"),
  ...syncMetadata,
});
export const insertMemorySchema = createInsertSchema(assistantMemory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type AssistantMemoryRecord = typeof assistantMemory.$inferSelect;

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error
  read: boolean("read").notNull().default(false),
  metadata: jsonb("metadata"),
  ...syncMetadata,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const automations = pgTable("automations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  name: text("name").notNull(),
  triggerType: text("trigger_type").notNull(), // entity_created, entity_updated, low_fuel, etc.
  condition: jsonb("condition"),
  action: jsonb("action"),
  enabled: boolean("enabled").notNull().default(true),
  ...syncMetadata,
});
export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type Automation = typeof automations.$inferSelect;

export const inspections = pgTable("inspections", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  vehicleId: varchar("vehicle_id").notNull(),
  bookingId: varchar("booking_id"),
  type: text("type").notNull(), // check-in, check-out, maintenance
  mediaUrls: jsonb("media_urls").$type<string[]>(),
  aiFindings: jsonb("ai_findings"), // Detected scratches, dents, etc.
  status: text("status").notNull().default("pending"), // pending, processing, completed
  notes: text("notes"),
  ...syncMetadata,
});
export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;

// --- Files / Uploads ---
export const files = pgTable("files", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  entityType: text("entity_type"), // vehicle, booking, inspection, etc.
  entityId: varchar("entity_id"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  url: text("url").notNull(),
  ...syncMetadata,
});
export type FileRecord = typeof files.$inferSelect;

// --- Webhooks ---
export const webhooks = pgTable("webhooks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  url: text("url").notNull(),
  events: jsonb("events").$type<string[]>().notNull(),
  secret: text("secret").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  lastDeliveryAt: timestamp("last_delivery_at"),
  lastStatus: integer("last_status"),
  ...syncMetadata,
});
export type Webhook = typeof webhooks.$inferSelect;

// --- Saved Views ---
export const savedViews = pgTable("saved_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  entityType: text("entity_type").notNull(),
  filters: jsonb("filters"),
  sortBy: text("sort_by"),
  columns: jsonb("columns"),
  ...syncMetadata,
});
export type SavedView = typeof savedViews.$inferSelect;

// --- API Keys ---
export const apiKeys = pgTable("api_keys", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  prefix: text("prefix").notNull(),
  permissions: jsonb("permissions").$type<string[]>(),
  expiresAt: timestamp("expires_at").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  ...syncMetadata,
});
export type ApiKey = typeof apiKeys.$inferSelect;

// --- Audit Log (enhanced) ---
export const auditLog = pgTable("audit_log", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: varchar("resource_id"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  ...syncMetadata,
});
export type AuditLogEntry = typeof auditLog.$inferSelect;
