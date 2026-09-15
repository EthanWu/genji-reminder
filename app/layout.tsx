import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "青屿 · 资源与日程",
  description: "鲸海拾贝资源档案、合作跟进与日程工作台。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
