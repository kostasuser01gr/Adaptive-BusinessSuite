import React, { useState } from "react";
import { useAppState } from "@/lib/store";
import {
  CarFront,
  LayoutDashboard,
  Calendar,
  FileText,
  Settings,
  Bot,
  Briefcase,
  User,
  Wallet,
  LogOut,
  Menu,
  X,
  Wrench,
  CheckSquare,
  Users,
  ChevronDown,
  Sparkles,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ontologies } from "@shared/ontologies";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  CarFront,
  Calendar,
  Users,
  Wrench,
  CheckSquare,
  FileText,
  Wallet,
  Shield,
  Settings,
  Briefcase,
};

export default function Sidebar() {
  const { mode, activeOntology, setMode, toggleChat, logout, user } =
    useAppState();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="h-14 flex items-center px-5 border-b border-white/5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center mr-2.5 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
          <div className="w-2.5 h-2.5 bg-white rounded-[3px]" />
        </div>
        <span className="font-heading font-bold text-lg tracking-tight">
          Nexus
        </span>
        <button
          className="lg:hidden ml-auto p-1 text-muted-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        {activeOntology.navigation.map((link) => {
          const Icon = ICON_MAP[link.icon] || LayoutDashboard;
          const isActive = location === link.path;
          return (
            <Link key={link.path} href={link.path}>
              <div
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer text-[13px] ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                }`}
                data-testid={`link-${link.label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4 mr-2.5 shrink-0" />
                {link.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/5 space-y-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => setModeMenuOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs glass-card rounded-lg border border-white/10 shadow-lg hover:bg-muted/50 transition-colors"
            data-testid="button-mode-selector"
          >
            <span className="text-muted-foreground">Ontology:</span>
            <span className="font-medium">{activeOntology.label}</span>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground transition-transform ${modeMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {modeMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 glass-card rounded-lg border border-white/10 p-1 shadow-xl z-50">
              {Object.values(ontologies).map((ont) => (
                <button
                  key={ont.id}
                  onClick={() => {
                    setMode(ont.id as any);
                    setModeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${mode === ont.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                  data-testid={`button-mode-${ont.id}`}
                >
                  {ont.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full justify-start text-xs h-9 glass-card bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          onClick={() => {
            toggleChat();
            setMobileOpen(false);
          }}
          data-testid="button-open-assistant"
        >
          <Bot className="mr-2 h-3.5 w-3.5" />
          Nexus Assistant
        </Button>

        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
            {user?.displayName || user?.username}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-destructive"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 glass rounded-lg"
        onClick={() => setMobileOpen(true)}
        data-testid="button-mobile-menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`w-56 bg-background/80 backdrop-blur-xl border-r border-white/5 flex flex-col fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
