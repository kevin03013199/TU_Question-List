import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";

const schema = z.object({ content: z.string().min(1).max(5000) });

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const { content } = schema.parse(body);

    const comment = await prisma.comment.create({
      data: {
        issue: { connect: { id: params.id } },
        user: { connect: { username: session.user.username } },
        content,
      },
      include: { user: { select: { id: true, displayName: true, username: true } } },
    });

    return NextResponse.json({ comment });
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.errors[0];
      return NextResponse.json(
        { error: first?.message ?? "validation failed" },
        { status: 400 },
      );
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "sessionExpired" }, { status: 401 });
    }
    console.error("POST /api/issues/[id]/comments failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
