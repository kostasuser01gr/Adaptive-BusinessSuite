import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { useLocation } from "wouter";
import {
  Search,
  Car,
  Users,
  Calendar,
  FileText,
  Wrench,
  CheckSquare,
  LayoutDashboard,
  Settings,
  Bot,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export default function CommandBar() {
  const {
    isCommandBarOpen,
    setCommandBarOpen,
    processCommand,
    toggleChat,
    activeOntology,
  } = useAppState();
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandBarOpen(!isCommandBarOpen);
      }
      if (e.key === "Escape") setCommandBarOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isCommandBarOpen, setCommandBarOpen]);

  useEffect(() => {
    if (isCommandBarOpen) {
      inputRef.current?.focus();
      setQuery("");
    }
  }, [isCommandBarOpen]);

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Go to main dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      action: () => {
        setLocation("/");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },
    {
      id: "fleet",
      label: activeOntology.resourceName + "s",
      description: `Manage ${activeOntology.resourceName.toLowerCase()}s`,
      icon: <Car className="h-4 w-4" />,
      action: () => {
        setLocation("/fleet");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },
    {
      id: "bookings",
      label: activeOntology.eventName + "s",
      description: `View ${activeOntology.eventName.toLowerCase()}s`,
      icon: <Calendar className="h-4 w-4" />,
      action: () => {
        setLocation("/bookings");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },
    {
      id: "tasks",
      label: "Tasks",
      description: "Task management",
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => {
        setLocation("/tasks");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },
    {
      id: "settings",
      label: "Settings",
      description: "App & model settings",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        setLocation("/settings");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },

    {
      id: "optimize",
      label: "Yield Optimization",
      description: "Run pricing analysis",
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => {
        processCommand("Show me pricing optimization insights");
        toggleChat();
        setCommandBarOpen(false);
      },
      category: "Intelligence",
    },
    {
      id: "inspect",
      label: "AI Damage Inspection",
      description: "Start Vision-AI triage",
      icon: <ShieldCheck className="h-4 w-4" />,
      action: () => {
        processCommand("I want to start a new vehicle inspection");
        toggleChat();
        setCommandBarOpen(false);
      },
      category: "Intelligence",
    },

    {
      id: "customers",
      label: "Customers",
      description: "Manage customer records",
      icon: <Users className="h-4 w-4" />,
      action: () => {
        setLocation("/customers");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },
    {
      id: "notes",
      label: "Notes",
      description: "Quick notes & docs",
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        setLocation("/notes");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },
    {
      id: "maintenance",
      label: "Maintenance",
      description: "Service & repairs",
      icon: <Wrench className="h-4 w-4" />,
      action: () => {
        setLocation("/maintenance");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },
    {
      id: "financial",
      label: "Financial Dashboard",
      description: "Revenue, expenses & analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => {
        setLocation("/financial");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },
    {
      id: "nexus",
      label: "Nexus Ultra",
      description: "Enterprise compliance & governance",
      icon: <ShieldCheck className="h-4 w-4" />,
      action: () => {
        setLocation("/nexus-ultra");
        setCommandBarOpen(false);
      },
      category: "Navigation",
    },

    {
      id: "assistant",
      label: "Open Assistant",
      description: "Chat with Nexus AI",
      icon: <Bot className="h-4 w-4" />,
      action: () => {
        toggleChat();
        setCommandBarOpen(false);
      },
      category: "Actions",
    },
    {
      id: "clear",
      label: "Clear Dashboard",
      description: "Reset dashboard modules",
      icon: <Sparkles className="h-4 w-4" />,
      action: () => {
        processCommand("clear dashboard");
        setCommandBarOpen(false);
      },
      category: "Quick Actions",
    },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, c) => {
    (acc[c.category] = acc[c.category] || []).push(c);
    return acc;
  }, {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      processCommand(query);
      toggleChat();
      setCommandBarOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isCommandBarOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={() => setCommandBarOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative w-full max-w-xl mx-4 glass-card rounded-2xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="command-bar"
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-center px-4 border-b border-white/10 bg-white/[0.02]"
        >
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, navigate, or command the AI..."
            className="flex-1 bg-transparent border-none py-5 px-3 text-base focus:outline-none text-foreground placeholder:text-muted-foreground/50"
            data-testid="input-command-bar"
          />
          <div className="hidden sm:flex items-center gap-1.5">
            <kbd className="text-[10px] text-muted-foreground bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shadow-sm">
              ESC
            </kbd>
          </div>
        </form>
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-2">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary/60">
                {category}
              </div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm hover:bg-white/[0.06] text-left transition-all group active:scale-[0.98]"
                  data-testid={`command-${item.id}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors border border-white/5">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-muted-foreground/70 text-xs truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && query && (
            <div className="px-3 py-10 text-center animate-in fade-in slide-in-from-top-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Ask the Assistant
              </p>
              <p className="text-xs text-muted-foreground mt-1 px-10">
                Press Enter to send "{query}" to the workspace intelligence
                layer.
              </p>
            </div>
          )}
        </div>
        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
              System Ready
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/40 font-mono">
            v14.0-ULTRA
          </span>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
