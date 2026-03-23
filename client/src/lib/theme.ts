export interface ThemeConfig {
  name: string;
  primaryColor: string;
  accentColor: string;
  borderRadius: string;
  fontScale: number;
  /** HSL values without the hsl() wrapper, e.g. "220 70% 50%" */
  vars: {
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  midnight: {
    name: "Midnight",
    primaryColor: "#3b82f6",
    accentColor: "#6366f1",
    borderRadius: "0.75rem",
    fontScale: 1,
    vars: {
      primary: "217.2 91.2% 59.8%",
      primaryForeground: "210 40% 98%",
      accent: "238.7 83.5% 66.7%",
      accentForeground: "210 40% 98%",
    },
  },
  emerald: {
    name: "Emerald",
    primaryColor: "#10b981",
    accentColor: "#34d399",
    borderRadius: "0.75rem",
    fontScale: 1,
    vars: {
      primary: "160.1 84.1% 39.4%",
      primaryForeground: "210 40% 98%",
      accent: "156.2 71.6% 51.8%",
      accentForeground: "210 40% 98%",
    },
  },
  rose: {
    name: "Rose",
    primaryColor: "#f43f5e",
    accentColor: "#fb7185",
    borderRadius: "0.75rem",
    fontScale: 1,
    vars: {
      primary: "349.7 89.2% 60.2%",
      primaryForeground: "210 40% 98%",
      accent: "351.3 94.5% 71.4%",
      accentForeground: "210 40% 98%",
    },
  },
  amber: {
    name: "Amber",
    primaryColor: "#f59e0b",
    accentColor: "#fbbf24",
    borderRadius: "0.75rem",
    fontScale: 1,
    vars: {
      primary: "37.7 92.1% 50.2%",
      primaryForeground: "20 14.3% 4.1%",
      accent: "43.3 96.4% 56.3%",
      accentForeground: "20 14.3% 4.1%",
    },
  },
};

export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.vars.primary);
  root.style.setProperty("--primary-foreground", theme.vars.primaryForeground);
  root.style.setProperty("--accent", theme.vars.accent);
  root.style.setProperty("--accent-foreground", theme.vars.accentForeground);
  root.style.setProperty("--radius", theme.borderRadius);
  root.style.setProperty("font-size", `${theme.fontScale * 100}%`);
}

export const THEME_STORAGE_KEY = "abs-theme";
