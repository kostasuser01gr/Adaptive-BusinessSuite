import React, { createContext, useContext, useState } from 'react';
import { api } from './api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type UserMode = 'rental' | 'personal' | 'professional' | 'custom';

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
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: string[];
}

interface AppContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  mode: UserMode;
  modules: ModuleConfig[];
  chatHistory: Message[];
  stats: any;
  suggestions: any[];
  isChatOpen: boolean;
  isCommandBarOpen: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  setMode: (mode: UserMode) => Promise<void>;
  removeModule: (id: string) => Promise<void>;
  toggleChat: () => void;
  setCommandBarOpen: (open: boolean) => void;
  processCommand: (command: string) => Promise<void>;
  refetchAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommandBarOpen, setCommandBarOpen] = useState(false);
  const qc = useQueryClient();

  const { data: userData, isLoading: userLoading } = useQuery({ queryKey: ['/api/auth/me'], queryFn: api.auth.me, retry: false, staleTime: Infinity });
  const isAuthenticated = !!userData && !userLoading;
  const user = userData || null;
  const mode = (user?.mode as UserMode) || 'rental';

  const { data: modulesData } = useQuery({ queryKey: ['/api/modules'], queryFn: api.modules.list, enabled: isAuthenticated });
  const modules: ModuleConfig[] = (modulesData || []).map((m: any) => ({ ...m, w: parseInt(m.w) || 1, h: parseInt(m.h) || 1 }));

  const { data: chatData } = useQuery({ queryKey: ['/api/chat'], queryFn: api.chat.list, enabled: isAuthenticated });
  const chatHistory: Message[] = (chatData || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.createdAt), actions: m.actions as string[] | undefined }));

  const { data: statsData } = useQuery({ queryKey: ['/api/stats'], queryFn: api.stats, enabled: isAuthenticated, refetchInterval: 30000 });
  const stats = statsData || {};

  const { data: suggestionsData } = useQuery({ queryKey: ['/api/suggestions'], queryFn: api.suggestions, enabled: isAuthenticated, refetchInterval: 60000 });
  const suggestions = suggestionsData || [];

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ['/api/modules'] });
    qc.invalidateQueries({ queryKey: ['/api/chat'] });
    qc.invalidateQueries({ queryKey: ['/api/auth/me'] });
    qc.invalidateQueries({ queryKey: ['/api/stats'] });
    qc.invalidateQueries({ queryKey: ['/api/suggestions'] });
  };

  const login = async (username: string, password: string) => {
    const user = await api.auth.login(username, password);
    // Populate the cache synchronously so ProtectedRoute sees isAuthenticated=true
    // on the very next render, eliminating the redirect-to-/auth race condition.
    qc.setQueryData(['/api/auth/me'], user);
    qc.invalidateQueries();
  };
  const register = async (username: string, password: string, displayName?: string) => {
    const user = await api.auth.register(username, password, displayName);
    qc.setQueryData(['/api/auth/me'], user);
    qc.invalidateQueries();
  };
  const logout = async () => { await api.auth.logout(); qc.clear(); qc.invalidateQueries({ queryKey: ['/api/auth/me'] }); };
  const setMode = async (m: UserMode) => { await api.user.setMode(m); refetchAll(); };
  const removeModule = async (id: string) => { await api.modules.remove(id); qc.invalidateQueries({ queryKey: ['/api/modules'] }); };
  const toggleChat = () => setIsChatOpen(o => !o);
  const processCommand = async (command: string) => {
    await api.chat.send(command);
    refetchAll();
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, isLoading: userLoading, user, mode, modules, chatHistory, stats, suggestions,
      isChatOpen, isCommandBarOpen, login, register, logout, setMode, removeModule, toggleChat,
      setCommandBarOpen, processCommand, refetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
};