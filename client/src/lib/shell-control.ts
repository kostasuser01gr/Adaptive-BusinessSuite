import type { Ontology } from "@shared/ontologies";

type StatsPayload = {
  bookings?: {
    active?: number;
    pending?: number;
  };
  tasks?: {
    pending?: number;
    done?: number;
  };
  maintenance?: {
    pending?: number;
  };
  fleet?: {
    total?: number;
    rented?: number;
  };
  utilization?: number;
};

export type ShellPostureTone = "stable" | "watch" | "attention" | "critical";

export interface ShellPosture {
  tone: ShellPostureTone;
  label: string;
  summary: string;
  primaryFocus: string;
}

export interface ShellSignal {
  id: "alerts" | "tasks" | "events" | "maintenance";
  label: string;
  count: number;
  description: string;
  href: string;
  tone: ShellPostureTone;
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function pluralize(label: string, total: number): string {
  return total === 1 ? label : `${label}s`;
}

export function deriveShellPosture({
  stats,
  unreadNotificationsCount,
}: {
  stats?: StatsPayload | null;
  unreadNotificationsCount?: number;
}): ShellPosture {
  const unread = count(unreadNotificationsCount);
  const pendingTasks = count(stats?.tasks?.pending);
  const pendingEvents = count(stats?.bookings?.pending);
  const pendingMaintenance = count(stats?.maintenance?.pending);
  const activeEvents = count(stats?.bookings?.active);
  const signalLoad =
    unread * 3 + pendingMaintenance * 2 + pendingTasks * 2 + pendingEvents;

  if (signalLoad >= 12 || unread >= 3 || pendingTasks >= 6 || pendingMaintenance >= 3) {
    return {
      tone: "critical",
      label: "Critical",
      summary: "Multiple queues need intervention now before the day slips.",
      primaryFocus: unread > 0 ? "Clear alerts" : "Stabilize task load",
    };
  }

  if (signalLoad >= 6 || unread > 0 || pendingTasks >= 3 || pendingMaintenance >= 2) {
    return {
      tone: "attention",
      label: "Attention",
      summary: "The workspace is carrying active pressure across live queues.",
      primaryFocus: unread > 0 ? "Review unread alerts" : "Reduce active backlog",
    };
  }

  if (signalLoad >= 2 || pendingEvents > 0 || activeEvents > 0) {
    return {
      tone: "watch",
      label: "Watch",
      summary: "The shell is steady, with a few live items ready for review.",
      primaryFocus:
        pendingTasks > 0
          ? "Close pending tasks"
          : activeEvents > 0
            ? "Track live work"
            : "Review the next queue",
    };
  }

  return {
    tone: "stable",
    label: "Stable",
    summary: "Queues are quiet and the workspace is ready for the next move.",
    primaryFocus: "Open Today",
  };
}

export function buildShellSignals({
  activeOntology,
  stats,
  unreadNotificationsCount,
}: {
  activeOntology: Ontology;
  stats?: StatsPayload | null;
  unreadNotificationsCount?: number;
}): ShellSignal[] {
  const unread = count(unreadNotificationsCount);
  const pendingTasks = count(stats?.tasks?.pending);
  const pendingEvents = count(stats?.bookings?.pending);
  const pendingMaintenance = count(stats?.maintenance?.pending);
  const eventName = activeOntology.eventName.toLowerCase();

  return [
    {
      id: "alerts",
      label: "Alerts",
      count: unread,
      description:
        unread > 0
          ? `${unread} unread ${pluralize("alert", unread)}`
          : "Notification stack is quiet",
      href: "/",
      tone: unread > 0 ? "attention" : "stable",
    },
    {
      id: "tasks",
      label: "Tasks",
      count: pendingTasks,
      description:
        pendingTasks > 0
          ? `${pendingTasks} open ${pluralize("task", pendingTasks)}`
          : "Task queue is clear",
      href: "/tasks",
      tone: pendingTasks >= 3 ? "attention" : pendingTasks > 0 ? "watch" : "stable",
    },
    {
      id: "events",
      label: pluralize(eventName, 2),
      count: pendingEvents,
      description:
        pendingEvents > 0
          ? `${pendingEvents} pending ${pluralize(eventName, pendingEvents)}`
          : `${activeOntology.label} queue is quiet`,
      href: "/bookings",
      tone: pendingEvents >= 2 ? "attention" : pendingEvents > 0 ? "watch" : "stable",
    },
    {
      id: "maintenance",
      label: "Service",
      count: pendingMaintenance,
      description:
        pendingMaintenance > 0
          ? `${pendingMaintenance} scheduled ${pluralize("service", pendingMaintenance)}`
          : "Maintenance lane is clear",
      href: "/maintenance",
      tone:
        pendingMaintenance >= 2
          ? "attention"
          : pendingMaintenance > 0
            ? "watch"
            : "stable",
    },
  ];
}
