interface ActiveSession {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: Date;
  lastActive: Date;
}

/** In-memory session tracking (can be upgraded to DB-backed in production) */
class SessionManager {
  private sessions = new Map<string, ActiveSession>();

  track(sessionId: string, userId: string, ip: string, userAgent: string) {
    this.sessions.set(sessionId, {
      id: sessionId,
      userId,
      ip,
      userAgent,
      createdAt: this.sessions.get(sessionId)?.createdAt || new Date(),
      lastActive: new Date(),
    });
  }

  getForUser(userId: string): ActiveSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId,
    );
  }

  revoke(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  revokeAllForUser(userId: string, exceptSessionId?: string): number {
    let count = 0;
    for (const [id, session] of Array.from(this.sessions.entries())) {
      if (session.userId === userId && id !== exceptSessionId) {
        this.sessions.delete(id);
        count++;
      }
    }
    return count;
  }
}

export const sessionManager = new SessionManager();
