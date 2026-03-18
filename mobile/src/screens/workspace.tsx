import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  AppButton,
  AppInput,
  Chip,
  Panel,
  Screen,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import { theme } from "../app/theme";
import { workspaceModeLabels, WorkspaceMode } from "../domain/models";
import { useAppStore } from "../state/store";
import { useActiveWorkspace } from "../state/selectors";

export function WorkspaceScreen({ navigation }: any) {
  const workspace = useActiveWorkspace();
  const workspaces = useAppStore((state) =>
    state.workspaces.filter(
      (item) => item.ownerId === state.session.activeUserId,
    ),
  );
  const switchWorkspace = useAppStore((state) => state.switchWorkspace);
  const createWorkspace = useAppStore((state) => state.createWorkspace);
  const resetActiveWorkspaceToPreset = useAppStore(
    (state) => state.resetActiveWorkspaceToPreset,
  );
  const [name, setName] = useState("");
  const [mode, setMode] = useState<WorkspaceMode>("rental");

  if (!workspace) return null;

  return (
    <Screen>
      <SectionHeader
        title="Workspace"
        subtitle="Presets, modules, quick actions, fields, and saved layout control."
        action={
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <AppButton
              label="Settings"
              variant="secondary"
              onPress={() => navigation.navigate("Settings")}
            />
            <AppButton
              label="History"
              variant="secondary"
              onPress={() => navigation.navigate("History")}
            />
          </View>
        }
      />
      <Panel>
        <Text
          style={{ color: theme.colors.text, fontSize: 20, fontWeight: "700" }}
        >
          {workspace.name}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {workspaceModeLabels[workspace.mode]} mode
        </Text>
        <StatusBadge
          label={`${workspace.modules.length} modules`}
          tone="info"
        />
        <AppButton
          label="Reset to preset"
          variant="secondary"
          onPress={resetActiveWorkspaceToPreset}
        />
      </Panel>

      <Panel>
        <SectionHeader
          title="Switch workspace"
          subtitle="Multi-workspace shell selection."
        />
        {workspaces.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            active={item.id === workspace.id}
            onPress={() => switchWorkspace(item.id)}
          />
        ))}
      </Panel>

      <Panel>
        <SectionHeader
          title="Create new workspace"
          subtitle="Spin up another preset without losing the current one."
        />
        <AppInput
          value={name}
          onChangeText={setName}
          placeholder="Workspace name"
        />
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.sm,
            flexWrap: "wrap",
          }}
        >
          {(["rental", "personal", "hybrid", "custom"] as const).map(
            (option) => (
              <Chip
                key={option}
                label={workspaceModeLabels[option]}
                active={mode === option}
                onPress={() => setMode(option)}
              />
            ),
          )}
        </View>
        <AppButton
          label="Create workspace"
          onPress={() => {
            createWorkspace(
              mode,
              name || `${workspaceModeLabels[mode]} Workspace`,
            );
            setName("");
          }}
        />
      </Panel>

      <Panel>
        <SectionHeader
          title="Modules"
          subtitle="Active modules in the current shell."
        />
        {workspace.modules.map((module) => (
          <Text key={module.id} style={{ color: theme.colors.text }}>
            {module.title} · {module.description}
          </Text>
        ))}
      </Panel>

      <Panel>
        <SectionHeader
          title="Custom fields"
          subtitle="Workspace-scoped field extensions."
        />
        {Object.entries(workspace.customFields).map(([scope, fields]) => (
          <View key={scope}>
            <Text
              style={{
                color: theme.colors.text,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              {scope}
            </Text>
            {fields.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted }}>
                No custom fields yet.
              </Text>
            ) : (
              fields.map((field) => (
                <Text key={field.id} style={{ color: theme.colors.textMuted }}>
                  {field.label} · {field.type}
                </Text>
              ))
            )}
          </View>
        ))}
      </Panel>

      <Panel>
        <SectionHeader
          title="Quick actions"
          subtitle="The current thumb-reach action rail."
        />
        {workspace.quickActions.map((action) => (
          <Chip key={action.id} label={action.label} />
        ))}
      </Panel>
    </Screen>
  );
}

export function SettingsScreen() {
  const modelSettings = useAppStore((state) => state.modelSettings);
  const setModelSettings = useAppStore((state) => state.setModelSettings);

  return (
    <Screen>
      <SectionHeader
        title="Settings"
        subtitle="Model routing, backend sync placeholder, and fallback behavior."
      />
      <Panel>
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          Provider
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.sm,
            flexWrap: "wrap",
          }}
        >
          {[
            ["none", "No model"],
            ["mock-local", "Mock local"],
            ["openai-compatible", "OpenAI-compatible"],
            ["local-private", "Local/private"],
            ["fast-lightweight", "Fast model"],
            ["advanced-reasoning", "Reasoning model"],
          ].map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              active={modelSettings.activeProvider === value}
              onPress={() =>
                setModelSettings({
                  activeProvider: value as typeof modelSettings.activeProvider,
                  activeModelLabel: label,
                })
              }
            />
          ))}
        </View>
        <AppButton
          label={
            modelSettings.fallbackModeEnabled
              ? "Fallback mode on"
              : "Fallback mode off"
          }
          variant="secondary"
          onPress={() =>
            setModelSettings({
              fallbackModeEnabled: !modelSettings.fallbackModeEnabled,
            })
          }
        />
      </Panel>

      <Panel>
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          Capability profile
        </Text>
        <AppInput
          value={modelSettings.capabilityProfile}
          onChangeText={(value) =>
            setModelSettings({ capabilityProfile: value })
          }
          placeholder="Model capability profile"
          multiline
        />
      </Panel>

      <Panel>
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          Future backend sync
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          The Expo Go app stays local-first. When the Railway backend is ready,
          plug its public URL here without changing the screen layer.
        </Text>
        <AppInput
          value={modelSettings.backendBaseUrl}
          onChangeText={(value) => setModelSettings({ backendBaseUrl: value })}
          placeholder="https://your-railway-service.up.railway.app"
        />
      </Panel>
    </Screen>
  );
}

export function HistoryScreen() {
  const workspace = useActiveWorkspace();
  const history = useAppStore((state) =>
    state.history.filter((entry) => entry.workspaceId === workspace?.id),
  );
  const rollbackHistoryEntry = useAppStore(
    (state) => state.rollbackHistoryEntry,
  );

  if (!workspace) return null;

  return (
    <Screen>
      <SectionHeader
        title="History"
        subtitle="Configuration changes, preset resets, and rollback support."
      />
      {history.length === 0 ? (
        <Panel>
          <Text style={{ color: theme.colors.textMuted }}>
            No changes saved yet.
          </Text>
        </Panel>
      ) : (
        history
          .slice()
          .reverse()
          .map((entry) => (
            <Panel key={entry.id}>
              <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                {entry.title}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {entry.description}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {new Date(entry.createdAt).toLocaleString()}
              </Text>
              {entry.previousWorkspaceSnapshot ? (
                <AppButton
                  label="Rollback"
                  variant="secondary"
                  onPress={() => rollbackHistoryEntry(entry.id)}
                />
              ) : null}
            </Panel>
          ))
      )}
    </Screen>
  );
}
