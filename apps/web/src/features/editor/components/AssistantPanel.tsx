import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Sparkles, Square, Wand2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";

interface Message {
  id: string;
  role: "user" | "assistant";
  body: string;
}

const SUGGESTIONS = [
  "Add a Gmail step when the agent is unsure",
  "Explain what this workflow does",
  "Make the If branch stricter",
  "Add memory with a 20-message window",
];

const INITIAL: Message[] = [
  {
    id: "m1",
    role: "assistant",
    body: "Hi! I can edit this workflow for you — add nodes, rewrite prompts or explain how data flows. What do you need?",
  },
];

export function AssistantPanel() {
  const open = useEditorStore((state) => state.assistantOpen);
  const setOpen = useEditorStore((state) => state.setAssistantOpen);
  const workflowName = useEditorStore((state) => state.workflow.name);
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    const userMessage: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      body: value,
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setMessages((current) => [
        ...current,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          body: `Here's a plan for “${workflowName}”: I'd insert the new step right after the agent, keep the existing If branches, and reuse the current Telegram credential. Click Apply to add the step to the canvas.`,
        },
      ]);
    }, 900);
  };

  const applyChange = () => {
    const lastUser = [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.body.toLowerCase();
    if (!lastUser) {
      toast.error("Ask for a change first.");
      return;
    }
    const match =
      /gmail|email|reply/.test(lastUser)
        ? { type: "flowpilot.gmailSend", label: "Gmail — Send" }
        : /memory|remember|context/.test(lastUser)
          ? { type: "flowpilot.simpleMemory", label: "Simple Memory" }
          : /telegram|message/.test(lastUser)
            ? { type: "flowpilot.telegramSendMessage", label: "Telegram — Send" }
            : /if|condition|branch|stricter/.test(lastUser)
              ? { type: "flowpilot.if", label: "If" }
              : /slack/.test(lastUser)
                ? { type: "flowpilot.slackSend", label: "Slack — Send" }
                : /http|api|request/.test(lastUser)
                  ? { type: "flowpilot.httpRequest", label: "HTTP Request" }
                  : { type: "flowpilot.set", label: "Edit Fields" };

    const state = useEditorStore.getState();
    const rightmost = state.nodes.reduce(
      (max, node) => Math.max(max, node.position.x + 300),
      0,
    );
    const position =
      state.nodes.length > 0 ? { x: rightmost + 80, y: 0 } : { x: 120, y: 160 };
    state.addNode(match.type, position, undefined, false);
    toast.success(`${match.label} added to the canvas`);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          className="absolute bottom-0 right-0 top-0 z-30 flex w-[360px] flex-col border-l border-line bg-surface shadow-[-20px_0_50px_rgba(0,0,0,.4)]"
          initial={{ x: reduced ? 0 : 360 }}
          animate={{ x: 0 }}
          exit={{ x: reduced ? 0 : 360 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          aria-label="AI assistant"
        >
          <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-hairline px-4">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-[var(--accent-grad)] text-white shadow-[0_4px_14px_var(--accent-glow)]">
                <Sparkles className="size-3.5" />
              </span>
              <div>
                <h2 className="text-[13px] font-semibold text-ink">Ask AI</h2>
                <p className="text-[10px] text-ink-3">Build with natural language</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-7 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
              aria-label="Close AI assistant"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="fp-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-[12px] px-3 py-2 text-[11.5px] leading-relaxed",
                    message.role === "user"
                      ? "bg-accent text-white"
                      : "border border-hairline bg-surface-2/60 text-ink-2",
                  )}
                >
                  {message.body}
                </div>
              </div>
            ))}
            {thinking ? (
              <div className="flex items-center gap-1.5 rounded-[12px] border border-hairline bg-surface-2/60 px-3 py-2.5">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="size-1.5 animate-pulse-soft rounded-full bg-accent"
                    style={{ animationDelay: `${dot * 160}ms` }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-hairline p-3">
            {messages.length <= 1 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.slice(0, 2).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-hairline bg-surface-2 px-2 py-1 text-[10px] text-ink-3 transition hover:border-accent/30 hover:text-ink-2"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="rounded-[12px] border border-line bg-surface-2/50 p-1.5 transition focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-soft">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(draft);
                  }
                }}
                rows={2}
                placeholder="Describe a change…"
                className="w-full resize-none bg-transparent px-2 py-1.5 text-[11.5px] leading-relaxed text-ink outline-none placeholder:text-ink-3"
              />
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1 text-[9.5px] text-ink-3">
                  <Wand2 className="size-2.5" />
                  Agent mode
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="iconXs"
                    aria-label="Clear conversation"
                    onClick={() => setMessages(INITIAL)}
                  >
                    <Square className="size-3" />
                  </Button>
                  <Button
                    variant="primary"
                    size="iconXs"
                    aria-label="Send message"
                    onClick={() => send(draft)}
                    disabled={!draft.trim()}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="mt-1.5 text-center text-[9px] text-ink-3">
              Assistant replies are simulated · Apply adds the detected node
            </p>
          </div>

          {messages.length > 1 ? (
            <div className="shrink-0 border-t border-hairline px-3 py-2">
              <Button
                variant="soft"
                size="sm"
                className="w-full"
                onClick={applyChange}
              >
                <Sparkles className="size-3.5" />
                Apply to canvas
              </Button>
            </div>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
