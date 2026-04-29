import "./globals.css";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Issue Tracking Platform",
  description: "Multi-department issue list",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const lang = session?.user?.language === "en" ? "en" : "zh-TW";
  return (
    <html lang={lang}>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
