import React, { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/lib/store";
import ModuleRenderer from "@/components/modules/ModuleRenderer";
import DashboardStudio from "@/components/dashboard/DashboardStudio";
import {
  Bot,
  LayoutTemplate,
  Plus,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { mode, modules, toggleChat, suggestions, preferences } = useAppState();
  const [, setLocation] = useLocation();
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const modeLabels: Record<string, string> = {
    rental: "Rental Operations",
    personal: "Personal Space",
    professional: "Professional Workspace",
    custom: "Custom Dashboard",
  };

  useEffect(() => {
    if (window.sessionStorage.getItem("open-dashboard-studio") === "1") {
      setIsStudioOpen(true);
      window.sessionStorage.removeItem("open-dashboard-studio");
    }
  }, []);

  const visibleModules = useMemo(
    () => modules.filter((module) => module.visible !== false),
    [modules],
  );

  const dashboardGridClass =
    preferences.dashboard.preset === "focus"
      ? "gap-3 auto-rows-[156px]"
      : preferences.dashboard.preset === "executive"
        ? "gap-4 auto-rows-[128px]"
        : "gap-3 auto-rows-[140px]";

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardStudio
        open={isStudioOpen}
        onOpenChange={setIsStudioOpen}
        modules={modules}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <h1
            className="text-xl sm:text-2xl font-heading font-bold tracking-tight"
            data-testid="text-dashboard-title"
          >
            {modeLabels[mode] || "Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tune your live workspace below or open the assistant for guided
            customization.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setIsStudioOpen(true)}
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/[0.02] text-xs gap-1.5 shrink-0"
            data-testid="button-open-dashboard-studio"
          >
            <LayoutTemplate className="h-3.5 w-3.5 text-primary" />
            Edit Dashboard
          </Button>
          <Button
            onClick={toggleChat}
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/[0.02] text-xs gap-1.5 shrink-0"
            data-testid="button-open-ai"
          >
            <Bot className="h-3.5 w-3.5 text-primary" />
            Customize with AI
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
          {preferences.dashboard.preset} layout
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
          {visibleModules.length} visible modules
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
          {preferences.shell.density} shell
        </span>
      </div>

      {preferences.dashboard.showSuggestions && suggestions.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {suggestions.slice(0, 3).map((s: any, i: number) => (
            <button
              key={i}
              onClick={() => {
                if (s.action.startsWith("navigate:"))
                  setLocation(s.action.replace("navigate:", ""));
                else if (s.action.startsWith("command:")) {
                  /* handled by chat */
                }
              }}
              className="flex items-center gap-2 bg-primary/[0.05] hover:bg-primary/[0.08] border border-primary/10 rounded-lg px-3 py-2 transition-colors group"
              data-testid={`dashboard-suggestion-${i}`}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {s.description}
                </p>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}
        </div>
      )}

      {visibleModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 rotate-6 border border-primary/15">
            <Plus className="h-8 w-8 text-primary -rotate-6" />
          </div>
          <h2 className="text-lg font-heading font-semibold mb-2">
            Empty Dashboard
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Your workspace adapts to your needs. Use the assistant to add
            modules.
          </p>
          <Button onClick={toggleChat} className="rounded-xl">
            Open Assistant
          </Button>
        </div>
      ) : (
        <div className={`grid grid-cols-2 md:grid-cols-4 ${dashboardGridClass}`}>
          {visibleModules.map((mod) => (
            <div
              key={mod.id}
              className={`${mod.w >= 4 ? "col-span-2 md:col-span-4" : mod.w >= 2 ? "col-span-2" : "col-span-1"} ${mod.h >= 2 ? "row-span-2" : "row-span-1"}`}
            >
              <ModuleRenderer module={mod} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
