import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const STATUSES = ["PENDING", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
  if (!issue) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ issue });
}

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignedDepartmentId: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = patchSchema.parse(body);

  const updateData: Record<string, unknown> = { ...data };
  if (data.status === "COMPLETED") {
    updateData.completedAt = new Date();
  } else if (data.status) {
    updateData.completedAt = null;
  }

  const issue = await prisma.issue.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ issue });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await prisma.issue.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
