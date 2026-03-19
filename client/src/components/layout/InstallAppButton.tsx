import { Download, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInstallPrompt } from "@/lib/pwa";

export default function InstallAppButton() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled) {
    return (
      <Badge
        variant="outline"
        className="inline-flex h-8 items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2 text-emerald-300 sm:px-2.5"
        data-testid="badge-app-installed"
      >
        <Smartphone className="h-3 w-3" />
        <span className="hidden sm:inline">Installed</span>
        <span className="sr-only sm:hidden">App installed</span>
      </Badge>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="inline-flex h-8 w-8 border-white/10 bg-white/[0.03] px-0 text-xs hover:bg-white/[0.06] sm:w-auto sm:gap-1.5 sm:px-3"
      onClick={async () => {
        const installed = await promptInstall();
        if (installed) {
          toast.success("Nexus OS is ready to use like an installed app.");
        }
      }}
      data-testid="button-install-app"
    >
      <Download className="h-3.5 w-3.5" />
      <span className="sr-only sm:not-sr-only sm:inline">Install App</span>
    </Button>
  );
}
