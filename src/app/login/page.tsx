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
      <div className="w-full max-w-sm card p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">{t.appName}</h1>
          <select
            className="text-xs border rounded px-2 py-1"
            value={locale}
            onChange={(e) => setLocale(e.target.value as "zh-TW" | "en")}
          >
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <p className="text-sm text-slate-500 mb-4">{t.login.hint}</p>
        <form onSubmit={onSubmit} className="space-y-4">
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
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "..." : t.login.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
