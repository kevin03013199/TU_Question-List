"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { classNames, formatDateTime, relativeTime, getDeptColor, STATUSES, PRIORITIES } from "@/lib/utils";
import { DepartmentBadge, PriorityBadge, StatusBadge, UserAvatar } from "./Badges";

type Department = { id: string; name: string; code: string };

type Issue = {
  id: string;
  issueNumber: string;
  modelName: string;
  moNumber: string;
  content: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  createdBy: { id: string; displayName: string; username: string };
  assignedDepartments: Department[];
  images: { id: string; url: string; filename: string }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; displayName: string; username: string };
  }[];
};

export default function IssueDetailClient({
  locale,
  isAdmin,
  initialIssue,
  departments,
}: {
  locale: string;
  isAdmin: boolean;
  initialIssue: Issue;
  departments: Department[];
}) {
  const t = getDict(locale);
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const res = await fetch(`/api/issues/${issue.id}`, { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setIssue(j.issue);
    }
  }

  useEffect(() => {
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(body: Record<string, unknown>) {
    setError("");
    const res = await fetch(`/api/issues/${issue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || t.common.genericError);
      return;
    }
    refresh();
  }

  async function toggleDept(deptId: string) {
    const has = issue.assignedDepartments.some((d) => d.id === deptId);
    const next = has
      ? issue.assignedDepartments.filter((d) => d.id !== deptId).map((d) => d.id)
      : [...issue.assignedDepartments.map((d) => d.id), deptId];
    if (next.length === 0) {
      setError(t.issue.noDeptSelected);
      return;
    }
    await patch({ assignedDepartmentIds: next });
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/issues/${issue.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    setPosting(false);
    if (res.ok) {
      setComment("");
      refresh();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="btn btn-ghost text-brand-700">
          ← {t.issue.back}
        </Link>
        <span className="font-mono text-sm text-slate-400">{issue.issueNumber}</span>
      </div>

      {/* Main card */}
      <div className="card overflow-hidden">
        {/* Hero */}
        <div className="px-6 pt-5 pb-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {issue.modelName}
              </h1>
              <div className="text-sm text-slate-500 mt-1">
                <span className="text-slate-400">MO</span>{" "}
                <span className="font-mono text-slate-700">{issue.moNumber}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={issue.status} locale={locale} />
              <PriorityBadge priority={issue.priority} locale={locale} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {issue.assignedDepartments.map((d) => (
              <DepartmentBadge key={d.id} code={d.code} name={d.name} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div>
            <div className="label">{t.issue.content}</div>
            <p className="whitespace-pre-wrap text-slate-800 leading-relaxed">
              {issue.content}
            </p>
          </div>

          {issue.images.length > 0 && (
            <div>
              <div className="label">{t.issue.images} · {issue.images.length}</div>
              <div className="flex flex-wrap gap-3">
                {issue.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative overflow-hidden rounded-lg border border-slate-200 hover:shadow-md transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="h-32 w-32 object-cover transition group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
            <Meta label={t.issue.createdBy}>
              <div className="flex items-center gap-2 mt-0.5">
                <UserAvatar id={issue.createdBy.id} name={issue.createdBy.displayName} size={24} />
                <span className="text-slate-800">{issue.createdBy.displayName}</span>
              </div>
            </Meta>
            <Meta label={t.issue.createdAt}>{formatDateTime(issue.createdAt, locale)}</Meta>
            <Meta label={t.issue.updatedAt}>{formatDateTime(issue.updatedAt, locale)}</Meta>
            <Meta label={t.issue.completedAt}>
              {issue.completedAt ? formatDateTime(issue.completedAt, locale) : "—"}
            </Meta>
          </div>
        </div>

        {/* Actions toolbar */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 space-y-3">
          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <Field label={t.issue.changeStatus}>
              <select
                className="input py-1.5"
                value={issue.status}
                onChange={(e) => patch({ status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t.statuses[s as keyof typeof t.statuses]}</option>
                ))}
              </select>
            </Field>
            <Field label={t.issue.priority}>
              <select
                className="input py-1.5"
                value={issue.priority}
                onChange={(e) => patch({ priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{t.priorities[p as keyof typeof t.priorities]}</option>
                ))}
              </select>
            </Field>
            <div className="ml-auto">
              {issue.status !== "COMPLETED" ? (
                <button className="btn btn-primary" onClick={() => patch({ status: "COMPLETED" })}>
                  ✓ {t.issue.complete}
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={() => patch({ status: "IN_PROGRESS" })}>
                  ↻ {t.issue.reopen}
                </button>
              )}
            </div>
          </div>

          {isAdmin && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                {t.issue.assignedDepartments}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {departments.map((d) => {
                  const active = issue.assignedDepartments.some((x) => x.id === d.id);
                  const c = getDeptColor(d.code);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDept(d.id)}
                      className={classNames(
                        "rounded-full border px-2.5 py-0.5 text-xs flex items-center gap-1.5 transition",
                        active
                          ? c.pill + " ring-2 ring-offset-1 ring-brand-300"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      <span className={classNames("h-1.5 w-1.5 rounded-full", c.dot)} />
                      <span className="font-mono font-semibold">{d.code}</span>
                      {active && <span className="text-current">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {t.issue.comments}
          <span className="pill bg-slate-100 text-slate-700 border border-slate-200">
            {issue.comments.length}
          </span>
        </h2>

        <ul className="space-y-4">
          {issue.comments.map((c) => (
            <li key={c.id} className="flex gap-3 fade-in">
              <UserAvatar id={c.user.id} name={c.user.displayName} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-800">{c.user.displayName}</span>
                  <span className="text-slate-300">·</span>
                  <span>{relativeTime(c.createdAt, locale)}</span>
                  <span className="text-slate-300 hidden md:inline">·</span>
                  <span className="hidden md:inline">{formatDateTime(c.createdAt, locale)}</span>
                </div>
                <div className="mt-1 rounded-lg bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-sm text-slate-800 whitespace-pre-wrap">
                  {c.content}
                </div>
              </div>
            </li>
          ))}
          {issue.comments.length === 0 && (
            <li className="text-sm text-slate-400 text-center py-4">
              {t.issue.noComments}
            </li>
          )}
        </ul>

        <form onSubmit={submitComment} className="space-y-2 border-t pt-4">
          <label className="label">{t.issue.addComment}</label>
          <textarea
            className="input min-h-[110px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.issue.commentPlaceholder}
          />
          <div className="text-right">
            <button className="btn btn-primary" disabled={posting || !comment.trim()}>
              {posting ? "..." : `📩 ${t.issue.submitComment}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{label}</div>
      <div className="text-sm text-slate-700 mt-0.5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{label}</span>
      {children}
    </div>
  );
}
