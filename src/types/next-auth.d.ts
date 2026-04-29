import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      username: string;
      role: "ADMIN" | "USER";
      language: string;
      departmentId: string | null;
      departmentName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "ADMIN" | "USER";
    language: string;
    departmentId: string | null;
    departmentName: string | null;
  }
}
