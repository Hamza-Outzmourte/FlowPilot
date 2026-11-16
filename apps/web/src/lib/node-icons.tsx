import {
  AlignLeft,
  ArrowUpDown,
  BarChart3,
  Bell,
  Blocks,
  Bot,
  Box,
  Braces,
  Brain,
  Calculator,
  CalendarClock,
  ChartNoAxesColumn,
  CheckCheck,
  CircleStop,
  Cloud,
  Code2,
  Columns3,
  Combine,
  Cpu,
  Database,
  FileCode2,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType2,
  Files,
  Filter,
  FolderOpen,
  GitBranch,
  GitMerge,
  Globe,
  HardDrive,
  Image,
  Layers,
  Link2,
  ListFilter,
  Mail,
  Merge,
  MessageCircle,
  MessageSquare,
  MousePointerClick,
  Play,
  Puzzle,
  RefreshCw,
  Repeat,
  ScanText,
  Search,
  Send,
  ShieldCheck,
  Sigma,
  Sparkles,
  Split,
  SquarePen,
  Table2,
  Tags,
  TextCursorInput,
  Timer,
  UserCheck,
  Webhook,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

type IconComponent = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

const lucideIcons: Record<string, IconComponent> = {
  bot: Bot,
  sparkles: Sparkles,
  braces: Braces,
  brain: Brain,
  cpu: Cpu,
  database: Database,
  "file-text": FileText,
  split: Split,
  if: IfIcon,
  "git-branch": GitBranch,
  "git-merge": GitMerge,
  merge: Merge,
  combine: Combine,
  repeat: Repeat,
  clock: ClockIcon,
  timer: Timer,
  "calendar-clock": CalendarClock,
  "circle-stop": CircleStop,
  workflow: Workflow,
  code: Code2,
  globe: Globe,
  webhook: Webhook,
  "message-square": MessageSquare,
  "message-circle": MessageCircle,
  mail: Mail,
  send: Send,
  image: Image,
  "square-pen": SquarePen,
  tags: Tags,
  table: Table2,
  "file-spreadsheet": FileSpreadsheet,
  "file-csv": FileSpreadsheet,
  "file-json": FileJson,
  "file-code": FileCode2,
  "file-type": FileType2,
  files: Files,
  filter: Filter,
  "list-filter": ListFilter,
  "arrow-up-down": ArrowUpDown,
  sigma: Sigma,
  "align-left": AlignLeft,
  layers: Layers,
  blocks: Blocks,
  box: Box,
  search: Search,
  "scan-text": ScanText,
  "shield-check": ShieldCheck,
  "user-check": UserCheck,
  "mouse-pointer-click": MousePointerClick,
  play: Play,
  "refresh-cw": RefreshCw,
  "hard-drive": HardDrive,
  "folder-open": FolderOpen,
  cloud: Cloud,
  "link-2": Link2,
  "text-cursor": TextCursorInput,
  chart: BarChart3,
  "chart-column": ChartNoAxesColumn,
  bell: Bell,
  check: CheckCheck,
  puzzle: Puzzle,
  calculator: Calculator,
  zap: Zap,
  columns: Columns3,
  file: FileText,
};

function ClockIcon(props: React.ComponentProps<LucideIcon>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IfIcon(props: React.ComponentProps<LucideIcon>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12h5" />
      <path d="M8 12c4 0 5.2-6.2 9.4-6.2" />
      <path d="M8 12c4 0 5.2 6.2 9.4 6.2" />
      <path d="M14.8 3.2 17.4 5.8 14.8 8.4" />
      <path d="M14.8 15.6 17.4 18.2 14.8 20.8" />
    </svg>
  );
}

function Svg({
  children,
  className,
  viewBox = "0 0 32 32",
}: {
  children: React.ReactNode;
  className?: string;
  viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const brandIcons: Record<string, (className?: string) => React.ReactNode> = {
  telegram: (className) => (
    <img
      src="/brands/telegram.png"
      alt="Telegram"
      className={className}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
  ),
  gmail: (className) => (
    <img
      src="/brands/gmail.png"
      alt="Gmail"
      className={className}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
  ),
  gemini: (className) => (
    <Svg className={className}>
      <defs>
        <linearGradient id="gemGrad" x1="5" y1="4" x2="27" y2="28">
          <stop stopColor="#4285F4" />
          <stop offset=".45" stopColor="#9B72CB" />
          <stop offset="1" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        d="M16 3c.8 6.7 4.3 10.2 11 11-6.7.8-10.2 4.3-11 11-.8-6.7-4.3-10.2-11-11 6.7-.8 10.2-4.3 11-11Z"
        fill="url(#gemGrad)"
      />
      <path
        d="M25.2 3.5c.2 1.9 1.1 2.8 3 3-1.9.2-2.8 1.1-3 3-.2-1.9-1.1-2.8-3-3 1.9-.2 2.8-1.1 3-3Z"
        fill="url(#gemGrad)"
        opacity=".8"
      />
    </Svg>
  ),
  openai: (className) => (
    <Svg className={className}>
      <path
        d="M16 4.2 25.6 9.7v11L16 26.2 6.4 20.7v-11L16 4.2Z"
        stroke="#10A37F"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M11.4 12.2 16 9.6l4.6 2.6v5.2L16 20l-4.6-2.6v-5.2Z"
        stroke="#10A37F"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M16 9.6v10.8M11.4 12.2l9.2 5.2M20.6 12.2l-9.2 5.2" stroke="#10A37F" strokeWidth="1.4" opacity=".6" />
    </Svg>
  ),
  anthropic: (className) => (
    <Svg className={className}>
      <rect x="3" y="3" width="26" height="26" rx="7" fill="#D97757" />
      <path
        d="M10 23 15.2 9h2.4L23 23h-2.7l-1.1-3.2h-5.6L12.6 23H10Zm4.3-5.4h4.2l-2.1-6-2.1 6Z"
        fill="#fff"
      />
    </Svg>
  ),
  ollama: (className) => (
    <Svg className={className}>
      <rect x="3" y="3" width="26" height="26" rx="8" fill="#1f1f24" />
      <path
        d="M11 22v-6.5c0-2.8 2.2-5 5-5s5 2.2 5 5V22"
        stroke="#e8e8ec"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="13.4" cy="14.6" r="1.2" fill="#e8e8ec" />
      <circle cx="18.6" cy="14.6" r="1.2" fill="#e8e8ec" />
      <path d="M9 22h14" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  slack: (className) => (
    <Svg className={className}>
      <rect x="13.4" y="3.6" width="5.2" height="13" rx="2.6" fill="#36C5F0" />
      <rect x="15.4" y="13.4" width="13" height="5.2" rx="2.6" fill="#2EB67D" />
      <rect x="13.4" y="15.4" width="5.2" height="13" rx="2.6" fill="#ECB22E" />
      <rect x="3.6" y="13.4" width="13" height="5.2" rx="2.6" fill="#E01E5A" />
    </Svg>
  ),
  discord: (className) => (
    <Svg className={className}>
      <rect x="3" y="4" width="26" height="24" rx="8" fill="#5865F2" />
      <path
        d="M12 20c2.6 1.5 5.4 1.5 8 0M11 14.5h.01M21 14.5h.01"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M10 11c3.6-1.4 8.4-1.4 12 0" stroke="#fff" strokeWidth="2" opacity=".55" strokeLinecap="round" />
    </Svg>
  ),
  notion: (className) => (
    <Svg className={className}>
      <rect x="3" y="3" width="26" height="26" rx="6" fill="#fff" />
      <path d="M10 23V9h2.8l7.2 9.6V9H23v14h-2.8l-7.2-9.6V23H10Z" fill="#111" />
    </Svg>
  ),
  sheets: (className) => (
    <Svg className={className}>
      <rect x="6" y="2.5" width="20" height="27" rx="3" fill="#0F9D58" />
      <path d="M10 10h12v12H10z" fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d="M10 14h12M10 18h12M14.4 10v12M19 10v12" stroke="#fff" strokeWidth="1.2" opacity=".9" />
    </Svg>
  ),
  google: (className) => (
    <Svg className={className}>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4 .6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </Svg>
  ),
  github: (className) => (
    <Svg className={className}>
      <circle cx="16" cy="16" r="13" fill="#181717" />
      <path
        d="M16 7.2a8.8 8.8 0 0 0-2.8 17.1c.4.1.6-.2.6-.4v-1.6c-2.4.5-2.9-1.1-2.9-1.1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4 1 1.4 1 .8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.3-2-.2-4-1-4-4.3 0-1 .3-1.7.9-2.3-.1-.2-.4-1.1.1-2.3 0 0 .7-.2 2.4.9a8.3 8.3 0 0 1 4.4 0c1.6-1.1 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.3 0 3.4-2 4.1-4 4.3.3.3.6.9.6 1.8v2.7c0 .2.2.5.6.4A8.8 8.8 0 0 0 16 7.2Z"
        fill="#fff"
      />
    </Svg>
  ),
  airtable: (className) => (
    <Svg className={className}>
      <path d="M15.7 5.2 5.5 9.3c-.7.3-.7 1.3 0 1.6l10.2 4.1c.2.1.5.1.7 0l10.2-4.1c.7-.3.7-1.3 0-1.6L16.4 5.2a1 1 0 0 0-.7 0Z" fill="#FCB400" />
      <path d="M17.6 16.8v9.5c0 .6.6 1 1.1.8l8.2-3.3c.3-.1.5-.4.5-.8v-8.4c0-.6-.6-1-1.1-.8l-8.2 3.2c-.3.1-.5.4-.5.8Z" fill="#18BFFF" />
      <path d="M14.5 17.1 6.4 13c-.5-.2-1.1.2-1.1.8v8.5c0 .3.2.6.4.7l8.2 3.9c.5.2 1.1-.2 1.1-.8v-8.4c0-.2-.2-.5-.5-.6Z" fill="#F82B60" />
    </Svg>
  ),
  postgres: (className) => (
    <Svg className={className}>
      <circle cx="16" cy="16" r="13" fill="#336791" />
      <path
        d="M11 9.5c-1.4 3-1.7 8.4-.7 11.3.5 1.4 1.7 1.5 2.2.4.4-.9.2-2.4.2-2.4m6.3-9.5c1.5 3 1.8 8.4.8 11.3-.5 1.4-1.7 1.5-2.2.4-.4-.9-.2-2.4-.2-2.4M11 9.5c1.3-.9 6.7-.9 8 0m-8.4 9.8c2.7.9 6.1.9 8.8 0"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  ),
  s3: (className) => (
    <Svg className={className}>
      <rect x="4" y="4" width="24" height="24" rx="6" fill="#7C3AED" />
      <path
        d="M10 10.5h12l-1.1 12.4c-.1.6-.6 1.1-1.2 1.1h-7.4c-.6 0-1.1-.5-1.2-1.1L10 10.5Z"
        stroke="#fff"
        strokeWidth="1.7"
      />
      <path d="M9 10.5h14M13 14.5h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  ),
  drive: (className) => (
    <Svg className={className}>
      <path d="m12.3 5.5 8.2 14.2h-5.2L7.1 5.5h5.2Z" fill="#0F9D58" />
      <path d="M22.8 7.5 28 16.6l-7.5 4.3-3.5-6.1 5.8-7.3Z" fill="#F4B400" />
      <path d="M12.4 26.5 4 26.5l3.6-6.2h16.8l-3.7 6.2H12.4Z" fill="#4285F4" />
    </Svg>
  ),
  http: (className) => (
    <Svg className={className}>
      <rect x="3" y="3" width="26" height="26" rx="7" fill="#0EA5E9" />
      <path
        d="M16 9.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm-9.5 6.5h19M16 9.5c2.2 2.1 3.2 4.3 3.2 6.5s-1 4.4-3.2 6.5c-2.2-2.1-3.2-4.3-3.2-6.5s1-4.4 3.2-6.5Z"
        stroke="#fff"
        strokeWidth="1.5"
      />
    </Svg>
  ),
};

export function NodeIcon({
  name,
  className = "h-11 w-11",
}: {
  name: string;
  className?: string;
}) {
  const brand = brandIcons[name];
  if (brand) return <>{brand(className)}</>;
  const Icon = lucideIcons[name] ?? Blocks;
  return <Icon className={className} strokeWidth={1.7} />;
}

export function hasBrandIcon(name: string): boolean {
  return Boolean(brandIcons[name]);
}
