// Layout (Next.js): пациенти — дел за доктор.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Пациенти" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
