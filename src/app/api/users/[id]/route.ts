import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const patchSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  departmentId: z.string().optional().nullable(),
  active: z.boolean().optional(),
  password: z.string().min(4).max(100).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const data = patchSchema.parse(body);
  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
    delete updateData.password;
  }
  if (data.email === "") updateData.email = null;
  const user = await prisma.user.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ user: { id: user.id } });
}
