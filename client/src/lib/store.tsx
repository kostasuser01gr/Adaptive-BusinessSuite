import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { api } from "./api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ontologies, type Ontology, defaultOntology } from "@shared/ontologies";
import { WebSyncCoordinator } from "./sync";
import {
  defaultPreferences,
  mergePreferences,
  normalizePreferences,
  type AppPreferences,
  type AppPreferencesPatch,
} from "./preferences";

export type UserMode = "rental" | "personal" | "professional" | "custom";

export interface ModuleConfig {
  id: string;
  type: string;
  title: string;
  w: number;
  h: number;
  position: number;
  data?: any;
  visible?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: string[];
  proposedAction?: any;
  workflow?: any[];
  generativeUI?: any;
}

interface AppContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  mode: UserMode;
  activeOntology: Ontology;
  preferences: AppPreferences;
  modules: ModuleConfig[];
  chatHistory: Message[];
  stats: any;
  suggestions: any[];
  notifications: any[];
  unreadNotificationsCount: number;
  isChatOpen: boolean;
  isCommandBarOpen: boolean;
  isNotificationsOpen: boolean;
  currentProposal: any | null;
  currentWorkflow: any[] | null;
  currentGenerativeUI: any | null;
  login: (username: string, password: string) => Promise<any>;
  register: (
    username: string,
    password: string,
    displayName?: string,
  ) => Promise<any>;
  logout: () => Promise<void>;
  setMode: (mode: UserMode) => Promise<void>;
  updatePreferences: (patch: AppPreferencesPatch) => Promise<AppPreferences>;
  removeModule: (id: string) => Promise<void>;
  toggleChat: () => void;
  setCommandBarOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  processCommand: (command: string) => Promise<void>;
  applyProposal: () => Promise<void>;
  applyWorkflow: () => Promise<void>;
  dismissProposal: () => void;
  refetchAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommandBarOpen, setCommandBarOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<any | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<any[] | null>(null);
  const [currentGenerativeUI, setCurrentGenerativeUI] = useState<any | null>(
    null,
  );
  const qc = useQueryClient();

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.auth.me,
    retry: false,
    staleTime: Infinity,
  });
  const isAuthenticated = !!userData && !userLoading;
  const user = userData || null;
  const mode = (user?.mode as UserMode) || "rental";
  const preferences = useMemo(
    () => normalizePreferences(user?.preferences ?? defaultPreferences),
    [user?.preferences],
  );

  const activeOntology = useMemo(
    () => ontologies[mode] || defaultOntology,
    [mode],
  );

  const { data: modulesData } = useQuery({
    queryKey: ["/api/modules"],
    queryFn: api.modules.list,
    enabled: isAuthenticated,
  });
  const modules: ModuleConfig[] = (modulesData || [])
    .map((m: any, index: number) => ({
      ...m,
      w: parseInt(m.w) || 1,
      h: parseInt(m.h) || 1,
      position: typeof m.position === "number" ? m.position : index,
    }))
    .sort((left: ModuleConfig, right: ModuleConfig) => {
      if (left.position !== right.position) {
        return left.position - right.position;
      }
      return left.title.localeCompare(right.title);
    });

  const { data: chatData } = useQuery({
    queryKey: ["/api/chat"],
    queryFn: api.chat.list,
    enabled: isAuthenticated,
  });
  const chatHistory: Message[] = (chatData || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.createdAt),
    actions: m.actions as string[] | undefined,
    proposedAction: m.metadata?.proposedAction,
    workflow: m.metadata?.workflow,
    generativeUI: m.metadata?.generativeUI,
  }));

  const { data: statsData } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: api.stats,
    enabled: isAuthenticated,
  });
  const stats = statsData || {};

  const { data: suggestionsData } = useQuery({
    queryKey: ["/api/suggestions"],
    queryFn: api.suggestions,
    enabled: isAuthenticated,
  });
  const suggestions = suggestionsData || [];

  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: api.notifications.list,
    enabled: isAuthenticated,
  });
  const notifications = notificationsData || [];
  const unreadNotificationsCount = notifications.filter(
    (notification: any) => !notification.read,
  ).length;

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ["/api/modules"] });
    qc.invalidateQueries({ queryKey: ["/api/chat"] });
    qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
    qc.invalidateQueries({ queryKey: ["/api/suggestions"] });
    qc.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  // --- Background Sync Integration ---
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const coordinator = new WebSyncCoordinator({
      userId: user.id,
      onSync: (delta) => {
        // Optimistically update caches with delta if needed
        // For now, we simple refresh queries to ensure total consistency
        if (
          Object.values(delta).some(
            (arr: any) => Array.isArray(arr) && arr.length > 0,
          )
        ) {
          refetchAll();
        }
      },
    });

    coordinator.start();
    return () => coordinator.stop();
  }, [isAuthenticated, user?.id]);

  const login = async (username: string, password: string) => {
    const user = await api.auth.login(username, password);
    qc.setQueryData(["/api/auth/me"], user);
    toast.success(`Welcome back, ${user.displayName || user.username}`);
    qc.invalidateQueries();
    return user;
  };
  const register = async (
    username: string,
    password: string,
    displayName?: string,
  ) => {
    const user = await api.auth.register(username, password, displayName);
    qc.setQueryData(["/api/auth/me"], user);
    toast.success("Account created successfully");
    qc.invalidateQueries();
    return user;
  };
  const logout = async () => {
    await api.auth.logout();
    await qc.cancelQueries();
    qc.setQueryData(["/api/auth/me"], null);
    qc.removeQueries({
      predicate: (query) => query.queryKey[0] !== "/api/auth/me",
    });
    toast.success("Signed out");
  };

  const setMode = async (m: UserMode) => {
    const prevUser = qc.getQueryData(["/api/auth/me"]);
    qc.setQueryData(["/api/auth/me"], (old: any) => ({ ...old, mode: m }));
    try {
      await api.user.setMode(m);
      toast.success(`Switched to ${ontologies[m]?.label || m} ontology`);
      refetchAll();
    } catch (e) {
      qc.setQueryData(["/api/auth/me"], prevUser);
      toast.error("Failed to switch mode");
    }
  };

  const updatePreferences = async (patch: AppPreferencesPatch) => {
    const previousUser = qc.getQueryData(["/api/auth/me"]);
    const previousPreferences = normalizePreferences(
      (previousUser as any)?.preferences ?? defaultPreferences,
    );
    const nextPreferences = mergePreferences(previousPreferences, patch);

    qc.setQueryData(["/api/auth/me"], (old: any) =>
      old ? { ...old, preferences: nextPreferences } : old,
    );

    try {
      await api.user.setPreferences(nextPreferences);
      toast.success("Workspace preferences updated");
      await qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      return nextPreferences;
    } catch (e) {
      qc.setQueryData(["/api/auth/me"], previousUser);
      toast.error("Failed to update workspace preferences");
      throw e;
    }
  };

  const removeModule = async (id: string) => {
    const prevModules = qc.getQueryData(["/api/modules"]);
    qc.setQueryData(["/api/modules"], (old: any[]) =>
      old.filter((m) => m.id !== id),
    );
    try {
      await api.modules.remove(id);
      qc.invalidateQueries({ queryKey: ["/api/modules"] });
    } catch (e) {
      qc.setQueryData(["/api/modules"], prevModules);
      toast.error("Failed to remove module");
    }
  };

  const toggleChat = () => setIsChatOpen((o) => !o);

  const markNotificationRead = async (id: string) => {
    const previous = qc.getQueryData(["/api/notifications"]);
    qc.setQueryData(["/api/notifications"], (old: any[] = []) =>
      old.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );

    try {
      await api.notifications.read(id);
      await qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (e) {
      qc.setQueryData(["/api/notifications"], previous);
      toast.error("Failed to update notification");
    }
  };

  const markAllNotificationsRead = async () => {
    const previous = qc.getQueryData(["/api/notifications"]);
    qc.setQueryData(["/api/notifications"], (old: any[] = []) =>
      old.map((notification) => ({ ...notification, read: true })),
    );

    try {
      await api.notifications.readAll();
      await qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (e) {
      qc.setQueryData(["/api/notifications"], previous);
      toast.error("Failed to update notifications");
    }
  };

  const processCommand = async (command: string) => {
    const result = await api.chat.send(command);
    if (result.proposedAction) {
      setCurrentProposal(result.proposedAction);
      setIsChatOpen(true);
    }
    if (result.workflow) {
      setCurrentWorkflow(result.workflow);
      setIsChatOpen(true);
    }
    if (result.generativeUI) {
      setCurrentGenerativeUI(result.generativeUI);
      setIsChatOpen(true);
    }
    refetchAll();
  };

  const applyProposal = async () => {
    if (!currentProposal) return;
    try {
      await api.applyAction(currentProposal);
      toast.success("Action applied successfully");
      setCurrentProposal(null);
      refetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to apply action");
    }
  };

  const applyWorkflow = async () => {
    if (!currentWorkflow) return;
    const total = currentWorkflow.length;
    let successCount = 0;
    for (const step of currentWorkflow) {
      try {
        await api.applyAction(step);
        successCount++;
        toast.info(`Step ${successCount}/${total} completed`);
      } catch (e: any) {
        toast.error(
          `Workflow failed at step ${successCount + 1}: ${e.message}`,
        );
        break;
      }
    }
    if (successCount === total) {
      toast.success("Full workflow executed successfully");
      setCurrentWorkflow(null);
    }
    refetchAll();
  };

  const dismissProposal = () => {
    setCurrentProposal(null);
    setCurrentWorkflow(null);
    setCurrentGenerativeUI(null);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isLoading: userLoading,
        user,
        mode,
        activeOntology,
        preferences,
        modules,
        chatHistory,
        stats,
        suggestions,
        notifications,
        unreadNotificationsCount,
        isChatOpen,
        isCommandBarOpen,
        isNotificationsOpen,
        currentProposal,
        currentWorkflow,
        currentGenerativeUI,
        login,
        register,
        logout,
        setMode,
        updatePreferences,
        removeModule,
        toggleChat,
        setCommandBarOpen,
        setNotificationsOpen,
        markNotificationRead,
        markAllNotificationsRead,
        processCommand,
        applyProposal,
        applyWorkflow,
        dismissProposal,
        refetchAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppState must be used within AppStateProvider");
  return context;
};
