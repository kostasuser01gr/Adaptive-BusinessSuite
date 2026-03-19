import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAppState } from "@/lib/store";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, register, isAuthenticated } = useAppState();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("All fields required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password, displayName || username);
      }
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md p-8 glass-card rounded-3xl z-10 mx-4 border-t border-white/20">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)]">
            <Sparkles className="text-white h-6 w-6" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1
            className="text-3xl font-heading font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70"
            data-testid="text-app-title"
          >
            Nexus OS
          </h1>
          <p className="text-muted-foreground text-sm">
            The adaptable operating system for business and life.
          </p>
        </div>

        <div className="flex mb-6 bg-black/20 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="button-login-tab"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="button-register-tab"
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div
            className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20"
            data-testid="text-auth-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                data-testid="input-display-name"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              placeholder="Enter username"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              data-testid="input-username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="Enter password"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              data-testid="input-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-md shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all group"
            data-testid="button-auth-submit"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
