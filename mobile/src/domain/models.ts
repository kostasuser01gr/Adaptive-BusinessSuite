export type WorkspaceMode = "rental" | "personal" | "hybrid" | "custom";
export type ModuleKey =
  | "dashboard"
  | "fleet"
  | "bookings"
  | "customers"
  | "maintenance"
  | "tasks"
  | "notes"
  | "calendar"
  | "finance"
  | "checkflow"
  | "damage-reports"
  | "late-returns-workflow";
export type WidgetType =
  | "today-summary"
  | "bookings-today"
  | "returns-today"
  | "available-vehicles"
  | "maintenance-due"
  | "reminders"
  | "notes-tasks"
  | "revenue-snapshot"
  | "assistant-recommendations"
  | "custom-kpi";
export type EntityScope = "vehicles" | "bookings" | "customers" | "tasks";
export type VehicleStatus = "available" | "rented" | "maintenance" | "reserved";
export type BookingStatus =
  | "draft"
  | "confirmed"
  | "active"
  | "returned"
  | "late";
export type MaintenanceStatus = "scheduled" | "in-progress" | "resolved";
export type TaskStatus = "todo" | "doing" | "done";
export type NoteCategory = "ops" | "customer" | "finance" | "personal";
export type ModelProviderId =
  | "none"
  | "openai"
  | "mock-local"
  | "openai-compatible"
  | "local-private"
  | "fast-lightweight"
  | "advanced-reasoning";
export type QuickActionTarget =
  | "NewBooking"
  | "AddVehicle"
  | "OpenCheckFlow"
  | "NewTask"
  | "NewNote"
  | "AddCustomer"
  | "OpenReturns";
export type SuggestionStatus = "pending" | "applied" | "dismissed";
export type HistoryType =
  | "suggestion-applied"
  | "rollback"
  | "preset-reset"
  | "workspace-created";

export interface UserProfile {
  id: string;
  username: string;
  /** SHA-256 hash of password + salt */
  passwordHash: string;
  /** Random salt for password hashing */
  passwordSalt: string;
  displayName: string;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface SessionState {
  activeUserId: string | null;
  activeWorkspaceId: string | null;
}

import * as Crypto from "expo-crypto";

export interface ModuleDefinition {
  id: string;
  key: ModuleKey;
  title: string;
  description: string;
  icon: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  metricKey?: string;
}

export interface QuickActionDefinition {
  id: string;
  label: string;
  icon: string;
  target: QuickActionTarget;
}

export interface CustomFieldDefinition {
  id: string;
  scope: EntityScope;
  label: string;
  type: "text" | "number" | "date";
  placeholder?: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgetIds: string[];
}

export interface WorkspaceRecord {
  id: string;
  ownerId: string;
  name: string;
  mode: WorkspaceMode;
  modules: ModuleDefinition[];
  dashboardWidgets: DashboardWidget[];
  quickActions: QuickActionDefinition[];
  customFields: Record<EntityScope, CustomFieldDefinition[]>;
  savedLayouts: DashboardLayout[];
  activeLayoutId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  workspaceId: string;
  name: string;
  plate: string;
  status: VehicleStatus;
  mileage: number;
  availabilityLabel: string;
  notes: string;
  serviceStatus: string;
  maintenanceDueOn: string;
  category: string;
}

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  phone: string;
  email: string;
  tag: "vip" | "risk" | "standard";
  notes: string;
}

export interface Booking {
  id: string;
  workspaceId: string;
  vehicleId: string;
  customerId: string;
  status: BookingStatus;
  pickupAt: string;
  dropoffAt: string;
  amount: number;
  pickupLocation: string;
  dropoffLocation: string;
  notes: string;
}

export interface MaintenanceItem {
  id: string;
  workspaceId: string;
  vehicleId: string;
  title: string;
  dueOn: string;
  status: MaintenanceStatus;
  urgency: "low" | "medium" | "high";
  notes: string;
}

export interface TaskRecord {
  id: string;
  workspaceId: string;
  title: string;
  status: TaskStatus;
  dueOn: string;
  assigneeLabel: string;
}

export interface NoteRecord {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  category: NoteCategory;
  pinned: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  kind: "alert" | "reminder" | "assistant";
  read: boolean;
  createdAt: string;
}

export interface FinanceSummary {
  id: string;
  workspaceId: string;
  dailyRevenue: number;
  monthToDateRevenue: number;
  outstandingPayments: number;
  estimatedCosts: number;
}

export interface AssistantMemoryRecord {
  id: string;
  workspaceId: string | null;
  key: string;
  value: string;
}

export type AssistantAction =
  | { type: "add-module"; module: ModuleDefinition }
  | { type: "add-custom-field"; field: CustomFieldDefinition }
  | { type: "add-quick-action"; quickAction: QuickActionDefinition }
  | { type: "add-widget"; widget: DashboardWidget }
  | { type: "switch-mode"; mode: WorkspaceMode }
  | {
      type: "create-workflow";
      module: ModuleDefinition;
      quickAction: QuickActionDefinition;
    }
  | { type: "noop"; insight: string }
  | { type: "remote-mutation"; raw: any };

export interface AssistantSuggestion {
  id: string;
  workspaceId: string | null;
  command: string;
  title: string;
  description: string;
  preview: string[];
  action: AssistantAction;
  status: SuggestionStatus;
  createdAt: string;
}

export interface AssistantMessage {
  id: string;
  workspaceId: string | null;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  workspaceId: string;
  type: HistoryType;
  title: string;
  description: string;
  createdAt: string;
  previousWorkspaceSnapshot?: WorkspaceRecord;
}

export interface ModelSettings {
  activeProvider: ModelProviderId;
  fallbackModeEnabled: boolean;
  activeModelLabel: string;
  capabilityProfile: string;
  backendBaseUrl: string;
}

export interface AssistantContextSnapshot {
  workspace: WorkspaceRecord;
  todayReturnsCount: number;
  activeBookingsCount: number;
  availableVehiclesCount: number;
  overdueTasksCount: number;
}

export interface AssistantInterpretation {
  reply: string;
  suggestions: AssistantSuggestion[];
  memoryUpdates?: AssistantMemoryRecord[];
}

export const workspaceModeLabels: Record<WorkspaceMode, string> = {
  rental: "Car Rental",
  personal: "Personal",
  hybrid: "Hybrid",
  custom: "Custom",
};

export function createId(prefix: string): string {
  return `${prefix}-${Crypto.randomUUID()}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createModule(
  key: ModuleKey,
  title: string,
  description: string,
  icon: string,
): ModuleDefinition {
  return { id: createId("module"), key, title, description, icon };
}

export function createWidget(
  type: WidgetType,
  title: string,
  description: string,
  metricKey?: string,
): DashboardWidget {
  return { id: createId("widget"), type, title, description, metricKey };
}

export function createQuickAction(
  label: string,
  icon: string,
  target: QuickActionTarget,
): QuickActionDefinition {
  return { id: createId("quick-action"), label, icon, target };
}

export function createCustomField(
  scope: EntityScope,
  label: string,
  type: "text" | "number" | "date",
  placeholder?: string,
): CustomFieldDefinition {
  return { id: createId("field"), scope, label, type, placeholder };
}

export function createWorkspacePreset(
  mode: WorkspaceMode,
  ownerId: string,
  name?: string,
  existingId?: string,
): WorkspaceRecord {
  const workspaceId = existingId ?? createId("workspace");
  const now = nowIso();
  const baseModules: Record<WorkspaceMode, ModuleDefinition[]> = {
    rental: [
      createModule(
        "dashboard",
        "Dashboard",
        "Central operational control center.",
        "grid",
      ),
      createModule(
        "fleet",
        "Fleet",
        "Vehicle availability, mileage, and service state.",
        "car",
      ),
      createModule(
        "bookings",
        "Bookings",
        "Reservations, returns, and extensions.",
        "calendar",
      ),
      createModule(
        "customers",
        "Customers",
        "Profiles, contact info, and linked rentals.",
        "people",
      ),
      createModule(
        "maintenance",
        "Maintenance",
        "Service backlog and vehicle issues.",
        "construct",
      ),
      createModule(
        "tasks",
        "Tasks",
        "Operational follow-through and reminders.",
        "checkmark-circle",
      ),
      createModule(
        "notes",
        "Notes",
        "Fast capture for daily context.",
        "document-text",
      ),
      createModule("calendar", "Calendar", "Daily and weekly agenda.", "today"),
      createModule(
        "finance",
        "Finance Snapshot",
        "Revenue and payment overview.",
        "cash",
      ),
      createModule(
        "checkflow",
        "Check-In / Out",
        "Guided handoff workflow.",
        "swap-horizontal",
      ),
    ],
    personal: [
      createModule(
        "dashboard",
        "Dashboard",
        "Personal operating command center.",
        "grid",
      ),
      createModule(
        "tasks",
        "Tasks",
        "Priority stack and routines.",
        "checkmark-circle",
      ),
      createModule(
        "notes",
        "Notes",
        "Captured ideas and references.",
        "document-text",
      ),
      createModule(
        "calendar",
        "Calendar",
        "Agenda and planning view.",
        "today",
      ),
      createModule(
        "finance",
        "Finance Snapshot",
        "Simple personal money view.",
        "cash",
      ),
    ],
    hybrid: [
      createModule(
        "dashboard",
        "Dashboard",
        "Unified personal and business command center.",
        "grid",
      ),
      createModule("fleet", "Fleet", "Vehicle operations.", "car"),
      createModule(
        "bookings",
        "Bookings",
        "Rental schedule and commitments.",
        "calendar",
      ),
      createModule(
        "customers",
        "Customers",
        "Business contacts and renters.",
        "people",
      ),
      createModule(
        "tasks",
        "Tasks",
        "Cross-mode execution queue.",
        "checkmark-circle",
      ),
      createModule(
        "notes",
        "Notes",
        "Operational memory and personal capture.",
        "document-text",
      ),
      createModule("calendar", "Calendar", "Shared agenda view.", "today"),
      createModule(
        "finance",
        "Finance Snapshot",
        "Income and cost snapshot.",
        "cash",
      ),
    ],
    custom: [
      createModule(
        "dashboard",
        "Dashboard",
        "Minimal adaptive shell ready for customization.",
        "grid",
      ),
      createModule(
        "tasks",
        "Tasks",
        "Start with a task-driven workspace.",
        "checkmark-circle",
      ),
      createModule(
        "notes",
        "Notes",
        "Start with fast capture.",
        "document-text",
      ),
    ],
  };

  const baseWidgets: Record<WorkspaceMode, DashboardWidget[]> = {
    rental: [
      createWidget(
        "today-summary",
        "Today Summary",
        "What matters right now across bookings and fleet.",
      ),
      createWidget(
        "bookings-today",
        "Bookings Today",
        "Confirmed pickups scheduled today.",
      ),
      createWidget(
        "returns-today",
        "Returns Today",
        "Vehicles expected back before end of day.",
      ),
      createWidget(
        "available-vehicles",
        "Available Vehicles",
        "Ready-to-rent fleet count.",
      ),
      createWidget(
        "maintenance-due",
        "Maintenance Due",
        "Vehicles that need service attention.",
      ),
      createWidget(
        "notes-tasks",
        "Notes + Tasks",
        "Pinned notes and pending work.",
      ),
      createWidget(
        "revenue-snapshot",
        "Revenue Snapshot",
        "Daily and month-to-date revenue.",
      ),
      createWidget(
        "assistant-recommendations",
        "Assistant Recommendations",
        "Next-best actions from the operating system.",
      ),
    ],
    personal: [
      createWidget(
        "today-summary",
        "Today Summary",
        "Focus, workload, and momentum.",
      ),
      createWidget(
        "notes-tasks",
        "Notes + Tasks",
        "Current action list and notes.",
      ),
      createWidget(
        "assistant-recommendations",
        "Assistant Recommendations",
        "Personal productivity nudges.",
      ),
      createWidget(
        "revenue-snapshot",
        "Money Snapshot",
        "Cash in, cash out, and balance trend.",
      ),
    ],
    hybrid: [
      createWidget(
        "today-summary",
        "Today Summary",
        "Personal and business priorities in one view.",
      ),
      createWidget(
        "bookings-today",
        "Bookings Today",
        "Business-critical commitments.",
      ),
      createWidget(
        "notes-tasks",
        "Notes + Tasks",
        "Cross-mode execution snapshot.",
      ),
      createWidget(
        "revenue-snapshot",
        "Revenue Snapshot",
        "Business income and personal spend signal.",
      ),
      createWidget(
        "assistant-recommendations",
        "Assistant Recommendations",
        "Suggestions tuned for a mixed workspace.",
      ),
    ],
    custom: [
      createWidget(
        "today-summary",
        "Today Summary",
        "Build your own command center from here.",
      ),
      createWidget(
        "assistant-recommendations",
        "Assistant Recommendations",
        "Ask the assistant to shape the workspace.",
      ),
    ],
  };

  const baseQuickActions: Record<WorkspaceMode, QuickActionDefinition[]> = {
    rental: [
      createQuickAction("New Booking", "add-circle", "NewBooking"),
      createQuickAction("Add Vehicle", "car-sport", "AddVehicle"),
      createQuickAction("Quick Check-Out", "swap-horizontal", "OpenCheckFlow"),
      createQuickAction("Add Customer", "person-add", "AddCustomer"),
      createQuickAction("Open Returns", "return-down-back", "OpenReturns"),
    ],
    personal: [
      createQuickAction("New Task", "checkmark-done", "NewTask"),
      createQuickAction("New Note", "create", "NewNote"),
    ],
    hybrid: [
      createQuickAction("New Booking", "add-circle", "NewBooking"),
      createQuickAction("New Task", "checkmark-done", "NewTask"),
      createQuickAction("New Note", "create", "NewNote"),
      createQuickAction("Quick Check-Out", "swap-horizontal", "OpenCheckFlow"),
    ],
    custom: [
      createQuickAction("New Task", "checkmark-done", "NewTask"),
      createQuickAction("New Note", "create", "NewNote"),
    ],
  };

  const savedLayouts: DashboardLayout[] = [
    {
      id: createId("layout"),
      name: "Default",
      widgetIds: baseWidgets[mode].map((widget) => widget.id),
    },
  ];

  return {
    id: workspaceId,
    ownerId,
    name: name || `${workspaceModeLabels[mode]} Workspace`,
    mode,
    modules: baseModules[mode],
    dashboardWidgets: baseWidgets[mode],
    quickActions: baseQuickActions[mode],
    customFields: {
      vehicles: [],
      bookings: [],
      customers: [],
      tasks: [],
    },
    savedLayouts,
    activeLayoutId: savedLayouts[0].id,
    createdAt: now,
    updatedAt: now,
  };
}
