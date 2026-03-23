import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatedMount } from "@/components/animation/AnimatedMount";
import { Button } from "@/components/ui/button";
import { Key, Plus, Trash2, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPanel() {
  const qc = useQueryClient();
  const { data: keys = [], isLoading } = useQuery<ApiKeyItem[]>({
    queryKey: ["/api/api-keys"],
    queryFn: () => api.apiKeys.list(),
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(90);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const result = await api.apiKeys.create({ name: name.trim(), expiresInDays });
      setNewKey(result.key);
      setName("");
      qc.invalidateQueries({ queryKey: ["/api/api-keys"] });
    } catch (err: any) {
      console.error("Failed to create API key:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.apiKeys.remove(id);
      qc.invalidateQueries({ queryKey: ["/api/api-keys"] });
    } catch (err: any) {
      console.error("Failed to delete API key:", err);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-card/40 border border-white/[0.04] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-heading font-semibold">API Keys</h2>
        </div>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={() => {
              setShowForm(true);
              setNewKey(null);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create API Key
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        API keys allow programmatic access to the API. Keys are shown only once
        after creation.
      </p>

      {/* New key display */}
      {newKey && (
        <AnimatedMount className="mb-4 p-3 bg-primary/[0.05] border border-primary/10 rounded-lg">
          <p className="text-[11px] font-semibold text-primary mb-2">
            New API Key Created - Copy it now, it won't be shown again!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] bg-black/20 rounded px-2 py-1.5 font-mono break-all">
              {newKey}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 shrink-0"
              onClick={copyKey}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs mt-2"
            onClick={() => {
              setNewKey(null);
              setShowForm(false);
            }}
          >
            Dismiss
          </Button>
        </AnimatedMount>
      )}

      {/* Create form */}
      {showForm && !newKey && (
        <AnimatedMount className="mb-4 p-3 bg-black/10 rounded-lg space-y-3">
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">
              Key Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CI Pipeline, Mobile App"
              className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">
              Expires In
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={handleCreate}
              disabled={!name.trim() || creating}
            >
              {creating ? "Creating..." : "Create Key"}
            </Button>
          </div>
        </AnimatedMount>
      )}

      {/* Key list */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          Loading...
        </div>
      ) : keys.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          No API keys yet
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between px-3 py-2.5 bg-black/10 rounded-lg"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-medium">{k.name}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                  <code>{k.prefix}...</code>
                  <span>
                    Expires{" "}
                    {new Date(k.expiresAt).toLocaleDateString()}
                  </span>
                  {k.lastUsedAt && (
                    <span>
                      Last used{" "}
                      {new Date(k.lastUsedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(k.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
