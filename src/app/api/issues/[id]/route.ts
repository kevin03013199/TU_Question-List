import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";

const STATUSES = ["PENDING", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

function fromZod(e: ZodError) {
  const first = e.errors[0];
  return NextResponse.json(
    { error: first ? `${first.path.join(".")}: ${first.message}` : "validation failed" },
    { status: 400 },
  );
}

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
      assignedDepartments: { orderBy: { code: "asc" } },
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
  assignedDepartmentIds: z.array(z.string().min(1)).min(1).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = patchSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.status === "COMPLETED") updateData.completedAt = new Date();
    else if (data.status) updateData.completedAt = null;

    if (data.assignedDepartmentIds) {
      updateData.assignedDepartments = {
        set: data.assignedDepartmentIds.map((id) => ({ id })),
      };
    }

    const issue = await prisma.issue.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ issue });
  } catch (e) {
    if (e instanceof ZodError) return fromZod(e);
    console.error("PATCH /api/issues/[id] failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
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
