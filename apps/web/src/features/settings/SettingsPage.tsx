import {
  Bell,
  Check,
  KeyRound,
  Laptop,
  Monitor,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Avatar, Switch } from "@/components/ui/primitives";
import { PageTopBar } from "@/components/shell/PageTopBar";
import { cn } from "@/lib/utils";
import { DEMO_USER } from "@/data/demo";
import { useUiStore, type Theme } from "@/stores/ui.store";

const SETTINGS_KEY = "flowpilot.settings.v1";

interface StoredSettings {
  name: string;
  email: string;
  bio: string;
  avatar?: string;
  notifications: {
    executionAlerts: boolean;
    weeklyDigest: boolean;
    productUpdates: boolean;
    nodeFailures: boolean;
    budgetWarnings: boolean;
  };
}

const DEFAULT_SETTINGS: StoredSettings = {
  name: DEMO_USER.name,
  email: DEMO_USER.email,
  bio: "Automating support with Telegram, Gmail and Gemini agents.",
  notifications: {
    executionAlerts: true,
    weeklyDigest: false,
    productUpdates: true,
    nodeFailures: true,
    budgetWarnings: true,
  },
};

function readSettings(): StoredSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...parsed.notifications,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: StoredSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Quota errors are non-fatal in the local demo.
  }
}

type Section =
  | "profile"
  | "appearance"
  | "workspace"
  | "usage"
  | "api"
  | "notifications";

const SECTIONS: Array<{
  id: Section;
  label: string;
  icon: React.ReactNode;
  hint: string;
}> = [
  {
    id: "profile",
    label: "Profile",
    icon: <UserRound className="size-4" />,
    hint: "Your name, email and avatar",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: <Monitor className="size-4" />,
    hint: "Theme and motion",
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: <Users className="size-4" />,
    hint: "Members, roles and defaults",
  },
  {
    id: "api",
    label: "API keys",
    icon: <KeyRound className="size-4" />,
    hint: "Programmatic access",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="size-4" />,
    hint: "What we email you",
  },
];

const THEME_OPTIONS: Array<{
  value: Theme;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
  { value: "light", label: "Light", icon: <Sun className="size-4" /> },
  { value: "system", label: "System", icon: <Laptop className="size-4" /> },
];

function SectionCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-hairline px-5 py-4">
        <h2 className="text-[13.5px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        <p className="mt-0.5 text-[11.5px] text-ink-3">{description}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-2 border-t border-hairline bg-surface-2/30 px-5 py-3">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-hairline py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-ink">{title}</div>
        <p className="mt-0.5 max-w-md text-[11px] leading-relaxed text-ink-3">
          {description}
        </p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [section, setSection] = useState<Section>("profile");
  const saved = useRef<StoredSettings>(readSettings());
  const [name, setName] = useState(saved.current.name);
  const [email, setEmail] = useState(saved.current.email);
  const [bio, setBio] = useState(saved.current.bio);
  const [avatar, setAvatar] = useState<string | undefined>(saved.current.avatar);
  const [notifications, setNotifications] = useState(
    saved.current.notifications,
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("fp_live_9f2c7a41d8b34e50");
  const [members, setMembers] = useState([
    {
      initials: "SB",
      name: "Saka Boy",
      email: "saka@flowpilot.dev",
      role: "Owner" as const,
    },
    {
      initials: "AM",
      name: "Amina Mansouri",
      email: "amina@flowpilot.dev",
      role: "Editor" as const,
    },
    {
      initials: "JL",
      name: "Jonas Lind",
      email: "jonas@flowpilot.dev",
      role: "Viewer" as const,
    },
  ]);
  const avatarRef = useRef<HTMLInputElement>(null);
  const snapToGrid = useUiStore((state) => state.snapToGrid);
  const setSnapToGrid = useUiStore((state) => state.setSnapToGrid);
  const compactLabels = useUiStore((state) => state.compactLabels);
  const setCompactLabels = useUiStore((state) => state.setCompactLabels);

  const save = () => {
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Add a name and a valid email address");
      return;
    }
    const next: StoredSettings = {
      name: name.trim(),
      email: email.trim(),
      bio: bio.trim(),
      avatar,
      notifications,
    };
    writeSettings(next);
    saved.current = next;
    toast.success("Settings saved");
  };

  const cancelProfile = () => {
    setName(saved.current.name);
    setEmail(saved.current.email);
    setBio(saved.current.bio);
    setAvatar(saved.current.avatar);
    toast("Discarded unsaved changes");
  };

  const uploadAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("The image must be 2 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        toast("Avatar ready — save to apply it");
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteAccount = () => {
    const confirmed = window.confirm(
      "Delete your local FlowPilot account? Every workflow, knowledge collection and setting on this device will be removed.",
    );
    if (!confirmed) return;
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("flowpilot.")) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
    toast.success("Local account data deleted");
    navigate("/login");
  };

  const inviteMember = () => {
    const address = window.prompt("Teammate email address");
    const trimmed = address?.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (members.some((member) => member.email === trimmed)) {
      toast.error("That person is already in the workspace");
      return;
    }
    const local = trimmed.split("@")[0] ?? "New member";
    const label = local
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const initials = label
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
    setMembers((current) => [
      ...current,
      { initials, name: label, email: trimmed, role: "Editor" },
    ]);
    toast.success(`Invite sent to ${trimmed}`);
  };

  const createApiKey = () => {
    const bytes = new Uint8Array(12);
    window.crypto.getRandomValues(bytes);
    const key = `fp_live_${Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")}`;
    setApiKey(key);
    setShowKey(true);
    toast.success("New API key created", {
      description: "Copy it now — it is only shown once.",
    });
    void navigator.clipboard?.writeText(key);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <PageTopBar
        title="Settings"
        subtitle="Manage your profile, workspace and AI usage limits."
        breadcrumb="Personal workspace"
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-[236px] shrink-0 border-r border-hairline p-3">
          <div className="mb-3 flex items-center gap-2.5 rounded-[10px] border border-hairline bg-surface-2/50 px-3 py-2.5">
            <Avatar src={avatar} initials={DEMO_USER.initials} className="size-8" />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-ink">
                {name}
              </div>
              <div className="truncate text-[10px] text-ink-3">
                {DEMO_USER.plan} plan · {DEMO_USER.workspace}
              </div>
            </div>
          </div>

          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left transition",
                section === item.id
                  ? "bg-surface-2 text-ink"
                  : "text-ink-3 hover:bg-surface-2/60 hover:text-ink-2",
              )}
            >
              {item.icon}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium">
                  {item.label}
                </span>
                <span className="block truncate text-[9.5px] text-ink-3">
                  {item.hint}
                </span>
              </span>
            </button>
          ))}

          <div className="mt-3 border-t border-hairline pt-3">
            <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-3/60">
              Local workspace
            </div>
          </div>
        </aside>

        <div className="fp-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[860px] space-y-4 px-6 py-6">
            {section === "profile" ? (
              <>
                <SectionCard
                  title="Profile"
                  description="This is how you appear across the workspace."
                  footer={
                    <>
                      <Button variant="ghost" size="sm" onClick={cancelProfile}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={save}>
                        <Check className="size-3.5" />
                        Save changes
                      </Button>
                    </>
                  }
                >
                  <div className="flex items-center gap-4 pb-4">
                    <Avatar
                      src={avatar}
                      initials={DEMO_USER.initials}
                      className="size-14 text-[16px]"
                    />
                    <div>
                      <div className="flex gap-2">
                        <input
                          ref={avatarRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            uploadAvatar(event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => avatarRef.current?.click()}
                        >
                          Change avatar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!avatar}
                          onClick={() => setAvatar(undefined)}
                        >
                          Remove
                        </Button>
                      </div>
                      <p className="mt-1.5 text-[10px] text-ink-3">
                        PNG or SVG, max 2 MB.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Full name" required>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </Field>
                    <Field label="Email" required>
                      <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field
                      label="Bio"
                      hint="Shown on shared workflows and templates."
                    >
                      <Textarea
                        rows={2}
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Timezone">
                      <Select defaultValue="Africa/Casablanca">
                        <option>Africa/Casablanca</option>
                        <option>Europe/Paris</option>
                        <option>America/New_York</option>
                        <option>Asia/Tokyo</option>
                      </Select>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Danger zone"
                  description="Irreversible actions on your personal account."
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-danger/20 bg-[var(--danger-soft)] px-3.5 py-3">
                    <div>
                      <div className="text-[12px] font-medium text-ink">
                        Delete account
                      </div>
                      <p className="mt-0.5 text-[10.5px] text-ink-3">
                        This removes every workflow, execution and credential in
                        your personal workspace.
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={deleteAccount}
                    >
                      <Trash2 className="size-3.5" />
                      Delete account
                    </Button>
                  </div>
                </SectionCard>
              </>
            ) : section === "appearance" ? (
              <>
                <SectionCard
                  title="Theme"
                  description="Dark is the primary design target. Light is fully supported."
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    {THEME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setTheme(option.value);
                          toast(`Theme: ${option.label}`);
                        }}
                        className={cn(
                          "rounded-[11px] border p-2 text-left transition",
                          theme === option.value
                            ? "border-accent/50 ring-2 ring-accent-soft"
                            : "border-line hover:border-line-strong",
                        )}
                        aria-pressed={theme === option.value}
                      >
                        <div
                          className={cn(
                            "flex h-[64px] items-end gap-1 rounded-[7px] border border-hairline p-2",
                            option.value === "light"
                              ? "bg-[#fafafb]"
                              : option.value === "dark"
                                ? "bg-[#0f0f12]"
                                : "bg-[linear-gradient(100deg,#0f0f12_0%,#0f0f12_50%,#fafafb_50%,#fafafb_100%)]",
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-8 rounded-full",
                              option.value === "light"
                                ? "bg-[#d8d8e0]"
                                : "bg-[#2f2f36]",
                            )}
                          />
                          <span
                            className={cn(
                              "h-2 w-4 rounded-full",
                              option.value === "light"
                                ? "bg-[#e3e3ea]"
                                : "bg-[#3a3a44]",
                            )}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink">
                            {option.icon}
                            {option.label}
                          </span>
                          {theme === option.value ? (
                            <Check className="size-3.5 text-accent" />
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Motion & density"
                  description="Fine-tune how the interface behaves."
                >
                  <Row
                    title="Reduce motion"
                    description="Disable animated edges, drawer transitions and pulsing rings."
                  >
                    <Switch
                      checked={reducedMotion}
                      onCheckedChange={(value) => {
                        setReducedMotion(value);
                        document.documentElement.classList.toggle(
                          "fp-reduce-motion",
                          value,
                        );
                      }}
                    />
                  </Row>
                  <Row
                    title="Compact node labels"
                    description="Show titles only below nodes, hiding subtitles."
                  >
                    <Switch
                      checked={compactLabels}
                      onCheckedChange={(value) => {
                        setCompactLabels(value);
                        toast(
                          value
                            ? "Subtitles hidden on the canvas"
                            : "Subtitles shown on the canvas",
                        );
                      }}
                    />
                  </Row>
                  <Row
                    title="Snap canvas to grid"
                    description="Align nodes to a 12 px grid while dragging."
                  >
                    <Switch
                      checked={snapToGrid}
                      onCheckedChange={(value) => {
                        setSnapToGrid(value);
                        toast(value ? "Snap to grid on" : "Snap to grid off");
                      }}
                    />
                  </Row>
                </SectionCard>
              </>
            ) : section === "workspace" ? (
              <>
                <SectionCard
                  title="Workspace"
                  description="Shared configuration for everyone in this workspace."
                  footer={
                    <Button variant="primary" size="sm" onClick={save}>
                      <Check className="size-3.5" />
                      Save changes
                    </Button>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Workspace name">
                      <Input defaultValue="Personal" />
                    </Field>
                    <Field label="Workspace slug">
                      <Input defaultValue="personal" />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field
                      label="Default workflow timezone"
                      hint="Used by Schedule triggers unless a workflow overrides it."
                    >
                      <Select defaultValue="Africa/Casablanca">
                        <option>Africa/Casablanca</option>
                        <option>UTC</option>
                        <option>Europe/Berlin</option>
                        <option>America/Los_Angeles</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Execution data retention">
                      <Select defaultValue="30 days">
                        <option>7 days</option>
                        <option>30 days</option>
                        <option>90 days</option>
                        <option>Forever</option>
                      </Select>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Members"
                  description="Invite teammates and assign roles."
                  footer={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={inviteMember}
                    >
                      <Plus className="size-3.5" />
                      Invite member
                    </Button>
                  }
                >
                  <div className="space-y-1.5">
                    {members.map((member) => (
                      <div
                        key={member.email}
                        className="flex items-center gap-3 rounded-[10px] border border-hairline bg-surface-2/30 px-3 py-2"
                      >
                        <Avatar
                          initials={member.initials}
                          className="size-7"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-medium text-ink">
                            {member.name}
                          </div>
                          <div className="truncate text-[10px] text-ink-3">
                            {member.email}
                          </div>
                        </div>
                        <Badge
                          variant={member.role === "Owner" ? "accent" : "default"}
                        >
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </>
            ) : section === "api" ? (
              <>
                <SectionCard
                  title="API keys"
                  description="Authenticate requests to the FlowPilot API and webhooks."
                  footer={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={createApiKey}
                    >
                      <Plus className="size-3.5" />
                      Create key
                    </Button>
                  }
                >
                  <div className="rounded-[10px] border border-hairline bg-surface-2/40 px-3.5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-ink">
                            Production key
                          </span>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <p className="mt-0.5 text-[10px] text-ink-3">
                          Created 12 days ago · last used 4 minutes ago
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <code className="rounded-md border border-hairline bg-canvas px-2 py-1 font-mono text-[10.5px] text-ink-2">
                          {showKey
                            ? apiKey
                            : `${apiKey.slice(0, 8)}${"•".repeat(12)}`}
                        </code>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setShowKey((value) => !value)}
                        >
                          {showKey ? "Hide" : "Reveal"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 flex items-start gap-2 rounded-[9px] border border-warning/20 bg-[var(--warning-soft)] px-3 py-2 text-[10.5px] leading-relaxed text-ink-3">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    Keys grant full API access. Rotate them regularly and never
                    commit them to source control.
                  </p>
                </SectionCard>

                <SectionCard
                  title="Webhook base URL"
                  description="Use this as the origin for every public webhook trigger."
                >
                  <Input
                    readOnly
                    value="https://api.flowpilot.dev/webhook"
                    className="font-mono text-[11.5px]"
                  />
                </SectionCard>
              </>
            ) : (
              <>
                <SectionCard
                  title="Email notifications"
                  description="Choose what we send to your inbox."
                >
                  <Row
                    title="Execution failures"
                    description="Get an email when a production run fails, with the failing node and error."
                  >
                    <Switch
                      checked={notifications.executionAlerts}
                      onCheckedChange={(value) =>
                        setNotifications((current) => ({
                          ...current,
                          executionAlerts: value,
                        }))
                      }
                    />
                  </Row>
                  <Row
                    title="Weekly digest"
                    description="A Monday summary of runs, AI spend and knowledge-base health."
                  >
                    <Switch
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(value) =>
                        setNotifications((current) => ({
                          ...current,
                          weeklyDigest: value,
                        }))
                      }
                    />
                  </Row>
                  <Row
                    title="Product updates"
                    description="New node types, model providers and editor features."
                  >
                    <Switch
                      checked={notifications.productUpdates}
                      onCheckedChange={(value) =>
                        setNotifications((current) => ({
                          ...current,
                          productUpdates: value,
                        }))
                      }
                    />
                  </Row>
                </SectionCard>

                <SectionCard
                  title="In-app alerts"
                  description="Toasts and badges inside the editor."
                >
                  <Row
                    title="Node failures"
                    description="Show a toast as soon as a node errors during a run."
                  >
                    <Switch
                      checked={notifications.nodeFailures}
                      onCheckedChange={(value) =>
                        setNotifications((current) => ({
                          ...current,
                          nodeFailures: value,
                        }))
                      }
                    />
                  </Row>
                  <Row
                    title="Token budget warnings"
                    description="Warn at 80% of the configured per-execution token cap."
                  >
                    <Switch
                      checked={notifications.budgetWarnings}
                      onCheckedChange={(value) =>
                        setNotifications((current) => ({
                          ...current,
                          budgetWarnings: value,
                        }))
                      }
                    />
                  </Row>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
