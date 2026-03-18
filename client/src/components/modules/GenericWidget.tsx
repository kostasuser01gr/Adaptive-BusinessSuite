import React from "react";
import { ModuleConfig, useAppState } from "@/lib/store";
import { MoreVertical, Trash2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function WidgetWrapper({
  module,
  children,
  noPadding,
}: {
  module: ModuleConfig;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  const { removeModule } = useAppState();
  return (
    <div
      className={`bg-card/40 backdrop-blur-sm rounded-xl border border-white/[0.04] flex flex-col h-full relative group transition-all hover:border-white/[0.08] ${noPadding ? "" : "p-4"}`}
      data-testid={`card-module-${module.id}`}
    >
      <div
        className={`flex justify-between items-center mb-3 ${noPadding ? "px-4 pt-4" : ""}`}
      >
        <h3
          className="font-heading font-semibold text-sm"
          data-testid={`text-module-title-${module.id}`}
        >
          {module.title}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-popover border-white/10"
          >
            <DropdownMenuItem
              className="text-destructive text-xs cursor-pointer"
              onClick={() => removeModule(module.id)}
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className={`flex-1 min-h-0 ${noPadding ? "px-4 pb-4" : ""}`}>
        {children}
      </div>
    </div>
  );
}

export default function GenericWidget({ module }: { module: ModuleConfig }) {
  const { toggleChat } = useAppState();
  return (
    <WidgetWrapper module={module}>
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-xs font-medium mb-1">Ready to configure</p>
        <p className="text-[11px] text-center max-w-[80%] mb-3">
          Use the assistant to set up this {module.type} module.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 border-white/10"
          onClick={toggleChat}
        >
          Configure
        </Button>
      </div>
    </WidgetWrapper>
  );
}
