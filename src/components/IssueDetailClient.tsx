"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { classNames, formatDateTime, PRIORITY_COLORS, STATUS_COLORS, STATUSES, PRIORITIES } from "@/lib/utils";

type Issue = {
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
  assignedDepartment: { id: string; name: string; code: string };
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
  departments: { id: string; name: string; code: string }[];
}) {
  const t = getDict(locale);
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

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

  async function changeStatus(status: string) {
    await fetch(`/api/issues/${issue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  async function changePriority(priority: string) {
    await fetch(`/api/issues/${issue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    refresh();
  }

  async function changeDept(assignedDepartmentId: string) {
    await fetch(`/api/issues/${issue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedDepartmentId }),
    });
    refresh();
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="btn btn-ghost text-brand-700">
          ← {t.issue.back}
        </Link>
        <span className="font-mono text-sm text-slate-500">{issue.issueNumber}</span>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold">{issue.productName}</h1>
            <div className="text-sm text-slate-500 mt-1">
              MO: <span className="font-mono">{issue.moNumber}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={classNames("badge", STATUS_COLORS[issue.status])}>
              {t.statuses[issue.status as keyof typeof t.statuses]}
            </span>
            <span className={classNames("badge", PRIORITY_COLORS[issue.priority])}>
              {t.priorities[issue.priority as keyof typeof t.priorities]}
            </span>
            <span className="badge bg-slate-100 text-slate-700">
              {issue.assignedDepartment.code} - {issue.assignedDepartment.name}
            </span>
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-1">{t.issue.content}</div>
          <p className="whitespace-pre-wrap text-slate-800">{issue.content}</p>
        </div>

        {issue.images.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">{t.issue.images}</div>
            <div className="flex flex-wrap gap-2">
              {issue.images.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="h-32 w-32 object-cover rounded border"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-500 border-t pt-4">
          <div>
            <div>{t.issue.createdBy}</div>
            <div className="text-slate-800">{issue.createdBy.displayName}</div>
          </div>
          <div>
            <div>{t.issue.createdAt}</div>
            <div className="text-slate-800">{formatDateTime(issue.createdAt, locale)}</div>
          </div>
          <div>
            <div>{t.issue.updatedAt}</div>
            <div className="text-slate-800">{formatDateTime(issue.updatedAt, locale)}</div>
          </div>
          <div>
            <div>{t.issue.completedAt}</div>
            <div className="text-slate-800">{formatDateTime(issue.completedAt, locale)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">{t.issue.changeStatus}</label>
            <select
              className="input py-1"
              value={issue.status}
              onChange={(e) => changeStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t.statuses[s as keyof typeof t.statuses]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">{t.issue.priority}</label>
            <select
              className="input py-1"
              value={issue.priority}
              onChange={(e) => changePriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{t.priorities[p as keyof typeof t.priorities]}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">{t.issue.assignedDepartment}</label>
              <select
                className="input py-1"
                value={issue.assignedDepartment.id}
                onChange={(e) => changeDept(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>
          )}
          {issue.status !== "COMPLETED" ? (
            <button className="btn btn-primary ml-auto" onClick={() => changeStatus("COMPLETED")}>
              {t.issue.complete}
            </button>
          ) : (
            <button className="btn btn-secondary ml-auto" onClick={() => changeStatus("IN_PROGRESS")}>
              {t.issue.reopen}
            </button>
          )}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t.issue.comments} ({issue.comments.length})</h2>
        <div className="space-y-3">
          {issue.comments.map((c) => (
            <div key={c.id} className="border-l-2 border-brand-200 pl-3">
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{c.user.displayName}</span>
                {" · "}
                {formatDateTime(c.createdAt, locale)}
              </div>
              <p className="whitespace-pre-wrap text-slate-800 text-sm mt-1">{c.content}</p>
            </div>
          ))}
          {issue.comments.length === 0 && (
            <p className="text-sm text-slate-400">—</p>
          )}
        </div>

        <form onSubmit={submitComment} className="space-y-2 border-t pt-3">
          <label className="label">{t.issue.addComment}</label>
          <textarea
            className="input min-h-[100px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="text-right">
            <button className="btn btn-primary" disabled={posting || !comment.trim()}>
              {posting ? "..." : t.issue.submitComment}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
