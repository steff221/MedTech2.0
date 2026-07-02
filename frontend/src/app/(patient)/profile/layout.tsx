// Layout (Next.js): профил — дел за пациент.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Мој профил" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
