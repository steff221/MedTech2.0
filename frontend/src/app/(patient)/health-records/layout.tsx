import type { Metadata } from "next";
export const metadata: Metadata = { title: "Здравствена историја" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
