import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import type { IncomingMessage } from "http";

interface WebSocketClient {
  ws: WebSocket;
  userId: string;
  connectedAt: number;
  lastPing: number;
}

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, Set<WebSocketClient>>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const userId = this.extractUserId(req);
      if (!userId) {
        ws.close(4001, "Unauthorized");
        return;
      }

      const client: WebSocketClient = {
        ws,
        userId,
        connectedAt: Date.now(),
        lastPing: Date.now(),
      };

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(client);

      ws.on("pong", () => {
        client.lastPing = Date.now();
      });

      ws.on("close", () => {
        const userClients = this.clients.get(userId);
        if (userClients) {
          userClients.delete(client);
          if (userClients.size === 0) {
            this.clients.delete(userId);
          }
        }
      });

      ws.on("error", () => {
        ws.close();
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: "connected",
        data: { userId, timestamp: Date.now() },
      });
    });

    // Heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 30_000);
  }

  private extractUserId(req: IncomingMessage): string | null {
    // Extract userId from query string (set during WebSocket connection from client)
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    return url.searchParams.get("userId");
  }

  private sendToClient(
    ws: WebSocket,
    message: { type: string; data: unknown },
  ) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private cleanupStaleConnections() {
    const now = Date.now();
    const timeout = 60_000;

    for (const [userId, userClients] of Array.from(this.clients.entries())) {
      for (const client of Array.from(userClients)) {
        if (now - client.lastPing > timeout) {
          client.ws.terminate();
          userClients.delete(client);
        } else {
          client.ws.ping();
        }
      }
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * Send event to a specific user (all their connected sessions).
   */
  broadcast(userId: string, event: string, data: unknown) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const message = { type: event, data, timestamp: Date.now() };
    for (const client of Array.from(userClients)) {
      this.sendToClient(client.ws, message);
    }
  }

  /**
   * Send event to all connected users.
   */
  broadcastAll(event: string, data: unknown) {
    const message = { type: event, data, timestamp: Date.now() };
    for (const [, userClients] of Array.from(this.clients.entries())) {
      for (const client of Array.from(userClients)) {
        this.sendToClient(client.ws, message);
      }
    }
  }

  /**
   * Get connection statistics.
   */
  getStats() {
    let totalConnections = 0;
    for (const [, clients] of Array.from(this.clients.entries())) {
      totalConnections += clients.size;
    }
    return {
      uniqueUsers: this.clients.size,
      totalConnections,
    };
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const wsManager = new WebSocketManager();
