"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getDict } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [locale, setLocale] = useState<"zh-TW" | "en">("zh-TW");
  const t = getDict(locale);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t.login.error);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-lg font-bold shadow-md">
            Q
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">{t.appName}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.login.hint}</p>
        </div>

        <div className="card p-6 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium">{t.login.title}</h2>
            <select
              className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
              value={locale}
              onChange={(e) => setLocale(e.target.value as "zh-TW" | "en")}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="label">{t.login.username}</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label">{t.login.password}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <button className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? "..." : t.login.submit}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          © {new Date().getFullYear()} TU Question List
        </p>
      </div>
    </div>
  );
}
