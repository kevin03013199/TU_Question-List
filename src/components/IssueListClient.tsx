"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDict, format } from "@/lib/i18n";
import { classNames, formatDateTime, PRIORITY_COLORS, STATUS_COLORS, STATUSES, PRIORITIES } from "@/lib/utils";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">{archived ? t.history.title : t.nav.active}</h1>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={classNames(
              "px-2 py-1 rounded border",
              autoRefresh ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-50 border-slate-300",
            )}
          >
            {autoRefresh ? t.issue.autoRefreshOn : t.issue.autoRefreshOff}
          </button>
          <span>{format(t.issue.refreshSeconds, { n: interval })}</span>
          <input
            type="number"
            min={1}
            max={3600}
            value={interval}
            onChange={(e) => setIntervalSecs(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 input py-1"
          />
          {lastUpdated && (
            <span className="text-slate-400">{formatDateTime(lastUpdated, locale)}</span>
          )}
        </div>
      </div>

      <div className="card p-3 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input
          className="input"
          placeholder={t.issue.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">{t.issue.allDepartments}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
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
        {!archived && (
          <Link href="/issues/new" className="btn btn-primary">
            {t.nav.newIssue}
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">{t.issue.issueNumber}</th>
              <th className="text-left px-3 py-2">{t.issue.productName}</th>
              <th className="text-left px-3 py-2">{t.issue.moNumber}</th>
              <th className="text-left px-3 py-2">{t.issue.assignedDepartment}</th>
              <th className="text-left px-3 py-2">{t.issue.status}</th>
              <th className="text-left px-3 py-2">{t.issue.priority}</th>
              <th className="text-left px-3 py-2">{t.issue.createdBy}</th>
              <th className="text-left px-3 py-2">{archived ? t.issue.completedAt : t.issue.createdAt}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                  {t.common.loading}
                </td>
              </tr>
            )}
            {!loading && issues.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                  {archived ? t.history.empty : t.issue.noIssues}
                </td>
              </tr>
            )}
            {issues.map((it) => (
              <tr key={it.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs text-slate-600">{it.issueNumber}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{it.productName}</div>
                  <div className="text-xs text-slate-500 line-clamp-1 max-w-[260px]">{it.content}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{it.moNumber}</td>
                <td className="px-3 py-2">
                  <span className="badge bg-slate-100 text-slate-700">{it.assignedDepartment.code}</span>{" "}
                  <span className="text-slate-600">{it.assignedDepartment.name}</span>
                </td>
                <td className="px-3 py-2">
                  <span className={classNames("badge", STATUS_COLORS[it.status])}>
                    {t.statuses[it.status as keyof typeof t.statuses]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={classNames("badge", PRIORITY_COLORS[it.priority])}>
                    {t.priorities[it.priority as keyof typeof t.priorities]}
                  </span>
                </td>
                <td className="px-3 py-2">{it.createdBy.displayName}</td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                  {formatDateTime(archived ? it.completedAt : it.createdAt, locale)}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link className="btn btn-ghost text-brand-700" href={`/issues/${it.id}`}>
                    {t.issue.detail}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
