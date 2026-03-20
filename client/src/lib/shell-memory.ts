import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  defaultOntology,
  ontologies,
  type NavigationLink,
  type Ontology,
} from "@shared/ontologies";

export interface ShellRouteMeta {
  path: string;
  label: string;
  icon: string;
  description: string;
}

export interface ShellMemoryState {
  favorites: string[];
  recents: string[];
}

export const supportedShellRoutes = new Set<string>([
  "/",
  "/today",
  "/fleet",
  "/bookings",
  "/customers",
  "/tasks",
  "/notes",
  "/maintenance",
  "/financial",
  "/settings",
  "/nexus-ultra",
]);

const DEFAULT_MEMORY_STATE: ShellMemoryState = {
  favorites: [],
  recents: [],
};

const SHELL_MEMORY_EVENT = "nexus:shell-memory-change";
const MAX_RECENTS = 6;

const routeDescriptions: Record<string, string> = {
  "/today": "Return to the live operator board and active watchlists.",
  "/": "Open the adaptive workspace dashboard.",
  "/fleet": "Inspect asset availability, utilization, and condition.",
  "/bookings": "Review the live booking and event pipeline.",
  "/customers": "Open customer operations and intelligence.",
  "/tasks": "Drop into execution and follow-through.",
  "/notes": "Resume captured context and working memory.",
  "/maintenance": "Review service work and pending closures.",
  "/financial": "Inspect finance, utilization, and margin posture.",
  "/settings": "Adjust workspace configuration and shell behavior.",
  "/nexus-ultra": "Open the intelligence and governance workspace.",
};

function getStorageKey(userId: string): string {
  return `nexus-shell-memory:${userId}`;
}

function uniquePaths(paths: string[], allowedPaths: Set<string>): string[] {
  return paths.filter(
    (path, index) => allowedPaths.has(path) && paths.indexOf(path) === index,
  );
}

export function getShellRouteKey(path: string): string {
  return path === "/" ? "dashboard" : path.replace(/^\//, "").replace(/\//g, "-");
}

export function buildShellRouteCatalog(
  activeOntology: Ontology = defaultOntology,
): ShellRouteMeta[] {
  const routeMap = new Map<string, ShellRouteMeta>();

  const addLink = (link: NavigationLink) => {
    if (!supportedShellRoutes.has(link.path)) {
      return;
    }

    if (!routeMap.has(link.path)) {
      routeMap.set(link.path, {
        path: link.path,
        label: link.label,
        icon: link.icon,
        description: routeDescriptions[link.path] || `Open ${link.label}.`,
      });
    }
  };

  activeOntology.navigation.forEach(addLink);

  Object.values(ontologies).forEach((ontology) => {
    if (ontology.id === activeOntology.id) return;
    ontology.navigation.forEach(addLink);
  });

  return Array.from(routeMap.values());
}

export function normalizeShellMemory(
  raw: unknown,
  allowedPaths: Iterable<string>,
): ShellMemoryState {
  const allowed = new Set(allowedPaths);
  const state =
    raw && typeof raw === "object"
      ? (raw as Partial<Record<keyof ShellMemoryState, unknown>>)
      : {};

  const favorites = Array.isArray(state.favorites)
    ? uniquePaths(
        state.favorites.filter((path): path is string => typeof path === "string"),
        allowed,
      )
    : [];

  const recents = Array.isArray(state.recents)
    ? uniquePaths(
        state.recents.filter((path): path is string => typeof path === "string"),
        allowed,
      ).slice(0, MAX_RECENTS)
    : [];

  return {
    favorites,
    recents,
  };
}

export function toggleFavoritePath(
  state: ShellMemoryState,
  path: string,
  allowedPaths: Iterable<string>,
): ShellMemoryState {
  const allowed = new Set(allowedPaths);
  if (!allowed.has(path)) {
    return state;
  }

  const nextFavorites = state.favorites.includes(path)
    ? state.favorites.filter((candidate) => candidate !== path)
    : [path, ...state.favorites.filter((candidate) => candidate !== path)];

  return normalizeShellMemory(
    {
      ...state,
      favorites: nextFavorites,
    },
    allowed,
  );
}

export function recordRecentPath(
  state: ShellMemoryState,
  path: string,
  allowedPaths: Iterable<string>,
): ShellMemoryState {
  const allowed = new Set(allowedPaths);
  if (!allowed.has(path)) {
    return state;
  }

  const nextRecents = [path, ...state.recents.filter((candidate) => candidate !== path)]
    .slice(0, MAX_RECENTS);

  return normalizeShellMemory(
    {
      ...state,
      recents: nextRecents,
    },
    allowed,
  );
}

function readShellMemory(
  userId: string | null | undefined,
  allowedPaths: Iterable<string>,
): ShellMemoryState {
  if (!userId || typeof window === "undefined") {
    return DEFAULT_MEMORY_STATE;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    return normalizeShellMemory(raw ? JSON.parse(raw) : null, allowedPaths);
  } catch {
    return normalizeShellMemory(null, allowedPaths);
  }
}

function writeShellMemory(userId: string, nextState: ShellMemoryState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(nextState));
  window.dispatchEvent(
    new CustomEvent(SHELL_MEMORY_EVENT, {
      detail: { key: getStorageKey(userId) },
    }),
  );
}

export function useShellMemory(
  userId: string | null | undefined,
  routes: ShellRouteMeta[],
) {
  const allowedPaths = useMemo(
    () => routes.map((route) => route.path),
    [routes],
  );

  const [memory, setMemory] = useState<ShellMemoryState>(() =>
    readShellMemory(userId, allowedPaths),
  );
  const memoryRef = useRef(memory);

  useEffect(() => {
    memoryRef.current = memory;
  }, [memory]);

  useEffect(() => {
    setMemory(readShellMemory(userId, allowedPaths));
  }, [allowedPaths, userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") {
      return;
    }

    const key = getStorageKey(userId);

    const syncFromStorage = (event?: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail?.key &&
        event.detail.key !== key
      ) {
        return;
      }

      setMemory(readShellMemory(userId, allowedPaths));
    };

    const syncFromNativeStorage = (event: StorageEvent) => {
      if (event.key && event.key !== key) {
        return;
      }

      setMemory(readShellMemory(userId, allowedPaths));
    };

    window.addEventListener(SHELL_MEMORY_EVENT, syncFromStorage as EventListener);
    window.addEventListener("storage", syncFromNativeStorage);

    return () => {
      window.removeEventListener(
        SHELL_MEMORY_EVENT,
        syncFromStorage as EventListener,
      );
      window.removeEventListener("storage", syncFromNativeStorage);
    };
  }, [allowedPaths, userId]);

  const commitMemory = useCallback(
    (updater: (current: ShellMemoryState) => ShellMemoryState) => {
      const currentState = userId
        ? readShellMemory(userId, allowedPaths)
        : memoryRef.current;
      const nextState = updater(currentState);

      if (
        nextState.favorites.join("|") === currentState.favorites.join("|") &&
        nextState.recents.join("|") === currentState.recents.join("|")
      ) {
        return;
      }

      if (userId) {
        writeShellMemory(userId, nextState);
      }

      setMemory(nextState);
    },
    [allowedPaths, userId],
  );

  const rememberPath = useCallback(
    (path: string) => {
      commitMemory((currentState) =>
        recordRecentPath(currentState, path, allowedPaths),
      );
    },
    [allowedPaths, commitMemory],
  );

  const toggleFavorite = useCallback(
    (path: string) => {
      commitMemory((currentState) =>
        toggleFavoritePath(currentState, path, allowedPaths),
      );
    },
    [allowedPaths, commitMemory],
  );

  const isFavorite = useCallback(
    (path: string) => memory.favorites.includes(path),
    [memory.favorites],
  );

  return {
    favorites: memory.favorites,
    recents: memory.recents,
    isFavorite,
    rememberPath,
    toggleFavorite,
  };
}
