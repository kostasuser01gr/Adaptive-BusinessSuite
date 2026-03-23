import { motion } from "framer-motion";
import {
  Car,
  Calendar,
  User,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  entityType?: string;
  timestamp: string | Date;
  actorType?: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  maxItems?: number;
}

const ENTITY_ICONS: Record<string, LucideIcon> = {
  vehicle: Car,
  booking: Calendar,
  customer: User,
  maintenance: Wrench,
  task: CheckCircle2,
  notification: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  create: "bg-emerald-400/15 text-emerald-400",
  update: "bg-blue-400/15 text-blue-400",
  delete: "bg-rose-400/15 text-rose-400",
  system: "bg-amber-400/15 text-amber-400",
};

function getIcon(entityType?: string): LucideIcon {
  return (entityType && ENTITY_ICONS[entityType]) || AlertCircle;
}

function getColor(type: string): string {
  for (const [key, color] of Object.entries(TYPE_COLORS)) {
    if (type.toLowerCase().includes(key)) return color;
  }
  return "bg-muted text-muted-foreground";
}

function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ActivityTimeline({
  events,
  maxItems = 20,
}: ActivityTimelineProps) {
  const items = events.slice(0, maxItems);

  return (
    <div className="space-y-0">
      {items.map((event, i) => {
        const Icon = getIcon(event.entityType);
        const colorClass = getColor(event.type);

        return (
          <motion.div
            key={event.id}
            className="flex gap-3 py-2.5 relative"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.2 }}
          >
            {/* Vertical line */}
            {i < items.length - 1 && (
              <div className="absolute left-[13px] top-10 bottom-0 w-px bg-white/[0.04]" />
            )}

            {/* Icon */}
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                colorClass,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug">{event.description}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatTime(event.timestamp)}
                {event.actorType && event.actorType !== "user" && (
                  <span className="ml-1.5 text-muted-foreground/60">
                    · {event.actorType}
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">No recent activity</p>
        </div>
      )}
    </div>
  );
}
