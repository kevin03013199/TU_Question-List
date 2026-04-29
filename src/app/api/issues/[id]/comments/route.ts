import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ content: z.string().min(1).max(5000) });

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content } = schema.parse(body);

  const comment = await prisma.comment.create({
    data: {
      issueId: params.id,
      userId: session.user.id,
      content,
    },
    include: { user: { select: { id: true, displayName: true, username: true } } },
  });

  return NextResponse.json({ comment });
}
