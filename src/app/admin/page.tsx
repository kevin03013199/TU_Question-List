import Navbar from "@/components/Navbar";
import AdminPanel from "@/components/AdminPanel";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const [users, departments, refreshSetting] = await Promise.all([
    prisma.user.findMany({
      include: { department: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.department.findMany({ orderBy: { code: "asc" } }),
    prisma.setting.findUnique({ where: { key: "refreshIntervalSeconds" } }),
  ]);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <AdminPanel
          locale={session.user.language ?? "zh-TW"}
          initialUsers={users.map((u) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            email: u.email,
            role: u.role,
            active: u.active,
            departmentId: u.departmentId,
            department: u.department ? { id: u.department.id, name: u.department.name, code: u.department.code } : null,
          }))}
          initialDepartments={departments.map((d) => ({
            id: d.id,
            code: d.code,
            name: d.name,
            nameEn: d.nameEn,
            active: d.active,
          }))}
          initialRefreshSeconds={Number(refreshSetting?.value ?? 5)}
        />
      </main>
    </>
  );
}
