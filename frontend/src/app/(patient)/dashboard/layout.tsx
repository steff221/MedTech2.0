// Layout (Next.js): контролна табла — дел за пациент.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Почетна" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
