import React, { useState } from "react";
import { ModuleConfig } from "@/lib/store";
import { WidgetWrapper } from "./GenericWidget";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function NotesWidget({ module }: { module: ModuleConfig }) {
  const qc = useQueryClient();
  const { data: notesList } = useQuery({
    queryKey: ["/api/notes"],
    queryFn: api.notes.list,
  });
  const [newNote, setNewNote] = useState("");

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await api.notes.create({ content: newNote });
    setNewNote("");
    qc.invalidateQueries({ queryKey: ["/api/notes"] });
  };

  return (
    <WidgetWrapper module={module}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-1.5 mb-2 min-h-0">
          {(notesList || []).slice(0, 6).map((n: any) => (
            <div
              key={n.id}
              className="bg-black/15 border border-white/[0.04] rounded-lg p-2.5 text-xs group hover:border-white/[0.08] transition-colors"
              data-testid={`note-${n.id}`}
            >
              <p className="text-foreground/90 line-clamp-2">{n.content}</p>
            </div>
          ))}
          {(!notesList || notesList.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No notes yet
            </p>
          )}
        </div>
        <form onSubmit={addNote} className="relative mt-auto">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Quick note..."
            className="w-full bg-black/20 border border-white/[0.06] rounded-lg py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            data-testid="input-new-note"
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
