// Layout (Next.js): рецепти — дел за пациент.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Рецепти" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
