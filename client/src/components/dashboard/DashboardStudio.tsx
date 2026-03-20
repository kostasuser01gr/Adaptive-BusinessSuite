import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  LayoutTemplate,
  Loader2,
  PencilLine,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { type ModuleConfig } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

const moduleTemplates: Array<{
  type: string;
  title: string;
  description: string;
  w: number;
  h: number;
  data?: Record<string, unknown> | null;
}> = [
  {
    type: "daily-overview",
    title: "Daily Overview",
    description: "Topline briefing with the current workspace context.",
    w: 4,
    h: 1,
  },
  {
    type: "quick-actions",
    title: "Quick Actions",
    description: "Jump straight into the most common operator moves.",
    w: 4,
    h: 1,
  },
  {
    type: "tasks",
    title: "Priority Tasks",
    description: "Surface the tasks queue directly on the dashboard.",
    w: 2,
    h: 1,
  },
  {
    type: "notes",
    title: "Notes Watch",
    description: "Keep fresh notes and handoff context within reach.",
    w: 2,
    h: 2,
  },
  {
    type: "bookings",
    title: "Bookings Pulse",
    description: "Track booking movement and upcoming reservations.",
    w: 2,
    h: 2,
  },
  {
    type: "fleet",
    title: "Fleet Status",
    description: "Watch availability, downtime, and exceptions.",
    w: 2,
    h: 2,
  },
  {
    type: "kpi",
    title: "KPI Spotlight",
    description: "Pin a single headline metric to the shell.",
    w: 1,
    h: 1,
    data: {
      value: "0",
      label: "Set a metric",
      icon: "sparkles",
      color: "purple",
    },
  },
];

interface DashboardStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: ModuleConfig[];
}

export default function DashboardStudio({
  open,
  onOpenChange,
  modules,
}: DashboardStudioProps) {
  const qc = useQueryClient();
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    setTitleDrafts(
      Object.fromEntries(modules.map((module) => [module.id, module.title])),
    );
  }, [modules]);

  const visibleCount = useMemo(
    () => modules.filter((module) => module.visible !== false).length,
    [modules],
  );

  async function refreshModules() {
    await qc.invalidateQueries({ queryKey: ["/api/modules"] });
  }

  async function patchModule(
    moduleId: string,
    patch: Partial<Pick<ModuleConfig, "title" | "w" | "h" | "visible" | "position">>,
  ) {
    setSavingId(moduleId);
    try {
      await api.modules.update(moduleId, {
        ...patch,
        ...(patch.w !== undefined ? { w: String(patch.w) } : {}),
        ...(patch.h !== undefined ? { h: String(patch.h) } : {}),
      });
      await refreshModules();
    } catch (error) {
      toast.error("Failed to update dashboard module");
    } finally {
      setSavingId(null);
    }
  }

  async function addTemplate(templateIndex: number) {
    const template = moduleTemplates[templateIndex];
    setSavingId(`template-${template.type}`);
    try {
      await api.modules.create({
        type: template.type,
        title: template.title,
        w: String(template.w),
        h: String(template.h),
        data: template.data ?? null,
        position: modules.length,
      });
      await refreshModules();
      toast.success(`${template.title} added to the dashboard`);
    } catch (error) {
      toast.error("Failed to add dashboard module");
    } finally {
      setSavingId(null);
    }
  }

  async function moveModule(moduleId: string, direction: -1 | 1) {
    const currentIndex = modules.findIndex((module) => module.id === moduleId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= modules.length) {
      return;
    }

    const reordered = [...modules];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);

    setReordering(true);
    try {
      await Promise.all(
        reordered.map((module, position) =>
          api.modules.update(module.id, { position }),
        ),
      );
      await refreshModules();
    } catch (error) {
      toast.error("Failed to reorder dashboard modules");
    } finally {
      setReordering(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/10 bg-background/95 px-0 sm:max-w-xl"
        data-testid="sheet-dashboard-studio"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-white/5 px-5 pb-4">
            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <div>
                  <SheetTitle className="text-base font-heading">
                    Dashboard Studio
                  </SheetTitle>
                  <SheetDescription>
                    Tune module order, size, titles, and visibility without
                    leaving the shell.
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                  {modules.length} modules
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                  {visibleCount} visible
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                  Live edits
                </span>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-6 py-5">
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Add module</h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {moduleTemplates.map((template, index) => (
                    <button
                      key={template.type}
                      type="button"
                      onClick={() => void addTemplate(index)}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.04]"
                      data-testid={`button-add-module-${template.type}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {template.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        {savingId === `template-${template.type}` ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                        {template.w}x{template.h} footprint
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <PencilLine className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Current layout</h3>
                </div>
                <div className="space-y-3">
                  {modules.map((module, index) => {
                    const titleDraft = titleDrafts[module.id] ?? module.title;
                    const isSaving = savingId === module.id;

                    return (
                      <div
                        key={module.id}
                        className="rounded-2xl border border-white/[0.08] bg-card/50 p-4"
                        data-testid={`dashboard-module-row-${module.id}`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{module.type}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Position {index + 1} of {modules.length}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void moveModule(module.id, -1)}
                              disabled={index === 0 || reordering}
                              className="rounded-lg border border-white/10 p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                              data-testid={`button-move-module-up-${module.id}`}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void moveModule(module.id, 1)}
                              disabled={index === modules.length - 1 || reordering}
                              className="rounded-lg border border-white/10 p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                              data-testid={`button-move-module-down-${module.id}`}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[minmax(0,1.7fr)_110px_110px]">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Title
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={titleDraft}
                                onChange={(event) =>
                                  setTitleDrafts((current) => ({
                                    ...current,
                                    [module.id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                                data-testid={`input-module-title-${module.id}`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0 text-xs"
                                onClick={() =>
                                  void patchModule(module.id, {
                                    title: titleDraft.trim() || module.title,
                                  })
                                }
                                disabled={
                                  isSaving ||
                                  titleDraft.trim().length === 0 ||
                                  titleDraft.trim() === module.title
                                }
                                data-testid={`button-save-module-title-${module.id}`}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <label className="space-y-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Width
                            </span>
                            <select
                              value={String(module.w)}
                              onChange={(event) =>
                                void patchModule(module.id, {
                                  w: Number(event.target.value),
                                })
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                              data-testid={`select-module-width-${module.id}`}
                            >
                              <option value="1">1 column</option>
                              <option value="2">2 columns</option>
                              <option value="4">4 columns</option>
                            </select>
                          </label>

                          <label className="space-y-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Height
                            </span>
                            <select
                              value={String(module.h)}
                              onChange={(event) =>
                                void patchModule(module.id, {
                                  h: Number(event.target.value),
                                })
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                              data-testid={`select-module-height-${module.id}`}
                            >
                              <option value="1">1 row</option>
                              <option value="2">2 rows</option>
                            </select>
                          </label>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                          <div className="flex items-center gap-2 text-xs">
                            {module.visible === false ? (
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-primary" />
                            )}
                            <span className="font-medium">
                              {module.visible === false
                                ? "Hidden from dashboard"
                                : "Visible on dashboard"}
                            </span>
                          </div>
                          <Switch
                            checked={module.visible !== false}
                            onCheckedChange={(checked) =>
                              void patchModule(module.id, { visible: checked })
                            }
                            data-testid={`switch-module-visible-${module.id}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
