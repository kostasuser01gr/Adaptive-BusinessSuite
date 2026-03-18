import React from "react";
import { useAppState } from "@/lib/store";
import ModuleRenderer from "@/components/modules/ModuleRenderer";
import { Bot, Plus, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { mode, modules, toggleChat, suggestions } = useAppState();
  const [, setLocation] = useLocation();

  const modeLabels: Record<string, string> = {
    rental: "Rental Operations",
    personal: "Personal Space",
    professional: "Professional Workspace",
    custom: "Custom Dashboard",
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <h1
            className="text-xl sm:text-2xl font-heading font-bold tracking-tight"
            data-testid="text-dashboard-title"
          >
            {modeLabels[mode] || "Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your modules below or use the assistant to customize.
          </p>
        </div>
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

      {suggestions.length > 0 && (
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

      {modules.length === 0 ? (
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[140px]">
          {modules.map((mod) => (
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
