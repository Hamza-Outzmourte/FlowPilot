import {
  CheckCircle2,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/primitives";
import { PageTopBar } from "@/components/shell/PageTopBar";
import { NodeIcon } from "@/lib/node-icons";
import { formatRelative, sleep } from "@/lib/utils";
import { DEMO_CREDENTIALS } from "@/data/demo";
import type { CredentialRecord } from "@/types/workflow";

const CREDENTIAL_TYPES = [
  { value: "Telegram API", icon: "telegram" },
  { value: "Gmail OAuth2", icon: "gmail" },
  { value: "Google Gemini API", icon: "gemini" },
  { value: "OpenAI API", icon: "openai" },
  { value: "Anthropic API", icon: "anthropic" },
  { value: "Postgres", icon: "postgres" },
  { value: "Slack API", icon: "slack" },
  { value: "Notion API", icon: "notion" },
];

export function CredentialsPage() {
  const [credentials, setCredentials] =
    useState<CredentialRecord[]>(DEMO_CREDENTIALS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState(CREDENTIAL_TYPES[0]?.value ?? "");
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const createCredential = async () => {
    if (!name.trim() || !secret.trim()) {
      toast.error("Name and secret are required");
      return;
    }
    setSaving(true);
    await sleep(500);
    const found = CREDENTIAL_TYPES.find((item) => item.value === type);
    const record: CredentialRecord = {
      id: `cred_${Date.now()}`,
      name: name.trim(),
      type,
      icon: found?.icon ?? "key",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspace: "Personal",
    };
    setCredentials((current) => [record, ...current]);
    setSaving(false);
    setDialogOpen(false);
    setName("");
    setSecret("");
    toast.success("Credential encrypted and saved", {
      description: "Secrets are never returned by the API again.",
    });
  };

  const testCredential = async (credential: CredentialRecord) => {
    setTestingId(credential.id);
    await sleep(800);
    setTestingId(null);
    toast.success(`${credential.name} connected`, {
      description: "Handshake succeeded in 312 ms.",
    });
  };

  const renameCredential = (credential: CredentialRecord) => {
    const nextName = window.prompt("Rename credential", credential.name);
    const trimmed = nextName?.trim();
    if (!trimmed || trimmed === credential.name) return;
    setCredentials((current) =>
      current.map((item) =>
        item.id === credential.id
          ? { ...item, name: trimmed, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    toast.success(`Renamed to “${trimmed}”`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <PageTopBar
        title="Credentials"
        subtitle="Encrypted secrets for apps, models and databases."
        breadcrumb="Workspace"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-3.5" />
            New credential
          </Button>
        }
      />

      <div className="fp-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Stored credentials",
                value: String(credentials.length),
                icon: <KeyRound className="size-4" />,
                color: "var(--accent)",
              },
              {
                label: "Encryption",
                value: "Fernet / KMS",
                icon: <ShieldCheck className="size-4" />,
                color: "var(--success)",
              },
              {
                label: "OAuth refresh",
                value: "Automatic",
                icon: <Zap className="size-4" />,
                color: "#22d3ee",
              },
            ].map((stat) => (
              <div key={stat.label} className="surface-card flex items-center gap-3 px-4 py-3.5">
                <span
                  className="grid size-9 place-items-center rounded-[10px]"
                  style={{
                    color: stat.color,
                    background: `color-mix(in oklab, ${stat.color} 12%, transparent)`,
                  }}
                >
                  {stat.icon}
                </span>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-3">
                    {stat.label}
                  </div>
                  <div className="mt-0.5 text-[14px] font-semibold text-ink">
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {credentials.length === 0 ? (
            <div className="surface-card mt-5">
              <EmptyState
                icon={<KeyRound className="size-5" />}
                title="No credentials yet"
                description="Add an API key or connect an OAuth app to use in your workflow nodes."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="size-3.5" />
                    Add credential
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="surface-card mt-5 overflow-hidden">
              <div className="grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr_40px] gap-3 border-b border-hairline px-4 py-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                <span>Name</span>
                <span>Type</span>
                <span>Last used</span>
                <span>Updated</span>
                <span />
              </div>
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr_40px] items-center gap-3 border-b border-hairline px-4 py-2.5 transition last:border-b-0 hover:bg-surface-2/40"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-hairline bg-surface-2">
                      <NodeIcon name={credential.icon} className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-medium text-ink">
                        {credential.name}
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] text-ink-3">
                        <ShieldCheck className="size-2.5" />
                        encrypted
                      </div>
                    </div>
                  </div>
                  <span className="truncate text-[11px] text-ink-2">
                    {credential.type}
                  </span>
                  <span className="text-[10.5px] text-ink-3">
                    {credential.lastUsedAt
                      ? formatRelative(credential.lastUsedAt)
                      : "Never"}
                  </span>
                  <span className="text-[10.5px] text-ink-3">
                    {formatRelative(credential.updatedAt)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="grid size-7 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                        aria-label="Credential actions"
                      >
                        {testingId === credential.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <MoreHorizontal className="size-3.5" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => void testCredential(credential)}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Test connection
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => renameCredential(credential)}
                      >
                        <KeyRound className="size-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        danger
                        onSelect={() => {
                          setCredentials((current) =>
                            current.filter((item) => item.id !== credential.id),
                          );
                          toast(`“${credential.name}” deleted`);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-[12px] border border-warning/20 bg-[var(--warning-soft)] px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <div className="text-[11.5px] font-medium text-warning">
                Secrets never leave the server
              </div>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-3">
                Credentials are encrypted at rest with a KMS-backed key. The API
                only ever returns masked metadata, and logs redact tokens and PII
                before they are persisted.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New credential</DialogTitle>
            <DialogDescription>
              Choose a provider and paste the secret. It is encrypted before
              storage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 pb-4">
            <Field label="Name" required>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Support bot token"
              />
            </Field>
            <Field label="Type">
              <Select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {CREDENTIAL_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.value}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Secret"
              required
              hint="For OAuth providers, this opens the consent flow in production."
            >
              <Input
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder="••••••••••••••••"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void createCredential()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              Save credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
