import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { LayoutGroup } from "framer-motion";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useKanban, KANBAN_COLUMNS } from "./use-kanban";
import type { Task } from "./use-kanban";

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
}

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const {
    activeTask,
    getTasksByStatus,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useKanban({ tasks, onStatusChange });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <LayoutGroup>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={getTasksByStatus(col.id)}
            />
          ))}
        </div>
      </LayoutGroup>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <KanbanCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
