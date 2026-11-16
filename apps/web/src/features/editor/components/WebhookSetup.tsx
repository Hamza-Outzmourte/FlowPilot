import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEditorStore } from "@/stores/editor.store";

export function WebhookSetup() {
  const [botToken, setBotToken] = useState("");
  const [isSetting, setIsSetting] = useState(false);

  const workflow = useEditorStore((state) => state.workflow);
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const telegramTrigger = useEditorStore(
    (state) =>
      state.nodes.find((n) => n.data.nodeType === "flowpilot.telegramTrigger"),
  );

  const nodeId = telegramTrigger?.id;
  const workflowId = workflow.id;

  const isReady = Boolean(botToken && workflowId && nodeId);

  const setWebhook = async () => {
    if (!isReady || !telegramTrigger) return;
    setIsSetting(true);
    try {
      const triggerCredential =
        (telegramTrigger.data.credentials as Record<string, string> | undefined)?.[
          "telegramApi"
        ];
      const credentials: Record<string, Record<string, string>> = {};
      if (nodeId && triggerCredential) {
        credentials[nodeId] = { telegramApi: triggerCredential };
      }

      const res = await fetch("/api/v1/webhook/telegram/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: botToken,
          workflow_id: workflowId,
          node_id: nodeId,
          nodes,
          edges,
          credentials,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail || "Failed to set webhook");
      }
      const data = await res.json();
      toast.success("Webhook set", { description: data.webhook_url });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Webhook failed", { description: message });
    } finally {
      setIsSetting(false);
    }
  };

  if (!telegramTrigger) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-40 flex flex-col gap-2 w-[340px] rounded-[16px] border border-line bg-surface shadow-[var(--shadow-float)] backdrop-blur-xl p-4 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-accent" />
          <h3 className="text-[13px] font-semibold text-ink">Telegram Webhook</h3>
        </div>
        <span className="text-[10px] font-medium text-ink-3">
          {workflow.active ? "Active" : "Draft"}
        </span>
      </div>

      <Field label="Bot Token (from @BotFather)">
        <Input
          type="password"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="123456789:ABCdef..."
          className="text-[11px]"
        />
      </Field>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={setWebhook}
          disabled={!isReady || isSetting}
          className="flex-1 text-[11px] px-3 py-2"
        >
          {isSetting ? (
            <Zap className="size-3.5 animate-spin" />
          ) : (
            <>
              <Zap className="size-3.5" />
              Set Webhook
            </>
          )}
        </Button>
      </div>

      <p className="text-[9.5px] leading-relaxed text-ink-3 mt-1">
        Once set, Telegram will send messages to this workflow. Make sure your
        backend is running and accessible from the internet (use ngrok if
        testing locally).
      </p>
    </div>
  );
}
