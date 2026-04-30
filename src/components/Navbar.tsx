"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { getDict } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { classNames, getDeptColor } from "@/lib/utils";
import { UserAvatar } from "./Badges";

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

  const deptCode = session.user.departmentName ? session.user.departmentName : "";
  const deptColor = deptCode ? getDeptColor(deptCode) : null;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand-700">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold shadow-sm">
            Q
          </span>
          <span className="hidden sm:inline">{t.appName}</span>
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={classNames(
                  "px-3 py-1.5 rounded-lg text-sm transition",
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <LanguageSwitcher />
        <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <UserAvatar
            id={session.user.id}
            name={session.user.name ?? session.user.username}
            size={28}
          />
          <div className="text-sm leading-tight">
            <div className="font-medium text-slate-800">{session.user.name}</div>
            {deptColor && (
              <div className="text-[11px] text-slate-500">
                {session.user.departmentName}
              </div>
            )}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          {t.nav.logout}
        </button>
      </div>
    </header>
  );
}
