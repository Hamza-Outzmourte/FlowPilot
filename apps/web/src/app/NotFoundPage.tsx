import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-canvas px-6">
      <div className="dot-vignette pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,var(--accent-soft),transparent_70%)]" />

      <div className="relative flex flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-[16px] border border-line bg-surface text-accent shadow-[var(--shadow-float)]">
          <Compass className="size-6" />
        </div>
        <p className="mt-5 font-mono text-[11px] tracking-[0.2em] text-ink-3">
          ERROR 404
        </p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-ink">
          This page drifted off the canvas
        </h1>
        <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-ink-3">
          The route you followed doesn’t exist. Head back to your dashboard to
          keep automating.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <Button asChild variant="primary" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="size-3.5" />
              Back to dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to="/workflows">Browse workflows</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
