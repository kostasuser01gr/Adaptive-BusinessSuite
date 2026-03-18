import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  AssistantContextSnapshot,
  AssistantMemoryRecord,
  AssistantMessage,
  AssistantSuggestion,
  Booking,
  createId,
  createQuickAction,
  Customer,
  FinanceSummary,
  HistoryEntry,
  ModelSettings,
  ModuleDefinition,
  NoteRecord,
  NotificationItem,
  nowIso,
  QuickActionTarget,
  SessionState,
  TaskRecord,
  UserProfile,
  Vehicle,
  WorkspaceMode,
  WorkspaceRecord,
} from "../domain/models";
import { createSeedBundle } from "../domain/seed";
import { getModelAdapter } from "../services/assistant";
import {
  applySuggestionToWorkspace,
  cloneWorkspace,
  resetWorkspaceToPreset,
} from "../services/customization";
import { noopSyncGateway } from "../services/syncGateway";

type QuickCreateTarget = "vehicle" | "booking" | "customer" | "task" | "note";

interface UiState {
  commandBarOpen: boolean;
  quickCreateOpen: boolean;
  quickCreateTarget: QuickCreateTarget;
}

export interface AppStore {
  hasHydrated: boolean;
  ui: UiState;
  session: SessionState;
  users: UserProfile[];
  workspaces: WorkspaceRecord[];
  vehicles: Vehicle[];
  customers: Customer[];
  bookings: Booking[];
  maintenanceItems: import("../domain/models").MaintenanceItem[];
  tasks: TaskRecord[];
  notes: NoteRecord[];
  notifications: NotificationItem[];
  financeSummaries: FinanceSummary[];
  assistantMessages: AssistantMessage[];
  assistantSuggestions: AssistantSuggestion[];
  assistantMemory: AssistantMemoryRecord[];
  history: HistoryEntry[];
  modelSettings: ModelSettings;
  setHasHydrated: (value: boolean) => void;
  initializeDemoData: () => void;
  register: (
    username: string,
    displayName: string,
    password: string,
  ) => { ok: boolean; error?: string };
  login: (
    username: string,
    password: string,
  ) => { ok: boolean; error?: string };
  logout: () => void;
  completeOnboarding: (mode: WorkspaceMode, workspaceName: string) => void;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (mode: WorkspaceMode, workspaceName: string) => void;
  resetActiveWorkspaceToPreset: () => void;
  setCommandBarOpen: (open: boolean) => void;
  setQuickCreateOpen: (open: boolean, target?: QuickCreateTarget) => void;
  addVehicle: (payload: {
    name: string;
    plate: string;
    category: string;
  }) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;
  addCustomer: (payload: {
    name: string;
    phone: string;
    email: string;
  }) => void;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  addBooking: (payload: {
    vehicleId: string;
    customerId: string;
    pickupAt: string;
    dropoffAt: string;
    amount: number;
    pickupLocation: string;
    dropoffLocation: string;
  }) => string | null;
  extendBooking: (bookingId: string, days: number) => void;
  markBookingReturned: (bookingId: string) => void;
  addMaintenanceItem: (payload: {
    vehicleId: string;
    title: string;
    urgency: "low" | "medium" | "high";
    dueOn: string;
  }) => void;
  resolveMaintenanceItem: (maintenanceId: string) => void;
  addTask: (title: string) => void;
  updateTaskStatus: (taskId: string, status: TaskRecord["status"]) => void;
  addNote: (title: string, content: string) => void;
  toggleNotePin: (noteId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  sendAssistantCommand: (
    command: string,
    source?: "text" | "voice",
  ) => Promise<void>;
  applySuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  rollbackHistoryEntry: (historyId: string) => void;
  setModelSettings: (updates: Partial<ModelSettings>) => void;
}

const initialModelSettings: ModelSettings = {
  activeProvider: "none",
  fallbackModeEnabled: true,
  activeModelLabel: "Deterministic local mode",
  capabilityProfile:
    "Command parsing, proposals, and rule-based recommendations",
  backendBaseUrl: "",
};

const initialUiState: UiState = {
  commandBarOpen: false,
  quickCreateOpen: false,
  quickCreateTarget: "booking",
};

function getActiveUser(state: Pick<AppStore, "session" | "users">) {
  return (
    state.users.find((user) => user.id === state.session.activeUserId) || null
  );
}

function getActiveWorkspace(state: Pick<AppStore, "session" | "workspaces">) {
  return (
    state.workspaces.find(
      (workspace) => workspace.id === state.session.activeWorkspaceId,
    ) || null
  );
}

function summarizeContext(
  state: AppStore,
  workspace: WorkspaceRecord,
): AssistantContextSnapshot {
  const todayKey = new Date().toDateString();
  return {
    workspace,
    todayReturnsCount: state.bookings.filter(
      (booking) =>
        booking.workspaceId === workspace.id &&
        new Date(booking.dropoffAt).toDateString() === todayKey &&
        booking.status !== "returned",
    ).length,
    activeBookingsCount: state.bookings.filter(
      (booking) =>
        booking.workspaceId === workspace.id &&
        (booking.status === "active" || booking.status === "late"),
    ).length,
    availableVehiclesCount: state.vehicles.filter(
      (vehicle) =>
        vehicle.workspaceId === workspace.id && vehicle.status === "available",
    ).length,
    overdueTasksCount: state.tasks.filter(
      (task) =>
        task.workspaceId === workspace.id &&
        task.status !== "done" &&
        new Date(task.dueOn) < new Date(),
    ).length,
  };
}

function workspaceNameForMode(mode: WorkspaceMode) {
  if (mode === "rental") return "Car Rental Workspace";
  if (mode === "personal") return "Personal Workspace";
  if (mode === "hybrid") return "Hybrid Workspace";
  return "Custom Workspace";
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      ui: initialUiState,
      session: { activeUserId: null, activeWorkspaceId: null },
      users: [],
      workspaces: [],
      vehicles: [],
      customers: [],
      bookings: [],
      maintenanceItems: [],
      tasks: [],
      notes: [],
      notifications: [],
      financeSummaries: [],
      assistantMessages: [],
      assistantSuggestions: [],
      assistantMemory: [],
      history: [],
      modelSettings: initialModelSettings,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      initializeDemoData: () => {
        const state = get();
        if (!state.modelSettings.activeModelLabel) {
          set({ modelSettings: initialModelSettings });
        }
      },
      register: (username, displayName, password) => {
        const existing = get().users.find(
          (user) => user.username.toLowerCase() === username.toLowerCase(),
        );
        if (existing) {
          return { ok: false, error: "Username already exists locally." };
        }

        const user: UserProfile = {
          id: createId("user"),
          username,
          displayName,
          password,
          onboardingComplete: false,
          createdAt: nowIso(),
        };

        set((state) => ({
          users: [...state.users, user],
          session: { activeUserId: user.id, activeWorkspaceId: null },
        }));

        return { ok: true };
      },
      login: (username, password) => {
        const user = get().users.find(
          (candidate) =>
            candidate.username.toLowerCase() === username.toLowerCase() &&
            candidate.password === password,
        );
        if (!user) {
          return { ok: false, error: "Invalid local credentials." };
        }

        const firstWorkspace =
          get().workspaces.find((workspace) => workspace.ownerId === user.id) ||
          null;
        set({
          session: {
            activeUserId: user.id,
            activeWorkspaceId: firstWorkspace?.id ?? null,
          },
        });
        return { ok: true };
      },
      logout: () =>
        set({
          session: { activeUserId: null, activeWorkspaceId: null },
          ui: initialUiState,
        }),
      completeOnboarding: (mode, workspaceName) => {
        const user = getActiveUser(get());
        if (!user) return;

        const seed = createSeedBundle(
          user.id,
          mode,
          workspaceName || workspaceNameForMode(mode),
        );
        const seededUser = { ...user, onboardingComplete: true };

        set((state) => ({
          users: state.users.map((candidate) =>
            candidate.id === user.id ? seededUser : candidate,
          ),
          session: {
            activeUserId: user.id,
            activeWorkspaceId: seed.workspace.id,
          },
          workspaces: [...state.workspaces, seed.workspace],
          vehicles: [...state.vehicles, ...seed.vehicles],
          customers: [...state.customers, ...seed.customers],
          bookings: [...state.bookings, ...seed.bookings],
          maintenanceItems: [
            ...state.maintenanceItems,
            ...seed.maintenanceItems,
          ],
          tasks: [...state.tasks, ...seed.tasks],
          notes: [...state.notes, ...seed.notes],
          notifications: [...state.notifications, ...seed.notifications],
          financeSummaries: [...state.financeSummaries, seed.finance],
          assistantMessages: [
            ...state.assistantMessages,
            ...seed.assistantMessages,
          ],
          assistantMemory: [...state.assistantMemory, ...seed.assistantMemory],
          history: [
            ...state.history,
            {
              id: createId("history"),
              workspaceId: seed.workspace.id,
              type: "workspace-created",
              title: "Workspace created",
              description: `Initialized ${seed.workspace.name} from the ${mode} preset.`,
              createdAt: nowIso(),
            },
          ],
        }));
      },
      switchWorkspace: (workspaceId) =>
        set((state) => ({
          session: { ...state.session, activeWorkspaceId: workspaceId },
        })),
      createWorkspace: (mode, workspaceName) => {
        const user = getActiveUser(get());
        if (!user) return;
        const seed = createSeedBundle(
          user.id,
          mode,
          workspaceName || workspaceNameForMode(mode),
        );

        set((state) => ({
          workspaces: [...state.workspaces, seed.workspace],
          vehicles: [...state.vehicles, ...seed.vehicles],
          customers: [...state.customers, ...seed.customers],
          bookings: [...state.bookings, ...seed.bookings],
          maintenanceItems: [
            ...state.maintenanceItems,
            ...seed.maintenanceItems,
          ],
          tasks: [...state.tasks, ...seed.tasks],
          notes: [...state.notes, ...seed.notes],
          notifications: [...state.notifications, ...seed.notifications],
          financeSummaries: [...state.financeSummaries, seed.finance],
          assistantMessages: [
            ...state.assistantMessages,
            ...seed.assistantMessages,
          ],
          assistantMemory: [...state.assistantMemory, ...seed.assistantMemory],
          session: { ...state.session, activeWorkspaceId: seed.workspace.id },
          history: [
            ...state.history,
            {
              id: createId("history"),
              workspaceId: seed.workspace.id,
              type: "workspace-created",
              title: "Workspace created",
              description: `Created ${seed.workspace.name} from the ${mode} preset.`,
              createdAt: nowIso(),
            },
          ],
        }));
      },
      resetActiveWorkspaceToPreset: () => {
        const workspace = getActiveWorkspace(get());
        if (!workspace) return;
        const snapshot = cloneWorkspace(workspace);
        const reset = resetWorkspaceToPreset(workspace);
        set((state) => ({
          workspaces: state.workspaces.map((candidate) =>
            candidate.id === reset.id ? reset : candidate,
          ),
          history: [
            ...state.history,
            {
              id: createId("history"),
              workspaceId: reset.id,
              type: "preset-reset",
              title: "Workspace reset to preset",
              description: `Reset ${reset.name} to the ${reset.mode} preset.`,
              createdAt: nowIso(),
              previousWorkspaceSnapshot: snapshot,
            },
          ],
        }));
      },
      setCommandBarOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, commandBarOpen: open } })),
      setQuickCreateOpen: (open, target) =>
        set((state) => ({
          ui: {
            ...state.ui,
            quickCreateOpen: open,
            quickCreateTarget: target ?? state.ui.quickCreateTarget,
          },
        })),
      addVehicle: ({ name, plate, category }) => {
        const workspace = getActiveWorkspace(get());
        if (!workspace) return;
        const vehicle: Vehicle = {
          id: createId("vehicle"),
          workspaceId: workspace.id,
          name,
          plate,
          status: "available",
          mileage: 0,
          availabilityLabel: "Ready now",
          notes: "",
          serviceStatus: "Healthy",
          maintenanceDueOn: nowIso(),
          category,
        };
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set((state) => ({ vehicles: [vehicle, ...state.vehicles] }));
      },
      updateVehicle: (vehicleId, updates) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set((state) => ({
          vehicles: state.vehicles.map((vehicle) =>
            vehicle.id === vehicleId ? { ...vehicle, ...updates } : vehicle,
          ),
        }));
      },
      addCustomer: ({ name, phone, email }) => {
        const workspace = getActiveWorkspace(get());
        if (!workspace) return;
        const customer: Customer = {
          id: createId("customer"),
          workspaceId: workspace.id,
          name,
          phone,
          email,
          tag: "standard",
          notes: "",
        };
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set((state) => ({ customers: [customer, ...state.customers] }));
      },
      updateCustomer: (customerId, updates) =>
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === customerId ? { ...customer, ...updates } : customer,
          ),
        })),
      addBooking: ({
        vehicleId,
        customerId,
        pickupAt,
        dropoffAt,
        amount,
        pickupLocation,
        dropoffLocation,
      }) => {
        const workspace = getActiveWorkspace(get());
        if (!workspace) return "No active workspace.";

        const overlap = get().bookings.some(
          (booking) =>
            booking.workspaceId === workspace.id &&
            booking.vehicleId === vehicleId &&
            booking.status !== "returned" &&
            new Date(booking.pickupAt) <= new Date(dropoffAt) &&
            new Date(booking.dropoffAt) >= new Date(pickupAt),
        );

        const booking: Booking = {
          id: createId("booking"),
          workspaceId: workspace.id,
          vehicleId,
          customerId,
          status: overlap ? "draft" : "confirmed",
          pickupAt,
          dropoffAt,
          amount,
          pickupLocation,
          dropoffLocation,
          notes: overlap ? "Conflict warning placeholder triggered." : "",
        };

        Haptics.notificationAsync(
          overlap
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success,
        );
        set((state) => ({
          bookings: [booking, ...state.bookings],
          notifications: overlap
            ? [
                {
                  id: createId("alert"),
                  workspaceId: workspace.id,
                  title: "Booking conflict warning",
                  body: "The selected vehicle already has an overlapping booking. Review before confirming.",
                  kind: "alert",
                  read: false,
                  createdAt: nowIso(),
                },
                ...state.notifications,
              ]
            : state.notifications,
        }));

        return overlap
          ? "Conflict warning: overlapping booking detected."
          : null;
      },
      extendBooking: (bookingId, days) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  dropoffAt: new Date(
                    new Date(booking.dropoffAt).getTime() +
                      days * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                }
              : booking,
          ),
        }));
      },
      markBookingReturned: (bookingId) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "returned" }
              : booking,
          ),
          vehicles: state.vehicles.map((vehicle) => {
            const booking = state.bookings.find(
              (candidate) => candidate.id === bookingId,
            );
            if (!booking) return vehicle;
            return vehicle.id === booking.vehicleId
              ? {
                  ...vehicle,
                  status: "available",
                  availabilityLabel: "Ready now",
                }
              : vehicle;
          }),
        }));
      },
      addMaintenanceItem: ({ vehicleId, title, urgency, dueOn }) => {
        const workspace = getActiveWorkspace(get());
        if (!workspace) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set((state) => ({
          maintenanceItems: [
            {
              id: createId("maintenance"),
              workspaceId: workspace.id,
              vehicleId,
              title,
              dueOn,
              status: "scheduled",
              urgency,
              notes: "",
            },
            ...state.maintenanceItems,
          ],
        }));
      },
      resolveMaintenanceItem: (maintenanceId) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set((state) => ({
          maintenanceItems: state.maintenanceItems.map((item) =>
            item.id === maintenanceId ? { ...item, status: "resolved" } : item,
          ),
        }));
      },
      addTask: (title) => {
        const workspace = getActiveWorkspace(get());
        if (!workspace) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set((state) => ({
          tasks: [
            {
              id: createId("task"),
              workspaceId: workspace.id,
              title,
              status: "todo",
              dueOn: nowIso(),
              assigneeLabel: "Unassigned placeholder",
            },
            ...state.tasks,
          ],
        }));
      },
      updateTaskStatus: (taskId, status) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, status } : task,
          ),
        }));
      },
      addNote: (title, content) => {
        const workspace = getActiveWorkspace(get());
        if (!workspace) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set((state) => ({
          notes: [
            {
              id: createId("note"),
              workspaceId: workspace.id,
              title,
              content,
              category: "ops",
              pinned: false,
              createdAt: nowIso(),
            },
            ...state.notes,
          ],
        }));
      },
      toggleNotePin: (noteId) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId ? { ...note, pinned: !note.pinned } : note,
          ),
        })),
      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification,
          ),
        })),
      sendAssistantCommand: async (command, source = "text") => {
        const state = get();
        const workspace = getActiveWorkspace(state);
        if (!workspace) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const userMessage: AssistantMessage = {
          id: createId("message"),
          workspaceId: workspace.id,
          role: "user",
          content: command,
          createdAt: nowIso(),
        };

        const interpretation = await getModelAdapter(
          state.modelSettings,
        ).interpret(command, summarizeContext(state, workspace), source);
        const assistantMessage: AssistantMessage = {
          id: createId("message"),
          workspaceId: workspace.id,
          role: "assistant",
          content: interpretation.reply,
          createdAt: nowIso(),
        };

        set((current) => ({
          assistantMessages: [
            ...current.assistantMessages,
            userMessage,
            assistantMessage,
          ],
          assistantSuggestions: [
            ...current.assistantSuggestions,
            ...interpretation.suggestions,
          ],
          assistantMemory: [
            ...current.assistantMemory,
            ...(interpretation.memoryUpdates || []),
          ],
        }));
      },
      applySuggestion: (suggestionId) => {
        const state = get();
        const suggestion = state.assistantSuggestions.find(
          (candidate) => candidate.id === suggestionId,
        );
        const workspace = getActiveWorkspace(state);
        if (!suggestion || !workspace) return;

        const snapshot = cloneWorkspace(workspace);
        const updatedWorkspace = applySuggestionToWorkspace(
          workspace,
          suggestion,
        );

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set((current) => ({
          workspaces: current.workspaces.map((candidate) =>
            candidate.id === updatedWorkspace.id ? updatedWorkspace : candidate,
          ),
          assistantSuggestions: current.assistantSuggestions.map((candidate) =>
            candidate.id === suggestionId
              ? { ...candidate, status: "applied" }
              : candidate,
          ),
          assistantMessages: [
            ...current.assistantMessages,
            {
              id: createId("message"),
              workspaceId: workspace.id,
              role: "assistant",
              content: `Applied: ${suggestion.title}. The change is saved in history and can be rolled back.`,
              createdAt: nowIso(),
            },
          ],
          history: [
            ...current.history,
            {
              id: createId("history"),
              workspaceId: workspace.id,
              type: "suggestion-applied",
              title: suggestion.title,
              description: suggestion.description,
              createdAt: nowIso(),
              previousWorkspaceSnapshot: snapshot,
            },
          ],
        }));

        void noopSyncGateway.pushWorkspaceSnapshot(updatedWorkspace);
      },
      dismissSuggestion: (suggestionId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set((state) => ({
          assistantSuggestions: state.assistantSuggestions.map((candidate) =>
            candidate.id === suggestionId
              ? { ...candidate, status: "dismissed" }
              : candidate,
          ),
        }));
      },
      rollbackHistoryEntry: (historyId) => {
        const entry = get().history.find(
          (candidate) => candidate.id === historyId,
        );
        if (!entry?.previousWorkspaceSnapshot) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === entry.workspaceId
              ? entry.previousWorkspaceSnapshot!
              : workspace,
          ),
          history: [
            ...state.history,
            {
              id: createId("history"),
              workspaceId: entry.workspaceId,
              type: "rollback",
              title: `Rollback: ${entry.title}`,
              description:
                "Restored the previous workspace configuration snapshot.",
              createdAt: nowIso(),
            },
          ],
        }));
      },
      setModelSettings: (updates) =>
        set((state) => ({
          modelSettings: { ...state.modelSettings, ...updates },
        })),
    }),
    {
      name: "adaptive-business-suite-mobile",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        users: state.users,
        workspaces: state.workspaces,
        vehicles: state.vehicles,
        customers: state.customers,
        bookings: baseFilter(state.bookings),
        maintenanceItems: state.maintenanceItems,
        tasks: state.tasks,
        notes: state.notes,
        notifications: state.notifications,
        financeSummaries: state.financeSummaries,
        assistantMessages: state.assistantMessages,
        assistantSuggestions: state.assistantSuggestions,
        assistantMemory: state.assistantMemory,
        history: state.history,
        modelSettings: state.modelSettings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

function baseFilter(items: any[]) {
  return items;
}
