import React, { useState } from "react";
import { Text, View } from "react-native";
import { HeroCard, Screen, AppButton, AppInput, Panel } from "../components/ui";
import { theme } from "../app/theme";
import { useAppStore } from "../state/store";
import { workspaceModeLabels, WorkspaceMode } from "../domain/models";

export function SplashGateScreen() {
  return (
    <Screen
      scroll={false}
      contentContainerStyle={{ flex: 1, justifyContent: "center" }}
    >
      <HeroCard
        title="Adaptive Business Suite"
        subtitle="AI-native operations shell for car rental, personal productivity, and mixed-mode work."
      />
      <Panel>
        <Text
          style={{ color: theme.colors.text, fontSize: 18, fontWeight: "700" }}
        >
          Restoring your local workspace...
        </Text>
        <Text style={{ color: theme.colors.textMuted, lineHeight: 20 }}>
          The app stays useful without a live model and restores your session,
          workspace config, and records locally.
        </Text>
      </Panel>
    </Screen>
  );
}

export function LoginScreen({ navigation }: any) {
  const login = useAppStore((state) => state.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <Screen
      scroll={false}
      contentContainerStyle={{ flex: 1, justifyContent: "center" }}
    >
      <HeroCard
        title="Operator-first mobile OS"
        subtitle="Fast enough for real check-ins, returns, reminders, and daily decision-making."
      />
      <Panel>
        <Text
          style={{ color: theme.colors.text, fontSize: 18, fontWeight: "700" }}
        >
          Log in
        </Text>
        <AppInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
        />
        <AppInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
        />
        {error ? (
          <Text style={{ color: theme.colors.danger }}>{error}</Text>
        ) : null}
        <AppButton
          label="Continue"
          onPress={() => {
            const result = login(username.trim(), password);
            if (!result.ok) setError(result.error || "Unable to log in.");
          }}
        />
        <AppButton
          label="Create account"
          variant="secondary"
          onPress={() => navigation.navigate("SignUp")}
        />
      </Panel>
    </Screen>
  );
}

export function SignUpScreen({ navigation }: any) {
  const register = useAppStore((state) => state.register);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <Screen
      scroll={false}
      contentContainerStyle={{ flex: 1, justifyContent: "center" }}
    >
      <Panel>
        <Text
          style={{ color: theme.colors.text, fontSize: 20, fontWeight: "700" }}
        >
          Create local account
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          Authentication is local-first for the Expo Go build. Backend sync is
          isolated for later.
        </Text>
        <AppInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
        />
        <AppInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
        />
        <AppInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
        />
        {error ? (
          <Text style={{ color: theme.colors.danger }}>{error}</Text>
        ) : null}
        <AppButton
          label="Create account"
          onPress={() => {
            const result = register(
              username.trim(),
              displayName.trim() || username.trim(),
              password,
            );
            if (!result.ok)
              setError(result.error || "Could not create account.");
          }}
        />
        <AppButton
          label="Back to login"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </Panel>
    </Screen>
  );
}

export function OnboardingScreen() {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [mode, setMode] = useState<WorkspaceMode>("rental");
  const [workspaceName, setWorkspaceName] = useState("");

  const descriptions: Record<WorkspaceMode, string> = {
    rental:
      "Fleet, bookings, customers, maintenance, check-in/out, and revenue.",
    personal:
      "Tasks, notes, calendar, and money snapshot with low-friction capture.",
    hybrid: "One shell for business operations and personal execution.",
    custom: "Start minimal and shape the shell with assistant proposals.",
  };

  return (
    <Screen>
      <HeroCard
        title="Choose your operating mode"
        subtitle="The workspace preset shapes modules, quick actions, widgets, and assistant suggestions."
      />
      <View style={{ gap: theme.spacing.sm }}>
        {(Object.keys(descriptions) as WorkspaceMode[]).map((option) => (
          <Panel
            key={option}
            style={{
              borderColor:
                mode === option ? theme.colors.primary : theme.colors.border,
            }}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              {workspaceModeLabels[option]}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>
              {descriptions[option]}
            </Text>
            <AppButton
              label={mode === option ? "Selected" : "Choose"}
              variant={mode === option ? "primary" : "secondary"}
              onPress={() => setMode(option)}
            />
          </Panel>
        ))}
      </View>
      <Panel>
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          Workspace name
        </Text>
        <AppInput
          value={workspaceName}
          onChangeText={setWorkspaceName}
          placeholder="e.g. Athens Rental Ops"
        />
        <AppButton
          label="Launch workspace"
          onPress={() =>
            completeOnboarding(
              mode,
              workspaceName.trim() || `${workspaceModeLabels[mode]} Workspace`,
            )
          }
        />
      </Panel>
    </Screen>
  );
}
