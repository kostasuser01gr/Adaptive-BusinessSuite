import React from "react";
import { useAppState } from "@/lib/store";
import Sidebar from "./Sidebar";
import AssistantChat from "./AssistantChat";
import CommandBar from "./CommandBar";
import MobileNav from "./MobileNav";
import NotificationsSheet from "./NotificationsSheet";
import InstallAppButton from "./InstallAppButton";
import { Search, Bell, Loader2, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import ShortcutsPanel from "@/components/shortcuts/ShortcutsPanel";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    user,
    isChatOpen,
    isNotificationsOpen,
    notifications,
    unreadNotificationsCount,
    setCommandBarOpen,
    setNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppState();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)]">
          <div className="w-3 h-3 bg-white rounded-sm" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <>{children}</>;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
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
        <header className="h-14 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
          <div className="flex items-center gap-3 pl-10 lg:pl-0">
            <button
              onClick={() => setCommandBarOpen(true)}
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
          </div>

          <div className="flex items-center gap-2">
            <InstallAppButton />
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={() => setNotificationsOpen(true)}
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

        <main className="flex-1 overflow-auto p-4 sm:p-6 pb-20 lg:pb-6 relative">
          <div className="mb-3">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>

      {isChatOpen && <AssistantChat />}
      <MobileNav />
      <ShortcutsPanel />
    </div>
  );
}
