import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { generateIssueNumber } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const STATUSES = ["PENDING", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"] as const;

function badRequest(message: string, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ error: message, fieldErrors }, { status: 400 });
}

function fromZod(e: ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of e.errors) {
    const key = issue.path.join(".") || "_root";
    (fieldErrors[key] ||= []).push(issue.message);
  }
  const first = e.errors[0];
  const msg = first ? `${first.path.join(".")}: ${first.message}` : "validation failed";
  return badRequest(msg, fieldErrors);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const archived = url.searchParams.get("archived") === "true";
  const departmentId = url.searchParams.get("departmentId") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const priority = url.searchParams.get("priority") || undefined;
  const q = url.searchParams.get("q") || undefined;

  const where: Record<string, unknown> = {};
  if (archived) {
    where.status = "COMPLETED";
  } else {
    where.status = { not: "COMPLETED" };
  }
  if (status && STATUSES.includes(status as typeof STATUSES[number])) {
    where.status = status;
  }
  if (priority && PRIORITIES.includes(priority as typeof PRIORITIES[number])) {
    where.priority = priority;
  }
  if (departmentId) {
    where.assignedDepartments = { some: { id: departmentId } };
  }
  if (q) {
    where.OR = [
      { modelName: { contains: q } },
      { moNumber: { contains: q } },
      { content: { contains: q } },
      { issueNumber: { contains: q } },
    ];
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      assignedDepartments: { orderBy: { code: "asc" } },
      images: true,
      _count: { select: { comments: true } },
    },
    orderBy: archived ? { completedAt: "desc" } : { createdAt: "desc" },
  });

  return NextResponse.json({ issues });
}

const createSchema = z.object({
  modelName: z.string().min(1, "required"),
  moNumber: z.string().min(1, "required"),
  content: z.string().min(1, "required"),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  assignedDepartmentIds: z.array(z.string().min(1)).min(1, "at least one department required"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const ct = req.headers.get("content-type") || "";
    let payload: z.infer<typeof createSchema>;
    const images: { url: string; filename: string }[] = [];

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const ids = fd.getAll("assignedDepartmentIds").map((v) => String(v)).filter(Boolean);
      payload = createSchema.parse({
        modelName: fd.get("modelName"),
        moNumber: fd.get("moNumber"),
        content: fd.get("content"),
        priority: fd.get("priority") || "MEDIUM",
        assignedDepartmentIds: ids,
      });
      const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
      if (files.length > 0) {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });
        for (const file of files) {
          const ext = path.extname(file.name) || "";
          const safeExt = /^\.[a-zA-Z0-9]{1,8}$/.test(ext) ? ext.toLowerCase() : "";
          const fname = `${randomUUID()}${safeExt}`;
          const buf = Buffer.from(await file.arrayBuffer());
          await writeFile(path.join(uploadDir, fname), buf);
          images.push({ url: `/uploads/${fname}`, filename: file.name });
        }
      }
    } else {
      const body = await req.json();
      payload = createSchema.parse(body);
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const todayCount = await prisma.issue.count({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
    });
    const issueNumber = generateIssueNumber(todayCount + 1, today);

    const issue = await prisma.issue.create({
      data: {
        issueNumber,
        modelName: payload.modelName,
        moNumber: payload.moNumber,
        content: payload.content,
        priority: payload.priority,
        assignedDepartments: {
          connect: payload.assignedDepartmentIds.map((id) => ({ id })),
        },
        // Connect by unique username instead of session-cached id, so a
        // stale session (e.g. after a DB reset) still resolves to the
        // current user record.
        createdBy: { connect: { username: session.user.username } },
        images: { create: images },
      },
      include: { images: true, assignedDepartments: true },
    });

    return NextResponse.json({ issue });
  } catch (e) {
    if (e instanceof ZodError) return fromZod(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025 = related record not found; usually the session refers to a
      // user that no longer exists in the database.
      if (e.code === "P2025") {
        return NextResponse.json({ error: "sessionExpired" }, { status: 401 });
      }
      // P2003 = foreign-key violation (e.g. department id missing)
      if (e.code === "P2003") {
        return NextResponse.json({ error: "invalidDepartment" }, { status: 400 });
      }
    }
    console.error("POST /api/issues failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
