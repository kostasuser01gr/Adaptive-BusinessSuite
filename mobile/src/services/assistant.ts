import {
  AssistantContextSnapshot,
  AssistantInterpretation,
  AssistantMemoryRecord,
  AssistantSuggestion,
  createCustomField,
  createId,
  createModule,
  createQuickAction,
  createWidget,
  ModelProviderId,
  ModelSettings,
  nowIso,
} from "../domain/models";
import { apiClient } from "./apiClient";

export interface ModelAdapter {
  id: ModelProviderId;
  label: string;
  capabilityProfile: string[];
  interpret(
    command: string,
    context: AssistantContextSnapshot,
    source?: "text" | "voice",
  ): Promise<AssistantInterpretation>;
}

function suggestionBase(command: string, workspaceId: string | null) {
  return {
    id: createId("suggestion"),
    command,
    workspaceId,
    status: "pending" as const,
    createdAt: nowIso(),
  };
}

function createMemory(
  workspaceId: string | null,
  key: string,
  value: string,
): AssistantMemoryRecord {
  return {
    id: createId("memory"),
    workspaceId,
    key,
    value,
  };
}

function interpretDeterministically(
  command: string,
  context: AssistantContextSnapshot,
): AssistantInterpretation {
  const normalized = command.trim().toLowerCase();
  const workspaceId = context.workspace.id;

  if (normalized.includes("damage reports")) {
    const suggestion: AssistantSuggestion = {
      ...suggestionBase(command, workspaceId),
      title: "Add Damage Reports module",
      description:
        "Create a dedicated module for intake damage tracking and vehicle condition follow-up.",
      preview: [
        "New module in workspace navigation",
        "A focused place for damage-related workflows",
        "Ready for future form and photo capture integrations",
      ],
      action: {
        type: "add-module",
        module: createModule(
          "damage-reports",
          "Damage Reports",
          "Track condition issues and damage follow-ups.",
          "warning",
        ),
      },
    };

    return {
      reply:
        "I prepared a Damage Reports module proposal. Review the preview and apply it when you are ready.",
      suggestions: [suggestion],
      memoryUpdates: [
        createMemory(workspaceId, "last_command_topic", "damage-reports"),
      ],
    };
  }

  if (
    normalized.includes("pickup location") &&
    normalized.includes("booking")
  ) {
    const suggestion: AssistantSuggestion = {
      ...suggestionBase(command, workspaceId),
      title: "Add Pickup Location field",
      description:
        "Attach a reusable custom field to booking records for pickup logistics.",
      preview: [
        "Bookings gain a Pickup Location custom field",
        "The field is stored in workspace configuration",
        "Ready for future sync to a remote backend",
      ],
      action: {
        type: "add-custom-field",
        field: createCustomField(
          "bookings",
          "Pickup Location",
          "text",
          "Airport, office, hotel",
        ),
      },
    };

    return {
      reply: "I turned that into a structured booking-field proposal.",
      suggestions: [suggestion],
    };
  }

  if (
    (normalized.includes("quick button") ||
      normalized.includes("quick action")) &&
    normalized.includes("new booking")
  ) {
    const suggestion: AssistantSuggestion = {
      ...suggestionBase(command, workspaceId),
      title: "Add quick action for New Booking",
      description:
        "Place a one-tap New Booking action in the workspace quick-action rail.",
      preview: [
        "Quick action appears on dashboard and global quick create context",
        "Keeps booking creation within thumb reach",
      ],
      action: {
        type: "add-quick-action",
        quickAction: createQuickAction(
          "New Booking",
          "add-circle",
          "NewBooking",
        ),
      },
    };

    return {
      reply: "I prepared a quick-action proposal for New Booking.",
      suggestions: [suggestion],
    };
  }

  if (normalized.includes("today") && normalized.includes("return")) {
    return {
      reply: `Today there are ${context.todayReturnsCount} return(s) due. Open Bookings or the Quick Check-Out flow if you want to action them immediately.`,
      suggestions: [],
    };
  }

  if (
    normalized.includes("suggest improvements") ||
    (normalized.includes("improve") && normalized.includes("dashboard"))
  ) {
    const suggestions: AssistantSuggestion[] = [];
    const hasReturnsWidget = context.workspace.dashboardWidgets.some(
      (widget) => widget.type === "returns-today",
    );
    const hasRecommendationWidget = context.workspace.dashboardWidgets.some(
      (widget) => widget.type === "assistant-recommendations",
    );

    if (!hasReturnsWidget) {
      suggestions.push({
        ...suggestionBase(command, workspaceId),
        title: "Add Returns Today widget",
        description: "Surface return pressure directly on the command center.",
        preview: [
          "A dedicated return widget appears on the dashboard",
          "Improves end-of-day handoff visibility",
        ],
        action: {
          type: "add-widget",
          widget: createWidget(
            "returns-today",
            "Returns Today",
            "Track vehicles expected back before close of day.",
          ),
        },
      });
    }

    if (!hasRecommendationWidget) {
      suggestions.push({
        ...suggestionBase(command, workspaceId),
        title: "Add Assistant Recommendations widget",
        description:
          "Keep proactive suggestions visible even when the assistant panel is closed.",
        preview: [
          "Assistant recommendations stay visible on the dashboard",
          "Deterministic recommendations still work without a live model",
        ],
        action: {
          type: "add-widget",
          widget: createWidget(
            "assistant-recommendations",
            "Assistant Recommendations",
            "Always-on guidance from the intelligence layer.",
          ),
        },
      });
    }

    if (suggestions.length === 0) {
      return {
        reply:
          "Your dashboard already has the key recommendation widgets. My next improvement would be refining quick actions and custom fields based on your busiest flow.",
        suggestions: [],
      };
    }

    return {
      reply:
        "I generated dashboard improvement proposals based on what is currently missing.",
      suggestions,
    };
  }

  if (normalized.includes("switch") && normalized.includes("personal")) {
    const suggestion: AssistantSuggestion = {
      ...suggestionBase(command, workspaceId),
      title: "Switch workspace to Personal mode",
      description:
        "Re-shape modules, widgets, and quick actions around personal productivity.",
      preview: [
        "Preset changes dashboard and navigation modules",
        "Existing custom fields stay preserved",
        "History entry allows rollback to the previous mode",
      ],
      action: {
        type: "switch-mode",
        mode: "personal",
      },
    };

    return {
      reply:
        "I prepared a preset-switch proposal to move this workspace into Personal mode.",
      suggestions: [suggestion],
    };
  }

  if (normalized.includes("summarize")) {
    return {
      reply: `Workspace ${context.workspace.name} is in ${context.workspace.mode} mode with ${context.workspace.modules.length} module(s), ${context.activeBookingsCount} active booking(s), ${context.availableVehiclesCount} available vehicle(s), and ${context.overdueTasksCount} overdue task(s).`,
      suggestions: [],
    };
  }

  return {
    reply:
      "I can help with modules, quick actions, custom fields, dashboard widgets, preset changes, workflow proposals, and workspace summaries. Try: Add a Damage Reports module or Summarize my workspace.",
    suggestions: [],
  };
}

export const deterministicAdapter: ModelAdapter = {
  id: "none",
  label: "No-model deterministic mode",
  capabilityProfile: [
    "Command interpretation",
    "Config proposals",
    "Rule-based recommendations",
  ],
  interpret: async (command, context) =>
    interpretDeterministically(command, context),
};

export const remoteAdapter: ModelAdapter = {
  id: "openai",
  label: "Live AI Adapter",
  capabilityProfile: [
    "Semantic reasoning",
    "RAG-enhanced context",
    "Proactive automation",
  ],
  interpret: async (command, context, source = "text") => {
    try {
      const response = await apiClient.chat.send(command, source);
      const suggestions: AssistantSuggestion[] = [];

      if (response.proposedAction) {
        suggestions.push({
          id: createId("suggestion"),
          command,
          workspaceId: context.workspace.id,
          title: response.proposedAction.label || "AI Proposed Action",
          description: `AI suggested a ${response.proposedAction.type} mutation.`,
          preview: [JSON.stringify(response.proposedAction.payload, null, 2)],
          status: "pending",
          createdAt: nowIso(),
          action: {
            type: "remote-mutation",
            raw: response.proposedAction,
          } as any,
        });
      }

      return {
        reply: response.assistantMessage.content,
        suggestions,
        memoryUpdates: [],
      };
    } catch (err) {
      console.error("Remote adapter failed, falling back:", err);
      return interpretDeterministically(command, context);
    }
  },
};

export function getModelAdapter(settings: ModelSettings): ModelAdapter {
  if (settings.fallbackModeEnabled || settings.activeProvider === "none") {
    return deterministicAdapter;
  }

  return remoteAdapter;
}
