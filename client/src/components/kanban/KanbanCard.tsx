import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { springs } from "@/lib/animation";
import type { Task } from "./use-kanban";

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
  medium: { label: "Medium", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
};

interface KanbanCardProps {
  task: Task;
  overlay?: boolean;
}

export function KanbanCard({ task, overlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority ?? ""] ?? null;

  return (
    <motion.div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      layoutId={`kanban-card-${task.id}`}
      transition={springs.snappy}
      whileHover={overlay ? undefined : { y: -2 }}
      className={cn(
        "rounded-xl border border-white/[0.06] bg-card/60 px-3.5 py-3 backdrop-blur-sm",
        "cursor-grab select-none",
        "transition-shadow hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/20",
        isDragging && "opacity-40",
        overlay && "rotate-[2deg] shadow-2xl shadow-black/40 border-primary/30",
      )}
      {...(overlay ? {} : { ...attributes, ...listeners })}
    >
      <p className="text-xs font-medium leading-snug text-foreground">
        {task.title}
      </p>
      {priority && (
        <Badge
          variant="outline"
          className={cn("mt-2 text-[10px] capitalize", priority.className)}
        >
          {priority.label}
        </Badge>
      )}
    </motion.div>
  );
}
