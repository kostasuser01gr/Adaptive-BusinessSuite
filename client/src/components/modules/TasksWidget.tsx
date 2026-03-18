import React, { useState } from "react";
import { ModuleConfig } from "@/lib/store";
import { WidgetWrapper } from "./GenericWidget";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function TasksWidget({ module }: { module: ModuleConfig }) {
  const qc = useQueryClient();
  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: api.tasks.list,
  });
  const [newTask, setNewTask] = useState("");

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await api.tasks.create({
      title: newTask,
      status: "todo",
      priority: "medium",
    });
    setNewTask("");
    qc.invalidateQueries({ queryKey: ["/api/tasks"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const toggleTask = async (id: string, currentStatus: string) => {
    await api.tasks.update(id, {
      status: currentStatus === "done" ? "todo" : "done",
    });
    qc.invalidateQueries({ queryKey: ["/api/tasks"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const sorted = (tasks || []).sort(
    (a: any, b: any) =>
      (a.status === "done" ? 1 : -1) - (b.status === "done" ? 1 : -1),
  );

  return (
    <WidgetWrapper module={module}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-1 mb-2 min-h-0">
          {sorted.slice(0, 8).map((t: any) => (
            <button
              key={t.id}
              onClick={() => toggleTask(t.id, t.status)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.03] transition-colors text-left group"
              data-testid={`task-${t.id}`}
            >
              {t.status === "done" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary" />
              )}
              <span
                className={`truncate ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}
              >
                {t.title}
              </span>
            </button>
          ))}
          {(!tasks || tasks.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No tasks yet
            </p>
          )}
        </div>
        <form onSubmit={addTask} className="relative mt-auto">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add task..."
            className="w-full bg-black/20 border border-white/[0.06] rounded-lg py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            data-testid="input-new-task"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-0.5 top-0.5 h-7 w-7 text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </WidgetWrapper>
  );
}
