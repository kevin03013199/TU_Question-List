import Navbar from "@/components/Navbar";
import NewIssueForm from "@/components/NewIssueForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewIssuePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const departments = await prisma.department.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
  });

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <NewIssueForm
          locale={session.user.language ?? "zh-TW"}
          departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
        />
      </main>
    </>
  );
}
