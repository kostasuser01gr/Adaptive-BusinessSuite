import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2 } from "lucide-react";

export default function NotesPage() {
  const qc = useQueryClient();
  const { data: notesList } = useQuery({
    queryKey: ["/api/notes"],
    queryFn: api.notes.list,
  });
  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await api.notes.create({
      content: newContent,
      title: newTitle || undefined,
    });
    setNewContent("");
    setNewTitle("");
    qc.invalidateQueries({ queryKey: ["/api/notes"] });
  };

  const deleteNote = async (id: string) => {
    const previousNotes = qc.getQueryData(["/api/notes"]);
    qc.setQueryData(["/api/notes"], (current: any[] = []) =>
      current.filter((note) => note.id !== id),
    );

    try {
      await api.notes.remove(id);
      await qc.invalidateQueries({ queryKey: ["/api/notes"] });
    } catch (error) {
      qc.setQueryData(["/api/notes"], previousNotes);
      throw error;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1
        className="text-xl font-heading font-bold mb-6"
        data-testid="text-notes-title"
      >
        Notes
      </h1>

      <form
        onSubmit={addNote}
        className="bg-card/40 border border-white/[0.06] rounded-xl p-4 mb-6"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full bg-transparent border-none text-sm font-medium focus:outline-none mb-2 placeholder:text-muted-foreground"
          data-testid="input-note-title"
        />
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          className="w-full bg-transparent border-none text-xs focus:outline-none resize-none placeholder:text-muted-foreground"
          data-testid="input-note-content"
        />
        <div className="flex justify-end mt-2">
          <Button
            type="submit"
            size="sm"
            className="text-xs gap-1.5"
            data-testid="button-save-note"
          >
            <Plus className="h-3.5 w-3.5" />
            Save Note
          </Button>
        </div>
      </form>

      {!notesList || notesList.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No notes yet</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notesList.map((n: any) => (
            <div
              key={n.id}
              className="bg-card/40 border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors group"
              data-testid={`note-card-${n.id}`}
            >
              {n.title && (
                <p className="text-sm font-semibold mb-1">{n.title}</p>
              )}
              <p className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-4">
                {n.content}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => deleteNote(n.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  aria-label={`Delete note ${n.title || n.content.slice(0, 20)}`}
                  data-testid={`button-delete-note-${n.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
