import React from "react";
import { ModuleConfig } from "@/lib/store";
import KPIWidget from "./KPIWidget";
import FleetWidget from "./FleetWidget";
import NotesWidget from "./NotesWidget";
import TasksWidget from "./TasksWidget";
import BookingsWidget from "./BookingsWidget";
import QuickActionsWidget from "./QuickActionsWidget";
import DailyOverviewWidget from "./DailyOverviewWidget";
import GenericWidget from "./GenericWidget";

export default function ModuleRenderer({ module }: { module: ModuleConfig }) {
  switch (module.type) {
    case "kpi":
      return <KPIWidget module={module} />;
    case "fleet":
      return <FleetWidget module={module} />;
    case "notes":
      return <NotesWidget module={module} />;
    case "tasks":
      return <TasksWidget module={module} />;
    case "bookings":
      return <BookingsWidget module={module} />;
    case "quick-actions":
      return <QuickActionsWidget module={module} />;
    case "daily-overview":
      return <DailyOverviewWidget module={module} />;
    default:
      return <GenericWidget module={module} />;
  }
}
