export type PostAuthRoute =
  | "/"
  | "/today"
  | "/fleet"
  | "/bookings"
  | "/customers"
  | "/tasks"
  | "/notes"
  | "/financial"
  | "/settings"
  | "/nexus-ultra";

export type DensityPreference = "comfortable" | "compact";
export type MotionPreference = "full" | "reduced";
export type DashboardPreset = "balanced" | "focus" | "executive";
export type AssistantTone = "operator" | "concise" | "strategic";

export interface AppPreferences {
  workspace: {
    postAuthRoute: PostAuthRoute;
  };
  shell: {
    density: DensityPreference;
    motion: MotionPreference;
  };
  dashboard: {
    preset: DashboardPreset;
    showSuggestions: boolean;
    showGreeting: boolean;
  };
  assistant: {
    tone: AssistantTone;
    proactiveSuggestions: boolean;
  };
}

export type AppPreferencesPatch = {
  [K in keyof AppPreferences]?: Partial<AppPreferences[K]>;
};

export const defaultPreferences: AppPreferences = {
  workspace: {
    postAuthRoute: "/",
  },
  shell: {
    density: "comfortable",
    motion: "full",
  },
  dashboard: {
    preset: "balanced",
    showSuggestions: true,
    showGreeting: true,
  },
  assistant: {
    tone: "operator",
    proactiveSuggestions: true,
  },
};

export const postAuthRouteOptions: Array<{
  value: PostAuthRoute;
  label: string;
  description: string;
}> = [
  {
    value: "/today",
    label: "Today",
    description: "Open the live operator board with the next actions and watchlists.",
  },
  {
    value: "/",
    label: "Dashboard",
    description: "Open the adaptive command center after sign-in.",
  },
  {
    value: "/tasks",
    label: "Tasks",
    description: "Drop straight into your execution queue.",
  },
  {
    value: "/bookings",
    label: "Bookings",
    description: "Start from the live booking pipeline.",
  },
  {
    value: "/fleet",
    label: "Fleet",
    description: "Jump directly into asset availability and status.",
  },
  {
    value: "/customers",
    label: "Customers",
    description: "Open customer operations first.",
  },
  {
    value: "/notes",
    label: "Notes",
    description: "Start from capture and knowledge workflows.",
  },
  {
    value: "/financial",
    label: "Financial",
    description: "Prioritize revenue and cash visibility.",
  },
  {
    value: "/nexus-ultra",
    label: "NEXUS ULTRA",
    description: "Open the intelligence workspace first.",
  },
  {
    value: "/settings",
    label: "Settings",
    description: "Resume inside workspace configuration.",
  },
];

const validPostAuthRoutes = new Set(postAuthRouteOptions.map((item) => item.value));
const validDensity = new Set<DensityPreference>(["comfortable", "compact"]);
const validMotion = new Set<MotionPreference>(["full", "reduced"]);
const validPresets = new Set<DashboardPreset>([
  "balanced",
  "focus",
  "executive",
]);
const validAssistantTones = new Set<AssistantTone>([
  "operator",
  "concise",
  "strategic",
]);

export function normalizePreferences(raw: unknown): AppPreferences {
  const prefs =
    raw && typeof raw === "object"
      ? (raw as Partial<Record<keyof AppPreferences, unknown>>)
      : {};

  const workspace =
    prefs.workspace && typeof prefs.workspace === "object"
      ? (prefs.workspace as Partial<AppPreferences["workspace"]>)
      : {};
  const shell =
    prefs.shell && typeof prefs.shell === "object"
      ? (prefs.shell as Partial<AppPreferences["shell"]>)
      : {};
  const dashboard =
    prefs.dashboard && typeof prefs.dashboard === "object"
      ? (prefs.dashboard as Partial<AppPreferences["dashboard"]>)
      : {};
  const assistant =
    prefs.assistant && typeof prefs.assistant === "object"
      ? (prefs.assistant as Partial<AppPreferences["assistant"]>)
      : {};

  return {
    workspace: {
      postAuthRoute: validPostAuthRoutes.has(workspace.postAuthRoute as PostAuthRoute)
        ? (workspace.postAuthRoute as PostAuthRoute)
        : defaultPreferences.workspace.postAuthRoute,
    },
    shell: {
      density: validDensity.has(shell.density as DensityPreference)
        ? (shell.density as DensityPreference)
        : defaultPreferences.shell.density,
      motion: validMotion.has(shell.motion as MotionPreference)
        ? (shell.motion as MotionPreference)
        : defaultPreferences.shell.motion,
    },
    dashboard: {
      preset: validPresets.has(dashboard.preset as DashboardPreset)
        ? (dashboard.preset as DashboardPreset)
        : defaultPreferences.dashboard.preset,
      showSuggestions:
        typeof dashboard.showSuggestions === "boolean"
          ? dashboard.showSuggestions
          : defaultPreferences.dashboard.showSuggestions,
      showGreeting:
        typeof dashboard.showGreeting === "boolean"
          ? dashboard.showGreeting
          : defaultPreferences.dashboard.showGreeting,
    },
    assistant: {
      tone: validAssistantTones.has(assistant.tone as AssistantTone)
        ? (assistant.tone as AssistantTone)
        : defaultPreferences.assistant.tone,
      proactiveSuggestions:
        typeof assistant.proactiveSuggestions === "boolean"
          ? assistant.proactiveSuggestions
          : defaultPreferences.assistant.proactiveSuggestions,
    },
  };
}

export function mergePreferences(
  base: AppPreferences,
  patch: AppPreferencesPatch,
): AppPreferences {
  return normalizePreferences({
    ...base,
    ...patch,
    workspace: { ...base.workspace, ...patch.workspace },
    shell: { ...base.shell, ...patch.shell },
    dashboard: { ...base.dashboard, ...patch.dashboard },
    assistant: { ...base.assistant, ...patch.assistant },
  });
}

export function resolvePostAuthRoute(
  preferences: AppPreferences | null | undefined,
): PostAuthRoute {
  return normalizePreferences(preferences).workspace.postAuthRoute;
}

export function getAssistantToneMeta(tone: AssistantTone): {
  subtitle: string;
  placeholder: string;
} {
  switch (tone) {
    case "concise":
      return {
        subtitle: "Concise operator copilot",
        placeholder: "Ask for the next best action...",
      };
    case "strategic":
      return {
        subtitle: "Strategic planning copilot",
        placeholder: "Ask for tradeoffs, patterns, or decisions...",
      };
    default:
      return {
        subtitle: "Operator-ready workspace intelligence",
        placeholder: "Ask workspace AI...",
      };
  }
}
