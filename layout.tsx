import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "RepoSite",
  description: "GitHub repo site hosted on Vercel"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
