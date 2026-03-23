import { useState, useCallback } from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

export interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  [key: string]: unknown;
}

export type KanbanStatus = "todo" | "in-progress" | "done";

export const KANBAN_COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Completed" },
];

interface UseKanbanOptions {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
}

export function useKanban({ tasks, onStatusChange }: UseKanbanOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[] | null>(null);

  const currentTasks = optimisticTasks ?? tasks;

  const getTasksByStatus = useCallback(
    (status: KanbanStatus): Task[] =>
      currentTasks.filter((t) => t.status === status),
    [currentTasks],
  );

  const activeTask = activeId
    ? currentTasks.find((t) => t.id === activeId) ?? null
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const taskId = String(active.id);
      const overId = String(over.id);

      // Determine destination status: if dropped on a column, use the column id;
      // if dropped on another card, use that card's status.
      let destinationStatus: string;

      const isColumn = KANBAN_COLUMNS.some((col) => col.id === overId);
      if (isColumn) {
        destinationStatus = overId;
      } else {
        const overTask = currentTasks.find((t) => t.id === overId);
        if (!overTask) return;
        destinationStatus = overTask.status;
      }

      const task = currentTasks.find((t) => t.id === taskId);
      if (!task || task.status === destinationStatus) return;

      // Optimistic update
      setOptimisticTasks(
        currentTasks.map((t) =>
          t.id === taskId ? { ...t, status: destinationStatus } : t,
        ),
      );

      try {
        await onStatusChange(taskId, destinationStatus);
      } catch {
        // Revert on failure
      } finally {
        setOptimisticTasks(null);
      }
    },
    [currentTasks, onStatusChange],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return {
    activeId,
    activeTask,
    getTasksByStatus,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
