import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles, Wand2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    body: "Hi! I can help you build workflows — add nodes, explain data flows, or answer questions. What do you need?",
  },
];

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
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
          body: "I can help you add nodes, edit parameters, or explain how your workflow works. Just describe what you'd like to do.",
        },
      ]);
    }, 900);
  };

  const toggle = () => setOpen((current) => !current);

  return (
    <>
      {/* Floating button (always visible) */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_24px_var(--accent-glow)] transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "animate-fade-in",
        )}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {!open && (
          <Sparkles className="size-5" />
        )}
        {open && (
          <X className="size-5" />
        )}
      </button>

      {/* Assistant panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-40 w-[380px] h-[520px] flex flex-col border border-line bg-surface shadow-[var(--shadow-float)] rounded-[18px] backdrop-blur-xl"
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
                onClick={toggle}
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
                      <X className="size-3" />
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
                Assistant replies are simulated
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
