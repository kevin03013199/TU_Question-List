"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getDict } from "@/lib/i18n";
import { PRIORITIES } from "@/lib/utils";

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
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <h1 className="text-xl font-semibold">{t.new.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">{t.issue.productName} *</label>
          <input className="input" name="productName" required />
        </div>
        <div>
          <label className="label">{t.issue.moNumber} *</label>
          <input className="input" name="moNumber" required />
        </div>
        <div>
          <label className="label">{t.issue.assignedDepartment} *</label>
          <select className="input" name="assignedDepartmentId" required defaultValue="">
            <option value="" disabled>--</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t.issue.priority}</label>
          <select className="input" name="priority" defaultValue="MEDIUM">
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{t.priorities[p as keyof typeof t.priorities]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">{t.issue.content} *</label>
        <textarea className="input min-h-[140px]" name="content" required />
      </div>

      <div>
        <label className="label">{t.new.uploadImages}</label>
        <input className="input" type="file" name="images" accept="image/*" multiple />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => router.back()} className="btn btn-secondary">
          {t.new.cancel}
        </button>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "..." : t.new.submit}
        </button>
      </div>
    </form>
  );
}
