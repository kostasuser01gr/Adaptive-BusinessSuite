import { addDays, addHours, startOfDay, subDays } from "date-fns";
import {
  AssistantMessage,
  AssistantMemoryRecord,
  Booking,
  createId,
  createWorkspacePreset,
  Customer,
  FinanceSummary,
  MaintenanceItem,
  NoteRecord,
  NotificationItem,
  nowIso,
  TaskRecord,
  UserProfile,
  Vehicle,
  WorkspaceMode,
  WorkspaceRecord,
} from "./models";

export interface SeedBundle {
  user: UserProfile;
  workspace: WorkspaceRecord;
  vehicles: Vehicle[];
  customers: Customer[];
  bookings: Booking[];
  maintenanceItems: MaintenanceItem[];
  tasks: TaskRecord[];
  notes: NoteRecord[];
  notifications: NotificationItem[];
  finance: FinanceSummary;
  assistantMessages: AssistantMessage[];
  assistantMemory: AssistantMemoryRecord[];
}

export function createSeedBundle(
  ownerId: string,
  mode: WorkspaceMode,
  workspaceName?: string,
): SeedBundle {
  const workspace = createWorkspacePreset(mode, ownerId, workspaceName);
  const today = startOfDay(new Date());

  const vehicles: Vehicle[] = [
    {
      id: createId("vehicle"),
      workspaceId: workspace.id,
      name: "Tesla Model 3",
      plate: "XNZ-341",
      status: "available",
      mileage: 42180,
      availabilityLabel: "Ready now",
      notes: "Fast charger at office lot.",
      serviceStatus: "Healthy",
      maintenanceDueOn: addDays(today, 6).toISOString(),
      category: "sedan",
    },
    {
      id: createId("vehicle"),
      workspaceId: workspace.id,
      name: "Peugeot 208",
      plate: "KTB-918",
      status: "rented",
      mileage: 58700,
      availabilityLabel: "Returns today",
      notes: "Airport handoff package.",
      serviceStatus: "Oil change next week",
      maintenanceDueOn: addDays(today, 3).toISOString(),
      category: "compact",
    },
    {
      id: createId("vehicle"),
      workspaceId: workspace.id,
      name: "Ford Transit",
      plate: "VAN-071",
      status: "maintenance",
      mileage: 88210,
      availabilityLabel: "In workshop",
      notes: "Brake check scheduled.",
      serviceStatus: "Needs front pads",
      maintenanceDueOn: today.toISOString(),
      category: "van",
    },
  ];

  const customers: Customer[] = [
    {
      id: createId("customer"),
      workspaceId: workspace.id,
      name: "Maria Ioannou",
      phone: "+30 694 111 2222",
      email: "maria@example.com",
      tag: "vip",
      notes: "Prefers airport pickup and automatic transmission.",
    },
    {
      id: createId("customer"),
      workspaceId: workspace.id,
      name: "Nikos Petrou",
      phone: "+30 697 333 4455",
      email: "nikos@example.com",
      tag: "standard",
      notes: "Returning with family on Sunday.",
    },
    {
      id: createId("customer"),
      workspaceId: workspace.id,
      name: "Alex Reed",
      phone: "+44 7700 123456",
      email: "alex@example.com",
      tag: "risk",
      notes: "Deposit reminder required before handoff.",
    },
  ];

  const bookings: Booking[] = [
    {
      id: createId("booking"),
      workspaceId: workspace.id,
      vehicleId: vehicles[1].id,
      customerId: customers[0].id,
      status: "active",
      pickupAt: addHours(today, 9).toISOString(),
      dropoffAt: addHours(today, 18).toISOString(),
      amount: 180,
      pickupLocation: "Athens Airport",
      dropoffLocation: "Athens Airport",
      notes: "Upsell child seat at return.",
    },
    {
      id: createId("booking"),
      workspaceId: workspace.id,
      vehicleId: vehicles[0].id,
      customerId: customers[1].id,
      status: "confirmed",
      pickupAt: addHours(addDays(today, 1), 10).toISOString(),
      dropoffAt: addHours(addDays(today, 4), 10).toISOString(),
      amount: 320,
      pickupLocation: "City Office",
      dropoffLocation: "City Office",
      notes: "Weekend package confirmed.",
    },
    {
      id: createId("booking"),
      workspaceId: workspace.id,
      vehicleId: vehicles[0].id,
      customerId: customers[2].id,
      status: "late",
      pickupAt: subDays(today, 3).toISOString(),
      dropoffAt: subDays(today, 1).toISOString(),
      amount: 220,
      pickupLocation: "Piraeus Port",
      dropoffLocation: "Piraeus Port",
      notes: "Late return follow-up required.",
    },
  ];

  const maintenanceItems: MaintenanceItem[] = [
    {
      id: createId("maintenance"),
      workspaceId: workspace.id,
      vehicleId: vehicles[2].id,
      title: "Brake pad replacement",
      dueOn: today.toISOString(),
      status: "in-progress",
      urgency: "high",
      notes: "Workshop promised update by 17:00.",
    },
    {
      id: createId("maintenance"),
      workspaceId: workspace.id,
      vehicleId: vehicles[1].id,
      title: "Oil change",
      dueOn: addDays(today, 3).toISOString(),
      status: "scheduled",
      urgency: "medium",
      notes: "Bundle with interior detailing.",
    },
  ];

  const tasks: TaskRecord[] = [
    {
      id: createId("task"),
      workspaceId: workspace.id,
      title: "Confirm airport return for Maria",
      status: "todo",
      dueOn: addHours(today, 16).toISOString(),
      assigneeLabel: "Ops desk",
    },
    {
      id: createId("task"),
      workspaceId: workspace.id,
      title: "Review late return workflow",
      status: "doing",
      dueOn: addDays(today, 1).toISOString(),
      assigneeLabel: "Founder",
    },
    {
      id: createId("task"),
      workspaceId: workspace.id,
      title: "Refresh Tesla listing photos",
      status: "done",
      dueOn: subDays(today, 1).toISOString(),
      assigneeLabel: "Marketing placeholder",
    },
  ];

  const notes: NoteRecord[] = [
    {
      id: createId("note"),
      workspaceId: workspace.id,
      title: "Airport handoff notes",
      content: "Keep the handoff envelope in glovebox before 08:30.",
      category: "ops",
      pinned: true,
      createdAt: nowIso(),
    },
    {
      id: createId("note"),
      workspaceId: workspace.id,
      title: "VIP preferences",
      content: "Maria prefers chilled water and no paper receipts.",
      category: "customer",
      pinned: true,
      createdAt: nowIso(),
    },
    {
      id: createId("note"),
      workspaceId: workspace.id,
      title: "Fuel cost checkpoint",
      content: "Compare airport vs city refuel cost this week.",
      category: "finance",
      pinned: false,
      createdAt: nowIso(),
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: createId("alert"),
      workspaceId: workspace.id,
      title: "Returns due today",
      body: "Two vehicles are expected back before 18:00.",
      kind: "alert",
      read: false,
      createdAt: nowIso(),
    },
    {
      id: createId("alert"),
      workspaceId: workspace.id,
      title: "Maintenance update",
      body: "Ford Transit brake job is still in progress.",
      kind: "reminder",
      read: false,
      createdAt: nowIso(),
    },
  ];

  const finance: FinanceSummary = {
    id: createId("finance"),
    workspaceId: workspace.id,
    dailyRevenue: 180,
    monthToDateRevenue: 4860,
    outstandingPayments: 240,
    estimatedCosts: 910,
  };

  const assistantMessages: AssistantMessage[] = [
    {
      id: createId("message"),
      workspaceId: workspace.id,
      role: "assistant",
      content:
        "Welcome to your adaptive operating system. I can help you shape modules, quick actions, fields, workflows, and the dashboard without needing a live model connection.",
      createdAt: nowIso(),
    },
  ];

  const assistantMemory: AssistantMemoryRecord[] = [
    {
      id: createId("memory"),
      workspaceId: workspace.id,
      key: "preferred_mode",
      value: mode,
    },
    {
      id: createId("memory"),
      workspaceId: workspace.id,
      key: "operator_goal",
      value: "Move faster with less friction.",
    },
  ];

  const user: UserProfile = {
    id: ownerId,
    username: "",
    passwordHash: "",
    passwordSalt: "",
    displayName: "",
    onboardingComplete: true,
    createdAt: nowIso(),
  };

  return {
    user,
    workspace,
    vehicles,
    customers,
    bookings,
    maintenanceItems,
    tasks,
    notes,
    notifications,
    finance,
    assistantMessages,
    assistantMemory,
  };
}
