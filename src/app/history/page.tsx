import IssueListClient from "@/components/IssueListClient";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [departments, refreshSetting] = await Promise.all([
    prisma.department.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    prisma.setting.findUnique({ where: { key: "refreshIntervalSeconds" } }),
  ]);
  const refreshSeconds = Number(refreshSetting?.value ?? 5);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <IssueListClient
          mode="archived"
          departments={departments.map((d) => ({ id: d.id, name: d.name, nameEn: d.nameEn, code: d.code }))}
          refreshSeconds={refreshSeconds}
          locale={session.user.language ?? "zh-TW"}
        />
      </main>
    </>
  );
}
