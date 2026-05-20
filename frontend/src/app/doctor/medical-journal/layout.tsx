import type { Metadata } from "next";
export const metadata: Metadata = { title: "Медицински дневник" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
