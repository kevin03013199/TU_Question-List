"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDict, format } from "@/lib/i18n";
import { classNames, formatDateTime, relativeTime, STATUSES, PRIORITIES } from "@/lib/utils";
import { DepartmentBadge, PriorityBadge, StatusBadge, UserAvatar } from "./Badges";

type Department = { id: string; name: string; nameEn: string | null; code: string };

type IssueRow = {
  id: string;
  issueNumber: string;
  productName: string;
  moNumber: string;
  content: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  createdBy: { id: string; displayName: string; username: string };
  assignedDepartment: Department;
  images: { id: string; url: string }[];
  _count: { comments: number };
};

export default function IssueListClient({
  mode,
  departments,
  refreshSeconds,
  locale,
}: {
  mode: "active" | "archived";
  departments: Department[];
  refreshSeconds: number;
  locale: string;
}) {
  const t = getDict(locale);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [interval, setIntervalSecs] = useState(refreshSeconds);
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [q, setQ] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const archived = mode === "archived";

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (archived) p.set("archived", "true");
    if (departmentId) p.set("departmentId", departmentId);
    if (status) p.set("status", status);
    if (priority) p.set("priority", priority);
    if (q) p.set("q", q);
    return p.toString();
  }, [archived, departmentId, status, priority, q]);

  async function load() {
    try {
      const res = await fetch(`/api/issues?${queryString}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setIssues(data.issues);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(load, Math.max(1000, interval * 1000));
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, interval, queryString]);

  // ---- stats (from current filtered list) -----------------------------------
  const stats = useMemo(() => {
    const s = {
      total: issues.length,
      pending: 0,
      inProgress: 0,
      awaiting: 0,
      urgent: 0,
    };
    for (const it of issues) {
      if (it.status === "PENDING") s.pending++;
      else if (it.status === "IN_PROGRESS") s.inProgress++;
      else if (it.status === "AWAITING_CONFIRMATION") s.awaiting++;
      if (it.priority === "URGENT" && it.status !== "COMPLETED") s.urgent++;
    }
    return s;
  }, [issues]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {archived ? t.history.title : t.nav.active}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {archived
              ? (locale === "en" ? "Completed issues archive" : "已完成問題的歷史紀錄")
              : (locale === "en" ? "Issues currently being tracked across departments" : "各部門進行中的問題")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={classNames(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition",
              autoRefresh
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <span className={classNames("h-2 w-2 rounded-full", autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
            {autoRefresh ? t.issue.autoRefreshOn : t.issue.autoRefreshOff}
          </button>
          <span className="text-slate-500">{format(t.issue.refreshSeconds, { n: interval })}</span>
          <input
            type="number"
            min={1}
            max={3600}
            value={interval}
            onChange={(e) => setIntervalSecs(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 input py-1"
          />
          {lastUpdated && (
            <span className="text-slate-400 hidden md:inline">
              {formatDateTime(lastUpdated, locale)}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {!archived && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label={locale === "en" ? "Open total" : "進行中"} value={stats.total} tone="brand" />
          <StatCard label={t.statuses.PENDING} value={stats.pending} tone="amber" />
          <StatCard label={t.statuses.IN_PROGRESS} value={stats.inProgress} tone="blue" />
          <StatCard label={t.statuses.AWAITING_CONFIRMATION} value={stats.awaiting} tone="violet" />
          <StatCard label={t.priorities.URGENT} value={stats.urgent} tone="rose" emphasize={stats.urgent > 0} />
        </div>
      )}

      {/* Filters */}
      <div className="card p-3 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input
          className="input md:col-span-2"
          placeholder={t.issue.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">{t.issue.allDepartments}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.code} · {d.name}</option>
          ))}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t.issue.allStatuses}</option>
          {STATUSES.filter((s) => archived ? s === "COMPLETED" : s !== "COMPLETED").map((s) => (
            <option key={s} value={s}>{t.statuses[s as keyof typeof t.statuses]}</option>
          ))}
        </select>
        <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">{t.issue.allPriorities}</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{t.priorities[p as keyof typeof t.priorities]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>{t.issue.issueNumber}</th>
                <th>{t.issue.productName}</th>
                <th>{t.issue.moNumber}</th>
                <th>{t.issue.assignedDepartment}</th>
                <th>{t.issue.status}</th>
                <th>{t.issue.priority}</th>
                <th>{t.issue.createdBy}</th>
                <th>{archived ? t.issue.completedAt : t.issue.createdAt}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              )}
              {!loading && issues.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <EmptyState locale={locale} archived={archived} />
                  </td>
                </tr>
              )}
              {issues.map((it) => (
                <tr key={it.id} className="fade-in">
                  <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    <Link href={`/issues/${it.id}`} className="hover:text-brand-700">
                      {it.issueNumber}
                    </Link>
                  </td>
                  <td>
                    <div className="font-medium text-slate-900">{it.productName}</div>
                    <div className="text-xs text-slate-500 line-clamp-1 max-w-[280px] mt-0.5">
                      {it.content}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      {it.images.length > 0 && (
                        <span>📎 {it.images.length}</span>
                      )}
                      {it._count.comments > 0 && (
                        <span>💬 {it._count.comments}</span>
                      )}
                    </div>
                  </td>
                  <td className="font-mono text-xs">{it.moNumber}</td>
                  <td>
                    <DepartmentBadge code={it.assignedDepartment.code} name={it.assignedDepartment.name} />
                  </td>
                  <td>
                    <StatusBadge status={it.status} locale={locale} />
                  </td>
                  <td>
                    <PriorityBadge priority={it.priority} locale={locale} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <UserAvatar id={it.createdBy.id} name={it.createdBy.displayName} size={28} />
                      <span className="text-sm text-slate-700">{it.createdBy.displayName}</span>
                    </div>
                  </td>
                  <td className="text-slate-500 whitespace-nowrap text-xs">
                    <div>{formatDateTime(archived ? it.completedAt : it.createdAt, locale)}</div>
                    <div className="text-slate-400">
                      {relativeTime(archived ? it.completedAt : it.createdAt, locale)}
                    </div>
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/issues/${it.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      {t.issue.detail} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone: "brand" | "amber" | "blue" | "violet" | "rose";
  emphasize?: boolean;
}) {
  const styles: Record<string, string> = {
    brand: "from-brand-50 to-brand-100/40 text-brand-800",
    amber: "from-amber-50 to-amber-100/40 text-amber-800",
    blue: "from-blue-50 to-blue-100/40 text-blue-800",
    violet: "from-violet-50 to-violet-100/40 text-violet-800",
    rose: "from-rose-50 to-rose-100/40 text-rose-800",
  };
  const dot: Record<string, string> = {
    brand: "bg-brand-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
  };
  return (
    <div
      className={classNames(
        "card card-hover p-4 bg-gradient-to-br",
        styles[tone],
        emphasize && "ring-2 ring-rose-300",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-600">
        <span className={classNames("h-2 w-2 rounded-full", dot[tone])} />
        {label}
      </div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function EmptyState({ locale, archived }: { locale: string; archived: boolean }) {
  const t = getDict(locale);
  return (
    <div className="py-16 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-2xl">
        {archived ? "🗂" : "✨"}
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {archived ? t.history.empty : t.issue.noIssues}
      </p>
      {!archived && (
        <Link href="/issues/new" className="btn btn-primary mt-4">
          {t.nav.newIssue}
        </Link>
      )}
    </div>
  );
}
