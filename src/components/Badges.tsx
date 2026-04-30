"use client";

import {
  classNames,
  getDeptColor,
  getUserColor,
  initials,
  PRIORITY_STYLES,
  STATUS_STYLES,
} from "@/lib/utils";
import { getDict } from "@/lib/i18n";

export function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const t = getDict(locale);
  const s = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  return (
    <span className={classNames("pill", s.pill)}>
      <span className={classNames("pill-dot", s.dot)} />
      {t.statuses[status as keyof typeof t.statuses] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority, locale }: { priority: string; locale: string }) {
  const t = getDict(locale);
  const p = PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM;
  const label = t.priorities[priority as keyof typeof t.priorities] ?? priority;
  return (
    <span
      className={classNames(
        "pill",
        p.pill,
        p.emphasized && "urgent-pulse rounded-full",
      )}
    >
      {p.emphasized && <span className="font-bold">!</span>}
      {label}
    </span>
  );
}

export function DepartmentBadge({
  code,
  name,
  showName = true,
  size = "md",
}: {
  code: string;
  name?: string;
  showName?: boolean;
  size?: "sm" | "md";
}) {
  const c = getDeptColor(code);
  return (
    <span
      className={classNames(
        "pill",
        c.pill,
        size === "sm" && "text-[11px] py-0",
      )}
    >
      <span className={classNames("pill-dot", c.dot)} />
      <span className="font-mono font-semibold">{code}</span>
      {showName && name && <span className="text-slate-600/90 font-normal">/ {name}</span>}
    </span>
  );
}

export function UserAvatar({
  id,
  name,
  size = 32,
}: {
  id: string;
  name: string;
  size?: number;
}) {
  const color = getUserColor(id || name);
  return (
    <span
      className={classNames("avatar", color)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.floor(size * 0.42)),
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
