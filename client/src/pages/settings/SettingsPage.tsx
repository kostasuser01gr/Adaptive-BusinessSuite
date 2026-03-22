import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  CheckCircle2,
  Command,
  Cpu,
  History,
  LayoutTemplate,
  Save,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";

import { useAppState } from "@/lib/store";
import {
  postAuthRouteOptions,
  type AppPreferences,
  type AssistantTone,
  type DashboardPreset,
  type DensityPreference,
  type MotionPreference,
} from "@/lib/preferences";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function SegmentButton({
  active,
  children,
  onClick,
  testId,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-[0_0_24px_rgba(139,92,246,0.22)]"
          : "bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      }`}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  testId,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  testId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        data-testid={testId}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { user, mode, setMode, preferences, updatePreferences } = useAppState();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const { data: modelConfig } = useQuery({
    queryKey: ["/api/model-config"],
    queryFn: api.modelConfig.get,
  });
  const { data: actions } = useQuery({
    queryKey: ["/api/actions"],
    queryFn: api.actions,
  });

  const [draft, setDraft] = useState<AppPreferences>(preferences);
  const [saved, setSaved] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [config, setConfig] = useState({
    provider: "none",
    model: "",
    apiKey: "",
  });
  const [savingModel, setSavingModel] = useState(false);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  useEffect(() => {
    if (modelConfig) {
      setConfig({
        provider: modelConfig.provider || "none",
        model: modelConfig.model || "",
        apiKey: modelConfig.apiKey || "",
      });
    }
  }, [modelConfig]);

  const draftChanged = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(preferences),
    [draft, preferences],
  );

  function patchDraft<K extends keyof AppPreferences>(
    section: K,
    patch: Partial<AppPreferences[K]>,
  ) {
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch,
      },
    }));
  }

  async function savePreferences() {
    setSavingPrefs(true);
    try {
      await updatePreferences(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveConfig() {
    setSavingModel(true);
    try {
      await api.modelConfig.update(config);
      await qc.invalidateQueries({ queryKey: ["/api/model-config"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSavingModel(false);
    }
  }

  function openSelectedLandingSurface() {
    setLocation(draft.workspace.postAuthRoute);
  }

  function openDashboardStudio() {
    window.sessionStorage.setItem("open-dashboard-studio", "1");
    setLocation("/");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-xl font-heading font-bold mb-1"
            data-testid="text-settings-title"
          >
            Workspace Studio
          </h1>
          <p className="text-xs text-muted-foreground">
            Shape how Nexus launches, feels, and behaves for your operating
            rhythm.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={savePreferences}
          disabled={!draftChanged || savingPrefs}
          data-testid="button-save-preferences"
        >
          {savingPrefs ? (
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          ) : saved ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saved ? "Saved" : "Save Workspace Profile"}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-card/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Active ontology
              </p>
              <p className="mt-2 text-sm font-semibold capitalize">{mode}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Controls navigation vocabulary and dashboard defaults.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-card/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Sign-in landing
              </p>
              <p className="mt-2 text-sm font-semibold">
                {
                  postAuthRouteOptions.find(
                    (option) => option.value === draft.workspace.postAuthRoute,
                  )?.label
                }
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Opens immediately after login or account creation.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-card/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Shell profile
              </p>
              <p className="mt-2 text-sm font-semibold capitalize">
                {draft.shell.density} density · {draft.dashboard.preset} layout
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {draft.assistant.tone} assistant · {draft.shell.motion} motion
              </p>
            </div>
          </section>

          <Tabs defaultValue="workspace" className="space-y-4">
            <TabsList className="grid h-auto grid-cols-2 bg-white/[0.04] p-1 md:grid-cols-5">
              <TabsTrigger value="workspace" data-testid="tab-workspace">
                Workspace
              </TabsTrigger>
              <TabsTrigger value="shell" data-testid="tab-shell">
                Shell
              </TabsTrigger>
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="assistant" data-testid="tab-assistant">
                Assistant
              </TabsTrigger>
              <TabsTrigger value="ai" data-testid="tab-ai">
                AI Model
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="space-y-5">
              <section className="rounded-2xl border border-white/[0.06] bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-heading font-semibold">
                    Workspace identity
                  </h2>
                </div>
                <div className="grid gap-5">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Operating mode
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["rental", "personal", "professional"] as const).map(
                        (candidate) => (
                          <SegmentButton
                            key={candidate}
                            active={mode === candidate}
                            onClick={() => void setMode(candidate)}
                            testId={`settings-mode-${candidate}`}
                          >
                            {candidate}
                          </SegmentButton>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <label className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        After sign-in, open
                      </span>
                      <select
                        value={draft.workspace.postAuthRoute}
                        onChange={(event) =>
                          patchDraft("workspace", {
                            postAuthRoute: event.target.value as AppPreferences["workspace"]["postAuthRoute"],
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm"
                        data-testid="select-post-auth-route"
                      >
                        {postAuthRouteOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={openSelectedLandingSurface}
                      data-testid="button-open-selected-route"
                    >
                      <Command className="h-3.5 w-3.5" />
                      Open now
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-primary/10 bg-primary/[0.05] p-4">
                    <p className="text-xs font-medium">
                      {user?.displayName || user?.username}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This workspace profile travels with your account, so the
                      shell keeps the same posture on every trusted device.
                    </p>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="shell" className="space-y-5">
              <section className="rounded-2xl border border-white/[0.06] bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-heading font-semibold">
                    Shell experience
                  </h2>
                </div>

                <div className="grid gap-5">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Density
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["comfortable", "compact"] as DensityPreference[]).map(
                        (density) => (
                          <SegmentButton
                            key={density}
                            active={draft.shell.density === density}
                            onClick={() =>
                              patchDraft("shell", { density })
                            }
                            testId={`button-density-${density}`}
                          >
                            {density}
                          </SegmentButton>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Motion
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["full", "reduced"] as MotionPreference[]).map(
                        (motion) => (
                          <SegmentButton
                            key={motion}
                            active={draft.shell.motion === motion}
                            onClick={() => patchDraft("shell", { motion })}
                            testId={`button-motion-${motion}`}
                          >
                            {motion}
                          </SegmentButton>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-5">
              <section className="rounded-2xl border border-white/[0.06] bg-card/40 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-heading font-semibold">
                      Dashboard behavior
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={openDashboardStudio}
                    data-testid="button-open-dashboard-studio-shortcut"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Open Studio
                  </Button>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Layout preset
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["balanced", "focus", "executive"] as DashboardPreset[]).map(
                        (preset) => (
                          <SegmentButton
                            key={preset}
                            active={draft.dashboard.preset === preset}
                            onClick={() => patchDraft("dashboard", { preset })}
                            testId={`button-dashboard-preset-${preset}`}
                          >
                            {preset}
                          </SegmentButton>
                        ),
                      )}
                    </div>
                  </div>

                  <ToggleRow
                    title="Show suggestion rail"
                    description="Keep AI and system suggestions visible at the top of the dashboard."
                    checked={draft.dashboard.showSuggestions}
                    onCheckedChange={(checked) =>
                      patchDraft("dashboard", { showSuggestions: checked })
                    }
                    testId="switch-dashboard-suggestions"
                  />
                  <ToggleRow
                    title="Show greeting in overview"
                    description="Display a contextual greeting instead of a neutral module title in the daily overview."
                    checked={draft.dashboard.showGreeting}
                    onCheckedChange={(checked) =>
                      patchDraft("dashboard", { showGreeting: checked })
                    }
                    testId="switch-dashboard-greeting"
                  />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="assistant" className="space-y-5">
              <section className="rounded-2xl border border-white/[0.06] bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-heading font-semibold">
                    Assistant behavior
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Voice
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["operator", "concise", "strategic"] as AssistantTone[]).map(
                        (tone) => (
                          <SegmentButton
                            key={tone}
                            active={draft.assistant.tone === tone}
                            onClick={() => patchDraft("assistant", { tone })}
                            testId={`button-assistant-tone-${tone}`}
                          >
                            {tone}
                          </SegmentButton>
                        ),
                      )}
                    </div>
                  </div>

                  <ToggleRow
                    title="Show proactive suggestions"
                    description="Surface quick suggestion chips inside the assistant when the system has relevant recommendations."
                    checked={draft.assistant.proactiveSuggestions}
                    onCheckedChange={(checked) =>
                      patchDraft("assistant", {
                        proactiveSuggestions: checked,
                      })
                    }
                    testId="switch-assistant-suggestions"
                  />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="ai" className="space-y-5">
              <section className="rounded-2xl border border-white/[0.06] bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-heading font-semibold">
                    AI model configuration
                  </h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Connect a provider for richer intelligence. The app still runs
                  in deterministic fallback mode without a live model.
                </p>
                <div className="grid gap-3">
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Provider
                    </span>
                    <select
                      value={config.provider}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          provider: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm"
                      data-testid="select-model-provider"
                    >
                      <option value="none">None (Fallback Mode)</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google AI</option>
                      <option value="local">Local / Custom</option>
                    </select>
                  </label>

                  {config.provider !== "none" ? (
                    <>
                      <label className="space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Model
                        </span>
                        <input
                          type="text"
                          value={config.model}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              model: event.target.value,
                            }))
                          }
                          placeholder="e.g. gpt-5, claude-opus, gemini-pro"
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm"
                          data-testid="input-model-name"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          API Key
                        </span>
                        <input
                          type="password"
                          value={config.apiKey}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              apiKey: event.target.value,
                            }))
                          }
                          placeholder="sk-..."
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm"
                          data-testid="input-api-key"
                        />
                      </label>
                    </>
                  ) : null}

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={saveConfig}
                      disabled={savingModel}
                      data-testid="button-save-model"
                    >
                      {savingModel ? (
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      ) : saved ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {saved ? "Saved" : "Save Configuration"}
                    </Button>
                  </div>
                </div>

                {config.provider === "none" ? (
                  <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.05] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                        Fallback mode active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nexus uses saved templates, deterministic commands, and
                      local workspace state when no model is connected.
                    </p>
                  </div>
                ) : null}
              </section>
            </TabsContent>
          </Tabs>

          {actions && actions.length > 0 ? (
            <section className="rounded-2xl border border-white/[0.06] bg-card/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-heading font-semibold">
                  Recent action history
                </h2>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {actions.slice(0, 20).map((action: any) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between rounded-xl bg-black/10 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium capitalize">
                        {action.actionType.replaceAll("_", " ")}
                      </p>
                      {action.description ? (
                        <p className="truncate text-muted-foreground">
                          {action.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(action.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-2xl border border-white/[0.06] bg-card/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-heading font-semibold">
                Current profile
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                <p className="text-muted-foreground">Welcome surface</p>
                <p className="mt-1 font-medium">
                  {
                    postAuthRouteOptions.find(
                      (option) => option.value === draft.workspace.postAuthRoute,
                    )?.label
                  }
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                <p className="text-muted-foreground">Dashboard posture</p>
                <p className="mt-1 font-medium capitalize">
                  {draft.dashboard.preset} · {draft.shell.density}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                <p className="text-muted-foreground">Assistant voice</p>
                <p className="mt-1 font-medium capitalize">
                  {draft.assistant.tone}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-card/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <LayoutTemplate className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-heading font-semibold">
                Quick controls
              </h2>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={openDashboardStudio}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Edit live dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={openSelectedLandingSurface}
              >
                <Command className="h-3.5 w-3.5" />
                Open selected landing surface
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
