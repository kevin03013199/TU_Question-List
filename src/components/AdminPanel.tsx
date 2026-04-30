"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { classNames, ROLES } from "@/lib/utils";
import { DepartmentBadge, UserAvatar } from "./Badges";

type User = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
  active: boolean;
  departmentId: string | null;
  department: { id: string; name: string; code: string } | null;
};

type Department = {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  active: boolean;
};

export default function AdminPanel({
  locale,
  initialUsers,
  initialDepartments,
  initialRefreshSeconds,
}: {
  locale: string;
  initialUsers: User[];
  initialDepartments: Department[];
  initialRefreshSeconds: number;
}) {
  const t = getDict(locale);
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "departments" | "settings">("users");
  const [users, setUsers] = useState(initialUsers);
  const [departments, setDepartments] = useState(initialDepartments);
  const [refreshSeconds, setRefreshSeconds] = useState(initialRefreshSeconds);
  const [savedHint, setSavedHint] = useState("");

  function flashSaved() {
    setSavedHint(t.admin.saved);
    setTimeout(() => setSavedHint(""), 1500);
  }

  async function reloadUsers() {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) setUsers((await res.json()).users);
  }
  async function reloadDepts() {
    const res = await fetch("/api/departments", { cache: "no-store" });
    if (res.ok) setDepartments((await res.json()).departments);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t.admin.title}</h1>
        {savedHint && (
          <span className="pill bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ {savedHint}
          </span>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(["users", "departments", "settings"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={classNames(
              "px-4 py-1.5 text-sm rounded-lg transition",
              tab === k
                ? "bg-white text-brand-700 shadow-sm font-medium"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {k === "users" ? t.admin.users : k === "departments" ? t.admin.departments : t.admin.settings}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <UsersTab
          locale={locale}
          users={users}
          departments={departments}
          onChanged={async () => { await reloadUsers(); flashSaved(); router.refresh(); }}
        />
      )}
      {tab === "departments" && (
        <DepartmentsTab
          locale={locale}
          departments={departments}
          onChanged={async () => { await reloadDepts(); flashSaved(); router.refresh(); }}
        />
      )}
      {tab === "settings" && (
        <SettingsTab
          locale={locale}
          refreshSeconds={refreshSeconds}
          setRefreshSeconds={setRefreshSeconds}
          onSaved={() => { flashSaved(); router.refresh(); }}
        />
      )}
    </div>
  );
}

function UsersTab({
  locale,
  users,
  departments,
  onChanged,
}: {
  locale: string;
  users: User[];
  departments: Department[];
  onChanged: () => Promise<void>;
}) {
  const t = getDict(locale);
  const [form, setForm] = useState({
    username: "",
    password: "",
    displayName: "",
    email: "",
    role: "USER",
    departmentId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, departmentId: form.departmentId || null, email: form.email || null }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "error");
      return;
    }
    setForm({ username: "", password: "", displayName: "", email: "", role: "USER", departmentId: "" });
    onChanged();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onChanged();
  }

  async function resetPassword(id: string) {
    const np = window.prompt(t.admin.resetPassword + " — new password (min 4 chars)");
    if (!np || np.length < 4) return;
    await patch(id, { password: np });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createUser} className="card p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="label">{t.login.username}</label>
          <input className="input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div>
          <label className="label">{t.login.password}</label>
          <input className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <label className="label">{t.admin.displayName}</label>
          <input className="input" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">{t.admin.role}</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t.admin.department}</label>
          <select className="input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">--</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
          </select>
        </div>
        <div className="md:col-span-6 flex items-center justify-between">
          {error && <span className="text-sm text-rose-600">{error}</span>}
          <button className="btn btn-primary ml-auto" disabled={submitting}>
            + {t.admin.newUser}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>{t.admin.displayName}</th>
                <th>{t.login.username}</th>
                <th>Email</th>
                <th>{t.admin.role}</th>
                <th>{t.admin.department}</th>
                <th>{locale === "en" ? "Active" : "啟用"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar id={u.id} name={u.displayName} size={32} />
                      <span className="font-medium text-slate-800">{u.displayName}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-slate-500">{u.username}</td>
                  <td className="text-sm text-slate-500">{u.email ?? "—"}</td>
                  <td>
                    <select
                      className="input py-1 text-xs"
                      value={u.role}
                      onChange={(e) => patch(u.id, { role: e.target.value })}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <select
                      className="input py-1 text-xs"
                      value={u.departmentId ?? ""}
                      onChange={(e) => patch(u.id, { departmentId: e.target.value || null })}
                    >
                      <option value="">--</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
                    </select>
                  </td>
                  <td>
                    <button
                      className={classNames(
                        "pill cursor-pointer",
                        u.active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200",
                      )}
                      onClick={() => patch(u.id, { active: !u.active })}
                    >
                      <span className={classNames("pill-dot", u.active ? "bg-emerald-500" : "bg-slate-400")} />
                      {u.active ? (locale === "en" ? "Active" : "啟用中") : (locale === "en" ? "Inactive" : "已停用")}
                    </button>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm text-brand-700" onClick={() => resetPassword(u.id)}>
                      {t.admin.resetPassword}
                    </button>
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

function DepartmentsTab({
  locale,
  departments,
  onChanged,
}: {
  locale: string;
  departments: Department[];
  onChanged: () => Promise<void>;
}) {
  const t = getDict(locale);
  const [form, setForm] = useState({ code: "", name: "", nameEn: "" });
  const [error, setError] = useState("");

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: form.code, name: form.name, nameEn: form.nameEn || null }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "error");
      return;
    }
    setForm({ code: "", name: "", nameEn: "" });
    onChanged();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/departments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onChanged();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">{t.admin.code}</label>
          <input className="input font-mono" required placeholder="OP" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div>
          <label className="label">{t.admin.name}</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">{t.admin.nameEn}</label>
          <input className="input" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        </div>
        <div className="flex items-center justify-between">
          {error && <span className="text-sm text-rose-600">{error}</span>}
          <button className="btn btn-primary ml-auto">+ {t.admin.newDepartment}</button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>{locale === "en" ? "Color" : "顏色"}</th>
                <th>{t.admin.code}</th>
                <th>{t.admin.name}</th>
                <th>{t.admin.nameEn}</th>
                <th>{locale === "en" ? "Active" : "啟用"}</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <td>
                    <DepartmentBadge code={d.code} showName={false} />
                  </td>
                  <td className="font-mono">{d.code}</td>
                  <td>
                    <input
                      className="input py-1 text-sm"
                      defaultValue={d.name}
                      onBlur={(e) => e.target.value !== d.name && patch(d.id, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="input py-1 text-sm"
                      defaultValue={d.nameEn ?? ""}
                      onBlur={(e) => patch(d.id, { nameEn: e.target.value || null })}
                    />
                  </td>
                  <td>
                    <button
                      className={classNames(
                        "pill cursor-pointer",
                        d.active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200",
                      )}
                      onClick={() => patch(d.id, { active: !d.active })}
                    >
                      <span className={classNames("pill-dot", d.active ? "bg-emerald-500" : "bg-slate-400")} />
                      {d.active ? (locale === "en" ? "Active" : "啟用中") : (locale === "en" ? "Inactive" : "已停用")}
                    </button>
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

function SettingsTab({
  locale,
  refreshSeconds,
  setRefreshSeconds,
  onSaved,
}: {
  locale: string;
  refreshSeconds: number;
  setRefreshSeconds: (n: number) => void;
  onSaved: () => void;
}) {
  const t = getDict(locale);
  const [submitting, setSubmitting] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshIntervalSeconds: refreshSeconds }),
    });
    setSubmitting(false);
    onSaved();
  }

  return (
    <form onSubmit={save} className="card p-6 space-y-4 max-w-md">
      <div>
        <label className="label">{t.admin.refreshInterval}</label>
        <input
          type="number"
          min={1}
          max={3600}
          className="input"
          value={refreshSeconds}
          onChange={(e) => setRefreshSeconds(Math.max(1, Number(e.target.value) || 1))}
        />
        <p className="text-xs text-slate-500 mt-1">
          {locale === "en"
            ? "Default refresh interval for the issue list (1-3600 seconds). Users can override per session."
            : "問題清單的預設自動更新間隔（1–3600 秒），使用者可在自己的頁面覆寫。"}
        </p>
      </div>
      <button className="btn btn-primary" disabled={submitting}>
        {t.admin.saveSettings}
      </button>
    </form>
  );
}
