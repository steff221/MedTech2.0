// Layout (Next.js): слободни термини (достапност) — дел за доктор.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Работно расписание | MedTech Doctor",
};

export default function AvailabilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
