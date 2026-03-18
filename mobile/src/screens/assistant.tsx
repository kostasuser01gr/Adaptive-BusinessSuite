import React, { useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
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
import { useAppStore } from "../state/store";
import { useActiveWorkspace } from "../state/selectors";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// --- Specialized Generative UI for Mobile ---

const YieldRecommendation = ({ multiplier, uplift, reason }: any) => (
  <View style={styles.yieldCard}>
    <View style={styles.yieldHeader}>
      <MaterialCommunityIcons
        name="trending-up"
        size={16}
        color={theme.colors.primary}
      />
      <Text style={styles.yieldTitle}>Pricing Optimization</Text>
    </View>
    <Text style={styles.yieldValue}>{multiplier}x</Text>
    <Text style={styles.yieldText}>
      Recommended rate adjustment. Projected revenue uplift:{" "}
      <Text style={{ color: theme.colors.success, fontWeight: "bold" }}>
        {uplift}
      </Text>
      .
    </Text>
    <Text style={styles.yieldReason}>Reason: {reason}</Text>
  </View>
);

const InspectionFindings = ({ findings }: any) => (
  <View style={{ gap: 8, marginTop: 8 }}>
    {findings.map((f: any, i: number) => (
      <View key={i} style={styles.findingItem}>
        <MaterialCommunityIcons
          name="shield-alert"
          size={16}
          color={
            f.severity === "high" ? theme.colors.danger : theme.colors.warning
          }
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.findingPart}>{f.part}</Text>
          <Text style={styles.findingDetail}>
            {f.type} - {f.severity} severity
          </Text>
        </View>
        <Text style={styles.findingConf}>
          {Math.round(f.confidence * 100)}%
        </Text>
      </View>
    ))}
  </View>
);

export function AssistantScreen() {
  const workspace = useActiveWorkspace();
  const assistantMessages = useAppStore((state) =>
    state.assistantMessages.filter(
      (message) =>
        message.workspaceId === workspace?.id || message.workspaceId === null,
    ),
  );
  const assistantSuggestions = useAppStore((state) =>
    state.assistantSuggestions.filter(
      (suggestion) =>
        suggestion.workspaceId === workspace?.id ||
        suggestion.workspaceId === null,
    ),
  );
  const modelSettings = useAppStore((state) => state.modelSettings);
  const sendAssistantCommand = useAppStore(
    (state) => state.sendAssistantCommand,
  );
  const applySuggestion = useAppStore((state) => state.applySuggestion);
  const dismissSuggestion = useAppStore((state) => state.dismissSuggestion);
  const [command, setCommand] = useState("");
  const [isListening, setIsListening] = useState(false);

  const prompts = [
    "Run yield analysis",
    "Inspect car condition",
    "Show me the status of the Audi",
    "Who is renting the Tesla?",
  ];

  if (!workspace) return null;

  const handleVoicePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsListening(true);
    setTimeout(async () => {
      setIsListening(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  return (
    <Screen>
      <SectionHeader
        title="Assistant"
        subtitle="Ultra Intelligence integrated into your daily workspace rhythm."
      />
      <Panel>
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          Model routing
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          Provider: {modelSettings.activeProvider} ·{" "}
          {modelSettings.activeModelLabel}
        </Text>
        <StatusBadge
          label={
            modelSettings.fallbackModeEnabled
              ? "Fallback active"
              : "Ultra RAG enabled"
          }
          tone="info"
        />
      </Panel>

      <Panel>
        <AppInput
          value={command}
          onChangeText={setCommand}
          placeholder="Ask about fleet, customers, or bookings..."
          multiline
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            {prompts.map((prompt) => (
              <Chip
                key={prompt}
                label={prompt}
                onPress={() => setCommand(prompt)}
              />
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <AppButton
            label="Send"
            icon="sparkles"
            style={{ flex: 3 }}
            onPress={async () => {
              if (!command.trim()) return;
              await sendAssistantCommand(command.trim());
              setCommand("");
            }}
          />
          <AppButton
            label={isListening ? "..." : "Voice"}
            icon="mic"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={handleVoicePress}
          />
        </View>
      </Panel>

      <SectionHeader
        title="Proposals & Insights"
        subtitle="AI-generated components and multi-step mutations."
      />
      {assistantSuggestions.filter(
        (suggestion) => suggestion.status === "pending",
      ).length === 0 ? (
        <Panel>
          <Text style={{ color: theme.colors.textMuted }}>
            No active proposals right now.
          </Text>
        </Panel>
      ) : (
        assistantSuggestions
          .filter((suggestion) => suggestion.status === "pending")
          .map((suggestion) => (
            <Panel
              key={suggestion.id}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary,
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                {suggestion.title}
              </Text>
              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                {suggestion.description}
              </Text>

              {suggestion.action?.type === "remote-mutation" &&
                (suggestion.action as any).raw.generativeUI && (
                  <View style={{ marginBottom: 12 }}>
                    {(suggestion.action as any).raw.generativeUI.type ===
                      "YieldRecommendation" && (
                      <YieldRecommendation
                        {...(suggestion.action as any).raw.generativeUI.props}
                      />
                    )}
                    {(suggestion.action as any).raw.generativeUI.type ===
                      "InspectionFindings" && (
                      <InspectionFindings
                        {...(suggestion.action as any).raw.generativeUI.props}
                      />
                    )}
                  </View>
                )}

              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <AppButton
                  label="Approve"
                  onPress={() => applySuggestion(suggestion.id)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  label="Dismiss"
                  variant="secondary"
                  onPress={() => dismissSuggestion(suggestion.id)}
                  style={{ flex: 1 }}
                />
              </View>
            </Panel>
          ))
      )}

      <SectionHeader
        title="Conversation"
        subtitle="Operational memory across your entire fleet."
      />
      {assistantMessages.map((message) => (
        <Panel
          key={message.id}
          style={{
            backgroundColor:
              message.role === "assistant"
                ? theme.colors.surface
                : theme.colors.surfaceAlt,
          }}
        >
          <Text
            style={{
              color:
                message.role === "assistant"
                  ? theme.colors.primary
                  : theme.colors.textMuted,
              fontWeight: "700",
            }}
          >
            {message.role === "assistant" ? "Assistant" : "You"}
          </Text>
          <Text style={{ color: theme.colors.text, lineHeight: 20 }}>
            {message.content}
          </Text>
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  yieldCard: {
    backgroundColor: "rgba(103, 210, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(103, 210, 255, 0.2)",
  },
  yieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  yieldTitle: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  yieldValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  yieldText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  yieldReason: {
    color: theme.colors.text,
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 8,
    opacity: 0.7,
  },
  findingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  findingPart: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  findingDetail: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: "capitalize",
  },
  findingConf: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: "monospace",
    opacity: 0.5,
  },
});
