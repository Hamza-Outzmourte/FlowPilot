import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { NodeIcon } from "@/lib/node-icons";
import { sleep } from "@/lib/utils";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const signIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Enter your email and password");
      return;
    }
    if (mode === "signup") {
      if (!confirmPassword.trim()) {
        toast.error("Please confirm your password");
        return;
      }
      if (password.trim() !== confirmPassword.trim()) {
        toast.error("Passwords do not match");
        return;
      }
      if (password.trim().length < 6) {
        toast.error("Use at least 6 characters for your password");
        return;
      }
    }
    setLoading(true);
    await sleep(700);
    setLoading(false);
    toast.success(
      mode === "signup"
        ? "Account created — welcome to FlowPilot"
        : "Welcome back to FlowPilot",
    );
    navigate("/dashboard");
  };

  const oauthSignIn = async (provider: "Google" | "GitHub") => {
    setLoading(true);
    await sleep(600);
    setLoading(false);
    toast.success(`Signed in with ${provider}`);
    navigate("/dashboard");
  };

  const requestReset = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Enter a valid email address first");
      return;
    }
    toast.success(`Reset link sent to ${email.trim()}`, {
      description: "The link expires in 30 minutes.",
    });
  };

  return (
    <div className="grid min-h-screen w-full bg-app lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-hairline lg:block">
        <div className="absolute inset-0 bg-canvas" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_20%_10%,var(--accent-soft),transparent_60%),radial-gradient(60%_50%_at_85%_80%,rgba(34,211,238,0.10),transparent_70%)]" />
        <div className="dot-vignette pointer-events-none absolute inset-0 opacity-70" />

        <div className="relative flex h-full flex-col justify-between px-12 py-10">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[var(--accent-grad)] text-white shadow-[0_6px_20px_var(--accent-glow)]">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
                <path d="M13.6 2 5.3 13.5h4.3L9 22l8.4-11.5h-4.3L13.6 2Z" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
              FlowPilot
            </span>
          </div>

          <div className="max-w-[460px]">
            <h1 className="mt-10 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
              Build agents that
              <br />
              <span className="bg-[var(--accent-grad)] bg-clip-text text-transparent">
                actually get work done.
              </span>
            </h1>
            <p className="mt-4 max-w-[400px] text-[13px] leading-relaxed text-ink-3">
              Connect triggers, LangGraph agents, tools and app actions on one
              canvas — then watch every run in realtime.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10.5px] text-ink-3">
            <span>© 2026 FlowPilot</span>
            <span>·</span>
            <span>Privacy</span>
            <span>·</span>
            <span>Terms</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-7 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[var(--accent-grad)] text-white">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
                <path d="M13.6 2 5.3 13.5h4.3L9 22l8.4-11.5h-4.3L13.6 2Z" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold text-ink">FlowPilot</span>
          </div>

          <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-ink">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1.5 text-[12.5px] text-ink-3">
            {mode === "signup"
              ? "Start building AI workflows in your local workspace."
              : "Sign in to your workspace to keep building."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="md"
              disabled={loading}
              onClick={() => void oauthSignIn("Google")}
            >
              <NodeIcon name="google" className="size-4" />
              Google
            </Button>
            <Button
              variant="secondary"
              size="md"
              disabled={loading}
              onClick={() => void oauthSignIn("GitHub")}
            >
              <NodeIcon name="github" className="size-4" />
              GitHub
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-hairline" />
            <span className="text-[10px] uppercase tracking-wider text-ink-3">
              or continue with email
            </span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn();
            }}
          >
            <Field label="Email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="pl-8"
                />
              </div>
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
                <Input
                  type={visible ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="pl-8 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setVisible((value) => !value)}
                  className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </button>
              </div>
            </Field>
            {mode === "signup" && (
              <Field label="Confirm password" required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
                  <Input
                    type={confirmVisible ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    className="pl-8 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmVisible((value) => !value)}
                    className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                    aria-label={confirmVisible ? "Hide password" : "Show password"}
                  >
                    {confirmVisible ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              </Field>
            )}

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-[11.5px] text-ink-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="size-3.5 rounded border-line bg-surface-2 accent-[var(--accent)]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={requestReset}
                className="text-[11.5px] font-medium text-accent transition hover:text-accent-hover"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <ArrowRight className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {loading
                ? mode === "signup"
                  ? "Creating account…"
                  : "Signing in…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-[11.5px] text-ink-3">
            {mode === "signup" ? "Already have an account? " : "New to FlowPilot? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-medium text-accent transition hover:text-accent-hover"
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
