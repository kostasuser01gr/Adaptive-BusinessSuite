import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function detectStandaloneMode() {
  if (typeof window === "undefined") return false;

  const iosStandalone =
    "standalone" in navigator &&
    typeof (navigator as Navigator & { standalone?: boolean }).standalone ===
      "boolean" &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return (
    iosStandalone ||
    window.matchMedia("(display-mode: standalone)").matches ||
    document.referrer.startsWith("android-app://")
  );
}

export function registerServiceWorker() {
  if (
    !import.meta.env.PROD ||
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(detectStandaloneMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncInstalledState = () => {
      setIsInstalled(detectStandaloneMode());
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      syncInstalledState();
    };

    const onInstalled = () => {
      setPromptEvent(null);
      syncInstalledState();
    };

    syncInstalledState();
    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canInstall = Boolean(promptEvent) && !isInstalled;

  const promptInstall = async () => {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === "accepted") {
      setPromptEvent(null);
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  return {
    canInstall,
    isInstalled,
    promptInstall,
  };
}
