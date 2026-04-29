import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    include: { department: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      active: u.active,
      department: u.department,
      language: u.language,
    })),
  });
}

const createSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(4).max(100),
  displayName: z.string().min(1).max(80),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  departmentId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const data = createSchema.parse(body);
  const hash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      username: data.username,
      passwordHash: hash,
      displayName: data.displayName,
      email: data.email || null,
      role: data.role,
      departmentId: data.departmentId || null,
    },
  });
  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
