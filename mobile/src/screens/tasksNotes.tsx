import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  AppButton,
  AppInput,
  Panel,
  Screen,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import { theme } from "../app/theme";
import { useAppStore } from "../state/store";
import { useWorkspaceNotes, useWorkspaceTasks } from "../state/selectors";

export function TasksScreen({ navigation }: any) {
  const tasks = useWorkspaceTasks();
  const addTask = useAppStore((state) => state.addTask);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const [title, setTitle] = useState("");

  return (
    <Screen>
      <SectionHeader
        title="Tasks"
        subtitle="Operational execution with a lightweight assignment placeholder."
        action={
          <AppButton
            label="Notes"
            variant="secondary"
            onPress={() => navigation.navigate("Notes")}
          />
        }
      />
      <Panel>
        <AppInput
          value={title}
          onChangeText={setTitle}
          placeholder="Add task"
        />
        <AppButton
          label="Create task"
          onPress={() => {
            addTask(title || "New task");
            setTitle("");
          }}
        />
      </Panel>
      {tasks.map((task) => (
        <Panel key={task.id}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                {task.title}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                Due {new Date(task.dueOn).toLocaleDateString()} ·{" "}
                {task.assigneeLabel}
              </Text>
            </View>
            <StatusBadge
              label={task.status}
              tone={
                task.status === "done"
                  ? "success"
                  : task.status === "doing"
                    ? "warning"
                    : "info"
              }
            />
          </View>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <AppButton
              label="Todo"
              variant="secondary"
              onPress={() => updateTaskStatus(task.id, "todo")}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Doing"
              variant="secondary"
              onPress={() => updateTaskStatus(task.id, "doing")}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Done"
              variant="secondary"
              onPress={() => updateTaskStatus(task.id, "done")}
              style={{ flex: 1 }}
            />
          </View>
        </Panel>
      ))}
    </Screen>
  );
}

export function NotesScreen() {
  const notes = useWorkspaceNotes();
  const addNote = useAppStore((state) => state.addNote);
  const toggleNotePin = useAppStore((state) => state.toggleNotePin);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <Screen>
      <SectionHeader
        title="Notes"
        subtitle="Quick capture from anywhere, with pinning for the dashboard."
      />
      <Panel>
        <AppInput
          value={title}
          onChangeText={setTitle}
          placeholder="Note title"
        />
        <AppInput
          value={content}
          onChangeText={setContent}
          placeholder="What do you need to remember?"
          multiline
        />
        <AppButton
          label="Save note"
          onPress={() => {
            addNote(
              title || "Quick note",
              content || "Captured from the notes screen.",
            );
            setTitle("");
            setContent("");
          }}
        />
      </Panel>
      {notes.map((note) => (
        <Panel key={note.id}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                {note.title}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {note.content}
              </Text>
            </View>
            <StatusBadge
              label={note.pinned ? "Pinned" : "Normal"}
              tone={note.pinned ? "success" : "info"}
            />
          </View>
          <AppButton
            label={note.pinned ? "Unpin" : "Pin"}
            variant="secondary"
            onPress={() => toggleNotePin(note.id)}
          />
        </Panel>
      ))}
    </Screen>
  );
}
