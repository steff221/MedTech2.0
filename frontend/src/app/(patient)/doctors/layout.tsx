// Layout (Next.js): доктори — дел за пациент.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Лекари" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
