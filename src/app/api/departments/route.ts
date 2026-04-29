import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  nameEn: z.string().max(80).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const data = createSchema.parse(body);
  const department = await prisma.department.create({
    data: { code: data.code, name: data.name, nameEn: data.nameEn ?? null },
  });
  return NextResponse.json({ department });
}
