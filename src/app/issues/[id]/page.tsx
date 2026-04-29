import Navbar from "@/components/Navbar";
import IssueDetailClient from "@/components/IssueDetailClient";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      assignedDepartment: true,
      images: true,
      comments: {
        include: { user: { select: { id: true, displayName: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!issue) notFound();

  const departments = await prisma.department.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
  });

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <IssueDetailClient
          locale={session.user.language ?? "zh-TW"}
          isAdmin={session.user.role === "ADMIN"}
          initialIssue={JSON.parse(JSON.stringify(issue))}
          departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
        />
      </main>
    </>
  );
}
