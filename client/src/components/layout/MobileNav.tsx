import React from "react";
import { useAppState } from "@/lib/store";
import { useLocation, Link } from "wouter";
import { Sparkles, Car, Calendar, Bot, Settings } from "lucide-react";

export default function MobileNav() {
  const { toggleChat, mode } = useAppState();
  const [location] = useLocation();

  const items = [
    { icon: Sparkles, label: "Today", path: "/today" },
    ...(mode === "rental"
      ? [
          { icon: Car, label: "Fleet", path: "/fleet" },
          { icon: Calendar, label: "Bookings", path: "/bookings" },
        ]
      : []),
    { icon: Bot, label: "AI", path: "#assistant", onClick: toggleChat },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex flex-col items-center gap-0.5 py-1 px-3 text-muted-foreground"
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
