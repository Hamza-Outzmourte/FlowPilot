import { create } from "zustand";

export type Theme = "dark" | "light" | "system";

const THEME_KEY = "flowpilot.theme";
const SNAP_KEY = "flowpilot.snapToGrid";
const COMPACT_KEY = "flowpilot.compactLabels";

function readFlag(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value === null ? fallback : value === "true";
}

function applyCompactLabels(compact: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("fp-compact-labels", compact);
}

function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("light", resolved === "light");
  document.documentElement.style.colorScheme = resolved;
}

interface UiState {
  theme: Theme;
  commandOpen: boolean;
  snapToGrid: boolean;
  compactLabels: boolean;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
  setCommandOpen: (open: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setCompactLabels: (compact: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme:
    (typeof window !== "undefined"
      ? (window.localStorage.getItem(THEME_KEY) as Theme | null)
      : null) ?? "dark",
  commandOpen: false,
  snapToGrid: readFlag(SNAP_KEY, true),
  compactLabels: readFlag(COMPACT_KEY, false),

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, theme);
    }
    applyTheme(theme);
    set({ theme });
  },

  initTheme: () => {
    const theme =
      (typeof window !== "undefined"
        ? (window.localStorage.getItem(THEME_KEY) as Theme | null)
        : null) ?? "dark";
    applyTheme(theme);
    set({ theme });
    applyCompactLabels(readFlag(COMPACT_KEY, false));

    if (typeof window !== "undefined" && theme === "system") {
      const query = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => applyTheme("system");
      query.addEventListener("change", handler);
    }
  },

  setCommandOpen: (commandOpen) => set({ commandOpen }),

  setSnapToGrid: (snapToGrid) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SNAP_KEY, String(snapToGrid));
    }
    set({ snapToGrid });
  },

  setCompactLabels: (compactLabels) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COMPACT_KEY, String(compactLabels));
    }
    applyCompactLabels(compactLabels);
    set({ compactLabels });
  },
}));
