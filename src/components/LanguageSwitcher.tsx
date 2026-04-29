"use client";

import { useSession } from "next-auth/react";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const { data: session, update } = useSession();
  const [pending, startTransition] = useTransition();

  if (!session) return null;
  const current = session.user.language ?? "zh-TW";

  function onChange(lang: "zh-TW" | "en") {
    startTransition(async () => {
      await fetch("/api/me/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang }),
      });
      await update({ language: lang });
    });
  }

  return (
    <select
      disabled={pending}
      className="text-xs border rounded px-2 py-1 bg-white"
      value={current}
      onChange={(e) => onChange(e.target.value as "zh-TW" | "en")}
    >
      <option value="zh-TW">繁體中文</option>
      <option value="en">English</option>
    </select>
  );
}
