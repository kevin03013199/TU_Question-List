import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateIssueNumber } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const STATUSES = ["PENDING", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"] as const;

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
  if (departmentId) where.assignedDepartmentId = departmentId;
  if (q) {
    where.OR = [
      { productName: { contains: q } },
      { moNumber: { contains: q } },
      { content: { contains: q } },
      { issueNumber: { contains: q } },
    ];
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      assignedDepartment: true,
      images: true,
      _count: { select: { comments: true } },
    },
    orderBy: archived ? { completedAt: "desc" } : { createdAt: "desc" },
  });

  return NextResponse.json({ issues });
}

const createSchema = z.object({
  productName: z.string().min(1),
  moNumber: z.string().min(1),
  content: z.string().min(1),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  assignedDepartmentId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ct = req.headers.get("content-type") || "";
  let payload: z.infer<typeof createSchema>;
  let images: { url: string; filename: string }[] = [];

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    payload = createSchema.parse({
      productName: fd.get("productName"),
      moNumber: fd.get("moNumber"),
      content: fd.get("content"),
      priority: fd.get("priority") || "MEDIUM",
      assignedDepartmentId: fd.get("assignedDepartmentId"),
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
      productName: payload.productName,
      moNumber: payload.moNumber,
      content: payload.content,
      priority: payload.priority,
      assignedDepartmentId: payload.assignedDepartmentId,
      createdById: session.user.id,
      images: { create: images },
    },
    include: { images: true },
  });

  return NextResponse.json({ issue });
}
