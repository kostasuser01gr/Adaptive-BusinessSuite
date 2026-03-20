export interface TodayTask {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  dueDate?: string | Date | null;
}

export interface TodayBooking {
  id: string;
  status: string;
  customerId?: string | null;
  vehicleId?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}

export interface TodayMaintenance {
  id: string;
  status: string;
  type: string;
  vehicleId?: string | null;
  scheduledDate?: string | Date | null;
}

export interface TodayNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type?: string;
  createdAt?: string | Date;
}

export interface TodaySuggestion {
  title: string;
  description?: string;
  action?: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "urgent" | "watch" | "calm";
  label: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  when: Date | null;
  label: string;
}

function asDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatWhen(date: Date | null, fallback: string): string {
  if (!date) return fallback;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const priorityWeight: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function buildAttentionStack({
  tasks,
  bookings,
  maintenance,
  notifications,
}: {
  tasks: TodayTask[];
  bookings: TodayBooking[];
  maintenance: TodayMaintenance[];
  notifications: TodayNotification[];
}): AttentionItem[] {
  const today = startOfToday();

  const alertItems = notifications
    .filter((notification) => !notification.read)
    .slice(0, 3)
    .map((notification) => ({
      id: `notification-${notification.id}`,
      title: notification.title,
      detail: notification.message,
      href: "/today",
      tone: "watch" as const,
      label: "Unread alert",
    }));

  const taskItems = tasks
    .filter((task) => task.status !== "done")
    .sort((left, right) => {
      const leftPriority = priorityWeight[left.priority || "low"] ?? 3;
      const rightPriority = priorityWeight[right.priority || "low"] ?? 3;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      const leftDue = asDate(left.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDue =
        asDate(right.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftDue - rightDue;
    })
    .slice(0, 4)
    .map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      detail:
        task.priority === "high"
          ? "High priority task waiting in the queue."
          : "Open task ready for execution.",
      href: "/tasks",
      tone: task.priority === "high" ? ("urgent" as const) : ("watch" as const),
      label: task.priority ? `${task.priority} priority` : "Open task",
    }));

  const bookingItems = bookings
    .filter((booking) => booking.status === "active" || booking.status === "pending")
    .sort((left, right) => {
      const leftStart = asDate(left.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightStart =
        asDate(right.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftStart - rightStart;
    })
    .slice(0, 3)
    .map((booking) => {
      const endDate = asDate(booking.endDate);
      const tone =
        endDate && endDate.getTime() <= today.getTime() + 24 * 60 * 60 * 1000
          ? "urgent"
          : "watch";

      return {
        id: `booking-${booking.id}`,
        title:
          booking.status === "active"
            ? "Active booking needs supervision"
            : "Pending booking needs confirmation",
        detail: `${booking.status} · ${formatWhen(asDate(booking.startDate), "No date")} → ${formatWhen(endDate, "Open end")}`,
        href: "/bookings",
        tone: tone as AttentionItem["tone"],
        label: booking.status === "active" ? "Live booking" : "Pending booking",
      };
    });

  const maintenanceItems = maintenance
    .filter((record) => record.status !== "completed")
    .sort((left, right) => {
      const leftDate =
        asDate(left.scheduledDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDate =
        asDate(right.scheduledDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    })
    .slice(0, 3)
    .map((record) => ({
      id: `maintenance-${record.id}`,
      title: `${record.type} still needs closure`,
      detail: `Scheduled ${formatWhen(asDate(record.scheduledDate), "without a date")}`,
      href: "/maintenance",
      tone: "watch" as const,
      label: "Maintenance",
    }));

  return [...alertItems, ...taskItems, ...bookingItems, ...maintenanceItems].slice(
    0,
    6,
  );
}

export function buildSchedule({
  bookings,
  maintenance,
}: {
  bookings: TodayBooking[];
  maintenance: TodayMaintenance[];
}): ScheduleItem[] {
  const bookingItems = bookings
    .filter((booking) => booking.status !== "completed" && booking.status !== "cancelled")
    .map((booking) => ({
      id: `booking-${booking.id}`,
      title:
        booking.status === "active" ? "Live rental block" : "Upcoming booking",
      detail:
        booking.status === "active"
          ? `Return target ${formatWhen(asDate(booking.endDate), "Open-ended")}`
          : `Starts ${formatWhen(asDate(booking.startDate), "unscheduled")}`,
      href: "/bookings",
      when: asDate(booking.startDate) ?? asDate(booking.endDate),
      label: "Bookings",
    }));

  const maintenanceItems = maintenance
    .filter((record) => record.status !== "completed")
    .map((record) => ({
      id: `maintenance-${record.id}`,
      title: `${record.type} service window`,
      detail: `Maintenance queue · ${record.status}`,
      href: "/maintenance",
      when: asDate(record.scheduledDate),
      label: "Maintenance",
    }));

  return [...bookingItems, ...maintenanceItems]
    .sort((left, right) => {
      const leftWhen = left.when?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightWhen = right.when?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftWhen - rightWhen;
    })
    .slice(0, 6);
}

export function describeSuggestionCount(suggestions: TodaySuggestion[]): string {
  if (suggestions.length === 0) {
    return "No proactive suggestions right now.";
  }
  if (suggestions.length === 1) {
    return "1 active suggestion is ready for review.";
  }
  return `${suggestions.length} active suggestions are ready for review.`;
}
