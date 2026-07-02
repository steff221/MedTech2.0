// Layout (Next.js): упатства — дел за доктор.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Упатства" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
