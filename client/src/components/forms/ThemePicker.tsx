import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  themes,
  applyTheme,
  THEME_STORAGE_KEY,
  type ThemeConfig,
} from "@/lib/theme";

/** Hook that loads the saved theme on mount and provides the current selection. */
export function useTheme() {
  const [current, setCurrent] = useState<string>("midnight");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && themes[saved]) {
      setCurrent(saved);
      applyTheme(themes[saved]);
    }
  }, []);

  const setTheme = useCallback((key: string) => {
    const t = themes[key];
    if (!t) return;
    setCurrent(key);
    applyTheme(t);
    localStorage.setItem(THEME_STORAGE_KEY, key);
  }, []);

  return { current, setTheme } as const;
}

export default function ThemePicker() {
  const { current, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-4 gap-4">
      {Object.entries(themes).map(([key, theme]) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className="flex flex-col items-center gap-2 group"
          data-testid={`theme-${key}`}
        >
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full border-2 transition-all"
              style={{
                background: theme.primaryColor,
                borderColor:
                  current === key
                    ? theme.primaryColor
                    : "rgba(255,255,255,0.08)",
                boxShadow:
                  current === key
                    ? `0 0 12px ${theme.primaryColor}40`
                    : "none",
              }}
            />
            {current === key && (
              <motion.div
                layoutId="theme-check"
                className="absolute inset-0 flex items-center justify-center"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Check className="h-4 w-4 text-white drop-shadow" />
              </motion.div>
            )}
          </div>
          <span
            className={`text-[11px] font-medium transition-colors ${
              current === key
                ? "text-foreground"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {theme.name}
          </span>
        </button>
      ))}
    </div>
  );
}
