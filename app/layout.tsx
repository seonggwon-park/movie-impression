import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "여운",
  description: "영화가 끝난 뒤 마음에 남은 감정을 기록하는 감상 아카이브",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
