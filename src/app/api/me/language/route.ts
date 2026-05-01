import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOCALES } from "@/lib/i18n";
import { Prisma } from "@prisma/client";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { language } = await req.json();
    if (!LOCALES.includes(language)) {
      return NextResponse.json({ error: "invalid language" }, { status: 400 });
    }
    await prisma.user.update({
      where: { username: session.user.username },
      data: { language },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "sessionExpired" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
