import React from "react";
import { ModuleConfig, useAppState } from "@/lib/store";
import { WidgetWrapper } from "./GenericWidget";
import { Sun, Moon, Cloud } from "lucide-react";

export default function DailyOverviewWidget({
  module,
}: {
  module: ModuleConfig;
}) {
  const { user, stats, mode, preferences } = useAppState();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const Icon = hour < 6 || hour >= 20 ? Moon : hour < 18 ? Sun : Cloud;

  const summaryItems: string[] = [];
  if (mode === "rental" && stats) {
    if (stats.bookings?.active > 0)
      summaryItems.push(
        `${stats.bookings.active} active rental${stats.bookings.active > 1 ? "s" : ""}`,
      );
    if (stats.bookings?.pending > 0)
      summaryItems.push(
        `${stats.bookings.pending} pending booking${stats.bookings.pending > 1 ? "s" : ""}`,
      );
    if (stats.maintenance?.pending > 0)
      summaryItems.push(
        `${stats.maintenance.pending} vehicle${stats.maintenance.pending > 1 ? "s" : ""} need${stats.maintenance.pending === 1 ? "s" : ""} service`,
      );
    if (stats.tasks?.pending > 0)
      summaryItems.push(
        `${stats.tasks.pending} task${stats.tasks.pending > 1 ? "s" : ""} pending`,
      );
  } else if (stats) {
    if (stats.tasks?.pending > 0)
      summaryItems.push(
        `${stats.tasks.pending} task${stats.tasks.pending > 1 ? "s" : ""} to do`,
      );
  }

  return (
    <WidgetWrapper module={module}>
      <div className="flex items-center justify-between h-full">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Icon className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-heading font-semibold">
              {preferences.dashboard.showGreeting
                ? `${greeting}, ${user?.displayName || user?.username}`
                : module.title}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {summaryItems.length > 0
              ? summaryItems.join(" · ")
              : "Your dashboard is clean. Have a great day!"}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {mode} mode
          </p>
        </div>
      </div>
    </WidgetWrapper>
  );
}
