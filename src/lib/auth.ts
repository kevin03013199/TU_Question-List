import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "username", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { department: true },
        });
        if (!user || !user.active) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.displayName,
          email: user.email ?? undefined,
          username: user.username,
          role: user.role,
          language: user.language,
          departmentId: user.departmentId ?? null,
          departmentName: user.department?.name ?? null,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          username: string;
          role: string;
          language: string;
          departmentId: string | null;
          departmentName: string | null;
        };
        token.id = u.id;
        token.username = u.username;
        token.role = (u.role === "ADMIN" ? "ADMIN" : "USER");
        token.language = u.language;
        token.departmentId = u.departmentId;
        token.departmentName = u.departmentName;
      }
      if (trigger === "update" && session?.language) {
        token.language = session.language;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).username = token.username;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).language = token.language;
        (session.user as Record<string, unknown>).departmentId = token.departmentId;
        (session.user as Record<string, unknown>).departmentName = token.departmentName;
      }
      return session;
    },
  },
};

export type SessionUser = {
  id: string;
  name?: string | null;
  username: string;
  role: "ADMIN" | "USER";
  language: string;
  departmentId: string | null;
  departmentName: string | null;
};
