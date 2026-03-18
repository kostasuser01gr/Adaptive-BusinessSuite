import {
  AssistantSuggestion,
  createWorkspacePreset,
  nowIso,
  WorkspaceRecord,
} from "../domain/models";

export function cloneWorkspace(workspace: WorkspaceRecord): WorkspaceRecord {
  return JSON.parse(JSON.stringify(workspace)) as WorkspaceRecord;
}

function upsertByLabel<
  T extends { title?: string; label?: string; id: string },
>(items: T[], next: T) {
  const key = next.title ?? next.label;
  const exists = items.some((item) => (item.title ?? item.label) === key);
  return exists ? items : [...items, next];
}

export function applySuggestionToWorkspace(
  workspace: WorkspaceRecord,
  suggestion: AssistantSuggestion,
): WorkspaceRecord {
  const next = cloneWorkspace(workspace);

  switch (suggestion.action.type) {
    case "add-module":
      next.modules = upsertByLabel(next.modules, suggestion.action.module);
      break;
    case "add-custom-field":
      next.customFields[suggestion.action.field.scope] = upsertByLabel(
        next.customFields[suggestion.action.field.scope],
        suggestion.action.field,
      );
      break;
    case "add-quick-action":
      next.quickActions = upsertByLabel(
        next.quickActions,
        suggestion.action.quickAction,
      );
      break;
    case "add-widget":
      next.dashboardWidgets = upsertByLabel(
        next.dashboardWidgets,
        suggestion.action.widget,
      );
      const nextWidgetIds = next.dashboardWidgets.map((widget) => widget.id);
      next.savedLayouts = next.savedLayouts.map((layout) =>
        layout.id === next.activeLayoutId
          ? { ...layout, widgetIds: nextWidgetIds }
          : layout,
      );
      break;
    case "switch-mode": {
      const reset = createWorkspacePreset(
        suggestion.action.mode,
        workspace.ownerId,
        workspace.name,
        workspace.id,
      );
      next.mode = reset.mode;
      next.modules = reset.modules;
      next.dashboardWidgets = reset.dashboardWidgets;
      next.quickActions = reset.quickActions;
      next.savedLayouts = reset.savedLayouts;
      next.activeLayoutId = reset.activeLayoutId;
      break;
    }
    case "create-workflow":
      next.modules = upsertByLabel(next.modules, suggestion.action.module);
      next.quickActions = upsertByLabel(
        next.quickActions,
        suggestion.action.quickAction,
      );
      break;
    case "noop":
      break;
  }

  next.updatedAt = nowIso();
  return next;
}

export function resetWorkspaceToPreset(
  workspace: WorkspaceRecord,
): WorkspaceRecord {
  const reset = createWorkspacePreset(
    workspace.mode,
    workspace.ownerId,
    workspace.name,
    workspace.id,
  );
  reset.customFields = workspace.customFields;
  reset.updatedAt = nowIso();
  return reset;
}
