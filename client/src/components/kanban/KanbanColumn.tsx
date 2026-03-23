import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { KanbanCard } from "./KanbanCard";
import type { Task, KanbanStatus } from "./use-kanban";

const columnColors: Record<KanbanStatus, string> = {
  todo: "border-t-sky-500/60",
  "in-progress": "border-t-amber-500/60",
  done: "border-t-emerald-500/60",
};

const countColors: Record<KanbanStatus, string> = {
  todo: "bg-sky-500/15 text-sky-400",
  "in-progress": "bg-amber-500/15 text-amber-400",
  done: "bg-emerald-500/15 text-emerald-400",
};

interface KanbanColumnProps {
  id: KanbanStatus;
  label: string;
  tasks: Task[];
}

export function KanbanColumn({ id, label, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-white/[0.06] border-t-2 bg-card/30 backdrop-blur-sm",
        "min-h-[320px] transition-colors",
        columnColors[id],
        isOver && "border-primary/30 bg-primary/[0.03]",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
        <Badge
          variant="secondary"
          className={cn("text-[10px] tabular-nums", countColors[id])}
        >
          {tasks.length}
        </Badge>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex flex-1 flex-col gap-2 px-3 pb-3"
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} />
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/[0.06] py-8">
              <p className="text-[10px] text-muted-foreground/60">
                Drop tasks here
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
