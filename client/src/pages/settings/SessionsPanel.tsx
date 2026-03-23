import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Globe, X } from "lucide-react";
import { api } from "@/lib/api";

interface SessionItem {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

function getDeviceIcon(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return <Smartphone className="h-3.5 w-3.5" />;
  }
  return <Monitor className="h-3.5 w-3.5" />;
}

function getBrowserName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("edg")) return "Edge";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("chrome")) return "Chrome";
  return "Unknown Browser";
}

export default function SessionsPanel() {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading } = useQuery<SessionItem[]>({
    queryKey: ["/api/sessions"],
    queryFn: () => api.sessions.list(),
  });

  const handleRevoke = async (id: string) => {
    try {
      await api.sessions.revoke(id);
      qc.invalidateQueries({ queryKey: ["/api/sessions"] });
    } catch (err: any) {
      console.error("Failed to revoke session:", err);
    }
  };

  const handleRevokeAll = async () => {
    try {
      await api.sessions.revokeAll();
      qc.invalidateQueries({ queryKey: ["/api/sessions"] });
    } catch (err: any) {
      console.error("Failed to revoke sessions:", err);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <section className="bg-card/40 border border-white/[0.04] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-heading font-semibold">
            Active Sessions
          </h2>
        </div>
        {otherSessions.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleRevokeAll}
          >
            Revoke All Others
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        View and manage your active sessions across devices.
      </p>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          Loading...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          No active sessions tracked
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                s.isCurrent
                  ? "bg-primary/[0.05] border border-primary/10"
                  : "bg-black/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  {getDeviceIcon(s.userAgent)}
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-medium flex items-center gap-2">
                    {getBrowserName(s.userAgent)}
                    {s.isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <span>{s.ip}</span>
                    <span>
                      Last active{" "}
                      {new Date(s.lastActive).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {!s.isCurrent && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleRevoke(s.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
