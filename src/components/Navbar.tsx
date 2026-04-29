"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { getDict } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { classNames } from "@/lib/utils";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const lang = session?.user?.language ?? "zh-TW";
  const t = getDict(lang);

  if (!session) return null;

  const links: { href: string; label: string }[] = [
    { href: "/", label: t.nav.active },
    { href: "/issues/new", label: t.nav.newIssue },
    { href: "/history", label: t.nav.history },
  ];
  if (session.user.role === "ADMIN") {
    links.push({ href: "/admin", label: t.nav.admin });
  }

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold text-brand-700">
          {t.appName}
        </Link>
        <nav className="flex items-center gap-2 flex-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={classNames(
                  "px-3 py-1.5 rounded-md text-sm",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <LanguageSwitcher />
        <div className="text-sm text-slate-600">
          <span className="font-medium">{session.user.name}</span>
          {session.user.departmentName && (
            <span className="ml-1 text-slate-400">({session.user.departmentName})</span>
          )}
        </div>
        <button
          className="btn btn-ghost text-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          {t.nav.logout}
        </button>
      </div>
    </header>
  );
}
