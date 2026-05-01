import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

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
      departmentId: u.departmentId,
      language: u.language,
    })),
  });
}

const createSchema = z.object({
  username: z.string().min(2, "usernameTooShort").max(50),
  password: z.string().min(4, "passwordTooShort").max(100),
  displayName: z.string().min(1, "required").max(80),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  departmentId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
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
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.errors[0];
      const code = typeof first?.message === "string" ? first.message : "invalid";
      return NextResponse.json({ error: code, field: first?.path.join(".") }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "duplicateUsername" }, { status: 409 });
    }
    console.error("POST /api/users failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
