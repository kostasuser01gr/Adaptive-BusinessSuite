import React, { useMemo, useState } from "react";
import { useAppState } from "@/lib/store";
import {
  BellRing,
  CarFront,
  LayoutDashboard,
  Calendar,
  FileText,
  Settings,
  Bot,
  Briefcase,
  User,
  Wallet,
  LogOut,
  Menu,
  X,
  Wrench,
  CheckSquare,
  Users,
  ChevronDown,
  Sparkles,
  Shield,
  Pin,
  PinOff,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ontologies } from "@shared/ontologies";
import {
  buildShellRouteCatalog,
  getShellRouteKey,
  supportedShellRoutes,
  useShellMemory,
} from "@/lib/shell-memory";
import {
  buildShellSignals,
  deriveShellPosture,
  type ShellPostureTone,
} from "@/lib/shell-control";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Sparkles,
  CarFront,
  Calendar,
  Users,
  Wrench,
  CheckSquare,
  FileText,
  Wallet,
  Shield,
  Settings,
  Briefcase,
};

export default function Sidebar() {
  const {
    mode,
    activeOntology,
    setMode,
    toggleChat,
    logout,
    setNotificationsOpen,
    stats,
    unreadNotificationsCount,
    user,
  } =
    useAppState();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const shellRoutes = useMemo(
    () => buildShellRouteCatalog(activeOntology),
    [activeOntology],
  );
  const shellRouteMap = new Map(shellRoutes.map((route) => [route.path, route]));
  const { favorites, recents, isFavorite, toggleFavorite } = useShellMemory(
    user?.id,
    shellRoutes,
  );
  const primaryLinks = activeOntology.navigation.filter((link) =>
    supportedShellRoutes.has(link.path),
  );
  const pinnedRoutes = favorites
    .map((path) => shellRouteMap.get(path))
    .filter((route): route is NonNullable<typeof route> => Boolean(route));
  const recentRoutes = recents
    .filter((path) => !favorites.includes(path))
    .map((path) => shellRouteMap.get(path))
    .filter((route): route is NonNullable<typeof route> => Boolean(route));
  const posture = useMemo(
    () => deriveShellPosture({ stats, unreadNotificationsCount }),
    [stats, unreadNotificationsCount],
  );
  const controlSignals = useMemo(
    () =>
      buildShellSignals({
        activeOntology,
        stats,
        unreadNotificationsCount,
      }),
    [activeOntology, stats, unreadNotificationsCount],
  );
  const quickActions = useMemo(
    () => [
      {
        id: "today",
        label: "Today",
        description: "Return to the live operator board.",
        icon: Sparkles,
        onClick: () => openRoute("/today"),
      },
      {
        id: "tasks",
        label: "Tasks",
        description: "Drop into the active execution queue.",
        icon: CheckSquare,
        onClick: () => openRoute("/tasks"),
      },
      {
        id: "notifications",
        label: unreadNotificationsCount > 0 ? "Alerts" : "Inbox",
        description:
          unreadNotificationsCount > 0
            ? `${unreadNotificationsCount} unread ${unreadNotificationsCount === 1 ? "alert" : "alerts"}`
            : "Open the notification stack.",
        icon: BellRing,
        onClick: () => {
          setNotificationsOpen(true);
          setMobileOpen(false);
        },
      },
      {
        id: "assistant",
        label: "Assistant",
        description: "Open Nexus for guided actions.",
        icon: Bot,
        onClick: () => {
          toggleChat();
          setMobileOpen(false);
        },
      },
    ],
    [setNotificationsOpen, toggleChat, unreadNotificationsCount],
  );

  function openRoute(path: string) {
    setLocation(path);
    setMobileOpen(false);
  }

  function postureClasses(tone: ShellPostureTone) {
    switch (tone) {
      case "critical":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";
      case "attention":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";
      case "watch":
        return "border-sky-400/20 bg-sky-400/10 text-sky-300";
      default:
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }
  }

  function signalClasses(tone: ShellPostureTone) {
    switch (tone) {
      case "critical":
        return "border-rose-400/15 bg-rose-400/[0.08] hover:bg-rose-400/[0.12]";
      case "attention":
        return "border-amber-400/15 bg-amber-400/[0.08] hover:bg-amber-400/[0.12]";
      case "watch":
        return "border-sky-400/15 bg-sky-400/[0.08] hover:bg-sky-400/[0.12]";
      default:
        return "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]";
    }
  }

  const sidebarContent = (
    <>
      <div className="h-14 flex items-center px-5 border-b border-white/5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center mr-2.5 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
          <div className="w-2.5 h-2.5 bg-white rounded-[3px]" />
        </div>
        <span className="font-heading font-bold text-lg tracking-tight">
          Nexus
        </span>
        <button
          className="lg:hidden ml-auto p-1 text-muted-foreground"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        {pinnedRoutes.length > 0 ? (
          <div className="mb-4">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              Pinned
            </p>
            <div
              className="space-y-1"
              data-testid="shell-pinned-section"
            >
              {pinnedRoutes.map((route) => {
                const Icon = ICON_MAP[route.icon] || LayoutDashboard;
                const isActive = location === route.path;
                return (
                  <button
                    key={route.path}
                    type="button"
                    onClick={() => openRoute(route.path)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/85 hover:bg-white/[0.04]"
                    }`}
                    data-testid={`shell-pinned-item-${getShellRouteKey(route.path)}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{route.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {recentRoutes.length > 0 ? (
          <div className="mb-4">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              Recent
            </p>
            <div
              className="space-y-1"
              data-testid="shell-recent-section"
            >
              {recentRoutes.slice(0, 4).map((route) => {
                const Icon = ICON_MAP[route.icon] || Clock3;
                return (
                  <button
                    key={route.path}
                    type="button"
                    onClick={() => openRoute(route.path)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                    data-testid={`shell-recent-item-${getShellRouteKey(route.path)}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{route.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div
          className="mb-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-3 shadow-[0_12px_40px_rgba(5,10,20,0.28)]"
          data-testid="shell-control-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Control Center
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${postureClasses(posture.tone)}`}
                  data-testid="shell-posture-badge"
                >
                  {posture.label}
                </span>
                <span className="truncate text-[11px] text-foreground/80">
                  {posture.primaryFocus}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                {posture.summary}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {controlSignals.map((signal) => (
              <button
                key={signal.id}
                type="button"
                onClick={() => {
                  if (signal.id === "alerts") {
                    setNotificationsOpen(true);
                    setMobileOpen(false);
                    return;
                  }

                  openRoute(signal.href);
                }}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${signalClasses(signal.tone)}`}
                data-testid={`shell-signal-${signal.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                    {signal.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {signal.count}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                  {signal.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {primaryLinks.map((link) => {
          const Icon = ICON_MAP[link.icon] || LayoutDashboard;
          const isActive = location === link.path;
          const routeKey = getShellRouteKey(link.path);
          return (
            <div
              key={link.path}
              className={`flex items-center gap-1 rounded-lg px-1 py-0.5 transition-all duration-150 ${
                isActive ? "bg-primary/10" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => openRoute(link.path)}
                className={`flex min-w-0 flex-1 items-center px-2 py-2 text-left text-[13px] transition-all duration-150 ${
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`link-${link.label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4 mr-2.5 shrink-0" />
                <span className="truncate">{link.label}</span>
              </button>
              <div
                className="flex items-center"
              >
                <button
                  type="button"
                  onClick={() => toggleFavorite(link.path)}
                  className={`rounded-md p-1.5 transition-colors ${
                    isFavorite(link.path)
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                  aria-label={
                    isFavorite(link.path)
                      ? `Unpin ${link.label}`
                      : `Pin ${link.label}`
                  }
                  data-testid={`button-favorite-route-${routeKey}`}
                >
                  {isFavorite(link.path) ? (
                    <PinOff className="h-3.5 w-3.5" />
                  ) : (
                    <Pin className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        <div className="mt-4 mb-2">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2 px-1" data-testid="shell-quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                  data-testid={`button-shell-quick-${action.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-semibold text-foreground">
                      {action.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-white/5 space-y-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => setModeMenuOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs glass-card rounded-lg border border-white/10 shadow-lg hover:bg-muted/50 transition-colors"
            data-testid="button-mode-selector"
          >
            <span className="text-muted-foreground">Ontology:</span>
            <span className="font-medium">{activeOntology.label}</span>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground transition-transform ${modeMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {modeMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 glass-card rounded-lg border border-white/10 p-1 shadow-xl z-50">
              {Object.values(ontologies).map((ont) => (
                <button
                  key={ont.id}
                  onClick={() => {
                    setMode(ont.id as any);
                    setModeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${mode === ont.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                  data-testid={`button-mode-${ont.id}`}
                >
                  {ont.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full justify-start text-xs h-9 glass-card bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          onClick={() => {
            toggleChat();
            setMobileOpen(false);
          }}
          data-testid="button-open-assistant"
        >
          <Bot className="mr-2 h-3.5 w-3.5" />
          Nexus Assistant
        </Button>

        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
            {user?.displayName || user?.username}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-destructive"
            onClick={() => logout()}
            aria-label="Log out"
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 glass rounded-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        data-testid="button-mobile-menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        aria-label="Main navigation"
        className={`w-56 bg-background/80 backdrop-blur-xl border-r border-white/5 flex flex-col fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
