import React from "react";
import { ModuleConfig, useAppState } from "@/lib/store";
import { WidgetWrapper } from "./GenericWidget";
import {
  TrendingUp,
  Car,
  Euro,
  Gauge,
  CheckSquare,
  Activity,
  Wallet,
  Users,
} from "lucide-react";

const iconMap: Record<string, any> = {
  car: Car,
  euro: Euro,
  gauge: Gauge,
  tasks: CheckSquare,
  activity: Activity,
  wallet: Wallet,
  users: Users,
  check: CheckSquare,
  briefcase: Activity,
};
const colorMap: Record<string, string> = {
  blue: "text-blue-400 bg-blue-400/10",
  green: "text-emerald-400 bg-emerald-400/10",
  purple: "text-purple-400 bg-purple-400/10",
  orange: "text-amber-400 bg-amber-400/10",
  red: "text-rose-400 bg-rose-400/10",
};

export default function KPIWidget({ module }: { module: ModuleConfig }) {
  const { stats } = useAppState();
  const iconName = module.data?.icon || "activity";
  const color = module.data?.color || "blue";
  const Icon = iconMap[iconName] || Activity;
  const colors = colorMap[color] || colorMap.blue;

  let value = module.data?.value || "0";
  let label = module.data?.label || "";

  if (module.title.includes("Active Rentals") && stats?.bookings) {
    value = String(stats.bookings.active);
    label = `${stats.fleet?.rented || 0} vehicles out`;
  } else if (module.title.includes("Revenue") && stats?.revenue) {
    value = `€${stats.revenue.total.toLocaleString()}`;
    label = "This month";
  } else if (module.title.includes("Utilization") && stats) {
    value = `${stats.utilization || 0}%`;
    label = `${stats.fleet?.rented || 0} of ${stats.fleet?.total || 0} vehicles`;
  } else if (module.title.includes("Pending") && stats?.tasks) {
    value = String(stats.tasks.pending);
    label = "Need action";
  } else if (module.title.includes("Contacts") && stats?.customers) {
    value = String(stats.customers.total);
    label = "Total contacts";
  }

  return (
    <WidgetWrapper module={module}>
      <div className="flex items-start justify-between h-full">
        <div className="flex flex-col justify-center h-full">
          <div className="text-2xl font-heading font-bold mb-0.5">{value}</div>
          <div className="flex items-center text-xs text-muted-foreground font-medium">
            <TrendingUp className="h-3 w-3 mr-1 text-emerald-400" />
            {label}
          </div>
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </WidgetWrapper>
  );
}
