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

export type UserMode = "rental" | "personal" | "professional" | "custom";

export interface ModuleConfig {
  id: string;
  type: string;
  title: string;
  w: number;
  h: number;
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
  modules: ModuleConfig[];
  chatHistory: Message[];
  stats: any;
  suggestions: any[];
  isChatOpen: boolean;
  isCommandBarOpen: boolean;
  currentProposal: any | null;
  currentWorkflow: any[] | null;
  currentGenerativeUI: any | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  setMode: (mode: UserMode) => Promise<void>;
  removeModule: (id: string) => Promise<void>;
  toggleChat: () => void;
  setCommandBarOpen: (open: boolean) => void;
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

  const activeOntology = useMemo(
    () => ontologies[mode] || defaultOntology,
    [mode],
  );

  const { data: modulesData } = useQuery({
    queryKey: ["/api/modules"],
    queryFn: api.modules.list,
    enabled: isAuthenticated,
  });
  const modules: ModuleConfig[] = (modulesData || []).map((m: any) => ({
    ...m,
    w: parseInt(m.w) || 1,
    h: parseInt(m.h) || 1,
  }));

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

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ["/api/modules"] });
    qc.invalidateQueries({ queryKey: ["/api/chat"] });
    qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
    qc.invalidateQueries({ queryKey: ["/api/suggestions"] });
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
  };
  const logout = async () => {
    await api.auth.logout();
    qc.clear();
    qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
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
        modules,
        chatHistory,
        stats,
        suggestions,
        isChatOpen,
        isCommandBarOpen,
        currentProposal,
        currentWorkflow,
        currentGenerativeUI,
        login,
        register,
        logout,
        setMode,
        removeModule,
        toggleChat,
        setCommandBarOpen,
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
