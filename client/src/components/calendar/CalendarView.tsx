import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string | Date;
  endDate?: string | Date;
  color?: string;
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EVENT_COLORS: Record<string, string> = {
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
};

function resolveColor(color?: string): string {
  if (!color) return "bg-primary";
  if (EVENT_COLORS[color]) return EVENT_COLORS[color];
  if (color.startsWith("bg-")) return color;
  return "bg-primary";
}

export default function CalendarView({
  events = [],
  onEventClick,
  onDateClick,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = format(new Date(event.date), "yyyy-MM-dd");
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [events]);

  const goToPrev = () => {
    setDirection(-1);
    setCurrentMonth((m) => subMonths(m, 1));
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentMonth((m) => addMonths(m, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setDirection(now > currentMonth ? 1 : -1);
    setCurrentMonth(now);
  };

  return (
    <div className="bg-card/40 border border-white/[0.06] rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-heading font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="xs"
            className="text-[10px] text-muted-foreground"
            onClick={goToToday}
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={goToPrev}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={goToNext}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[10px] font-medium text-muted-foreground text-center py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={format(currentMonth, "yyyy-MM")}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="grid grid-cols-7"
        >
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(dayKey) || [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => onDateClick?.(day)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/[0.04] cursor-pointer",
                  !inMonth && "opacity-30",
                  today &&
                    "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                )}
              >
                <span className="leading-none">{format(day, "d")}</span>

                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <span
                        key={evt.id}
                        title={evt.title}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          resolveColor(evt.color)
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(evt);
                        }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-muted-foreground leading-none">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
