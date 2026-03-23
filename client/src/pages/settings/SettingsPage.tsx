import React, { useState, useEffect } from "react";
import { useAppState } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnimatedMount } from "@/components/animation/AnimatedMount";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Bot,
  Cpu,
  Shield,
  History,
  Save,
  CheckCircle2,
  Palette,
} from "lucide-react";
import ApiKeysPanel from "./ApiKeysPanel";
import SessionsPanel from "./SessionsPanel";
import ThemePicker from "@/components/forms/ThemePicker";

export default function SettingsPage() {
  const { user, mode, setMode } = useAppState();
  const qc = useQueryClient();
  const { data: modelConfig } = useQuery({
    queryKey: ["/api/model-config"],
    queryFn: api.modelConfig.get,
  });
  const { data: actions } = useQuery({
    queryKey: ["/api/actions"],
    queryFn: api.actions,
  });

  const [config, setConfig] = useState({
    provider: "none",
    model: "",
    apiKey: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (modelConfig)
      setConfig({
        provider: modelConfig.provider || "none",
        model: modelConfig.model || "",
        apiKey: modelConfig.apiKey || "",
      });
  }, [modelConfig]);

  const saveConfig = async () => {
    await api.modelConfig.update(config);
    qc.invalidateQueries({ queryKey: ["/api/model-config"] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AnimatedMount className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1
          className="text-xl font-heading font-bold mb-1"
          data-testid="text-settings-title"
        >
          Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure your workspace, model, and preferences.
        </p>
      </div>

      <section className="bg-card/40 border border-white/[0.04] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-heading font-semibold">Workspace</h2>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current Mode</span>
            <div className="flex gap-1.5">
              {(["rental", "personal", "professional"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  data-testid={`settings-mode-${m}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Display Name</span>
            <span className="text-xs font-medium">
              {user?.displayName || user?.username}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-card/40 border border-white/[0.04] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-heading font-semibold">Appearance</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Choose a color theme for the interface.
        </p>
        <ThemePicker />
      </section>

      <section className="bg-card/40 border border-white/[0.04] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-heading font-semibold">
            AI Model Configuration
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Connect any AI provider to enable intelligent features. The app works
          without a model using saved rules and templates.
        </p>
        <div className="grid gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">
              Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) =>
                setConfig((c) => ({ ...c, provider: e.target.value }))
              }
              className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2.5 text-xs"
              data-testid="select-model-provider"
            >
              <option value="none">None (Fallback Mode)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google AI</option>
              <option value="local">Local / Custom</option>
            </select>
          </div>
          {config.provider !== "none" && (
            <>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">
                  Model
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, model: e.target.value }))
                  }
                  placeholder="e.g. gpt-4o, claude-3, gemini-pro"
                  className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2.5 text-xs"
                  data-testid="input-model-name"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, apiKey: e.target.value }))
                  }
                  placeholder="sk-..."
                  className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2.5 text-xs"
                  data-testid="input-api-key"
                />
              </div>
            </>
          )}
          <div className="flex justify-end">
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={saveConfig}
              data-testid="button-save-model"
            >
              {saved ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saved ? "Saved" : "Save Configuration"}
            </Button>
          </div>
        </div>
        {config.provider === "none" && (
          <div className="mt-4 p-3 bg-primary/[0.05] border border-primary/10 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold">
                Fallback Mode Active
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              The assistant uses deterministic rules, saved templates, and
              predefined commands. All core features remain functional.
            </p>
          </div>
        )}
      </section>

      <ApiKeysPanel />
      <SessionsPanel />

      {actions && actions.length > 0 && (
        <section className="bg-card/40 border border-white/[0.04] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-heading font-semibold">
              Action History
            </h2>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {actions.slice(0, 20).map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between px-3 py-2 bg-black/10 rounded-lg text-xs"
              >
                <div>
                  <span className="font-medium capitalize">
                    {a.actionType.replace("_", " ")}
                  </span>
                  {a.description && (
                    <span className="text-muted-foreground ml-2">
                      {a.description}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AnimatedMount>
  );
}
