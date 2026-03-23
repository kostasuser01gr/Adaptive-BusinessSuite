import { EventEmitter } from "node:events";
import { storage } from "./storage";
import { wsManager } from "./services/websocket";

export const eventBus = new EventEmitter();

export const EventTypes = {
  ENTITY_CREATED: "ENTITY_CREATED",
  ENTITY_UPDATED: "ENTITY_UPDATED",
  ENTITY_DELETED: "ENTITY_DELETED",
  LOW_FUEL: "LOW_FUEL",
  MAINTENANCE_DUE: "MAINTENANCE_DUE",
};

export function emitEvent(
  userId: string,
  workspaceId: string | null,
  type: string,
  payload: any,
) {
  eventBus.emit(type, {
    userId,
    workspaceId,
    type,
    payload,
    timestamp: new Date(),
  });
}

// --- System Subscribers ---

// 1. Audit Log Subscriber
eventBus.on(EventTypes.ENTITY_CREATED, async (event) => {
  const { userId, workspaceId, payload } = event;
  await storage.createAction({
    userId,
    workspaceId,
    actorType: "system",
    actionType: "create",
    description: `Created ${event.payload.entityType}: ${event.payload.entityId}`,
    entityType: event.payload.entityType,
    entityId: event.payload.entityId,
    previousState: null,
    newState: event.payload.data,
    status: "applied",
  });
});

// 2. Notification Subscriber
eventBus.on(EventTypes.ENTITY_CREATED, async (event) => {
  const { userId, workspaceId, payload } = event;

  // Logic for specific entity types
  if (payload.entityType === "booking") {
    await storage.createNotification({
      userId,
      workspaceId,
      title: "New Booking Created",
      message: `A new booking has been recorded for ${payload.data.startDate}.`,
      type: "success",
      read: false,
      metadata: { bookingId: payload.entityId },
    });
  }
});

// 3. Automation Engine Subscriber (Simplified)
eventBus.on(EventTypes.ENTITY_CREATED, async (event) => {
  const { userId, workspaceId, payload } = event;
  const autos = await storage.getAutomations(userId);

  for (const auto of autos) {
    if (
      auto.enabled &&
      auto.triggerType === "entity_created" &&
      (auto.condition as any)?.entityType === payload.entityType
    ) {
      // Simple action: create a task
      const action = auto.action as any;
      if (action.type === "create_task") {
        await storage.createTask({
          userId,
          workspaceId,
          title: action.title || `Follow up: ${payload.entityType}`,
          description:
            action.description ||
            `Automated task triggered by ${payload.entityType} creation.`,
          status: "todo",
          priority: "medium",
          dueDate: null,
          category: "automation",
        });

        await storage.createNotification({
          userId,
          workspaceId,
          title: "Automation Triggered",
          message: `Task created via automation: ${auto.name}`,
          type: "info",
          read: false,
          metadata: { automationId: auto.id },
        });
      }
    }
  }
});

// 4. WebSocket Broadcast Subscriber — push entity events to connected clients
for (const eventType of [
  EventTypes.ENTITY_CREATED,
  EventTypes.ENTITY_UPDATED,
  EventTypes.ENTITY_DELETED,
]) {
  eventBus.on(eventType, (event) => {
    const wsEvent = `entity:${eventType.split("_")[1]?.toLowerCase() || "change"}`;
    wsManager.broadcast(event.userId, wsEvent, {
      entityType: event.payload.entityType,
      entityId: event.payload.entityId,
      data: event.payload.data,
    });
  });
}
