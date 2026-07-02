// Layout (Next.js): известувања — дел за доктор.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Известувања | MedTech Doctor",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
