import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BellRing,
  Bot,
  CalendarClock,
  CheckSquare,
  Command,
  FileText,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/store";
import {
  buildAttentionStack,
  buildSchedule,
  describeSuggestionCount,
} from "@/lib/today";

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "No date";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TodayPage() {
  const {
    activeOntology,
    notifications,
    preferences,
    setCommandBarOpen,
    stats,
    suggestions,
    toggleChat,
    unreadNotificationsCount,
  } = useAppState();
  const [, setLocation] = useLocation();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: api.tasks.list,
  });
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: api.bookings.list,
  });
  const { data: maintenance = [], isLoading: maintenanceLoading } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: api.maintenance.list,
  });
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes"],
    queryFn: api.notes.list,
  });

  const attentionItems = useMemo(
    () =>
      buildAttentionStack({
        tasks,
        bookings,
        maintenance,
        notifications,
      }),
    [bookings, maintenance, notifications, tasks],
  );

  const scheduleItems = useMemo(
    () =>
      buildSchedule({
        bookings,
        maintenance,
      }),
    [bookings, maintenance],
  );

  const recentNotes = useMemo(
    () =>
      [...notes]
        .sort((left: any, right: any) => {
          const leftDate = new Date(
            left.updatedAt ?? left.createdAt ?? 0,
          ).getTime();
          const rightDate = new Date(
            right.updatedAt ?? right.createdAt ?? 0,
          ).getTime();
          return rightDate - leftDate;
        })
        .slice(0, 3),
    [notes],
  );

  const showSuggestions =
    preferences.dashboard.showSuggestions ||
    preferences.assistant.proactiveSuggestions;

  const statCards = [
    {
      label: `Active ${activeOntology.eventName.toLowerCase()}s`,
      value: String(stats?.bookings?.active ?? 0),
      detail: `${stats?.bookings?.pending ?? 0} pending next`,
      icon: CalendarClock,
    },
    {
      label: "Open tasks",
      value: String(stats?.tasks?.pending ?? 0),
      detail: `${stats?.tasks?.done ?? 0} completed`,
      icon: CheckSquare,
    },
    {
      label: "Unread alerts",
      value: String(unreadNotificationsCount),
      detail:
        unreadNotificationsCount > 0
          ? "Operator attention required"
          : "Notification stack is quiet",
      icon: BellRing,
    },
    {
      label: "Utilization",
      value: `${stats?.utilization ?? 0}%`,
      detail: `${stats?.fleet?.rented ?? 0} of ${stats?.fleet?.total ?? 0} assets active`,
      icon: TrendingUp,
    },
  ];

  const quickActions = [
    {
      label: `Review ${activeOntology.eventName.toLowerCase()}s`,
      description: "Move through the live booking and event queue.",
      href: "/bookings",
      icon: CalendarClock,
    },
    {
      label: "Open tasks",
      description: "Clear the operational backlog and close blockers.",
      href: "/tasks",
      icon: CheckSquare,
    },
    {
      label: "Maintenance lane",
      description: "Inspect service work before it slips into downtime.",
      href: "/maintenance",
      icon: Wrench,
    },
    {
      label: "Workspace dashboard",
      description: "Switch back to the module grid and live widgets.",
      href: "/",
      icon: LayoutDashboard,
    },
  ];

  const isLoading =
    tasksLoading || bookingsLoading || maintenanceLoading || notesLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            <Sparkles className="h-3.5 w-3.5" />
            Today
          </div>
          <div>
            <h1
              className="text-xl font-heading font-bold tracking-tight sm:text-3xl"
              data-testid="text-today-title"
            >
              Live operator board
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
              {preferences.dashboard.showGreeting
                ? `Start with the next actions across ${activeOntology.label.toLowerCase()}, queue pressure, and active follow-through.`
                : describeSuggestionCount(suggestions)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-white/10 bg-white/[0.02] text-xs"
            onClick={() => setCommandBarOpen(true)}
            data-testid="button-open-command-center"
          >
            <Command className="h-3.5 w-3.5 text-primary" />
            Command Center
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-white/10 bg-white/[0.02] text-xs"
            onClick={toggleChat}
            data-testid="button-open-today-assistant"
          >
            <Bot className="h-3.5 w-3.5 text-primary" />
            Open Assistant
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/[0.06] bg-card/40 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {card.label}
              </p>
              <card.icon className="h-4 w-4 text-primary/80" />
            </div>
            <p className="mt-3 text-2xl font-heading font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section
          className="rounded-3xl border border-white/[0.06] bg-card/40 p-5"
          data-testid="card-today-attention"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Attention stack
              </p>
              <h2 className="mt-2 text-lg font-heading font-semibold">
                What needs operator focus next
              </h2>
            </div>
            {isLoading && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                syncing
              </span>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {attentionItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-sm text-muted-foreground">
                The live queue is clear. Keep the workspace warm with notes,
                follow-ups, and assistant-driven planning.
              </div>
            ) : (
              attentionItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLocation(item.href)}
                  className="group flex w-full items-start justify-between gap-3 rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3 text-left transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          item.tone === "urgent"
                            ? "bg-rose-500/10 text-rose-300"
                            : item.tone === "watch"
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.06] bg-card/40 p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Command center
          </p>
          <h2 className="mt-2 text-lg font-heading font-semibold">
            Suggestions and launch lanes
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {describeSuggestionCount(suggestions)}
          </p>

          <div className="mt-5 space-y-3">
            {showSuggestions && suggestions.length > 0 ? (
              suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                <button
                  key={`${suggestion.title}-${index}`}
                  type="button"
                  onClick={() => {
                    if (typeof suggestion.action === "string") {
                      if (suggestion.action.startsWith("navigate:")) {
                        setLocation(suggestion.action.replace("navigate:", ""));
                        return;
                      }
                      if (suggestion.action.startsWith("command:")) {
                        toggleChat();
                        return;
                      }
                    }
                    toggleChat();
                  }}
                  className="w-full rounded-2xl border border-primary/10 bg-primary/[0.05] px-4 py-3 text-left transition-colors hover:bg-primary/[0.08]"
                  data-testid={`today-suggestion-${index}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{suggestion.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {suggestion.description || "Open the assistant for a guided follow-through."}
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-4 text-xs text-muted-foreground">
                Proactive AI suggestions are currently quiet. Open the assistant
                to compose a new action path or review the dashboard modules.
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Quick launches
              </p>
              <div className="mt-3 space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => setLocation(action.href)}
                    className="group flex w-full items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-white/[0.12]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                        <action.icon className="h-4 w-4 text-primary/80" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{action.label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section
          className="rounded-3xl border border-white/[0.06] bg-card/40 p-5"
          data-testid="card-today-schedule"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Live schedule
          </p>
          <h2 className="mt-2 text-lg font-heading font-semibold">
            Upcoming service windows and active commitments
          </h2>

          <div className="mt-5 space-y-3">
            {scheduleItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-sm text-muted-foreground">
                Nothing is scheduled yet. Use bookings, maintenance, or the
                command center to seed the next operational block.
              </div>
            ) : (
              scheduleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLocation(item.href)}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3 text-left transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(item.when)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.06] bg-card/40 p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Working memory
          </p>
          <h2 className="mt-2 text-lg font-heading font-semibold">
            Recent notes and captured context
          </h2>

          <div className="mt-5 space-y-3">
            {recentNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-sm text-muted-foreground">
                No notes are pinned yet. Capture quick context so the assistant
                and the workspace stay anchored.
              </div>
            ) : (
              recentNotes.map((note: any) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setLocation("/notes")}
                  className="group block w-full rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3 text-left transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary/80" />
                        <p className="text-sm font-semibold">
                          {note.title || "Untitled note"}
                        </p>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                        {note.content}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
