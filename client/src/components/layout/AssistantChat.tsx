import React, { useState, useRef, useEffect } from "react";
import { useAppState } from "@/lib/store";
import {
  X,
  Send,
  Bot,
  Sparkles,
  Loader2,
  Lightbulb,
  Check,
  Trash2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GenerativeRenderer } from "@/components/generative/Registry";

export default function AssistantChat() {
  const {
    chatHistory,
    toggleChat,
    processCommand,
    suggestions,
    currentProposal,
    applyProposal,
    currentWorkflow,
    applyWorkflow,
    currentGenerativeUI,
    dismissProposal,
  } = useAppState();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, currentProposal, currentWorkflow, currentGenerativeUI]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await processCommand(input);
    } finally {
      setInput("");
      setSending(false);
    }
  };

  const handleAction = async (action: string) => {
    setSending(true);
    try {
      const cmd = action.startsWith("command:")
        ? action.replace("command:", "")
        : action;
      await processCommand(cmd);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-80 md:w-[360px] border-l border-white/5 bg-background/95 backdrop-blur-xl flex flex-col z-30 fixed right-0 top-0 bottom-0 animate-in slide-in-from-right duration-200">
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center border border-primary/20">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm">Assistant</h3>
            <p className="text-[10px] text-muted-foreground leading-none">
              Ultra Intelligence
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleChat}
          className="h-7 w-7 rounded-full"
          data-testid="button-close-chat"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="px-3 py-2 border-b border-white/5 bg-primary/[0.03]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Proactive Suggestions
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 3).map((s: any, i: number) => (
              <button
                key={i}
                onClick={() => handleAction(s.action)}
                className="text-[11px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md border border-white/5 transition-colors text-foreground/80"
                data-testid={`suggestion-${i}`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted/30 border border-white/5 rounded-tl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.timestamp && (
                <p className="text-[9px] opacity-40 mt-1.5">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {msg.generativeUI && (
                <div className="mt-3">
                  <GenerativeRenderer
                    type={msg.generativeUI.type}
                    props={msg.generativeUI.props}
                  />
                </div>
              )}

              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {msg.actions.map((action) => (
                    <button
                      key={action}
                      onClick={() => handleAction(action)}
                      className="text-[11px] bg-primary/15 hover:bg-primary/25 text-primary px-2 py-1 rounded-md border border-primary/15 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {currentGenerativeUI && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <GenerativeRenderer
              type={currentGenerativeUI.type}
              props={currentGenerativeUI.props}
            />
          </div>
        )}

        {currentProposal && (
          <div className="flex justify-start">
            <Card className="max-w-[95%] border-primary/30 bg-primary/5 overflow-hidden shadow-lg shadow-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Proposed Mutation
                  </span>
                </div>
                <div className="bg-background/50 rounded-lg p-2 mb-3 border border-white/5">
                  <p className="text-[11px] font-mono text-muted-foreground mb-1">
                    {currentProposal.type}
                  </p>
                  <pre className="text-[10px] overflow-hidden text-ellipsis italic opacity-70">
                    {JSON.stringify(currentProposal.payload, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={applyProposal}
                    className="flex-1 h-8 text-[11px] gap-1.5"
                  >
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={dismissProposal}
                    className="h-8 text-[11px] px-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentWorkflow && (
          <div className="flex justify-start">
            <Card className="max-w-[95%] border-purple-500/30 bg-purple-500/5 overflow-hidden shadow-lg shadow-purple-500/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Multi-Step Workflow
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  {currentWorkflow.map((step, i) => (
                    <div
                      key={i}
                      className="text-[10px] flex items-center gap-2 text-muted-foreground"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] text-purple-400 font-bold">
                        {i + 1}
                      </div>
                      {step.type}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={applyWorkflow}
                    className="flex-1 h-8 text-[11px] gap-1.5 bg-purple-600 hover:bg-purple-700"
                  >
                    <Check className="h-3 w-3" /> Execute Workflow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={dismissProposal}
                    className="h-8 text-[11px] px-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {sending && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-muted/30 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[10px] text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-white/5 bg-background/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask workspace AI..."
            className="w-full bg-muted/20 border border-white/5 rounded-xl py-2.5 pl-3.5 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50"
            data-testid="input-chat"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={sending}
            className={`absolute right-1 w-7 h-7 rounded-lg ${input.trim() ? "text-primary" : "text-muted-foreground"}`}
            data-testid="button-send-chat"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
