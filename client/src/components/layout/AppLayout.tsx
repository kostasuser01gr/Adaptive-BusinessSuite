import React, { useEffect, useMemo } from "react";
import { useAppState } from "@/lib/store";
import Sidebar from "./Sidebar";
import AssistantChat from "./AssistantChat";
import CommandBar from "./CommandBar";
import MobileNav from "./MobileNav";
import NotificationsSheet from "./NotificationsSheet";
import InstallAppButton from "./InstallAppButton";
import {
  Search,
  Bell,
  Loader2,
  Command,
  Pin,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { buildShellRouteCatalog, useShellMemory } from "@/lib/shell-memory";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    activeOntology,
    isAuthenticated,
    isLoading,
    user,
    preferences,
    isChatOpen,
    isNotificationsOpen,
    notifications,
    unreadNotificationsCount,
    setCommandBarOpen,
    setNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppState();
  const [location] = useLocation();
  const shellRoutes = useMemo(
    () => buildShellRouteCatalog(activeOntology),
    [activeOntology],
  );
  const { isFavorite, rememberPath, toggleFavorite } = useShellMemory(
    user?.id,
    shellRoutes,
  );
  const currentRoute = shellRoutes.find((route) => route.path === location) || null;

  useEffect(() => {
    document.documentElement.dataset.motion = preferences.shell.motion;
    document.documentElement.dataset.appDensity = preferences.shell.density;

    return () => {
      delete document.documentElement.dataset.motion;
      delete document.documentElement.dataset.appDensity;
    };
  }, [preferences.shell.density, preferences.shell.motion]);

  useEffect(() => {
    if (!isAuthenticated || location === "/auth") {
      return;
    }

    rememberPath(location);
  }, [isAuthenticated, location, rememberPath]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3" role="status" aria-label="Loading application">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)]">
          <div className="w-3 h-3 bg-white rounded-sm" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (!isAuthenticated) return <>{children}</>;

  const headerClass =
    preferences.shell.density === "compact" ? "h-12 px-3 sm:px-4" : "h-14 px-4 sm:px-6";
  const mainClass =
    preferences.shell.density === "compact"
      ? "p-3 sm:p-4 pb-20 lg:pb-4"
      : "p-4 sm:p-6 pb-20 lg:pb-6";

  return (
    <div
      className="flex h-[100dvh] overflow-hidden bg-background"
      data-density={preferences.shell.density}
      data-motion={preferences.shell.motion}
      data-testid="app-shell"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <CommandBar />
      <NotificationsSheet
        notifications={notifications}
        open={isNotificationsOpen}
        unreadCount={unreadNotificationsCount}
        onOpenChange={setNotificationsOpen}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
      />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between z-10 sticky top-0 ${headerClass}`}
        >
          <div className="flex items-center gap-3 pl-10 lg:pl-0">
            <button
              onClick={() => setCommandBarOpen(true)}
              aria-label="Open command bar"
              className="flex items-center gap-2 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5 border border-white/5 transition-colors cursor-pointer group"
              data-testid="button-command-bar"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Search or command...
              </span>
              <kbd className="hidden sm:inline-flex text-[10px] text-muted-foreground bg-black/30 border border-white/10 px-1 py-0.5 rounded ml-6">
                <Command className="h-2.5 w-2.5 inline" />K
              </kbd>
            </button>
            {currentRoute ? (
              <div className="hidden items-center gap-1.5 rounded-lg border border-white/5 bg-muted/20 px-2 py-1 md:flex">
                <span
                  className="text-[11px] font-medium text-foreground/80"
                  data-testid="text-current-surface"
                >
                  {currentRoute.label}
                </span>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                  onClick={() => toggleFavorite(currentRoute.path)}
                  aria-label={
                    isFavorite(currentRoute.path)
                      ? `Unpin ${currentRoute.label}`
                      : `Pin ${currentRoute.label}`
                  }
                  data-testid="button-toggle-current-favorite"
                >
                  {isFavorite(currentRoute.path) ? (
                    <PinOff className="h-3.5 w-3.5" />
                  ) : (
                    <Pin className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <InstallAppButton />
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={() => setNotificationsOpen(true)}
              aria-label={`Notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} unread)` : ""}`}
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
                  data-testid="badge-notification-count"
                >
                  {unreadNotificationsCount > 9
                    ? "9+"
                    : unreadNotificationsCount}
                </span>
              ) : null}
            </Button>
            <div
              className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-semibold cursor-pointer"
              data-testid="button-avatar"
            >
              {user?.displayName?.charAt(0) || user?.username?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <main id="main-content" className={`flex-1 overflow-auto relative ${mainClass}`}>
          {children}
        </main>
      </div>

      {isChatOpen && <AssistantChat />}
      <MobileNav />
    </div>
  );
}
