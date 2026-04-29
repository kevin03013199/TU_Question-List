import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOCALES } from "@/lib/i18n";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { language } = await req.json();
  if (!LOCALES.includes(language)) {
    return NextResponse.json({ error: "invalid language" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { language },
  });
  return NextResponse.json({ ok: true });
}
