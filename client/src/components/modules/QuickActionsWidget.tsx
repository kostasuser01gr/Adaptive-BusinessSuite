import React from "react";
import { ModuleConfig, useAppState } from "@/lib/store";
import { WidgetWrapper } from "./GenericWidget";
import {
  Plus,
  Car,
  Calendar,
  Users,
  FileText,
  CheckSquare,
  Wrench,
} from "lucide-react";
import { useLocation } from "wouter";

export default function QuickActionsWidget({
  module,
}: {
  module: ModuleConfig;
}) {
  const { mode } = useAppState();
  const [, setLocation] = useLocation();

  const actions =
    mode === "rental"
      ? [
          {
            icon: Car,
            label: "Add Vehicle",
            path: "/fleet",
            color: "text-blue-400 bg-blue-400/10",
          },
          {
            icon: Calendar,
            label: "New Booking",
            path: "/bookings",
            color: "text-purple-400 bg-purple-400/10",
          },
          {
            icon: Users,
            label: "Add Customer",
            path: "/customers",
            color: "text-emerald-400 bg-emerald-400/10",
          },
          {
            icon: Wrench,
            label: "Log Service",
            path: "/maintenance",
            color: "text-amber-400 bg-amber-400/10",
          },
        ]
      : [
          {
            icon: CheckSquare,
            label: "Add Task",
            path: "/tasks",
            color: "text-blue-400 bg-blue-400/10",
          },
          {
            icon: FileText,
            label: "New Note",
            path: "/notes",
            color: "text-purple-400 bg-purple-400/10",
          },
          {
            icon: Users,
            label: "Add Contact",
            path: "/customers",
            color: "text-emerald-400 bg-emerald-400/10",
          },
        ];

  return (
    <WidgetWrapper module={module}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-full">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <button
              key={i}
              onClick={() => setLocation(a.path)}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-black/15 border border-white/[0.04] hover:border-white/[0.08] hover:bg-black/25 transition-all"
              data-testid={`quick-action-${i}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {a.label}
              </span>
            </button>
          );
        })}
      </div>
    </WidgetWrapper>
  );
}
