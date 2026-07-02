// Layout (Next.js): МКБ-10 каталог — дел за доктор.
import type { Metadata } from "next";
export const metadata: Metadata = { title: "МКБ10 Дијагноза" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
