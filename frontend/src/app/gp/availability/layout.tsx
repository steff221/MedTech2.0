// Layout (Next.js): слободни термини (достапност) — дел за матичен лекар (GP).
import type { Metadata } from "next";
export const metadata: Metadata = { title: "MedTech GP" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
