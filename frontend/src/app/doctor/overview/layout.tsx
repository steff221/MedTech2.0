// Layout (Next.js): преглед — дел за доктор.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Преглед" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
