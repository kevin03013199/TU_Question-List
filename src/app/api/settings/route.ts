import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const REFRESH_KEY = "refreshIntervalSeconds";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json({
    settings: {
      refreshIntervalSeconds: Number(map[REFRESH_KEY] ?? 5),
    },
  });
}

const schema = z.object({
  refreshIntervalSeconds: z.number().int().min(1).max(3600).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const data = schema.parse(body);
  if (data.refreshIntervalSeconds !== undefined) {
    await prisma.setting.upsert({
      where: { key: REFRESH_KEY },
      update: { value: String(data.refreshIntervalSeconds) },
      create: { key: REFRESH_KEY, value: String(data.refreshIntervalSeconds) },
    });
  }
  return NextResponse.json({ ok: true });
}
