export function classNames(...arr: (string | false | null | undefined)[]) {
  return arr.filter(Boolean).join(" ");
}

export function generateIssueNumber(seq: number, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const seqStr = String(seq).padStart(4, "0");
  return `Q-${y}${m}${d}-${seqStr}`;
}

export function formatDateTime(d: Date | string | null | undefined, locale = "zh-TW") {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function relativeTime(d: Date | string | null | undefined, locale = "zh-TW") {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const zh = locale !== "en";
  if (sec < 60) return zh ? "剛剛" : "just now";
  if (min < 60) return zh ? `${min} 分鐘前` : `${min}m ago`;
  if (hr < 24) return zh ? `${hr} 小時前` : `${hr}h ago`;
  if (day < 7) return zh ? `${day} 天前` : `${day}d ago`;
  return formatDateTime(date, locale);
}

export function initials(name: string) {
  if (!name) return "?";
  const trimmed = name.trim();
  if (/^[一-鿿]/.test(trimmed)) return trimmed.slice(-2);
  const parts = trimmed.split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

// ---- Status & Priority styling ---------------------------------------------

export const STATUS_STYLES: Record<
  string,
  { pill: string; dot: string; ring: string }
> = {
  PENDING: {
    pill: "bg-amber-50 text-amber-800 border border-amber-200",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  IN_PROGRESS: {
    pill: "bg-blue-50 text-blue-800 border border-blue-200",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
  },
  AWAITING_CONFIRMATION: {
    pill: "bg-violet-50 text-violet-800 border border-violet-200",
    dot: "bg-violet-500",
    ring: "ring-violet-200",
  },
  COMPLETED: {
    pill: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
};

export const PRIORITY_STYLES: Record<
  string,
  { pill: string; bar: string; emphasized?: boolean }
> = {
  LOW: {
    pill: "bg-slate-50 text-slate-700 border border-slate-200",
    bar: "bg-slate-300",
  },
  MEDIUM: {
    pill: "bg-sky-50 text-sky-800 border border-sky-200",
    bar: "bg-sky-400",
  },
  HIGH: {
    pill: "bg-orange-50 text-orange-800 border border-orange-200",
    bar: "bg-orange-500",
  },
  URGENT: {
    pill: "bg-rose-600 text-white border border-rose-700 shadow-sm",
    bar: "bg-rose-600",
    emphasized: true,
  },
};

// ---- Department color palette ----------------------------------------------

// Curated palette; departments are mapped deterministically by their code/id
// so the same department always shows the same color.
export const DEPT_PALETTE: { pill: string; dot: string }[] = [
  { pill: "bg-blue-50 text-blue-800 border border-blue-200", dot: "bg-blue-500" },
  { pill: "bg-emerald-50 text-emerald-800 border border-emerald-200", dot: "bg-emerald-500" },
  { pill: "bg-amber-50 text-amber-800 border border-amber-200", dot: "bg-amber-500" },
  { pill: "bg-violet-50 text-violet-800 border border-violet-200", dot: "bg-violet-500" },
  { pill: "bg-rose-50 text-rose-800 border border-rose-200", dot: "bg-rose-500" },
  { pill: "bg-cyan-50 text-cyan-800 border border-cyan-200", dot: "bg-cyan-500" },
  { pill: "bg-orange-50 text-orange-800 border border-orange-200", dot: "bg-orange-500" },
  { pill: "bg-teal-50 text-teal-800 border border-teal-200", dot: "bg-teal-500" },
  { pill: "bg-pink-50 text-pink-800 border border-pink-200", dot: "bg-pink-500" },
  { pill: "bg-indigo-50 text-indigo-800 border border-indigo-200", dot: "bg-indigo-500" },
  { pill: "bg-lime-50 text-lime-800 border border-lime-200", dot: "bg-lime-500" },
  { pill: "bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200", dot: "bg-fuchsia-500" },
];

// Pinned colors for the seeded departments so they look intentional.
const DEPT_OVERRIDES: Record<string, number> = {
  OP: 0,    // blue
  PE: 1,    // emerald
  PC: 3,    // violet
  SALES: 6, // orange
};

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31 + s.charCodeAt(i)) | 0);
  return Math.abs(h);
}

export function getDeptColor(code: string) {
  const upper = (code || "").toUpperCase();
  const idx = upper in DEPT_OVERRIDES ? DEPT_OVERRIDES[upper] : hashString(upper) % DEPT_PALETTE.length;
  return DEPT_PALETTE[idx];
}

// User avatar color (used for comment authors etc.)
const USER_PALETTE = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500",
  "bg-pink-500", "bg-indigo-500", "bg-lime-600", "bg-fuchsia-500",
];

export function getUserColor(idOrName: string) {
  return USER_PALETTE[hashString(idOrName || "?") % USER_PALETTE.length];
}

export const STATUSES = ["PENDING", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const ROLES = ["ADMIN", "USER"] as const;
