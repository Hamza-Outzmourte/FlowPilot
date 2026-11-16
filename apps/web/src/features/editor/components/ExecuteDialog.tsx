import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlays";
import { useEditorStore } from "@/stores/editor.store";
import type { ExecuteInputs } from "@/stores/editor.store";

export function ExecuteDialog() {
  const open = useEditorStore((state) => state.executeDialogOpen);
  const close = useEditorStore((state) => state.closeExecuteDialog);
  const execute = useEditorStore((state) => state.execute);

  const [prompt, setPrompt] = useState("Hello! Tell me something interesting.");
  const [channel, setChannel] = useState<"telegram" | "gmail">("telegram");
  const [email, setEmail] = useState("user@example.com");
  const [chatId, setChatId] = useState("");

  useEffect(() => {
    if (open) {
      setPrompt("Hello! Tell me something interesting.");
      setChannel("telegram");
      setEmail("user@example.com");
      setChatId("");
    }
  }, [open]);

  const submit = () => {
    const inputs: ExecuteInputs = { prompt, channel, email, chatId };
    close();
    void execute(undefined, inputs);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run workflow</DialogTitle>
          <DialogDescription>
            Enter the prompt and choose where the reply should be delivered.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-ink-2">Prompt</label>
            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask something…"
              aria-label="Prompt"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-ink-2">Deliver reply via</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChannel("telegram")}
                className={`flex-1 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition ${
                  channel === "telegram"
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-hairline bg-surface-2 text-ink-3 hover:text-ink-2"
                }`}
              >
                Telegram
              </button>
              <button
                type="button"
                onClick={() => setChannel("gmail")}
                className={`flex-1 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition ${
                  channel === "gmail"
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-hairline bg-surface-2 text-ink-3 hover:text-ink-2"
                }`}
              >
                Gmail
              </button>
            </div>
          </div>

          {channel === "gmail" ? (
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-ink-2">
                Recipient email
              </label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@example.com"
                aria-label="Recipient email"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-ink-2">
                Telegram chat id
              </label>
              <Input
                value={chatId}
                onChange={(event) => setChatId(event.target.value)}
                placeholder="123456789"
                aria-label="Telegram chat id"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={submit}>
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}