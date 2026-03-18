import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";

export default function TasksPage() {
  const qc = useQueryClient();
  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: api.tasks.list,
  });
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState("medium");

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api.tasks.create({ title: newTitle, status: "todo", priority });
    setNewTitle("");
    qc.invalidateQueries({ queryKey: ["/api/tasks"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const toggleTask = async (id: string, status: string) => {
    await api.tasks.update(id, { status: status === "done" ? "todo" : "done" });
    qc.invalidateQueries({ queryKey: ["/api/tasks"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const deleteTask = async (id: string) => {
    await api.tasks.remove(id);
    qc.invalidateQueries({ queryKey: ["/api/tasks"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const todoTasks = (tasks || []).filter((t: any) => t.status !== "done");
  const doneTasks = (tasks || []).filter((t: any) => t.status === "done");
  const priorityColors: Record<string, string> = {
    high: "text-rose-400",
    medium: "text-amber-400",
    low: "text-muted-foreground",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-heading font-bold mb-6">Tasks</h1>

      <form onSubmit={addTask} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-card/40 border border-white/[0.06] rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
          data-testid="input-task-title"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-card/40 border border-white/[0.06] rounded-lg px-2 py-2.5 text-xs"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button
          type="submit"
          size="sm"
          className="text-xs"
          data-testid="button-add-task"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </form>

      <div className="space-y-1.5 mb-8">
        {todoTasks.map((t: any) => (
          <div
            key={t.id}
            className="bg-card/40 border border-white/[0.04] rounded-xl px-4 py-3 flex items-center gap-3 group hover:border-white/[0.08] transition-colors"
            data-testid={`task-item-${t.id}`}
          >
            <button
              onClick={() => toggleTask(t.id, t.status)}
              className="shrink-0"
            >
              <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{t.title}</p>
              <span
                className={`text-[10px] capitalize ${priorityColors[t.priority] || ""}`}
              >
                {t.priority}
              </span>
            </div>
            <button
              onClick={() => deleteTask(t.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {doneTasks.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
            Completed ({doneTasks.length})
          </p>
          <div className="space-y-1.5">
            {doneTasks.map((t: any) => (
              <div
                key={t.id}
                className="bg-card/20 border border-white/[0.02] rounded-xl px-4 py-3 flex items-center gap-3 group"
              >
                <button
                  onClick={() => toggleTask(t.id, t.status)}
                  className="shrink-0"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </button>
                <p className="text-xs text-muted-foreground line-through flex-1">
                  {t.title}
                </p>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
