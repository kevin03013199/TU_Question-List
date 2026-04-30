"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { getDict } from "@/lib/i18n";
import { classNames, PRIORITIES } from "@/lib/utils";
import { DepartmentBadge } from "./Badges";

export default function NewIssueForm({
  locale,
  departments,
}: {
  locale: string;
  departments: { id: string; name: string; code: string }[];
}) {
  const t = getDict(locale);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const [priority, setPriority] = useState("MEDIUM");
  const [selectedDept, setSelectedDept] = useState("");

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPreviews(files.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/issues", { method: "POST", body: fd });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "error");
      return;
    }
    const j = await res.json();
    router.push(`/issues/${j.issue.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.new.title}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {locale === "en"
            ? "Describe the issue clearly so the assigned department can act fast."
            : "請填寫問題詳情，被指派的部門才能快速處理。"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">{t.issue.productName} *</label>
          <input className="input" name="productName" required />
        </div>
        <div>
          <label className="label">{t.issue.moNumber} *</label>
          <input className="input font-mono" name="moNumber" required />
        </div>
      </div>

      <div>
        <label className="label">{t.issue.assignedDepartment} *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {departments.map((d) => (
            <label
              key={d.id}
              className={classNames(
                "cursor-pointer rounded-lg border px-3 py-2.5 text-sm flex items-center justify-between transition",
                selectedDept === d.id
                  ? "border-brand-400 bg-brand-50 ring-2 ring-brand-200"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <input
                type="radio"
                name="assignedDepartmentId"
                value={d.id}
                checked={selectedDept === d.id}
                onChange={() => setSelectedDept(d.id)}
                required
                className="hidden"
              />
              <DepartmentBadge code={d.code} name={d.name} />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t.issue.priority}</label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => {
            const active = priority === p;
            const color: Record<string, string> = {
              LOW: active ? "bg-slate-200 text-slate-800 border-slate-300" : "bg-white border-slate-200 text-slate-600",
              MEDIUM: active ? "bg-sky-100 text-sky-800 border-sky-300" : "bg-white border-slate-200 text-slate-600",
              HIGH: active ? "bg-orange-100 text-orange-800 border-orange-300" : "bg-white border-slate-200 text-slate-600",
              URGENT: active ? "bg-rose-600 text-white border-rose-700 shadow" : "bg-white border-slate-200 text-slate-600",
            };
            return (
              <label
                key={p}
                className={classNames(
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition",
                  color[p],
                )}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  className="hidden"
                  checked={active}
                  onChange={() => setPriority(p)}
                />
                {t.priorities[p as keyof typeof t.priorities]}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label">{t.issue.content} *</label>
        <textarea
          className="input min-h-[150px]"
          name="content"
          required
          placeholder={
            locale === "en"
              ? "What happened? Steps to reproduce, expected vs actual..."
              : "問題現象、發生情境、期望結果..."
          }
        />
      </div>

      <div>
        <label className="label">{t.new.uploadImages}</label>
        <input
          className="input"
          type="file"
          name="images"
          accept="image/*"
          multiple
          onChange={onFiles}
        />
        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={p.url}
                alt={p.name}
                className="h-20 w-20 object-cover rounded-md border border-slate-200"
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
        <button type="button" onClick={() => router.back()} className="btn btn-secondary">
          {t.new.cancel}
        </button>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "..." : `✓ ${t.new.submit}`}
        </button>
      </div>
    </form>
  );
}
