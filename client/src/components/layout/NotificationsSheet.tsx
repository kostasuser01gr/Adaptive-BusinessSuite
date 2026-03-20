import { formatDistanceToNow } from "date-fns";
import { BellRing, CheckCheck, CircleCheck, CircleAlert, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
};

interface NotificationsSheetProps {
  notifications: NotificationRecord[];
  open: boolean;
  unreadCount: number;
  onOpenChange: (open: boolean) => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

function notificationIcon(type: NotificationRecord["type"]) {
  switch (type) {
    case "success":
      return <CircleCheck className="h-4 w-4 text-emerald-400" />;
    case "warning":
    case "error":
      return <CircleAlert className="h-4 w-4 text-amber-400" />;
    default:
      return <Info className="h-4 w-4 text-sky-400" />;
  }
}

function formatNotificationTimestamp(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

export default function NotificationsSheet({
  notifications,
  open,
  unreadCount,
  onOpenChange,
  onMarkRead,
  onMarkAllRead,
}: NotificationsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/10 bg-background/95 px-0 sm:max-w-md"
        data-testid="sheet-notifications"
      >
        <SheetHeader className="border-b border-white/5 px-5 pb-4">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="space-y-1">
              <SheetTitle className="text-base font-heading">
                Notifications
              </SheetTitle>
              <SheetDescription>
                Stay on top of new bookings, automations, and workspace events.
              </SheetDescription>
            </div>
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => void onMarkAllRead()}
                data-testid="button-notifications-read-all"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        {open ? (
          notifications.length === 0 ? (
            <Empty className="border-none px-6 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BellRing className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>All clear</EmptyTitle>
                <EmptyDescription>
                  New bookings, automations, and system events will appear here.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="text-xs text-muted-foreground">
                Keep the app installed to receive alerts faster.
              </EmptyContent>
            </Empty>
          ) : (
            <div className="h-[calc(100dvh-7rem)] overflow-y-auto px-3">
              <div className="space-y-2 py-4">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void onMarkRead(notification.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                      notification.read
                        ? "border-white/[0.05] bg-white/[0.02]"
                        : "border-primary/20 bg-primary/[0.06]",
                    )}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {notificationIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read ? (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <p className="mt-3 text-[11px] text-muted-foreground/80">
                          {formatNotificationTimestamp(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
