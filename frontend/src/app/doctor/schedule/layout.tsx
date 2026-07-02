// Layout (Next.js): распоред — дел за доктор.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Календар" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
