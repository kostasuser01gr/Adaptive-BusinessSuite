import { format, isSameDay, startOfDay } from "date-fns";
import { AppStore, useAppStore } from "./store";

function activeWorkspace(state: AppStore) {
  return (
    state.workspaces.find(
      (workspace) => workspace.id === state.session.activeWorkspaceId,
    ) || null
  );
}

export function useActiveWorkspace() {
  return useAppStore((state) => activeWorkspace(state));
}

export function useWorkspaceVehicles() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    return workspace
      ? state.vehicles.filter((vehicle) => vehicle.workspaceId === workspace.id)
      : [];
  });
}

export function useWorkspaceCustomers() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    return workspace
      ? state.customers.filter(
          (customer) => customer.workspaceId === workspace.id,
        )
      : [];
  });
}

export function useWorkspaceBookings() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    return workspace
      ? state.bookings.filter((booking) => booking.workspaceId === workspace.id)
      : [];
  });
}

export function useWorkspaceTasks() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    return workspace
      ? state.tasks.filter((task) => task.workspaceId === workspace.id)
      : [];
  });
}

export function useWorkspaceNotes() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    return workspace
      ? state.notes.filter((note) => note.workspaceId === workspace.id)
      : [];
  });
}

export function useWorkspaceMaintenance() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    return workspace
      ? state.maintenanceItems.filter(
          (item) => item.workspaceId === workspace.id,
        )
      : [];
  });
}

export function useWorkspaceNotifications() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    return workspace
      ? state.notifications.filter(
          (notification) => notification.workspaceId === workspace.id,
        )
      : [];
  });
}

export function useWorkspaceFinance() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    return workspace
      ? state.financeSummaries.find(
          (summary) => summary.workspaceId === workspace.id,
        ) || null
      : null;
  });
}

export function useDashboardSnapshot() {
  return useAppStore((state) => {
    const workspace = activeWorkspace(state);
    if (!workspace) return null;

    const today = startOfDay(new Date());
    const vehicles = state.vehicles.filter(
      (vehicle) => vehicle.workspaceId === workspace.id,
    );
    const bookings = state.bookings.filter(
      (booking) => booking.workspaceId === workspace.id,
    );
    const maintenance = state.maintenanceItems.filter(
      (item) => item.workspaceId === workspace.id,
    );
    const tasks = state.tasks.filter(
      (task) => task.workspaceId === workspace.id,
    );
    const notes = state.notes.filter(
      (note) => note.workspaceId === workspace.id,
    );
    const finance =
      state.financeSummaries.find(
        (summary) => summary.workspaceId === workspace.id,
      ) || null;
    const pendingSuggestions = state.assistantSuggestions.filter(
      (suggestion) =>
        suggestion.workspaceId === workspace.id &&
        suggestion.status === "pending",
    );

    const bookingsToday = bookings.filter((booking) =>
      isSameDay(new Date(booking.pickupAt), today),
    ).length;
    const returnsToday = bookings.filter(
      (booking) =>
        isSameDay(new Date(booking.dropoffAt), today) &&
        booking.status !== "returned",
    ).length;

    return {
      workspace,
      vehicles,
      bookings,
      maintenance,
      tasks,
      notes,
      finance,
      pendingSuggestions,
      stats: {
        bookingsToday,
        returnsToday,
        availableVehicles: vehicles.filter(
          (vehicle) => vehicle.status === "available",
        ).length,
        maintenanceDue: maintenance.filter((item) => item.status !== "resolved")
          .length,
        overdueTasks: tasks.filter(
          (task) => task.status !== "done" && new Date(task.dueOn) < new Date(),
        ).length,
      },
    };
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateLabel(value: string) {
  return format(new Date(value), "EEE d MMM");
}
