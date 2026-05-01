import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const departments = await prisma.department.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ departments });
}

const createSchema = z.object({
  code: z.string().min(1, "required").max(40),
  name: z.string().min(1, "required").max(80),
  nameEn: z.string().max(80).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const data = createSchema.parse(body);
    const department = await prisma.department.create({
      data: { code: data.code.toUpperCase(), name: data.name, nameEn: data.nameEn ?? null },
    });
    return NextResponse.json({ department });
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.errors[0];
      return NextResponse.json(
        { error: first?.message ?? "validation failed", field: first?.path.join(".") },
        { status: 400 },
      );
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "duplicateDeptCode" }, { status: 409 });
    }
    console.error("POST /api/departments failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
