import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Shortcut {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["\u2318", "K"], label: "Command Bar" },
      { keys: ["?"], label: "Keyboard Shortcuts" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", "D"], label: "Go to Dashboard" },
      { keys: ["G", "F"], label: "Go to Fleet" },
      { keys: ["G", "B"], label: "Go to Bookings" },
      { keys: ["G", "C"], label: "Go to Customers" },
      { keys: ["G", "T"], label: "Go to Tasks" },
      { keys: ["G", "M"], label: "Go to Maintenance" },
      { keys: ["G", "S"], label: "Go to Settings" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["N"], label: "New item" },
      { keys: ["E"], label: "Edit" },
      { keys: ["/"], label: "Search" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5",
        "rounded-md border border-white/10 bg-black/30",
        "text-[11px] font-mono text-muted-foreground"
      )}
    >
      {children}
    </kbd>
  );
}

export default function ShortcutsPanel() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (open && e.key === "Escape") {
        setOpen(false);
        return;
      }

      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    },
    [open]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            className={cn(
              "relative w-full max-w-lg max-h-[80vh] overflow-auto",
              "bg-card/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl",
              "shadow-2xl shadow-black/40"
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-heading font-semibold">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    {group.title}
                  </h3>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.label}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-xs text-foreground/80">
                          {shortcut.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={i} className="flex items-center gap-1">
                              {i > 0 && (
                                <span className="text-[10px] text-muted-foreground/40">
                                  then
                                </span>
                              )}
                              <Kbd>{key}</Kbd>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              Press <Kbd>?</Kbd> to toggle &middot; <Kbd>Esc</Kbd> to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
